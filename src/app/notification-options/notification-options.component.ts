// notification-options.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonDatetimeButton,
  IonDatetime,
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notification-options',
  template: `
    <ion-content>
      <ion-list>
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
    IonButton,
    IonDatetimeButton,
    IonDatetime,
    IonModal,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
  ],
})
export class NotificationOptionsComponent implements OnInit {
  selectedTime: string = new Date().toISOString(); // Initialize with current time
  scheduledTime: Date | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadScheduledTime();
  }

  async loadScheduledTime() {
    this.scheduledTime = await this.notificationService.getScheduledTime();
    if (this.scheduledTime) {
      this.selectedTime = this.scheduledTime.toISOString();
    }
  }

  async onTimeSelected(event: any) {
    const selectedTimeStr = event.detail.value;
    if (selectedTimeStr) {
      // Create a new Date object for today with the selected time
      const today = new Date();
      const selectedTime = new Date(selectedTimeStr);

      const scheduledTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );

      // If the time has already passed today, schedule for tomorrow
      if (scheduledTime < new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await this.notificationService.scheduleNotification(scheduledTime);
      this.scheduledTime = scheduledTime;
    }
  }
}
