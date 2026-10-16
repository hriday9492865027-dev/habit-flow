import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.friendflow.app',
  appName: 'FriendFlow',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    BackgroundGeolocation: {
      backgroundTitle: 'FriendFlow Location Sharing',
      backgroundMessage: 'Sharing live location with your accepted friends',
    },
  },
};

export default config;
