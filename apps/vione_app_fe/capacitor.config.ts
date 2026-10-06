import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'connect.vn.vione_app',
  appName: 'ViOne',
  webDir: 'www',
  server: {
    url: 'https://14.225.217.232:5445/connect-app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      '14.225.217.232*',
      '14.225.217.232:5445*',
      '*.14-225-217-232.sslip.io*',
      '*.sslip.io*',
      'vione.vn*',
      '*.vione.vn*'
    ]
  }
};

export default config;
