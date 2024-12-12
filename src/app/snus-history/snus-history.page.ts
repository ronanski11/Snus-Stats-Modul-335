// snus-history.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { SnusDetailModalComponent } from '../snus-detail-modal/snus-detail-modal.component';
import {
  timeOutline,
  locationOutline,
  peopleOutline,
  trash,
  chevronDownCircleOutline,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

interface SnusConsumption {
  id: string;
  consumed_at: string;
  location: any;
  cons_with: string[];
  image_id: string | null;
  snus: {
    brand: string;
    flavor: string;
    strength_mg: number;
  };
  image?: {
    base64_data: string;
  } | null;
}

@Component({
  selector: 'app-snus-history',
  templateUrl: './snus-history.page.html',
  styleUrls: ['./snus-history.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class SnusHistoryPage implements OnInit {
  consumptions: SnusConsumption[] = [];
  error: string | null = null;
  isInitialLoading = true;

  constructor(
    private supabase: SupabaseService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      timeOutline,
      locationOutline,
      peopleOutline,
      trash,
      chevronDownCircleOutline,
    });
  }

  async ngOnInit() {
    await this.loadHistory();
  }

  async loadHistory() {
    try {
      const { data, error } = await this.supabase
        .getClient()
        .rpc('get_snus_history_with_geojson');

      if (error) throw error;

      // Transform the data to match our interface
      this.consumptions = (data || []).map((item: any) => ({
        ...item,
        snus: Array.isArray(item.snus) ? item.snus[0] : item.snus,
        image: Array.isArray(item.image) ? item.image[0] : item.image,
      }));
    } catch (error) {
      console.error('Error loading history:', error);
      this.error = 'Failed to load history';
    } finally {
      this.isInitialLoading = false;
    }
  }

  async handleRefresh(event: any) {
    try {
      await this.loadHistory();
    } finally {
      event.target.complete();
    }
  }

  async openDetail(consumption: SnusConsumption) {
    const modal = await this.modalCtrl.create({
      component: SnusDetailModalComponent,
      componentProps: {
        consumption,
      },
    });

    await modal.present();

    // Handle the modal dismissal
    const { data } = await modal.onWillDismiss();
    if (data?.deleted) {
      await this.deleteConsumption(consumption);
    } else if (data?.updated) {
      // Reload the history to reflect the changes
      await this.loadHistory();
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
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

  async deleteConsumption(consumption: SnusConsumption) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Deletion',
      message: 'Are you sure you want to delete this entry?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              // First, delete the consumption record
              const { error: consumptionError } = await this.supabase
                .getClient()
                .from('snus_consumed')
                .delete()
                .eq('id', consumption.id);

              if (consumptionError) throw consumptionError;

              // If successful, remove from local array
              this.consumptions = this.consumptions.filter(
                (item) => item.id !== consumption.id
              );

              // If there was an image, delete it from the images table
              if (consumption.image_id) {
                const { error: imageError } = await this.supabase
                  .getClient()
                  .from('images')
                  .delete()
                  .eq('id', consumption.image_id);

                if (imageError) {
                  console.error('Error deleting image:', imageError);
                  // Don't throw here as the main deletion was successful
                }
              }
            } catch (error) {
              console.error('Error deleting consumption:', error);
              const errorAlert = await this.alertCtrl.create({
                header: 'Error',
                message: 'Failed to delete the entry. Please try again.',
                buttons: ['OK'],
              });
              await errorAlert.present();
            }
          },
        },
      ],
    });

    await alert.present();
  }
}
