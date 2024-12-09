import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreenService } from './services/splashscreen.service';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private splashScreenService: SplashScreenService) {
    this.initializeApp();
  }

  async initializeApp() {
    try {
      await this.splashScreenService.initialize();

      // Initialize theme
      const { value } = await Preferences.get({ key: 'theme' });
      if (value === 'dark') {
        document.body.classList.add('dark');
      }

      // Add your app initialization logic here
      // When ready, hide the splash screen
      await this.splashScreenService.hide();
    } catch (error) {
      console.error('Error in app initialization:', error);
    }
  }
}
