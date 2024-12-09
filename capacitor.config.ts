import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Snus Stats',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // Duration in milliseconds
      launchAutoHide: true,
      backgroundColor: '#ffffffff', // Background color in hex format
      androidSplashResourceName: 'splash', // Android resource name
      androidScaleType: 'CENTER_CROP',
      showSpinner: true, // Optional loading spinner
      spinnerColor: '#999999', // Spinner color in hex format
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
