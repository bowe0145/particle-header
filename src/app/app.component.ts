import { BasePageComponent } from './base-page/base-page.component';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CoolHeaderComponent } from './cool-header/cool-header.component';
import { HeaderComponent } from './header/header.component';
import { ParticleHeaderComponent } from './particle-header/particle-header.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    CoolHeaderComponent,
    ParticleHeaderComponent,
    BasePageComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'particle-header';
  showParticles = true;
  hideBackground = false;
}
