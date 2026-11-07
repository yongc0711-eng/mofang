import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base 用相对路径 + HashRouter，部署到 GitHub Pages 子路径或任意静态托管都不用改配置。
export default defineConfig({
  base: './',
  build: { target: 'esnext', chunkSizeWarningLimit: 3000 },
  plugins: [
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
        // Three.js 的 chunk 较大，也要缓存才能离线播放 3D 动画
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
