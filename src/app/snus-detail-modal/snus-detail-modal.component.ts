// snus-detail-modal.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trash, create } from 'ionicons/icons';
import { EditEntryComponent } from '../edit-entry/edit-entry.component';
import { SupabaseService } from '../services/supabase.service';

interface Snus {
  id: string;
  brand: string;
  flavor: string;
  strength_mg: number;
}

interface SnusConsumption {
  id: string;
  consumed_at: string;
  location: any;
  cons_with: string[];
  image_id: string | null;
  snus: Snus;
  image?: {
    base64_data: string;
  } | null;
}

interface RPCResponse {
  id: string;
  consumed_at: string;
  location: any;
  cons_with: string[];
  image_id: string | null;
  snus: Snus | Snus[];
  image: { base64_data: string } | { base64_data: string }[] | null;
}

@Component({
  selector: 'app-snus-detail-modal',
  templateUrl: './snus-detail-modal.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class SnusDetailModalComponent {
  @Input() consumption!: SnusConsumption;
  private wasUpdated = false;
  constructor(
    private modalCtrl: ModalController,
    private supabase: SupabaseService
  ) {
    addIcons({ trash, create });
  }

  async editConsumption() {
    const modal = await this.modalCtrl.create({
      component: EditEntryComponent,
      componentProps: {
        consumption: this.consumption,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      try {
        const { data: updatedData, error } = (await this.supabase
          .getClient()
          .rpc('get_snus_history_with_geojson')
          .eq('id', this.consumption.id)
          .single()) as { data: RPCResponse | null; error: any };

        if (error) throw error;

        if (updatedData) {
          this.consumption = {
            ...updatedData,
            snus: Array.isArray(updatedData.snus)
              ? updatedData.snus[0]
              : updatedData.snus,
            image: Array.isArray(updatedData.image)
              ? updatedData.image[0]
              : updatedData.image,
          } as SnusConsumption;
        }
        this.wasUpdated = true;
      } catch (error) {
        console.error('Error refreshing consumption data:', error);
      }

      this.modalCtrl.dismiss({
        updated: true,
      });
    }
  }

  dismissModal() {
    this.modalCtrl.dismiss({
      updated: this.wasUpdated,
    });
  }

  async deleteConsumption() {
    this.modalCtrl.dismiss({
      deleted: true,
      consumptionId: this.consumption.id,
    });
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
      if (typeof location === 'object' && location.type === 'Point') {
        const [longitude, latitude] = location.coordinates;
        return `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(
          6
        )}`;
      } else {
        console.log('location:', location);
      }

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
