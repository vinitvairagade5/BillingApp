import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.antigravity.billingapp',
  appName: 'BillPro',
  webDir: 'dist/billing-app-ui/browser',
  server: {
    androidScheme: 'https',
    allowNavigation: ['billpro.vinshri.in', '192.168.1.12']
  }
};

export default config;
