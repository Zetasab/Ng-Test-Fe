import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AUTH_SESSION_KEY } from '../../auth.guard';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  protected readonly submitted = signal(false);
  protected readonly invalidCredentials = signal(false);
  protected readonly isDarkMode = this.themeService.isDarkMode;

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  public ngOnInit(): void {
    const isAuthenticated = sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
    if (isAuthenticated) {
      void this.router.navigateByUrl('/');
    }
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    this.invalidCredentials.set(false);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.getRawValue();
    const isValidLogin =
      credentials.username === 'admin' && credentials.password === 'admin';

    if (!isValidLogin) {
      this.invalidCredentials.set(true);
      return;
    }

    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    void this.router.navigateByUrl('/');
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

}
