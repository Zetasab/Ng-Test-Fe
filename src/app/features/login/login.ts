import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AUTH_SESSION_KEY, USER_SESSION_KEY } from '../../shared/auth.guard';
import { ThemeService } from '../../shared/theme.service';
import { AuthService } from '../../services/auth.service';
import { InfoService } from '../../services/info.service';
import { LaddaResponseButton, type LaddaResponseState } from '../../components/ladda-response-button/ladda-response-button';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    LaddaResponseButton,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private static readonly REMEMBER_USER_KEY = 'rememberUser';
  private static readonly REMEMBER_PASSWORD_KEY = 'rememberPassword';
  private static readonly BUTTON_FEEDBACK_DELAY_MS = 500;

  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly infoService = inject(InfoService);
  protected readonly submitted = signal(false);
  protected readonly invalidCredentials = signal(false);
  protected readonly loginButtonState = signal<LaddaResponseState>('idle');
  protected readonly isDarkMode = this.themeService.isDarkMode;

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rememberUser: false,
  });

  public ngOnInit(): void {
    const isAuthenticated = sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
    if (isAuthenticated) {
      void this.router.navigateByUrl('/');
      return;
    }

    const rememberedUsername = localStorage.getItem(Login.REMEMBER_USER_KEY);
    const rememberedPassword = localStorage.getItem(Login.REMEMBER_PASSWORD_KEY);
    if (rememberedUsername !== null && rememberedPassword !== null) {
      this.loginForm.patchValue({
        username: rememberedUsername,
        password: rememberedPassword,
        rememberUser: true,
      });
    }
  }

  protected async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.invalidCredentials.set(false);
    this.loginButtonState.set('idle');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.loginButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.loginButtonState.set('idle');
      return;
    }

    this.loginButtonState.set('loading');

    const credentials = this.loginForm.getRawValue();

    try {
      const info = await firstValueFrom(this.infoService.get());
      console.log('getInfo response:', info);
    } catch (error: unknown) {
      console.error('Error calling getInfo:', error);
    }

    try {
      const userResponse = await firstValueFrom(this.authService.login(credentials));

      if (credentials.rememberUser) {
        localStorage.setItem(Login.REMEMBER_USER_KEY, credentials.username);
        localStorage.setItem(Login.REMEMBER_PASSWORD_KEY, credentials.password);
      } else {
        localStorage.removeItem(Login.REMEMBER_USER_KEY);
        localStorage.removeItem(Login.REMEMBER_PASSWORD_KEY);
      }

      sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(userResponse));
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      this.loginButtonState.set('correct');
      await this.waitButtonFeedback();
      await this.router.navigateByUrl('/');
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.invalidCredentials.set(true);
        this.loginButtonState.set('wrong');
        await this.waitButtonFeedback();
        this.loginButtonState.set('idle');
        return;
      }

      this.invalidCredentials.set(true);
      this.loginButtonState.set('wrong');
      await this.waitButtonFeedback();
      this.loginButtonState.set('idle');
    }
  }

  private async waitButtonFeedback(): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, Login.BUTTON_FEEDBACK_DELAY_MS);
    });
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

}
