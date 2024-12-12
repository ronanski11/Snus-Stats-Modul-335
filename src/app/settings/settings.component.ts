// settings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Platform } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonListHeader,
} from '@ionic/angular/standalone';
import { NotificationService } from '../services/notification.service';
import { AsyncPipe } from '@angular/common';
import { NotificationOptionsComponent } from '../notification-options/notification-options.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    AsyncPipe,
    IonListHeader,
    NotificationOptionsComponent,
  ],
})
export class SettingsComponent implements OnInit {
  isDarkMode = false;

  constructor(
    private platform: Platform,
    public notificationService: NotificationService
  ) {}

  async ngOnInit() {
    // Load saved theme preference
    const { value } = await Preferences.get({ key: 'theme' });
    if (value === 'dark') {
      this.isDarkMode = true;
      this.applyTheme(true);
    }
  }

  async onThemeToggle(event: any) {
    this.isDarkMode = event.detail.checked;
    await this.applyTheme(this.isDarkMode);
    await Preferences.set({
      key: 'theme',
      value: this.isDarkMode ? 'dark' : 'light',
    });
  }

  onNotificationToggle(event: any) {
    console.log('attempting to toggle notifications');
    this.notificationService.toggleNotifications(event.detail.checked);
  }

  private async applyTheme(isDark: boolean) {
    document.body.classList.toggle('dark', isDark);

    if (this.platform.is('capacitor')) {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      if (isDark) {
        StatusBar.setBackgroundColor({ color: '#000000' });
        StatusBar.setStyle({ style: Style.Dark });
      } else {
        StatusBar.setBackgroundColor({ color: '#ffffff' });
        StatusBar.setStyle({ style: Style.Light });
      }
    }
  }
}
