import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarParticlesComponent } from './star-particles.component';

describe('StarParticlesComponent', () => {
  let component: StarParticlesComponent;
  let fixture: ComponentFixture<StarParticlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarParticlesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StarParticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
