import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import {
  LaddaResponseButton,
  type LaddaResponseState,
} from '../../../components/ladda-response-button/ladda-response-button';
import { PlatformService } from '../../../services/games/platform.service';
import { PlatformModel } from '../../../../models/games/platform.model';

@Component({
  selector: 'app-platform-page',
  imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    LaddaResponseButton,
  ],
  templateUrl: './platform-page.html',
  styleUrl: './platform-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformPage {
  private static readonly BUTTON_FEEDBACK_DELAY_MS = 600;

  private readonly formBuilder = inject(FormBuilder);
  private readonly platformService = inject(PlatformService);

  protected readonly platforms = signal<PlatformModel[]>([]);
  protected readonly isGridLoading = signal(false);

  protected readonly isPlatformDialogVisible = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingPlatformId = signal<string | null>(null);

  protected readonly isDeleteDialogVisible = signal(false);
  protected readonly deletingPlatform = signal<PlatformModel | null>(null);

  protected readonly saveButtonState = signal<LaddaResponseState>('idle');
  protected readonly deleteButtonState = signal<LaddaResponseState>('idle');

  protected readonly isSavePending = computed(() => this.saveButtonState() === 'loading');
  protected readonly isDeletePending = computed(() => this.deleteButtonState() === 'loading');
  protected readonly isEditMode = computed(() => this.dialogMode() === 'edit');
  protected readonly platformDialogTitle = computed(() =>
    this.isEditMode() ? 'Editar platform' : 'Añadir platform',
  );

  protected readonly platformForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    manufacturer: ['', [Validators.maxLength(120)]],
    releaseYear: null as Date | null,
  });

  public ngOnInit(): void {
    void this.loadPlatforms();
  }

  protected openCreateDialog(): void {
    this.dialogMode.set('create');
    this.editingPlatformId.set(null);
    this.platformForm.reset({
      name: '',
      manufacturer: '',
      releaseYear: null,
    });
    this.saveButtonState.set('idle');
    this.isPlatformDialogVisible.set(true);
  }

  protected openEditDialog(platform: PlatformModel): void {
    this.dialogMode.set('edit');
    this.editingPlatformId.set(platform.id);
    this.platformForm.reset({
      name: platform.name,
      manufacturer: platform.manufacturer ?? '',
      releaseYear: this.parseYear(platform.releaseYear),
    });
    this.saveButtonState.set('idle');
    this.isPlatformDialogVisible.set(true);
  }

  protected closePlatformDialog(): void {
    if (this.isSavePending()) {
      return;
    }

    this.isPlatformDialogVisible.set(false);
    this.saveButtonState.set('idle');
  }

  protected async submitPlatform(): Promise<void> {
    this.saveButtonState.set('idle');

    if (this.platformForm.invalid) {
      this.platformForm.markAllAsTouched();
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
      return;
    }

    this.saveButtonState.set('loading');

    try {
      const model = new PlatformModel();
      model.name = this.platformForm.controls.name.value.trim();

      const manufacturerValue = this.platformForm.controls.manufacturer.value.trim();
      model.manufacturer = manufacturerValue ? manufacturerValue : null;

      const releaseYearValue = this.platformForm.controls.releaseYear.value;
      model.releaseYear = releaseYearValue ? releaseYearValue.getFullYear() : null;

      if (this.isEditMode()) {
        const platformId = this.editingPlatformId();
        if (!platformId) {
          throw new Error('No se encontró el id del platform para editar.');
        }

        await firstValueFrom(this.platformService.update(platformId, model));
      } else {
        await firstValueFrom(this.platformService.insert(model));
      }

      this.saveButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isPlatformDialogVisible.set(false);
      this.saveButtonState.set('idle');
      await this.loadPlatforms();
    } catch (error: unknown) {
      console.error('Error guardando platform:', error);
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
    }
  }

  protected openDeleteDialog(platform: PlatformModel): void {
    this.deletingPlatform.set(platform);
    this.deleteButtonState.set('idle');
    this.isDeleteDialogVisible.set(true);
  }

  protected closeDeleteDialog(): void {
    if (this.isDeletePending()) {
      return;
    }

    this.isDeleteDialogVisible.set(false);
    this.deletingPlatform.set(null);
    this.deleteButtonState.set('idle');
  }

  protected async confirmDelete(): Promise<void> {
    const platform = this.deletingPlatform();
    if (!platform?.id) {
      return;
    }

    this.deleteButtonState.set('loading');

    try {
      await firstValueFrom(this.platformService.delete(platform.id));
      this.deleteButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isDeleteDialogVisible.set(false);
      this.deletingPlatform.set(null);
      this.deleteButtonState.set('idle');
      await this.loadPlatforms();
    } catch (error: unknown) {
      console.error('Error borrando platform:', error);
      this.deleteButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.deleteButtonState.set('idle');
    }
  }

  protected onGlobalFilter(table: Table, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    table.filterGlobal(input?.value ?? '', 'contains');
  }

  protected trackByPlatformId(index: number, platform: PlatformModel): string {
    return platform.id || `${index}-${platform.name}`;
  }

  private async loadPlatforms(): Promise<void> {
    this.isGridLoading.set(true);

    try {
      const result = await firstValueFrom(this.platformService.getAll());
      this.platforms.set(result);
    } catch (error: unknown) {
      console.error('Error cargando platforms:', error);
      this.platforms.set([]);
    } finally {
      this.isGridLoading.set(false);
    }
  }

  private async waitButtonFeedback(): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, PlatformPage.BUTTON_FEEDBACK_DELAY_MS);
    });
  }

  private parseYear(year: number | null): Date | null {
    if (year === null) {
      return null;
    }

    return new Date(year, 0, 1);
  }

}
