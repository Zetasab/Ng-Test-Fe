import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import {
  LaddaResponseButton,
  type LaddaResponseState,
} from '../../../components/ladda-response-button/ladda-response-button';
import { UserRole } from '../../../../models/user-response.model';
import { UserModel } from '../../../../models/user.model';
import { UserService } from '../../../services/user.service';

type RoleOption = {
  value: UserRole;
  label: string;
};

@Component({
  selector: 'app-user-page',
  imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    LaddaResponseButton,
  ],
  templateUrl: './user-page.html',
  styleUrl: './user-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPage {
  private static readonly BUTTON_FEEDBACK_DELAY_MS = 600;

  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);

  protected readonly users = signal<UserModel[]>([]);
  protected readonly isGridLoading = signal(false);

  protected readonly isUserDialogVisible = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingUserId = signal<string | null>(null);

  protected readonly isDeleteDialogVisible = signal(false);
  protected readonly deletingUser = signal<UserModel | null>(null);

  protected readonly saveButtonState = signal<LaddaResponseState>('idle');
  protected readonly deleteButtonState = signal<LaddaResponseState>('idle');

  protected readonly isSavePending = computed(() => this.saveButtonState() === 'loading');
  protected readonly isDeletePending = computed(() => this.deleteButtonState() === 'loading');
  protected readonly isEditMode = computed(() => this.dialogMode() === 'edit');
  protected readonly userDialogTitle = computed(() =>
    this.isEditMode() ? 'Editar user' : 'Añadir user',
  );

  protected readonly roleOptions: RoleOption[] = [
    { value: UserRole.User, label: 'User' },
    { value: UserRole.Admin, label: 'Admin' },
  ];

  protected readonly userForm = this.formBuilder.group({
    username: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    passwordHash: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(255)]),
    token: this.formBuilder.nonNullable.control('', [Validators.maxLength(500)]),
    role: this.formBuilder.nonNullable.control<UserRole>(UserRole.User),
    isActive: this.formBuilder.nonNullable.control(true),
  });

  public ngOnInit(): void {
    void this.loadUsers();
  }

  protected openCreateDialog(): void {
    this.dialogMode.set('create');
    this.editingUserId.set(null);
    this.userForm.reset({
      username: '',
      passwordHash: '',
      token: '',
      role: UserRole.User,
      isActive: true,
    });
    this.saveButtonState.set('idle');
    this.isUserDialogVisible.set(true);
  }

  protected openEditDialog(user: UserModel): void {
    this.dialogMode.set('edit');
    this.editingUserId.set(user.id);
    this.userForm.reset({
      username: user.username,
      passwordHash: user.passwordHash,
      token: user.token,
      role: this.parseUserRole(user.role),
      isActive: user.isActive,
    });
    this.saveButtonState.set('idle');
    this.isUserDialogVisible.set(true);
  }

  protected closeUserDialog(): void {
    if (this.isSavePending()) {
      return;
    }

    this.isUserDialogVisible.set(false);
    this.saveButtonState.set('idle');
  }

  protected async submitUser(): Promise<void> {
    this.saveButtonState.set('idle');

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
      return;
    }

    this.saveButtonState.set('loading');

    try {
      const model = new UserModel();
      model.username = this.userForm.controls.username.value.trim();
      model.passwordHash = this.userForm.controls.passwordHash.value.trim();
      model.token = this.userForm.controls.token.value.trim();
      model.role = this.userForm.controls.role.value;
      model.isActive = this.userForm.controls.isActive.value;

      if (this.isEditMode()) {
        const userId = this.editingUserId();
        if (!userId) {
          throw new Error('No se encontró el id del user para editar.');
        }

        await firstValueFrom(this.userService.update(userId, model));
      } else {
        await firstValueFrom(this.userService.insert(model));
      }

      this.saveButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isUserDialogVisible.set(false);
      this.saveButtonState.set('idle');
      await this.loadUsers();
    } catch (error: unknown) {
      console.error('Error guardando user:', error);
      this.saveButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.saveButtonState.set('idle');
    }
  }

  protected openDeleteDialog(user: UserModel): void {
    this.deletingUser.set(user);
    this.deleteButtonState.set('idle');
    this.isDeleteDialogVisible.set(true);
  }

  protected closeDeleteDialog(): void {
    if (this.isDeletePending()) {
      return;
    }

    this.isDeleteDialogVisible.set(false);
    this.deletingUser.set(null);
    this.deleteButtonState.set('idle');
  }

  protected async confirmDelete(): Promise<void> {
    const user = this.deletingUser();
    if (!user?.id) {
      return;
    }

    this.deleteButtonState.set('loading');

    try {
      await firstValueFrom(this.userService.delete(user.id));
      this.deleteButtonState.set('correct');
      await this.waitButtonFeedback();
      this.isDeleteDialogVisible.set(false);
      this.deletingUser.set(null);
      this.deleteButtonState.set('idle');
      await this.loadUsers();
    } catch (error: unknown) {
      console.error('Error borrando user:', error);
      this.deleteButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.deleteButtonState.set('idle');
    }
  }

  protected onGlobalFilter(table: Table, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    table.filterGlobal(input?.value ?? '', 'contains');
  }

  protected getRoleLabel(role: UserRole): string {
    return role === UserRole.Admin ? 'Admin' : 'User';
  }

  protected trackByUserId(index: number, user: UserModel): string {
    return user.id || `${index}-${user.username}`;
  }

  private async loadUsers(): Promise<void> {
    this.isGridLoading.set(true);

    try {
      const result = await firstValueFrom(this.userService.getAll());
      this.users.set(result);
    } catch (error: unknown) {
      console.error('Error cargando users:', error);
      this.users.set([]);
    } finally {
      this.isGridLoading.set(false);
    }
  }

  private async waitButtonFeedback(): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, UserPage.BUTTON_FEEDBACK_DELAY_MS);
    });
  }

  private parseUserRole(role: UserRole | string | number): UserRole {
    if (role === UserRole.Admin || role === 1 || `${role}`.trim().toLowerCase() === 'admin') {
      return UserRole.Admin;
    }

    return UserRole.User;
  }
}
