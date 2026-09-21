import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'connect.vn.vione_app',
  appName: 'vione_app',
  webDir: '.output/public',
  server: {
    cleartext: true
  }
};

export default config;
