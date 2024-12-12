import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsEnabled = new BehaviorSubject<boolean>(false);
  public notificationsEnabled$ = this.notificationsEnabled.asObservable();
  private currentNotificationId = 1;

  constructor(private platform: Platform) {
    this.initializeNotificationState();
    this.setupNotificationListeners();
  }

  private async setupNotificationListeners() {
    await LocalNotifications.addListener(
      'localNotificationReceived',
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (notification) => {
        console.log('Notification action performed:', notification);
      }
    );
  }

  private async initializeNotificationState() {
    const { value } = await Preferences.get({ key: 'notificationsEnabled' });
    const enabled = value === 'true';
    this.notificationsEnabled.next(enabled);
  }

  async requestPermissions(): Promise<boolean> {
    if (this.platform.is('capacitor')) {
      try {
        const permStatus = await LocalNotifications.requestPermissions();
        console.log('Permission request result:', permStatus);

        // Check if notifications are supported
        const canSchedule = await LocalNotifications.checkPermissions();
        console.log('Can schedule notifications:', canSchedule);

        return permStatus.display === 'granted';
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return false;
      }
    }
    return false;
  }

  async scheduleNotification(scheduleTime: Date) {
    try {
      // Cancel any existing notifications
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }

      const notificationId = this.currentNotificationId++;

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Snus Reminder',
            body: 'Time for your snus!',
            id: notificationId,
            schedule: { at: scheduleTime },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: undefined,
            smallIcon: 'ic_stat_notify',
            iconColor: '#488AFF',
          },
        ],
      });

      // Save the scheduled time
      await Preferences.set({
        key: 'scheduledNotificationTime',
        value: scheduleTime.toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }

  async getScheduledTime(): Promise<Date | null> {
    const { value } = await Preferences.get({
      key: 'scheduledNotificationTime',
    });
    return value ? new Date(value) : null;
  }

  async toggleNotifications(enabled: boolean) {
    if (enabled) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        this.notificationsEnabled.next(false);
        return;
      }
    }

    await Preferences.set({
      key: 'notificationsEnabled',
      value: enabled.toString(),
    });

    this.notificationsEnabled.next(enabled);

    if (!enabled) {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }
    }
  }
}
