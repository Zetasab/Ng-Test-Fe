import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { ActivatedRoute, Router } from '@angular/router';
import { DeveloperService } from '../../../services/games/developer.service';
import { GameService } from '../../../services/games/game.service';
import { GenreService } from '../../../services/games/genre.service';
import { PlatformService } from '../../../services/games/platform.service';
import { ReviewService } from '../../../services/games/review.service';
import { TagService } from '../../../services/games/tag.service';
import { GameModel } from '../../../../models/games/game.model';

type SelectOption = {
  value: string;
  label: string;
};

type ApiGamePaginationResponse = {
  Games?: GameModel[];
  games?: GameModel[];
  TotalResutls?: number;
  totalResutls?: number;
  TotalResults?: number;
  totalResults?: number;
};

@Component({
  selector: 'app-gamesearch-page',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    MultiSelectModule,
    ButtonModule,
  ],
  templateUrl: './gamesearch-page.html',
  styleUrl: './gamesearch-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesearchPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly gameService = inject(GameService);
  private readonly platformService = inject(PlatformService);
  private readonly developerService = inject(DeveloperService);
  private readonly tagService = inject(TagService);
  private readonly genreService = inject(GenreService);
  private readonly reviewService = inject(ReviewService);

  protected readonly isLoading = signal(false);
  protected readonly areLookupsLoading = signal(false);

  protected readonly games = signal<GameModel[]>([]);
  protected readonly totalResults = signal(0);

  protected readonly currentPage = signal(1);
  protected readonly pageSizeOptions = [12, 24, 36];
  protected readonly totalPages = computed(() => {
    const total = this.totalResults();
    const pageSize = this.searchForm.controls.pageSize.value;
    return Math.max(1, Math.ceil(total / pageSize));
  });

  protected readonly platformOptions = signal<SelectOption[]>([]);
  protected readonly developerOptions = signal<SelectOption[]>([]);
  protected readonly tagOptions = signal<SelectOption[]>([]);
  protected readonly genreOptions = signal<SelectOption[]>([]);
  protected readonly reviewOptions = signal<SelectOption[]>([]);

  protected readonly searchForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control(''),
    description: this.formBuilder.nonNullable.control(''),
    releaseDate: this.formBuilder.control<Date | null>(null),
    platformId: this.formBuilder.control<string | null>(null),
    developerId: this.formBuilder.control<string | null>(null),
    tagIds: this.formBuilder.nonNullable.control<string[]>([]),
    genreIds: this.formBuilder.nonNullable.control<string[]>([]),
    reviewIds: this.formBuilder.nonNullable.control<string[]>([]),
    pageSize: this.formBuilder.nonNullable.control(12),
  });

  public ngOnInit(): void {
    const initialState = this.readStateFromUrl();

    this.searchForm.patchValue({
      title: initialState.title,
      description: initialState.description,
      releaseDate: initialState.releaseDate,
      platformId: initialState.platformId,
      developerId: initialState.developerId,
      tagIds: initialState.tagIds,
      genreIds: initialState.genreIds,
      reviewIds: initialState.reviewIds,
      pageSize: initialState.pageSize,
    });

    void this.loadLookups();
    void this.searchGames(initialState.page, false);
  }

  protected async submitSearch(): Promise<void> {
    await this.searchGames(1);
  }

  protected async clearFilters(): Promise<void> {
    this.searchForm.reset({
      title: '',
      description: '',
      releaseDate: null,
      platformId: null,
      developerId: null,
      tagIds: [],
      genreIds: [],
      reviewIds: [],
      pageSize: 12,
    });

    await this.searchGames(1);
  }

  protected async goToPreviousPage(): Promise<void> {
    const nextPage = this.currentPage() - 1;
    if (nextPage < 1) {
      return;
    }

    await this.searchGames(nextPage);
  }

  protected async goToNextPage(): Promise<void> {
    const nextPage = this.currentPage() + 1;
    if (nextPage > this.totalPages()) {
      return;
    }

    await this.searchGames(nextPage);
  }

  protected getPlatformName(platformId: string | null): string {
    return this.getOptionLabel(this.platformOptions(), platformId);
  }

  protected getDeveloperName(developerId: string | null): string {
    return this.getOptionLabel(this.developerOptions(), developerId);
  }

  protected getTagNames(tagIds: string[]): string {
    return this.getOptionLabels(this.tagOptions(), tagIds);
  }

  protected getGenreNames(genreIds: string[]): string {
    return this.getOptionLabels(this.genreOptions(), genreIds);
  }

  protected getTagLabels(tagIds: string[]): string[] {
    return this.getOptionLabelsArray(this.tagOptions(), tagIds);
  }

  protected getGenreLabels(genreIds: string[]): string[] {
    return this.getOptionLabelsArray(this.genreOptions(), genreIds);
  }

  protected getReviewLabels(reviewIds: string[]): string {
    return this.getOptionLabels(this.reviewOptions(), reviewIds);
  }

  protected trackByGameId(index: number, game: GameModel): string {
    return game.id || `${index}-${game.title}`;
  }

  protected buildCardBackground(imageUrl: string | null): string {
    const fallbackImage = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=70';
    const source = imageUrl?.trim() ? imageUrl.trim() : fallbackImage;
    return `linear-gradient(to top, rgba(6, 8, 12, 0.92) 0%, rgba(6, 8, 12, 0.2) 55%, rgba(6, 8, 12, 0.1) 100%), url('${source}')`;
  }

  private async searchGames(page: number, syncUrl = true): Promise<void> {
    if (syncUrl) {
      await this.syncUrlState(page);
    }

    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.gameService.search({
          page,
          pageSize: this.searchForm.controls.pageSize.value,
          title: this.toNullIfBlank(this.searchForm.controls.title.value),
          description: this.toNullIfBlank(this.searchForm.controls.description.value),
          releaseDate: this.searchForm.controls.releaseDate.value,
          platformId: this.searchForm.controls.platformId.value,
          developerId: this.searchForm.controls.developerId.value,
          tagIds: this.joinIds(this.searchForm.controls.tagIds.value),
          genreIds: this.joinIds(this.searchForm.controls.genreIds.value),
          reviewIds: this.joinIds(this.searchForm.controls.reviewIds.value),
        }),
      ) as ApiGamePaginationResponse;

      this.games.set(response.Games ?? response.games ?? []);
      this.totalResults.set(
        response.TotalResutls
          ?? response.totalResutls
          ?? response.TotalResults
          ?? response.totalResults
          ?? 0,
      );
      this.currentPage.set(page);
    } catch (error: unknown) {
      console.error('Error buscando games:', error);
      this.games.set([]);
      this.totalResults.set(0);
      this.currentPage.set(1);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadLookups(): Promise<void> {
    this.areLookupsLoading.set(true);

    try {
      const [platforms, developers, tags, genres, reviews] = await Promise.all([
        firstValueFrom(this.platformService.getAll()),
        firstValueFrom(this.developerService.getAll()),
        firstValueFrom(this.tagService.getAll()),
        firstValueFrom(this.genreService.getAll()),
        firstValueFrom(this.reviewService.getAll()),
      ]);

      this.platformOptions.set(this.mapNamedOptions(platforms));
      this.developerOptions.set(this.mapNamedOptions(developers));
      this.tagOptions.set(this.mapNamedOptions(tags));
      this.genreOptions.set(this.mapNamedOptions(genres));
      this.reviewOptions.set(
        reviews.map((item) => ({
          value: item.id,
          label: `${item.gameId} · ${item.rating}`,
        })),
      );
    } catch (error: unknown) {
      console.error('Error cargando catálogos de búsqueda:', error);
      this.platformOptions.set([]);
      this.developerOptions.set([]);
      this.tagOptions.set([]);
      this.genreOptions.set([]);
      this.reviewOptions.set([]);
    } finally {
      this.areLookupsLoading.set(false);
    }
  }

  private mapNamedOptions(items: Array<{ id: string; name: string }>): SelectOption[] {
    return items.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  }

  private toNullIfBlank(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private readStateFromUrl(): {
    page: number;
    pageSize: number;
    title: string;
    description: string;
    releaseDate: Date | null;
    platformId: string | null;
    developerId: string | null;
    tagIds: string[];
    genreIds: string[];
    reviewIds: string[];
  } {
    const queryParams = this.route.snapshot.queryParamMap;

    const page = this.parsePositiveInteger(queryParams.get('page'), 1);
    const pageSize = this.parsePageSize(queryParams.get('pageSize'));

    return {
      page,
      pageSize,
      title: queryParams.get('title') ?? '',
      description: queryParams.get('description') ?? '',
      releaseDate: this.parseDateOnly(queryParams.get('releaseDate')),
      platformId: queryParams.get('platformId'),
      developerId: queryParams.get('developerId'),
      tagIds: this.parseIds(queryParams.get('tagIds')),
      genreIds: this.parseIds(queryParams.get('genreIds')),
      reviewIds: this.parseIds(queryParams.get('reviewIds')),
    };
  }

  private async syncUrlState(page: number): Promise<void> {
    const releaseDate = this.searchForm.controls.releaseDate.value;

    const queryParams: Record<string, string | null> = {
      page: String(page),
      pageSize: String(this.searchForm.controls.pageSize.value),
      title: this.toNullIfBlank(this.searchForm.controls.title.value),
      description: this.toNullIfBlank(this.searchForm.controls.description.value),
      releaseDate: releaseDate ? this.formatDateOnly(releaseDate) : null,
      platformId: this.searchForm.controls.platformId.value,
      developerId: this.searchForm.controls.developerId.value,
      tagIds: this.joinIds(this.searchForm.controls.tagIds.value),
      genreIds: this.joinIds(this.searchForm.controls.genreIds.value),
      reviewIds: this.joinIds(this.searchForm.controls.reviewIds.value),
    };

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  private joinIds(ids: string[]): string | null {
    return ids.length ? ids.join(',') : null;
  }

  private parseIds(value: string | null): string[] {
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => !!item);
  }

  private parseDateOnly(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private formatDateOnly(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parsePositiveInteger(value: string | null, fallback: number): number {
    const parsedValue = value ? Number(value) : Number.NaN;
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
  }

  private parsePageSize(value: string | null): number {
    const parsedPageSize = this.parsePositiveInteger(value, this.pageSizeOptions[0]);
    return this.pageSizeOptions.includes(parsedPageSize) ? parsedPageSize : this.pageSizeOptions[0];
  }

  private getOptionLabel(options: SelectOption[], id: string | null): string {
    if (!id) {
      return '-';
    }

    const option = options.find((item) => item.value === id);
    return option?.label ?? id;
  }

  private getOptionLabels(options: SelectOption[], ids: string[]): string {
    if (!ids.length) {
      return '-';
    }

    const labels = ids.map((id) => this.getOptionLabel(options, id));
    return labels.join(', ');
  }

  private getOptionLabelsArray(options: SelectOption[], ids: string[]): string[] {
    if (!ids.length) {
      return ['-'];
    }

    return ids.map((id) => this.getOptionLabel(options, id));
  }

}
