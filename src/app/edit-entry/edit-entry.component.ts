// edit-entry.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { SupabaseService } from '../services/supabase.service';
import {
  camera,
  location,
  add,
  refresh,
  closeCircle,
  trash,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

interface Snus {
  id: string;
  brand: string;
  flavor: string;
  strength_mg: number;
}

@Component({
  selector: 'app-edit-entry',
  templateUrl: './edit-entry.component.html',
  styleUrls: ['./edit-entry.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class EditEntryComponent implements OnInit {
  @Input() consumption: any;
  editForm: FormGroup;
  snusProducts: Snus[] = [];
  capturedImage: string | null = null;
  currentLocation: { latitude: number; longitude: number } | null = null;
  isSubmitting = false;
  isLoadingLocation = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {
    this.editForm = this.fb.group({
      snusId: ['', Validators.required],
      consWithInput: [''],
      consWith: [[]],
    });
    addIcons({ camera, location, add, refresh, closeCircle, trash });
  }

  async ngOnInit() {
    console.log(this.consumption);
    try {
      // First load the products
      await this.loadSnusProducts();

      // Then initialize the form
      this.initializeForm();
    } catch (error) {
      console.error('Error initializing edit form:', error);
      this.showToast('Failed to initialize form');
    }
  }

  private initializeForm() {
    if (!this.snusProducts.length) {
      return;
    }

    // Set initial values from consumption data
    this.editForm.patchValue({
      snusId: this.consumption.snus.id,
      consWith: this.consumption.cons_with || [],
    });

    // Set image if exists
    if (this.consumption.image?.base64_data) {
      this.capturedImage = this.consumption.image.base64_data;
    }

    // Set location if exists
    if (this.consumption.location?.coordinates) {
      const [longitude, latitude] = this.consumption.location.coordinates;
      this.currentLocation = { latitude, longitude };
    }
    console.log(this.consumption.snus.id);
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
    this.isLoadingLocation = true;
    try {
      const position = await Geolocation.getCurrentPosition();
      this.currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      this.showToast('Location updated successfully');
    } catch (error) {
      console.error('Error getting location:', error);
      this.showToast('Failed to get location');
      this.currentLocation = null;
    } finally {
      this.isLoadingLocation = false;
    }
  }

  clearLocation() {
    this.currentLocation = null;
    this.showToast('Location cleared');
  }

  addPerson() {
    const input = this.editForm.get('consWithInput')?.value?.trim();
    if (input) {
      const currentPeople = this.editForm.get('consWith')?.value || [];
      if (!currentPeople.includes(input)) {
        this.editForm.patchValue({
          consWith: [...currentPeople, input],
          consWithInput: '',
        });
      }
    }
  }

  removePerson(person: string) {
    const currentPeople = this.editForm.get('consWith')?.value || [];
    this.editForm.patchValue({
      consWith: currentPeople.filter((p: string) => p !== person),
    });
  }

  async submitEdit() {
    if (this.editForm.invalid || this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      let imageId = this.consumption.image_id;
      const oldImageId = imageId; // Store the old image ID for later deletion
      const isChangingImage =
        this.capturedImage !== (this.consumption.image?.base64_data || null);

      // Step 1: If we have a new image, upload it first
      if (isChangingImage && this.capturedImage) {
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
      } else if (isChangingImage) {
        // If we're just removing the image
        imageId = null;
      }

      // Step 2: Update consumption record with new image ID (or null)
      const { error: updateError } = await this.supabase
        .getClient()
        .from('snus_consumed')
        .update({
          snus_id: this.editForm.get('snusId')?.value,
          image_id: imageId,
          location: this.currentLocation
            ? `POINT(${this.currentLocation.longitude} ${this.currentLocation.latitude})`
            : null,
          cons_with: this.editForm.get('consWith')?.value || [],
        })
        .eq('id', this.consumption.id);

      if (updateError) throw updateError;

      // Step 3: After updating consumption record, delete the old image if we changed it
      if (isChangingImage && oldImageId) {
        const { error: deleteError } = await this.supabase
          .getClient()
          .from('images')
          .delete()
          .eq('id', oldImageId);

        if (deleteError) {
          console.error('Error deleting old image:', deleteError);
          // Don't throw since the main update was successful
        }
      }

      this.showToast('Entry updated successfully!');
      this.modalCtrl.dismiss({ updated: true });
    } catch (error: any) {
      console.error('Error updating entry:', error);
      this.showToast(error.message || 'Failed to update entry');
    } finally {
      this.isSubmitting = false;
    }
  }

  dismissModal() {
    this.modalCtrl.dismiss();
  }

  removePhoto() {
    this.capturedImage = null;
    this.showToast('Photo removed');
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
    });
    await toast.present();
  }
}
