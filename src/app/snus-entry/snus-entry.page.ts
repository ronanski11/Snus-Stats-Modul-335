import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { LoadingController, ToastController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { camera, location, add, refresh, closeCircle } from 'ionicons/icons';
import { addIcons } from 'ionicons';

interface Snus {
  id: string;
  brand: string;
  flavor: string;
  strength_mg: number;
}

@Component({
  selector: 'app-snus-entry',
  templateUrl: './snus-entry.page.html',
  styleUrls: ['./snus-entry.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class SnusEntryPage implements OnInit {
  entryForm: FormGroup;
  snusProducts: Snus[] = [];
  capturedImage: string | null = null;
  currentLocation: { latitude: number; longitude: number } | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.entryForm = this.fb.group({
      snusId: ['', Validators.required],
      consWithInput: [''],
      consWith: [[]], // Array of people
    });
    addIcons({ camera, location, add, refresh, closeCircle });
  }

  async ngOnInit() {
    await this.loadSnusProducts();
    await this.getCurrentLocation();
  }

  async loadSnusProducts() {
    try {
      const { data, error } = await this.supabase
        .getClient()
        .from('snus')
        .select('*')
        .order('brand')
        .order('flavor');

      if (error) throw error;
      this.snusProducts = data;
    } catch (error) {
      console.error('Error loading snus products:', error);
      this.showToast('Failed to load snus products');
    }
  }

  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      this.capturedImage = image.base64String || null;
    } catch (error) {
      console.error('Error capturing photo:', error);
      this.showToast('Failed to capture photo');
    }
  }

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition();
      this.currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      this.showToast('Failed to get location');
    }
  }

  addPerson() {
    const input = this.entryForm.get('consWithInput')?.value?.trim();
    if (input) {
      const currentPeople = this.entryForm.get('consWith')?.value || [];
      if (!currentPeople.includes(input)) {
        this.entryForm.patchValue({
          consWith: [...currentPeople, input],
          consWithInput: '',
        });
      }
    }
  }

  removePerson(person: string) {
    const currentPeople = this.entryForm.get('consWith')?.value || [];
    this.entryForm.patchValue({
      consWith: currentPeople.filter((p: string) => p !== person),
    });
  }

  async submitEntry() {
    if (this.entryForm.invalid || this.isSubmitting) return;

    const loading = await this.loadingCtrl.create({
      message: 'Saving entry...',
    });
    await loading.present();
    this.isSubmitting = true;

    try {
      // First, save the image if one was captured
      let imageId = null;
      if (this.capturedImage) {
        const { data: imageData, error: imageError } = await this.supabase
          .getClient()
          .from('images')
          .insert({
            base64_data: this.capturedImage,
            content_type: 'image/jpeg',
          })
          .select('id')
          .single();

        if (imageError) throw imageError;
        imageId = imageData.id;
      }

      // Then save the consumption record
      const { error } = await this.supabase
        .getClient()
        .from('snus_consumed')
        .insert({
          snus_id: this.entryForm.get('snusId')?.value,
          image_id: imageId,
          location: this.currentLocation
            ? `POINT(${this.currentLocation.longitude} ${this.currentLocation.latitude})`
            : null,
          cons_with: this.entryForm.get('consWith')?.value || [],
          consumed_at: new Date().toISOString(),
        });

      if (error) throw error;

      this.showToast('Entry saved successfully!');
      this.resetForm();
    } catch (error) {
      console.error('Error saving entry:', error);
      this.showToast('Failed to save entry');
    } finally {
      this.isSubmitting = false;
      await loading.dismiss();
    }
  }

  private resetForm() {
    this.entryForm.reset();
    this.capturedImage = null;
    this.entryForm.patchValue({ consWith: [] });
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
    });
    await toast.present();
  }
}
