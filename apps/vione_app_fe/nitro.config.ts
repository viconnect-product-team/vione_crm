import { defineConfig } from "nitro/config";

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const emptyMock = path.resolve(__dirname, 'src/mock-empty.js');

// Bundle all dependencies into the server output instead of relying on
// @vercel/nft (nf3) dependency tracing, which fails with CommonJS
// compatibility errors on certain packages during the self-hosted Docker
// (node-server preset) build. Auto-loaded and merged by Nitro.
const backendTarget = process.env.NEST_API_URL || 'http://backend:4000';

export default defineConfig({
  noExternals: true,
  preset: 'node-server',
  sourcemap: false,
  minify: false,
  alias: {
    'xmlhttprequest-ssl': emptyMock,
    https: 'node:https',
    http: 'node:http',
  },
  routeRules: {
    '/upload/**': { proxy: `${backendTarget}/api/upload/**` },
    '/api/upload/**': { proxy: `${backendTarget}/api/upload/**` },
    '/uploads/**': { proxy: `${backendTarget}/api/upload/**` },
  },
});
