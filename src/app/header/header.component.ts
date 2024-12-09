import { Component, OnInit } from '@angular/core';
import {IonToolbar, IonHeader, IonTitle} from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonToolbar, IonHeader, IonTitle]
})
export class HeaderComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
