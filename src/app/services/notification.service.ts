// notification.service.ts
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

  private notificationMode = new BehaviorSubject<'single' | 'interval'>(
    'single'
  );
  public notificationMode$ = this.notificationMode.asObservable();

  private currentNotificationId = 1;

  constructor(private platform: Platform) {
    this.initializeNotificationState();
    this.setupNotificationListeners();
  }

  async setNotificationMode(mode: 'single' | 'interval') {
    await this.cancelAllNotifications();
    await Preferences.set({ key: 'notificationMode', value: mode });
    this.notificationMode.next(mode);

    if (mode === 'interval') {
      const hours = await this.getIntervalHours();
      if (hours) await this.scheduleIntervalNotification(hours);
    } else {
      const time = await this.getScheduledTime();
      if (time) await this.scheduleNotification(time);
    }
  }

  private async initializeNotificationState() {
    const [enabledValue, modeValue] = await Promise.all([
      Preferences.get({ key: 'notificationsEnabled' }),
      Preferences.get({ key: 'notificationMode' }),
    ]);

    const enabled = enabledValue.value === 'true';
    const mode = (modeValue.value as 'single' | 'interval') || 'single';

    this.notificationsEnabled.next(enabled);
    this.notificationMode.next(mode);
  }

  private async setupNotificationListeners() {
    await LocalNotifications.addListener(
      'localNotificationReceived',
      (notification) => {
        console.log('Notification received:', notification);
        this.rescheduleIntervalNotificationsIfNeeded();
      }
    );

    await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (notification) => {
        console.log('Notification action performed:', notification);
        this.rescheduleIntervalNotificationsIfNeeded();
      }
    );
  }

  private async rescheduleIntervalNotificationsIfNeeded() {
    const mode = await Preferences.get({ key: 'notificationMode' });
    if (mode.value === 'interval') {
      const hours = await this.getIntervalHours();
      if (hours) {
        await this.scheduleIntervalNotification(hours);
      }
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (this.platform.is('capacitor')) {
      try {
        const permStatus = await LocalNotifications.requestPermissions();
        const canSchedule = await LocalNotifications.checkPermissions();
        return (
          permStatus.display === 'granted' && canSchedule.display === 'granted'
        );
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return false;
      }
    }
    return false;
  }

  private async cancelAllNotifications() {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }
  }

  private async cancelPendingNotifications() {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        const notificationsToCancel = pending.notifications.map((n) => ({
          id: n.id,
        }));
        await LocalNotifications.cancel({
          notifications: notificationsToCancel,
        });
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  async scheduleNotification(scheduleTime: Date) {
    try {
      // Cancel any existing notifications first
      await this.cancelPendingNotifications();

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

  async scheduleIntervalNotification(hours: number) {
    try {
      // Cancel any existing notifications first
      await this.cancelPendingNotifications();

      const now = new Date();
      const notifications = [];
      const notificationsCount = Math.floor(24 / hours);

      for (let i = 0; i < notificationsCount; i++) {
        const notificationTime = new Date(
          now.getTime() + (i + 1) * hours * 60 * 60 * 1000
        );

        notifications.push({
          title: 'Snus Reminder',
          body: 'Time for your snus!',
          id: this.currentNotificationId++,
          schedule: { at: notificationTime },
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: undefined,
          smallIcon: 'ic_stat_notify',
          iconColor: '#488AFF',
        });
      }

      await LocalNotifications.schedule({
        notifications: notifications,
      });

      await Preferences.set({
        key: 'notificationIntervalHours',
        value: hours.toString(),
      });

      return true;
    } catch (error) {
      console.error('Error scheduling interval notification:', error);
      return false;
    }
  }

  async getScheduledTime(): Promise<Date | null> {
    const { value } = await Preferences.get({
      key: 'scheduledNotificationTime',
    });
    return value ? new Date(value) : null;
  }

  async getIntervalHours(): Promise<number | null> {
    const { value } = await Preferences.get({
      key: 'notificationIntervalHours',
    });
    return value ? Number(value) : null;
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
      await this.cancelAllNotifications();
    } else {
      // Reschedule based on current mode
      const mode = await Preferences.get({ key: 'notificationMode' });
      if (mode.value === 'interval') {
        const hours = await this.getIntervalHours();
        if (hours) await this.scheduleIntervalNotification(hours);
      } else {
        const time = await this.getScheduledTime();
        if (time) await this.scheduleNotification(time);
      }
    }
  }
}
