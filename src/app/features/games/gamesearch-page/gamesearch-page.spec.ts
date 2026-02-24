import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamesearchPage } from './gamesearch-page';

describe('GamesearchPage', () => {
  let component: GamesearchPage;
  let fixture: ComponentFixture<GamesearchPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamesearchPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamesearchPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
