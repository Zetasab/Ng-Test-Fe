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
import { DeveloperService } from '../../../services/games/developer.service';
import { DeveloperModel } from '../../../../models/games/developer.model';

@Component({
  selector: 'app-developer-page',
  imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    LaddaResponseButton,
  ],
  templateUrl: './developer-page.html',
  styleUrl: './developer-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeveloperPage {
  private static readonly BUTTON_FEEDBACK_DELAY_MS = 600;

  private readonly formBuilder = inject(FormBuilder);
  private readonly developerService = inject(DeveloperService);

  protected readonly developers = signal<DeveloperModel[]>([]);
  protected readonly isGridLoading = signal(false);

  protected readonly isDeveloperDialogVisible = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingDeveloperId = signal<string | null>(null);

  protected readonly isDeleteDialogVisible = signal(false);
  protected readonly deletingDeveloper = signal<DeveloperModel | null>(null);

  protected readonly saveButtonState = signal<LaddaResponseState>('idle');
  protected readonly deleteButtonState = signal<LaddaResponseState>('idle');

  protected readonly isSavePending = computed(() => this.saveButtonState() === 'loading');
  protected readonly isDeletePending = computed(() => this.deleteButtonState() === 'loading');
  protected readonly isEditMode = computed(() => this.dialogMode() === 'edit');
  protected readonly developerDialogTitle = computed(() =>
    this.isEditMode() ? 'Editar developer' : 'Añadir developer',
  );

  protected readonly developerForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    country: ['', [Validators.maxLength(120)]],
    foundedDate: null as Date | null,
  });

  public ngOnInit(): void {
    void this.loadDevelopers();
  }

  protected openCreateDialog(): void {
    this.dialogMode.set('create');
    this.editingDeveloperId.set(null);
    this.developerForm.reset({
      name: '',
      country: '',
      foundedDate: null,
    });
    this.saveButtonState.set('idle');
    this.isDeveloperDialogVisible.set(true);
  }

  protected openEditDialog(developer: DeveloperModel): void {
    this.dialogMode.set('edit');
    this.editingDeveloperId.set(developer.id);
    this.developerForm.reset({
      name: developer.name,
      country: developer.country ?? '',
      foundedDate: this.parseDateOnly(developer.foundedDate),
    });
    this.saveButtonState.set('idle');
    this.isDeveloperDialogVisible.set(true);
  }

  protected closeDeveloperDialog(): void {
    if (this.isSavePending()) {
      return;
    }

    this.isDeveloperDialogVisible.set(false);
    this.saveButtonState.set('idle');
  }

  protected async submitDeveloper(): Promise<void> {
    this.saveButtonState.set('idle');

    if (this.developerForm.invalid) {
      this.developerForm.markAllAsTouched();
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
      return;
    }

    this.saveButtonState.set('loading');

    try {
      const model = new DeveloperModel();
      model.name = this.developerForm.controls.name.value.trim();

      const countryValue = this.developerForm.controls.country.value.trim();
      model.country = countryValue ? countryValue : null;

      const foundedDateValue = this.developerForm.controls.foundedDate.value;
      model.foundedDate = foundedDateValue ? this.formatDateOnly(foundedDateValue) : null;

      if (this.isEditMode()) {
        const developerId = this.editingDeveloperId();
        if (!developerId) {
          throw new Error('No se encontró el id del developer para editar.');
        }

        await firstValueFrom(this.developerService.update(developerId, model));
      } else {
        await firstValueFrom(this.developerService.insert(model));
      }

      this.saveButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isDeveloperDialogVisible.set(false);
      this.saveButtonState.set('idle');
      await this.loadDevelopers();
    } catch (error: unknown) {
      console.error('Error guardando developer:', error);
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
    }
  }

  protected openDeleteDialog(developer: DeveloperModel): void {
    this.deletingDeveloper.set(developer);
    this.deleteButtonState.set('idle');
    this.isDeleteDialogVisible.set(true);
  }

  protected closeDeleteDialog(): void {
    if (this.isDeletePending()) {
      return;
    }

    this.isDeleteDialogVisible.set(false);
    this.deletingDeveloper.set(null);
    this.deleteButtonState.set('idle');
  }

  protected async confirmDelete(): Promise<void> {
    const developer = this.deletingDeveloper();
    if (!developer?.id) {
      return;
    }

    this.deleteButtonState.set('loading');

    try {
      await firstValueFrom(this.developerService.delete(developer.id));
      this.deleteButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isDeleteDialogVisible.set(false);
      this.deletingDeveloper.set(null);
      this.deleteButtonState.set('idle');
      await this.loadDevelopers();
    } catch (error: unknown) {
      console.error('Error borrando developer:', error);
      this.deleteButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.deleteButtonState.set('idle');
    }
  }

  protected onGlobalFilter(table: Table, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    table.filterGlobal(input?.value ?? '', 'contains');
  }

  protected trackByDeveloperId(index: number, developer: DeveloperModel): string {
    return developer.id || `${index}-${developer.name}`;
  }

  private async loadDevelopers(): Promise<void> {
    this.isGridLoading.set(true);

    try {
      const result = await firstValueFrom(this.developerService.getAll());
      this.developers.set(result);
    } catch (error: unknown) {
      console.error('Error cargando developers:', error);
      this.developers.set([]);
    } finally {
      this.isGridLoading.set(false);
    }
  }

  private async waitButtonFeedback(): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, DeveloperPage.BUTTON_FEEDBACK_DELAY_MS);
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

}
