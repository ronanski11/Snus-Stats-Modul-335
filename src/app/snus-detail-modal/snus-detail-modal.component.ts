// snus-detail-modal.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trash } from 'ionicons/icons';
@Component({
  selector: 'app-snus-detail-modal',
  templateUrl: `./snus-detail-modal.component.html`,
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class SnusDetailModalComponent {
  @Input() consumption: any;

  constructor(private modalCtrl: ModalController) {
    addIcons({ trash });
  }

  async deleteConsumption() {
    // Dismiss modal with delete request
    this.modalCtrl.dismiss({
      deleted: true,
      consumptionId: this.consumption.id,
    });
  }

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
