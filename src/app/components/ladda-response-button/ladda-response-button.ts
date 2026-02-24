import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { LaddaModule } from 'angular2-ladda';
import { RippleModule } from 'primeng/ripple';

export type LaddaResponseState = 'idle' | 'loading' | 'correct' | 'wrong';

@Component({
  selector: 'app-ladda-response-button',
  imports: [LaddaModule, RippleModule],
  templateUrl: './ladda-response-button.html',
  styleUrl: './ladda-response-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('feedbackIcon', [
      transition('* => correct', [
        style({ opacity: 0, transform: 'scale(0.25) rotate(-30deg)' }),
        animate('260ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'scale(1) rotate(0deg)' })),
      ]),
      transition('* => wrong', [
        style({ opacity: 0, transform: 'scale(0.25) rotate(30deg)' }),
        animate('260ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'scale(1) rotate(0deg)' })),
      ]),
      transition('correct => wrong, wrong => correct', [
        animate('160ms ease-out', style({ transform: 'scale(0.85)', opacity: 0.6 })),
        animate('220ms ease-in', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class LaddaResponseButton {
  public readonly state = input<LaddaResponseState>('idle');
  public readonly label = input('Enviar respuesta');
  public readonly loadingLabel = input('Validando...');
  public readonly correctLabel = input('Correcta');
  public readonly wrongLabel = input('Incorrecta');
  public readonly disabled = input(false);
  public readonly type = input<'button' | 'submit' | 'reset'>('button');
  public readonly fullWidth = input(false);

  public readonly pressed = output<MouseEvent>();

  protected readonly isLoading = computed(() => this.state() === 'loading');
  protected readonly isCorrect = computed(() => this.state() === 'correct');
  protected readonly isWrong = computed(() => this.state() === 'wrong');
  protected readonly feedbackState = computed<'correct' | 'wrong' | 'none'>(() => {
    if (this.isCorrect()) {
      return 'correct';
    }

    if (this.isWrong()) {
      return 'wrong';
    }

    return 'none';
  });

  protected readonly currentLabel = computed(() => {
    if (this.isLoading()) {
      return this.loadingLabel();
    }

    if (this.isCorrect()) {
      return this.correctLabel();
    }

    if (this.isWrong()) {
      return this.wrongLabel();
    }

    return this.label();
  });

  protected readonly isButtonDisabled = computed(() => this.disabled() || this.isLoading());

  protected onPressed(event: MouseEvent): void {
    if (!this.isButtonDisabled()) {
      this.pressed.emit(event);
    }
  }
}
