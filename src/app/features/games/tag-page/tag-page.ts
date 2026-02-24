import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { LaddaResponseButton, type LaddaResponseState } from '../../../components/ladda-response-button/ladda-response-button';
import { TagService } from '../../../services/games/tag.service';
import { TagModel } from '../../../../models/games/tag.model';

@Component({
  selector: 'app-tag-page',
  imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    LaddaResponseButton,
  ],
  templateUrl: './tag-page.html',
  styleUrl: './tag-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagPage {
  private static readonly BUTTON_FEEDBACK_DELAY_MS = 600;

  private readonly formBuilder = inject(FormBuilder);
  private readonly tagService = inject(TagService);

  protected readonly tags = signal<TagModel[]>([]);
  protected readonly isGridLoading = signal(false);

  protected readonly isTagDialogVisible = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingTagId = signal<string | null>(null);

  protected readonly isDeleteDialogVisible = signal(false);
  protected readonly deletingTag = signal<TagModel | null>(null);

  protected readonly saveButtonState = signal<LaddaResponseState>('idle');
  protected readonly deleteButtonState = signal<LaddaResponseState>('idle');

  protected readonly isSavePending = computed(() => this.saveButtonState() === 'loading');
  protected readonly isDeletePending = computed(() => this.deleteButtonState() === 'loading');
  protected readonly isEditMode = computed(() => this.dialogMode() === 'edit');
  protected readonly tagDialogTitle = computed(() =>
    this.isEditMode() ? 'Editar tag' : 'Añadir tag',
  );

  protected readonly tagForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
  });

  public ngOnInit(): void {
    void this.loadTags();
  }

  protected openCreateDialog(): void {
    this.dialogMode.set('create');
    this.editingTagId.set(null);
    this.tagForm.reset({ name: '' });
    this.saveButtonState.set('idle');
    this.isTagDialogVisible.set(true);
  }

  protected openEditDialog(tag: TagModel): void {
    this.dialogMode.set('edit');
    this.editingTagId.set(tag.id);
    this.tagForm.reset({ name: tag.name });
    this.saveButtonState.set('idle');
    this.isTagDialogVisible.set(true);
  }

  protected closeTagDialog(): void {
    if (this.isSavePending()) {
      return;
    }

    this.isTagDialogVisible.set(false);
    this.saveButtonState.set('idle');
  }

  protected async submitTag(): Promise<void> {
    this.saveButtonState.set('idle');

    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched();
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
      return;
    }

    this.saveButtonState.set('loading');

    try {
      const model = new TagModel();
      model.name = this.tagForm.controls.name.value.trim();

      if (this.isEditMode()) {
        const tagId = this.editingTagId();
        if (!tagId) {
          throw new Error('No se encontró el id del tag para editar.');
        }

        await firstValueFrom(this.tagService.update(tagId, model));
      } else {
        await firstValueFrom(this.tagService.insert(model));
      }

      this.saveButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isTagDialogVisible.set(false);
      this.saveButtonState.set('idle');
      await this.loadTags();
    } catch (error: unknown) {
      console.error('Error guardando tag:', error);
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
    }
  }

  protected openDeleteDialog(tag: TagModel): void {
    this.deletingTag.set(tag);
    this.deleteButtonState.set('idle');
    this.isDeleteDialogVisible.set(true);
  }

  protected closeDeleteDialog(): void {
    if (this.isDeletePending()) {
      return;
    }

    this.isDeleteDialogVisible.set(false);
    this.deletingTag.set(null);
    this.deleteButtonState.set('idle');
  }

  protected async confirmDelete(): Promise<void> {
    const tag = this.deletingTag();
    if (!tag?.id) {
      return;
    }

    this.deleteButtonState.set('loading');

    try {
      await firstValueFrom(this.tagService.delete(tag.id));
      this.deleteButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isDeleteDialogVisible.set(false);
      this.deletingTag.set(null);
      this.deleteButtonState.set('idle');
      await this.loadTags();
    } catch (error: unknown) {
      console.error('Error borrando tag:', error);
      this.deleteButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.deleteButtonState.set('idle');
    }
  }

  protected onGlobalFilter(table: Table, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    table.filterGlobal(input?.value ?? '', 'contains');
  }

  protected trackByTagId(index: number, tag: TagModel): string {
    return tag.id || `${index}-${tag.name}`;
  }

  private async loadTags(): Promise<void> {
    this.isGridLoading.set(true);

    try {
      const result = await firstValueFrom(this.tagService.getAll());
      this.tags.set(result);
    } catch (error: unknown) {
      console.error('Error cargando tags:', error);
      this.tags.set([]);
    } finally {
      this.isGridLoading.set(false);
    }
  }

  private async waitButtonFeedback(): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, TagPage.BUTTON_FEEDBACK_DELAY_MS);
    });
  }

}
