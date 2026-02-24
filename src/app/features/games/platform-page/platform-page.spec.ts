import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformPage } from './platform-page';

describe('PlatformPage', () => {
  let component: PlatformPage;
  let fixture: ComponentFixture<PlatformPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatformPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
