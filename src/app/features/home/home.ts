import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxNumberTickerComponent } from '@omnedia/ngx-number-ticker';
import { NgxParticlesComponent } from '@omnedia/ngx-particles';
import { NgxThreeGlobeComponent } from '@omnedia/ngx-three-globe/browser';
import { NgxTypewriterComponent } from '@omnedia/ngx-typewriter';

type TestCard = {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
};

type TestHighlight = {
  id: number;
  countTo: number;
  suffix?: string;
  countDuration: number;
  label: string;
};

type FeaturePageLink = {
  label: string;
  path: string;
};

type FeatureGroup = {
  folder: string;
  pages: FeaturePageLink[];
};

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxThreeGlobeComponent, NgxNumberTickerComponent, NgxParticlesComponent, NgxTypewriterComponent, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly isLoading = signal(true);

  protected readonly heroWords = ['Bienvenido a Test Home'];

  protected readonly testHighlights = signal<TestHighlight[]>(this.buildRandomHighlights());

  protected readonly featuredTestCards = signal<TestCard[]>([
    { id: 1, title: 'Test Dashboard', subtitle: 'Panel moderno para revisar métricas de ejemplo en tiempo real.', badge: 'Test Pro' },
    { id: 2, title: 'Test Analytics', subtitle: 'Visualiza tendencias y actividad con datos simulados de prueba.', badge: 'Test Live' },
    { id: 3, title: 'Test Explorer', subtitle: 'Explora contenido demo con una experiencia limpia y rápida.', badge: 'Test New' },
    { id: 4, title: 'Test Studio', subtitle: 'Entorno de configuración mock para flujos de test y validación.', badge: 'Test Lab' },
    { id: 5, title: 'Test Library', subtitle: 'Colección de assets y recursos demo listos para usar.', badge: 'Test Plus' },
    { id: 6, title: 'Test Arena', subtitle: 'Sección experimental con componentes visuales de ejemplo.', badge: 'Test Beta' },
  ]);

  protected readonly quickActions = signal<string[]>([
    'Test Crear Proyecto',
    'Test Revisar Estado',
    'Test Publicar Demo',
    'Test Compartir Reporte',
  ]);

  protected readonly featureGroups = signal<FeatureGroup[]>([
    {
      folder: 'home',
      pages: [{ label: 'Home', path: '/' }],
    },
    {
      folder: 'games',
      pages: [
        { label: 'Developer Page', path: '/games/developer' },
        { label: 'Game Page', path: '/games/game' },
        { label: 'Game Search Page', path: '/games/gamesearch' },
        { label: 'Genre Page', path: '/games/genre' },
        { label: 'Platform Page', path: '/games/platform' },
        { label: 'Review Page', path: '/games/review' },
        { label: 'Tag Page', path: '/games/tag' },
      ],
    },
  ]);

  protected readonly formatMetric = (value: number): string => Math.round(value).toLocaleString('es-ES');

  private loadingTimerId: ReturnType<typeof setTimeout> | null = null;

  public ngOnInit(): void {
    this.loadingTimerId = setTimeout(() => {
      this.isLoading.set(false);
    }, 1200);
  }

  public ngOnDestroy(): void {
    if (this.loadingTimerId) {
      clearTimeout(this.loadingTimerId);
      this.loadingTimerId = null;
    }
  }

  private buildRandomHighlights(): TestHighlight[] {
    return [
      {
        id: 1,
        countTo: this.randomInt(95, 100),
        suffix: '%',
        countDuration: 1400,
        label: 'Test Uptime',
      },
      {
        id: 2,
        countTo: this.randomInt(10, 24),
        suffix: '/7',
        countDuration: 1800,
        label: 'Test Monitoring',
      },
      {
        id: 3,
        countTo: this.randomInt(80, 240),
        suffix: '+',
        countDuration: 2000,
        label: 'Test Modules',
      },
      {
        id: 4,
        countTo: this.randomInt(40, 50),
        suffix: '/10',
        countDuration: 1700,
        label: 'Test Rating',
      },
    ];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
