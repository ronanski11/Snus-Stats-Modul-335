import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SnusEntryPage } from './snus-entry.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: SnusEntryPage,
      },
    ]),
  ],
  declarations: [SnusEntryPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // This will allow Ionic components with custom properties
})
export class SnusEntryPageModule {}
