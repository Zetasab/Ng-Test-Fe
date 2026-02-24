import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import {
  LaddaResponseButton,
  type LaddaResponseState,
} from '../../../components/ladda-response-button/ladda-response-button';
import { DeveloperModel } from '../../../../models/games/developer.model';
import { GameService } from '../../../services/games/game.service';
import { GameModel } from '../../../../models/games/game.model';
import { GenreModel } from '../../../../models/games/genre.model';
import { PlatformModel } from '../../../../models/games/platform.model';
import { ReviewModel } from '../../../../models/games/review.model';
import { TagModel } from '../../../../models/games/tag.model';
import { DeveloperService } from '../../../services/games/developer.service';
import { GenreService } from '../../../services/games/genre.service';
import { PlatformService } from '../../../services/games/platform.service';
import { ReviewService } from '../../../services/games/review.service';
import { TagService } from '../../../services/games/tag.service';

type SelectOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-game-page',
  imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    MultiSelectModule,
    LaddaResponseButton,
  ],
  templateUrl: './game-page.html',
  styleUrl: './game-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamePage {
  private static readonly BUTTON_FEEDBACK_DELAY_MS = 600;

  private readonly formBuilder = inject(FormBuilder);
  private readonly gameService = inject(GameService);
  private readonly platformService = inject(PlatformService);
  private readonly developerService = inject(DeveloperService);
  private readonly tagService = inject(TagService);
  private readonly genreService = inject(GenreService);
  private readonly reviewService = inject(ReviewService);

  protected readonly games = signal<GameModel[]>([]);
  protected readonly isGridLoading = signal(false);
  protected readonly areLookupsLoading = signal(false);

  protected readonly platformOptions = signal<SelectOption[]>([]);
  protected readonly developerOptions = signal<SelectOption[]>([]);
  protected readonly tagOptions = signal<SelectOption[]>([]);
  protected readonly genreOptions = signal<SelectOption[]>([]);
  protected readonly reviewOptions = signal<SelectOption[]>([]);

  protected readonly isGameDialogVisible = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingGameId = signal<string | null>(null);

  protected readonly isDeleteDialogVisible = signal(false);
  protected readonly deletingGame = signal<GameModel | null>(null);

  protected readonly saveButtonState = signal<LaddaResponseState>('idle');
  protected readonly deleteButtonState = signal<LaddaResponseState>('idle');

  protected readonly isSavePending = computed(() => this.saveButtonState() === 'loading');
  protected readonly isDeletePending = computed(() => this.deleteButtonState() === 'loading');
  protected readonly isEditMode = computed(() => this.dialogMode() === 'edit');
  protected readonly gameDialogTitle = computed(() =>
    this.isEditMode() ? 'Editar game' : 'Añadir game',
  );

  protected readonly gameForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(160)]),
    imgUrl: this.formBuilder.nonNullable.control('', [Validators.maxLength(500)]),
    description: this.formBuilder.nonNullable.control('', [Validators.maxLength(500)]),
    releaseDate: this.formBuilder.control<Date | null>(null),
    platformId: this.formBuilder.control<string | null>(null),
    developerId: this.formBuilder.control<string | null>(null),
    tagIds: this.formBuilder.nonNullable.control<string[]>([]),
    genreIds: this.formBuilder.nonNullable.control<string[]>([]),
    reviewIds: this.formBuilder.nonNullable.control<string[]>([]),
  });

  public ngOnInit(): void {
    void this.loadLookups();
    void this.loadGames();
  }

  protected openCreateDialog(): void {
    this.dialogMode.set('create');
    this.editingGameId.set(null);
    this.gameForm.reset({
      title: '',
      imgUrl: '',
      description: '',
      releaseDate: null,
      platformId: null,
      developerId: null,
      tagIds: [],
      genreIds: [],
      reviewIds: [],
    });
    this.saveButtonState.set('idle');
    this.isGameDialogVisible.set(true);
  }

  protected openEditDialog(game: GameModel): void {
    this.dialogMode.set('edit');
    this.editingGameId.set(game.id);
    this.gameForm.reset({
      title: game.title,
      imgUrl: game.imgUrl ?? '',
      description: game.description ?? '',
      releaseDate: this.parseDateOnly(game.releaseDate),
      platformId: game.platformId,
      developerId: game.developerId,
      tagIds: [...game.tagIds],
      genreIds: [...game.genreIds],
      reviewIds: [...game.reviewIds],
    });
    this.saveButtonState.set('idle');
    this.isGameDialogVisible.set(true);
  }

  protected closeGameDialog(): void {
    if (this.isSavePending()) {
      return;
    }

    this.isGameDialogVisible.set(false);
    this.saveButtonState.set('idle');
  }

  protected async submitGame(): Promise<void> {
    this.saveButtonState.set('idle');

    if (this.gameForm.invalid) {
      this.gameForm.markAllAsTouched();
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
      return;
    }

    this.saveButtonState.set('loading');

    try {
      const model = new GameModel();
      model.title = this.gameForm.controls.title.value.trim();

      const imgUrlValue = this.gameForm.controls.imgUrl.value.trim();
      model.imgUrl = imgUrlValue ? imgUrlValue : null;

      const descriptionValue = this.gameForm.controls.description.value.trim();
      model.description = descriptionValue ? descriptionValue : null;

      const releaseDateValue = this.gameForm.controls.releaseDate.value;
      model.releaseDate = releaseDateValue ? this.formatDateOnly(releaseDateValue) : null;

      model.platformId = this.gameForm.controls.platformId.value;

      model.developerId = this.gameForm.controls.developerId.value;

      model.tagIds = [...this.gameForm.controls.tagIds.value];
      model.genreIds = [...this.gameForm.controls.genreIds.value];
      model.reviewIds = [...this.gameForm.controls.reviewIds.value];

      if (this.isEditMode()) {
        const gameId = this.editingGameId();
        if (!gameId) {
          throw new Error('No se encontró el id del game para editar.');
        }

        await firstValueFrom(this.gameService.update(gameId, model));
      } else {
        await firstValueFrom(this.gameService.insert(model));
      }

      this.saveButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isGameDialogVisible.set(false);
      this.saveButtonState.set('idle');
      await this.loadGames();
    } catch (error: unknown) {
      console.error('Error guardando game:', error);
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
    }
  }

  protected openDeleteDialog(game: GameModel): void {
    this.deletingGame.set(game);
    this.deleteButtonState.set('idle');
    this.isDeleteDialogVisible.set(true);
  }

  protected closeDeleteDialog(): void {
    if (this.isDeletePending()) {
      return;
    }

    this.isDeleteDialogVisible.set(false);
    this.deletingGame.set(null);
    this.deleteButtonState.set('idle');
  }

  protected async confirmDelete(): Promise<void> {
    const game = this.deletingGame();
    if (!game?.id) {
      return;
    }

    this.deleteButtonState.set('loading');

    try {
      await firstValueFrom(this.gameService.delete(game.id));
      this.deleteButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isDeleteDialogVisible.set(false);
      this.deletingGame.set(null);
      this.deleteButtonState.set('idle');
      await this.loadGames();
    } catch (error: unknown) {
      console.error('Error borrando game:', error);
      this.deleteButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.deleteButtonState.set('idle');
    }
  }

  protected onGlobalFilter(table: Table, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    table.filterGlobal(input?.value ?? '', 'contains');
  }

  protected trackByGameId(index: number, game: GameModel): string {
    return game.id || `${index}-${game.title}`;
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

  protected getReviewLabels(reviewIds: string[]): string {
    return this.getOptionLabels(this.reviewOptions(), reviewIds);
  }

  private async loadGames(): Promise<void> {
    this.isGridLoading.set(true);

    try {
      const result = await firstValueFrom(this.gameService.getAll());
      this.games.set(result);
    } catch (error: unknown) {
      console.error('Error cargando games:', error);
      this.games.set([]);
    } finally {
      this.isGridLoading.set(false);
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
      this.reviewOptions.set(this.mapReviewOptions(reviews));
    } catch (error: unknown) {
      console.error('Error cargando catálogos de game:', error);
      this.platformOptions.set([]);
      this.developerOptions.set([]);
      this.tagOptions.set([]);
      this.genreOptions.set([]);
      this.reviewOptions.set([]);
    } finally {
      this.areLookupsLoading.set(false);
    }
  }

  private async waitButtonFeedback(): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, GamePage.BUTTON_FEEDBACK_DELAY_MS);
    });
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

  private mapNamedOptions(items: Array<{ id: string; name: string }>): SelectOption[] {
    return items.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  }

  private mapReviewOptions(items: ReviewModel[]): SelectOption[] {
    return items.map((item) => ({
      value: item.id,
      label: `${item.gameId} · ${item.rating}`,
    }));
  }

  private getOptionLabel(options: SelectOption[], id: string | null): string {
    if (!id) {
      return '-';
    }

    const option = options.find((item) => item.value === id);
    return option?.label ?? id;
  }

  private getOptionLabels(options: SelectOption[], ids: string[]): string {
    if (ids.length === 0) {
      return '-';
    }

    const labels = ids.map((id) => this.getOptionLabel(options, id));
    return labels.join(', ');
  }

}
