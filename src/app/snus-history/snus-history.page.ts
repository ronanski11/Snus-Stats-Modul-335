// snus-history.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { SnusDetailModalComponent } from './snus-detail-modal.component';
import { timeOutline, locationOutline } from 'ionicons/icons';
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
  isLoading = true;
  error: string | null = null;

  constructor(
    private supabase: SupabaseService,
    private modalCtrl: ModalController
  ) {
    addIcons({ timeOutline, locationOutline });
  }

  async ngOnInit() {
    await this.loadHistory();
  }

  async loadHistory() {
    try {
      this.isLoading = true;
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
      this.isLoading = false;
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
}
