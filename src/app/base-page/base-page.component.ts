import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';
import { StarParticlesComponent } from '../star-particles/star-particles.component';

@Component({
  selector: 'app-base-page',
  templateUrl: './base-page.component.html',
  standalone: true,
  imports: [StarParticlesComponent, CommonModule],
  styleUrls: ['./base-page.component.scss']
})
export class BasePageComponent {
  @Input() height: number = 333;
  @Input() hideBackground: boolean = false;
  @Input() showParticles: boolean = false;
}