import { Injectable } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class SplashScreenService {
  constructor(private platform: Platform) {}

  async initialize() {
    try {
      if (this.platform.is('capacitor')) {
        // Show the splash screen
        await SplashScreen.show({
          showDuration: 3000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error('Error initializing splash screen:', error);
    }
  }

  async hide() {
    try {
      if (this.platform.is('capacitor')) {
        await SplashScreen.hide();
      }
    } catch (error) {
      console.error('Error hiding splash screen:', error);
    }
  }
}
