// snus-detail-modal.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-snus-detail-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Details</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismissModal()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Image -->
      <div *ngIf="consumption.image?.base64_data" class="ion-margin-bottom">
        <img
          [src]="'data:image/jpeg;base64,' + consumption.image.base64_data"
          alt="Snus photo"
          style="width: 100%; border-radius: 8px; max-height: 300px; object-fit: cover;"
        />
      </div>

      <!-- Basic Info -->
      <ion-item>
        <ion-label>
          <h2>{{ consumption.snus.brand }}</h2>
          <p>{{ consumption.snus.flavor }}</p>
        </ion-label>
        <ion-note slot="end" color="primary">
          {{ consumption.snus.strength_mg }}mg
        </ion-note>
      </ion-item>

      <!-- Time -->
      <ion-item>
        <ion-icon name="time-outline" slot="start"></ion-icon>
        <ion-label>
          <h2>Consumed At</h2>
          <p>{{ formatDate(consumption.consumed_at) }}</p>
        </ion-label>
      </ion-item>

      <!-- Location -->
      <ion-item *ngIf="consumption.location">
        <ion-icon name="location-outline" slot="start"></ion-icon>
        <ion-label>
          <h2>Location</h2>
          <p>{{ formatLocation(consumption.location) }}</p>
        </ion-label>
      </ion-item>

      <!-- People -->
      <ion-item *ngIf="consumption.cons_with?.length">
        <ion-icon name="people-outline" slot="start"></ion-icon>
        <ion-label>
          <h2>Consumed With</h2>
          <p>
            <ion-chip *ngFor="let person of consumption.cons_with" outline>
              {{ person }}
            </ion-chip>
          </p>
        </ion-label>
      </ion-item>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class SnusDetailModalComponent {
  @Input() consumption: any;

  constructor(private modalCtrl: ModalController) {}

  dismissModal() {
    this.modalCtrl.dismiss();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  formatLocation(location: any): string {
    if (!location) return 'No location data';

    try {
      // Handle GeoJSON format from PostGIS
      if (typeof location === 'object' && location.type === 'Point') {
        const [longitude, latitude] = location.coordinates;
        return `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(
          6
        )}`;
      } else {
        console.log('location:', location);
      }

      // Fallback for POINT string format (if needed)
      if (typeof location === 'string') {
        const match = location.match(/POINT\((.*?)\)/);
        if (match) {
          const [longitude, latitude] = match[1].split(' ');
          return `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(
            6
          )}`;
        }
      }

      return 'Invalid location format';
    } catch (error) {
      console.error('Error formatting location:', error, location);
      return 'Invalid location format';
    }
  }
}
