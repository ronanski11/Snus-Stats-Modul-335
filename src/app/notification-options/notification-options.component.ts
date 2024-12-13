// notification-options.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonDatetimeButton,
  IonDatetime,
  IonModal,
  IonContent,
  IonRange,
} from '@ionic/angular/standalone';
import { NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-notification-options',
  template: `
    <ion-content>
      <ion-list>
        <!-- Notification Mode Selection -->
        <ion-item>
          <ion-label>Notification Type</ion-label>
          <ion-select
            [value]="notificationMode"
            (ionChange)="onModeChange($event)"
          >
            <ion-select-option value="single">Single Time</ion-select-option>
            <ion-select-option value="interval"
              >Repeat Every Few Hours</ion-select-option
            >
          </ion-select>
        </ion-item>

        <!-- Single Time Settings -->
        <ng-container *ngIf="notificationMode === 'single'">
          <ion-item>
            <ion-label>Set Reminder Time</ion-label>
            <ion-datetime-button datetime="reminder-time"></ion-datetime-button>
          </ion-item>

          <ion-modal [keepContentsMounted]="true">
            <ng-template>
              <ion-datetime
                id="reminder-time"
                presentation="time"
                [preferWheel]="true"
                [value]="selectedTime"
                (ionChange)="onTimeSelected($event)"
              ></ion-datetime>
            </ng-template>
          </ion-modal>

          <ion-item *ngIf="scheduledTime">
            <ion-label>
              Next reminder scheduled for:
              {{ scheduledTime | date : 'shortTime' }}
            </ion-label>
          </ion-item>
        </ng-container>

        <!-- Interval Settings -->
        <ng-container *ngIf="notificationMode === 'interval'">
          <ion-item>
            <ion-label>Hours Between Reminders</ion-label>
            <ion-range
              [value]="intervalHours"
              [min]="1"
              [max]="12"
              [pin]="true"
              [snaps]="true"
              [step]="1"
              (ionChange)="onIntervalChanged($event)"
            >
              <ion-label slot="start">1h</ion-label>
              <ion-label slot="end">12h</ion-label>
            </ion-range>
          </ion-item>

          <ion-item *ngIf="intervalHours">
            <ion-label>
              Reminders will repeat every {{ intervalHours }} hours
            </ion-label>
            <ion-label *ngIf="nextIntervalTimes.length > 0">
              Next reminders at:
              <div *ngFor="let time of nextIntervalTimes">
                {{ time | date : 'shortTime' }}
              </div>
            </ion-label>
          </ion-item>
        </ng-container>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonDatetimeButton,
    IonDatetime,
    IonModal,
    IonContent,
    IonRange,
  ],
})
export class NotificationOptionsComponent implements OnInit, OnDestroy {
  selectedTime: string = new Date().toISOString();
  scheduledTime: Date | null = null;
  intervalHours: number = 2;
  notificationMode: 'single' | 'interval' = 'single';
  nextIntervalTimes: Date[] = [];

  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  async ngOnInit() {
    await this.loadSettings();

    this.subscription.add(
      this.notificationService.notificationMode$.subscribe((mode) => {
        this.notificationMode = mode;
        if (mode === 'interval') {
          this.updateNextIntervalTimes();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private async loadSettings() {
    const [scheduledTime, intervalHours, mode] = await Promise.all([
      this.notificationService.getScheduledTime(),
      this.notificationService.getIntervalHours(),
      Preferences.get({ key: 'notificationMode' }),
    ]);

    this.scheduledTime = scheduledTime;
    if (scheduledTime) {
      this.selectedTime = scheduledTime.toISOString();
    }

    this.intervalHours = intervalHours || 2;
    this.notificationMode = (mode.value as 'single' | 'interval') || 'single';

    if (this.notificationMode === 'interval') {
      this.updateNextIntervalTimes();
    }
  }

  private updateNextIntervalTimes() {
    const now = new Date();
    this.nextIntervalTimes = Array.from(
      { length: Math.min(3, Math.floor(24 / this.intervalHours)) },
      (_, i) =>
        new Date(now.getTime() + (i + 1) * this.intervalHours * 60 * 60 * 1000)
    );
  }

  async onModeChange(event: CustomEvent) {
    const mode = event.detail.value as 'single' | 'interval';
    await this.notificationService.setNotificationMode(mode);
    if (mode === 'interval') {
      this.updateNextIntervalTimes();
    }
  }

  async onTimeSelected(event: CustomEvent) {
    const selectedTimeStr = event.detail.value;
    if (selectedTimeStr) {
      const today = new Date();
      const selectedTime = new Date(selectedTimeStr);

      const scheduledTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );

      if (scheduledTime < new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await this.notificationService.scheduleNotification(scheduledTime);
      this.scheduledTime = scheduledTime;
    }
  }

  async onIntervalChanged(event: CustomEvent) {
    const hours = Number(event.detail.value);
    if (hours && hours > 0) {
      this.intervalHours = hours;
      await this.notificationService.scheduleIntervalNotification(hours);
      this.updateNextIntervalTimes();
    }
  }
}
