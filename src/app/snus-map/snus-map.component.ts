import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import * as L from 'leaflet';

interface SnusLocation {
  consumption_id: string;
  brand: string;
  flavor: string;
  strength_mg: number;
  consumed_at: string;
  location: any;
  cons_with: string[];
}

interface SnusConsumed {
  id: string;
  consumed_at: string;
  location: any;
  cons_with: string[];
  snus: {
    brand: string;
    flavor: string;
    strength_mg: number;
  }[];
}

@Component({
  selector: 'app-snus-map',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: ` <div id="map" style="height: 100%; width: 100%;"></div> `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      #map {
        z-index: 0;
      }
    `,
  ],
})
export class SnusMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private customIcon = L.icon({
    iconUrl: 'assets/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'assets/marker-shadow.png',
    shadowSize: [41, 41],
  });

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {}

  async ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
      this.loadSnusLocations();
    }, 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
    }).setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    window.addEventListener('resize', () => {
      this.map.invalidateSize();
    });
  }

  private async loadSnusLocations() {
    try {
      // Try to use the RPC function first
      const { data: rpcData, error: rpcError } = await this.supabaseService
        .getClient()
        .rpc('get_recent_consumption', { days: 30 });

      if (!rpcError && rpcData) {
        this.addMarkersToMap(rpcData);
        return;
      }

      // Fallback to direct query if RPC fails
      const { data: queryData, error: queryError } = await this.supabaseService
        .getClient()
        .from('snus_consumed')
        .select(
          `
          id,
          consumed_at,
          location,
          cons_with,
          snus:snus_id (
            brand,
            flavor,
            strength_mg
          )
        `
        )
        .gte(
          'consumed_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('consumed_at', { ascending: false });

      if (queryError) throw queryError;

      if (queryData) {
        // Transform the data to match the expected format
        const transformedData = (queryData as SnusConsumed[]).map((item) => ({
          consumption_id: item.id,
          brand: item.snus[0]?.brand || 'Unknown',
          flavor: item.snus[0]?.flavor || 'Unknown',
          strength_mg: item.snus[0]?.strength_mg || 0,
          consumed_at: item.consumed_at,
          location: item.location,
          cons_with: item.cons_with,
        }));
        this.addMarkersToMap(transformedData);
      }
    } catch (error) {
      console.error('Error loading snus locations:', error);
    }
  }

  private parseLocation(location: any): [number, number] | null {
    try {
      if (typeof location === 'object' && location.coordinates) {
        // Handle GeoJSON format
        const [lng, lat] = location.coordinates;
        return [lng, lat];
      }
      return null;
    } catch (error) {
      console.error('Error parsing location:', error);
      return null;
    }
  }

  private addMarkersToMap(locations: SnusLocation[]) {
    // Clear existing markers
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];

    const bounds = new L.LatLngBounds([]);

    locations.forEach((location) => {
      if (location.location) {
        const coordinates = this.parseLocation(location.location);

        if (coordinates) {
          const marker = L.marker([coordinates[1], coordinates[0]], {
            icon: this.customIcon,
          })
            .bindPopup(this.createPopupContent(location))
            .addTo(this.map);

          this.markers.push(marker);
          bounds.extend([coordinates[1], coordinates[0]]);
        }
      }
    });

    // Fit map to show all markers if there are any
    if (this.markers.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  private createPopupContent(location: SnusLocation): string {
    const date = new Date(location.consumed_at).toLocaleDateString();
    const time = new Date(location.consumed_at).toLocaleTimeString();

    return `
      <div class="popup-content">
        <h3>${location.brand}</h3>
        <p>Flavor: ${location.flavor}</p>
        <p>Strength: ${location.strength_mg}mg</p>
        <p>Consumed: ${date} ${time}</p>
        ${
          location.cons_with?.length
            ? `<p>With: ${location.cons_with.join(', ')}</p>`
            : ''
        }
      </div>
    `;
  }
}
