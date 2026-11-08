import { CubeSandbox } from '../components/CubeSandbox';

export function PlayPage() {
  return <div className="page">
    <h1 className="page-title">试转</h1>
    <p className="muted small">点字母转一步；拖动魔方换视角，双击回正</p>
    <CubeSandbox />
  </div>;
}
