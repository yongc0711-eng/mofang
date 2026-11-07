import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Each config/build invocation has one shared ID for JS and the uncacheable metadata asset.
const buildId = `${new Date().toISOString()}-${crypto.randomUUID()}`;

// base 用相对路径 + HashRouter，部署到 GitHub Pages 子路径或任意静态托管都不用改配置。
export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  build: { target: 'esnext', chunkSizeWarningLimit: 3000 },
  plugins: [
    {
      name: 'build-version',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: buildId }) + '\n' });
      },
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if ((request as { url?: string }).url?.split('?')[0] !== '/version.json') return next();
          response.setHeader('Content-Type', 'application/json');
          response.setHeader('Cache-Control', 'no-store');
          response.end(JSON.stringify({ version: buildId }));
        });
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '魔方公式',
        short_name: '魔方公式',
        description: '三阶魔方 CFOP 与桥式公式查询和练习',
        lang: 'zh-CN',
        display: 'standalone',
        start_url: './',
        scope: './',
        background_color: '#16181d',
        theme_color: '#16181d',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: ['**/version.json'],
        navigateFallbackDenylist: [/\/version\.json(?:\?|$)/],
        // Three.js 的 chunk 较大，也要缓存才能离线播放 3D 动画
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
});
