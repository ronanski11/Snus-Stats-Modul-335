import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private notificationService: NotificationService) {
    this.initializeApp();
  }

  async initializeApp() {
    // Theme initialization
    const { value } = await Preferences.get({ key: 'theme' });
    if (value === 'dark') {
      document.body.classList.add('dark');
    }

    // Request notification permissions on app start
    await this.notificationService.requestPermissions();
  }
}
