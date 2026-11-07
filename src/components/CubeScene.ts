import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
  type Texture,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { STICKERS, moveGeometry, type Face, type Move, type State, type Vec } from '../lib/cube';
import { displayFace, getDevicePrefs } from '../store/devicePrefs';

const FACE_VAR: Record<Face, string> = {
  U: '--cube-u',
  D: '--cube-d',
  F: '--cube-f',
  B: '--cube-b',
  R: '--cube-r',
  L: '--cube-l',
};
const AXES = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
/** 默认露出 U、F、R 三面，F 在左、R 在右，和等轴图解一致 */
const DEFAULT_YAW = 0.62;
const DEFAULT_PITCH = 0.56;
const MAX_PITCH = 1.45;

/** 表面：uv 是无贴纸魔方的光滑亮面（UV 钻面），matte 是哑光 */
export type CubeFinish = 'uv' | 'matte';

/** 圆角方块的 6 个材质槽，顺序是 Three.js 方块几何的 +x -x +y -y +z -z */
const slotOf = (n: Vec) => (n[0] === 1 ? 0 : n[0] === -1 ? 1 : n[1] === 1 ? 2 : n[1] === -1 ? 3 : n[2] === 1 ? 4 : 5);

interface Cubie {
  group: Group;
  home: Vector3;
  coords: [number, number, number];
  materials: Material[];
}

/**
 * 魔方的 Three.js 渲染层，不含播放逻辑。
 * 每个小块是一个圆角方块，朝外的面直接上色（无贴纸魔方的样子）。
 * 颜色按“位置”固定，转完一步后按引擎给的状态重新上色；
 * 转动中只把那一层的小块临时旋转，所以画面永远由 (状态, 转动, 进度) 决定。
 */
export class CubeScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(26, 1, 0.1, 100);
  private readonly root = new Group();
  private readonly cubies: Cubie[] = [];
  private readonly faceSlots: { cubie: Cubie; slot: number }[] = [];
  private readonly faceMats = new Map<Face, MeshPhysicalMaterial>();
  private readonly maskMat: MeshStandardMaterial;
  private readonly envMap: Texture;
  private readonly ambient = new AmbientLight(0xffffff, 1.9);
  private readonly keyLight = new DirectionalLight(0xffffff, 1.7);
  private readonly resizeObserver: ResizeObserver;
  private readonly disposables: { dispose(): void }[] = [];
  private mask: ((id: number) => boolean) | null = null;
  private last: { state: State; move: Move | null; eased: number } | null = null;
  private yaw = DEFAULT_YAW;
  private pitch = DEFAULT_PITCH;
  private drag: { id: number; x: number; y: number } | null = null;
  private downX = 0;
  private downY = 0;
  private lastTapAt = -Infinity;

  constructor(
    private readonly host: HTMLElement,
    finish: CubeFinish = 'uv',
  ) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // 手指放在魔方上时，上下左右都只转魔方，不滚动页面
    canvas.style.touchAction = 'none';
    host.replaceChildren(canvas);

    // 亮面要有东西可反射：用内置的室内环境，不用加载图片
    const pmrem = new PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    const envTarget = pmrem.fromScene(room, 0.03);
    this.envMap = envTarget.texture;
    room.dispose();
    pmrem.dispose();
    this.disposables.push(envTarget);

    const css = getComputedStyle(document.documentElement);
    for (const face of Object.keys(FACE_VAR) as Face[]) {
      const mat = new MeshPhysicalMaterial({ color: new Color(css.getPropertyValue(FACE_VAR[face]).trim()) });
      this.faceMats.set(face, mat);
      this.disposables.push(mat);
    }
    this.maskMat = new MeshStandardMaterial({ color: new Color('#8d9098'), roughness: 0.6 });
    // 内壳和芯：平时只在细缝里露出一条细线，转动时才看到内部。
    // 内面不用彩色，否则颜色会从缝里透出来，干扰看情形
    const inner = new MeshStandardMaterial({ color: new Color('#2c2e33'), roughness: 0.7 });
    // 所有小块共用一份几何体。分段数定得低，整颗约 1.5 万个三角形，手机也轻松
    const body = new RoundedBoxGeometry(0.994, 0.994, 0.994, 3, 0.1);
    // 把法线向外掰一点：面看起来微微鼓起，高光才有柔和的渐变，不会是一整片平色
    const position = body.getAttribute('position');
    const normal = body.getAttribute('normal');
    const n = new Vector3();
    for (let i = 0; i < normal.count; i++) {
      n.fromBufferAttribute(normal, i);
      n.x += position.getX(i) * 0.3;
      n.y += position.getY(i) * 0.3;
      n.z += position.getZ(i) * 0.3;
      n.normalize();
      normal.setXYZ(i, n.x, n.y, n.z);
    }
    const coreGeo = new SphereGeometry(1.42, 16, 12);
    this.disposables.push(this.maskMat, inner, body, coreGeo);

    const byKey = new Map<string, Cubie>();
    for (const s of STICKERS) {
      const key = s.p.join();
      let cubie = byKey.get(key);
      if (!cubie) {
        const group = new Group();
        const home = new Vector3(...s.p);
        group.position.copy(home);
        const materials: Material[] = Array.from({ length: 6 }, () => inner);
        group.add(new Mesh(body, materials));
        this.root.add(group);
        cubie = { group, home, coords: s.p, materials };
        byKey.set(key, cubie);
        this.cubies.push(cubie);
      }
      this.faceSlots[s.id] = { cubie, slot: slotOf(s.n) };
    }
    // 中间的芯：挡住小块之间的缝，不让背景透过来
    this.root.add(new Mesh(coreGeo, inner));

    this.scene.add(this.root);
    this.keyLight.position.set(2.5, 6, 7);
    const fill = new DirectionalLight(0xffffff, 0.14);
    fill.position.set(-6, -2, 4);
    this.scene.add(this.ambient, this.keyLight, fill);

    this.setFinish(finish);
    this.applyView();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();

    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onUp);
  }

  setFinish(finish: CubeFinish) {
    const uv = finish === 'uv';
    this.scene.environment = uv ? this.envMap : null;
    // 所有光加起来不能过曝，否则纯色会被洗淡，做不出 UV 面的鲜艳感
    this.ambient.intensity = uv ? 0.42 : 1.9;
    this.keyLight.intensity = uv ? 0.4 : 1.7;
    for (const mat of this.faceMats.values()) {
      mat.roughness = uv ? 0.34 : 0.5;
      mat.envMapIntensity = uv ? 0.5 : 1;
      // 亮面涂层：一层光滑的高光，这就是 UV 面的质感
      mat.clearcoat = uv ? 1 : 0;
      mat.clearcoatRoughness = 0.06;
      mat.needsUpdate = true;
    }
    if (this.last) this.render(this.last.state, this.last.move, this.last.eased);
  }

  /** 哪些贴纸显示颜色；传 null 显示全部 */
  setMask(mask: ((id: number) => boolean) | null) {
    this.mask = mask;
    if (this.last) this.render(this.last.state, this.last.move, this.last.eased);
  }

  /** 画一帧。eased 是缓动后的进度 0–1 */
  render(state: State, move: Move | null, eased: number) {
    this.last = { state, move, eased };
    // 底面颜色决定配色，和 2D 图解共用 displayFace；每帧读一次，设置一改下一帧就变
    const bottom = getDevicePrefs().bottomColor;
    for (let loc = 0; loc < 54; loc++) {
      const id = state[loc];
      const visible = !this.mask || this.mask(id);
      const { cubie, slot } = this.faceSlots[loc];
      cubie.materials[slot] = visible ? this.faceMats.get(displayFace(id, bottom))! : this.maskMat;
    }
    const geo = move ? moveGeometry(move) : null;
    const q = new Quaternion();
    if (geo) q.setFromAxisAngle(AXES[geo.axis], geo.angle * eased);
    for (const c of this.cubies) {
      if (geo && geo.layers.includes(c.coords[geo.axis])) {
        c.group.position.copy(c.home).applyQuaternion(q);
        c.group.quaternion.copy(q);
      } else {
        c.group.position.copy(c.home);
        c.group.quaternion.identity();
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.resizeObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onDown);
    canvas.removeEventListener('pointermove', this.onMove);
    canvas.removeEventListener('pointerup', this.onUp);
    canvas.removeEventListener('pointercancel', this.onUp);
    for (const d of this.disposables) d.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }

  private redraw() {
    this.renderer.render(this.scene, this.camera);
  }

  private applyView() {
    // 先绕竖轴转，再整体俯仰，这样拖动方向始终符合直觉
    const yawQ = new Quaternion().setFromAxisAngle(AXES[1], -this.yaw);
    const pitchQ = new Quaternion().setFromAxisAngle(AXES[0], this.pitch);
    this.root.quaternion.copy(pitchQ.multiply(yawQ));
  }

  private resize() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // 按较短的一边留出整个魔方：外接球半径约 2.7
    const halfFov = (this.camera.fov * Math.PI) / 360;
    const fit = 2.75 / Math.sin(halfFov);
    this.camera.position.set(0, 0, w < h ? fit / this.camera.aspect : fit);
    this.camera.updateProjectionMatrix();
    this.redraw();
  }

  private readonly onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    this.downX = e.clientX;
    this.downY = e.clientY;
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };

  private readonly onMove = (e: PointerEvent) => {
    if (!this.drag || this.drag.id !== e.pointerId) return;
    const SPEED = 0.009;
    this.yaw -= (e.clientX - this.drag.x) * SPEED;
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch + (e.clientY - this.drag.y) * SPEED));
    this.drag.x = e.clientX;
    this.drag.y = e.clientY;
    this.applyView();
    this.redraw();
  };

  private readonly onUp = (e: PointerEvent) => {
    if (this.drag?.id !== e.pointerId) return;
    this.drag = null;
    if (e.type !== 'pointerup') return;
    // 手机上不一定有 dblclick 事件，所以自己判断连点两下：两次都没怎么移动，且间隔够短
    const isTap = Math.hypot(e.clientX - this.downX, e.clientY - this.downY) < 10;
    if (isTap && e.timeStamp - this.lastTapAt < 350) {
      this.lastTapAt = -Infinity;
      this.resetView();
    } else {
      this.lastTapAt = isTap ? e.timeStamp : -Infinity;
    }
  };

  /** 双击回到默认视角 */
  private readonly resetView = () => {
    this.yaw = DEFAULT_YAW;
    this.pitch = DEFAULT_PITCH;
    this.applyView();
    this.redraw();
  };
}
