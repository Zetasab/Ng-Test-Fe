import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { Table, TableModule } from 'primeng/table';
import {
  LaddaResponseButton,
  type LaddaResponseState,
} from '../../../components/ladda-response-button/ladda-response-button';
import { GameService } from '../../../services/games/game.service';
import { ReviewService } from '../../../services/games/review.service';
import { GameModel } from '../../../../models/games/game.model';
import { ReviewModel } from '../../../../models/games/review.model';

type SelectOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-review-page',
  imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    SliderModule,
    LaddaResponseButton,
  ],
  templateUrl: './review-page.html',
  styleUrl: './review-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPage {
  private static readonly BUTTON_FEEDBACK_DELAY_MS = 600;

  private readonly formBuilder = inject(FormBuilder);
  private readonly reviewService = inject(ReviewService);
  private readonly gameService = inject(GameService);

  protected readonly reviews = signal<ReviewModel[]>([]);
  protected readonly isGridLoading = signal(false);
  protected readonly isGameOptionsLoading = signal(false);
  protected readonly gameOptions = signal<SelectOption[]>([]);

  protected readonly isReviewDialogVisible = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingReviewId = signal<string | null>(null);

  protected readonly isDeleteDialogVisible = signal(false);
  protected readonly deletingReview = signal<ReviewModel | null>(null);

  protected readonly saveButtonState = signal<LaddaResponseState>('idle');
  protected readonly deleteButtonState = signal<LaddaResponseState>('idle');

  protected readonly isSavePending = computed(() => this.saveButtonState() === 'loading');
  protected readonly isDeletePending = computed(() => this.deleteButtonState() === 'loading');
  protected readonly isEditMode = computed(() => this.dialogMode() === 'edit');
  protected readonly reviewDialogTitle = computed(() =>
    this.isEditMode() ? 'Editar review' : 'Añadir review',
  );

  protected readonly reviewForm = this.formBuilder.nonNullable.group({
    gameId: this.formBuilder.control<string | null>(null, [Validators.required, Validators.maxLength(100)]),
    userId: ['', [Validators.maxLength(100)]],
    rating: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    comment: ['', [Validators.maxLength(500)]],
  });

  public ngOnInit(): void {
    void this.loadGameOptions();
    void this.loadReviews();
  }

  protected openCreateDialog(): void {
    this.dialogMode.set('create');
    this.editingReviewId.set(null);
    this.reviewForm.reset({
      gameId: null,
      userId: '',
      rating: 0,
      comment: '',
    });
    this.saveButtonState.set('idle');
    this.isReviewDialogVisible.set(true);
  }

  protected openEditDialog(review: ReviewModel): void {
    this.dialogMode.set('edit');
    this.editingReviewId.set(review.id);
    this.reviewForm.reset({
      gameId: review.gameId,
      userId: review.userId ?? '',
      rating: review.rating,
      comment: review.comment ?? '',
    });
    this.saveButtonState.set('idle');
    this.isReviewDialogVisible.set(true);
  }

  protected closeReviewDialog(): void {
    if (this.isSavePending()) {
      return;
    }

    this.isReviewDialogVisible.set(false);
    this.saveButtonState.set('idle');
  }

  protected async submitReview(): Promise<void> {
    this.saveButtonState.set('idle');

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
      return;
    }

    this.saveButtonState.set('loading');

    try {
      const model = new ReviewModel();
      const gameIdValue = this.reviewForm.controls.gameId.value;

      if (!gameIdValue) {
        throw new Error('Debes seleccionar un game.');
      }

      model.gameId = gameIdValue;

      const userIdValue = this.reviewForm.controls.userId.value.trim();
      model.userId = userIdValue ? userIdValue : null;

      model.rating = this.reviewForm.controls.rating.value;

      const commentValue = this.reviewForm.controls.comment.value.trim();
      model.comment = commentValue ? commentValue : null;

      if (this.isEditMode()) {
        const reviewId = this.editingReviewId();
        if (!reviewId) {
          throw new Error('No se encontró el id del review para editar.');
        }

        await firstValueFrom(this.reviewService.update(reviewId, model));
      } else {
        await firstValueFrom(this.reviewService.insert(model));
      }

      this.saveButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isReviewDialogVisible.set(false);
      this.saveButtonState.set('idle');
      await this.loadReviews();
    } catch (error: unknown) {
      console.error('Error guardando review:', error);
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
    }
  }

  protected openDeleteDialog(review: ReviewModel): void {
    this.deletingReview.set(review);
    this.deleteButtonState.set('idle');
    this.isDeleteDialogVisible.set(true);
  }

  protected closeDeleteDialog(): void {
    if (this.isDeletePending()) {
      return;
    }

    this.isDeleteDialogVisible.set(false);
    this.deletingReview.set(null);
    this.deleteButtonState.set('idle');
  }

  protected async confirmDelete(): Promise<void> {
    const review = this.deletingReview();
    if (!review?.id) {
      return;
    }

    this.deleteButtonState.set('loading');

    try {
      await firstValueFrom(this.reviewService.delete(review.id));
      this.deleteButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isDeleteDialogVisible.set(false);
      this.deletingReview.set(null);
      this.deleteButtonState.set('idle');
      await this.loadReviews();
    } catch (error: unknown) {
      console.error('Error borrando review:', error);
      this.deleteButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.deleteButtonState.set('idle');
    }
  }

  protected onGlobalFilter(table: Table, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    table.filterGlobal(input?.value ?? '', 'contains');
  }

  protected trackByReviewId(index: number, review: ReviewModel): string {
    return review.id || `${index}-${review.gameId}`;
  }

  private async loadReviews(): Promise<void> {
    this.isGridLoading.set(true);

    try {
      const result = await firstValueFrom(this.reviewService.getAll());
      this.reviews.set(result);
    } catch (error: unknown) {
      console.error('Error cargando reviews:', error);
      this.reviews.set([]);
    } finally {
      this.isGridLoading.set(false);
    }
  }

  private async loadGameOptions(): Promise<void> {
    this.isGameOptionsLoading.set(true);

    try {
      const games = await firstValueFrom(this.gameService.getAll());
      this.gameOptions.set(this.mapGameOptions(games));
    } catch (error: unknown) {
      console.error('Error cargando games para reviews:', error);
      this.gameOptions.set([]);
    } finally {
      this.isGameOptionsLoading.set(false);
    }
  }

  private async waitButtonFeedback(): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, ReviewPage.BUTTON_FEEDBACK_DELAY_MS);
    });
  }

  private mapGameOptions(games: GameModel[]): SelectOption[] {
    return games.map((game) => ({
      value: game.id,
      label: game.title,
    }));
  }

}
