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
} from '@ionic/angular/standalone';

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
  ],
})
export class SettingsComponent implements OnInit {
  isDarkMode = false;

  constructor(private platform: Platform) {}

  async ngOnInit() {
    // Load saved theme preference
    const { value } = await Preferences.get({ key: 'theme' });
    if (value === 'dark') {
      this.isDarkMode = true;
      this.applyTheme(true);
    }
  }

  async onThemeToggle(event: any) {
    // Update the state immediately based on the toggle value
    this.isDarkMode = event.detail.checked;

    // Apply the theme change
    await this.applyTheme(this.isDarkMode);

    // Save the preference
    await Preferences.set({
      key: 'theme',
      value: this.isDarkMode ? 'dark' : 'light',
    });
  }

  private async applyTheme(isDark: boolean) {
    document.body.classList.toggle('dark', isDark);

    // Handle status bar color for mobile devices
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
