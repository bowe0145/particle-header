import { Component } from '@angular/core';
import {
  Container,
  IOptions,
  MoveDirection,
  OutMode,
  RecursivePartial,
  Engine,
} from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { NgParticlesService, NgxParticlesModule } from '@tsparticles/angular';

@Component({
  selector: 'app-particle-header',
  standalone: true,
  imports: [NgxParticlesModule],
  templateUrl: './particle-header.component.html',
  styleUrl: './particle-header.component.scss',
})
export class ParticleHeaderComponent {
  id = 'tsparticles';

  // Create dots that connect to each other while moving around
  public options: RecursivePartial<IOptions> = {
    background: {
      color: '#2c2c2c',
    },
    autoPlay: true,
    particles: {
      number: {
        value: 5,
      },
      move: {
        enable: true,
      },
      size: {
        value: 1,
      },
      shape: {
        type: 'circle',
      },
    },
    smooth: true,
    clear: true,
    fpsLimit: 60,
    detectRetina: true,
  };

  constructor(private readonly ngParticlesService: NgParticlesService) {
    console.log('k');
  }

  ngOnInit(): void {
    console.log('ok');
    void this.ngParticlesService.init(async (engine: Engine) => {
      console.log('init', engine);

      await loadSlim(engine);
    });
  }

  public particlesLoaded(container: Container): void {
    console.log('loaded', container);
  }
}
