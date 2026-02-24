import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import {
  LaddaResponseButton,
  type LaddaResponseState,
} from '../../../components/ladda-response-button/ladda-response-button';
import { GenreService } from '../../../services/games/genre.service';
import { GenreModel } from '../../../../models/games/genre.model';

@Component({
  selector: 'app-genre-page',
  imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    LaddaResponseButton,
  ],
  templateUrl: './genre-page.html',
  styleUrl: './genre-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenrePage {
  private static readonly BUTTON_FEEDBACK_DELAY_MS = 600;

  private readonly formBuilder = inject(FormBuilder);
  private readonly genreService = inject(GenreService);

  protected readonly genres = signal<GenreModel[]>([]);
  protected readonly isGridLoading = signal(false);

  protected readonly isGenreDialogVisible = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingGenreId = signal<string | null>(null);

  protected readonly isDeleteDialogVisible = signal(false);
  protected readonly deletingGenre = signal<GenreModel | null>(null);

  protected readonly saveButtonState = signal<LaddaResponseState>('idle');
  protected readonly deleteButtonState = signal<LaddaResponseState>('idle');

  protected readonly isSavePending = computed(() => this.saveButtonState() === 'loading');
  protected readonly isDeletePending = computed(() => this.deleteButtonState() === 'loading');
  protected readonly isEditMode = computed(() => this.dialogMode() === 'edit');
  protected readonly genreDialogTitle = computed(() =>
    this.isEditMode() ? 'Editar genre' : 'Añadir genre',
  );

  protected readonly genreForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
  });

  public ngOnInit(): void {
    void this.loadGenres();
  }

  protected openCreateDialog(): void {
    this.dialogMode.set('create');
    this.editingGenreId.set(null);
    this.genreForm.reset({
      name: '',
      description: '',
    });
    this.saveButtonState.set('idle');
    this.isGenreDialogVisible.set(true);
  }

  protected openEditDialog(genre: GenreModel): void {
    this.dialogMode.set('edit');
    this.editingGenreId.set(genre.id);
    this.genreForm.reset({
      name: genre.name,
      description: genre.description ?? '',
    });
    this.saveButtonState.set('idle');
    this.isGenreDialogVisible.set(true);
  }

  protected closeGenreDialog(): void {
    if (this.isSavePending()) {
      return;
    }

    this.isGenreDialogVisible.set(false);
    this.saveButtonState.set('idle');
  }

  protected async submitGenre(): Promise<void> {
    this.saveButtonState.set('idle');

    if (this.genreForm.invalid) {
      this.genreForm.markAllAsTouched();
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
      return;
    }

    this.saveButtonState.set('loading');

    try {
      const model = new GenreModel();
      model.name = this.genreForm.controls.name.value.trim();

      const descriptionValue = this.genreForm.controls.description.value.trim();
      model.description = descriptionValue ? descriptionValue : null;

      if (this.isEditMode()) {
        const genreId = this.editingGenreId();
        if (!genreId) {
          throw new Error('No se encontró el id del genre para editar.');
        }

        await firstValueFrom(this.genreService.update(genreId, model));
      } else {
        await firstValueFrom(this.genreService.insert(model));
      }

      this.saveButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isGenreDialogVisible.set(false);
      this.saveButtonState.set('idle');
      await this.loadGenres();
    } catch (error: unknown) {
      console.error('Error guardando genre:', error);
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
    }
  }

  protected openDeleteDialog(genre: GenreModel): void {
    this.deletingGenre.set(genre);
    this.deleteButtonState.set('idle');
    this.isDeleteDialogVisible.set(true);
  }

  protected closeDeleteDialog(): void {
    if (this.isDeletePending()) {
      return;
    }

    this.isDeleteDialogVisible.set(false);
    this.deletingGenre.set(null);
    this.deleteButtonState.set('idle');
  }

  protected async confirmDelete(): Promise<void> {
    const genre = this.deletingGenre();
    if (!genre?.id) {
      return;
    }

    this.deleteButtonState.set('loading');

    try {
      await firstValueFrom(this.genreService.delete(genre.id));
      this.deleteButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isDeleteDialogVisible.set(false);
      this.deletingGenre.set(null);
      this.deleteButtonState.set('idle');
      await this.loadGenres();
    } catch (error: unknown) {
      console.error('Error borrando genre:', error);
      this.deleteButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.deleteButtonState.set('idle');
    }
  }

  protected onGlobalFilter(table: Table, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    table.filterGlobal(input?.value ?? '', 'contains');
  }

  protected trackByGenreId(index: number, genre: GenreModel): string {
    return genre.id || `${index}-${genre.name}`;
  }

  private async loadGenres(): Promise<void> {
    this.isGridLoading.set(true);

    try {
      const result = await firstValueFrom(this.genreService.getAll());
      this.genres.set(result);
    } catch (error: unknown) {
      console.error('Error cargando genres:', error);
      this.genres.set([]);
    } finally {
      this.isGridLoading.set(false);
    }
  }

  private async waitButtonFeedback(): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, GenrePage.BUTTON_FEEDBACK_DELAY_MS);
    });
  }

}
