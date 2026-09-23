import { defineConfig } from '@lovable.dev/vite-tanstack-config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const emptyMock = path.resolve(__dirname, 'src/mock-empty.js');

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        'xmlhttprequest-ssl': emptyMock,
        https: 'node:https',
        http: 'node:http',
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        maxParallelFileOps: 2,
      },
    },
    ssr: {
      external: ['jspdf', 'xlsx'],
    },
    server: {
      port: 5173,
      watch: {
        ignored: [
          '**/.output/**',
          '**/.tanstack/**',
          '**/release_apk/**',
          '**/android/**',
          '**/ios/**',
          '**/.turbo/**',
          '**/*.log',
        ],
      },
      proxy: {
        '/upload': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/upload/, '/api/upload'),
        },
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  },
});
