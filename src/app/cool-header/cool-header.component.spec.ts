import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoolHeaderComponent } from './cool-header.component';

describe('CoolHeaderComponent', () => {
  let component: CoolHeaderComponent;
  let fixture: ComponentFixture<CoolHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoolHeaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CoolHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
