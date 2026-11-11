import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  mode: AuthMode = 'login';
  isSubmitting = false;
  errorMessage = '';
  sessionExpired = false;
  readonly authForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.authForm = this.formBuilder.group({
      fullName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get isRegister(): boolean {
    return this.mode === 'register';
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.mode = data['mode'] === 'register' ? 'register' : 'login';
      const fullName = this.authForm.get('fullName');
      fullName?.setValidators(
        this.isRegister ? [Validators.required, Validators.minLength(2), Validators.maxLength(100)] : null
      );
      fullName?.updateValueAndValidity({ emitEvent: false });
      const password = this.authForm.get('password');
      password?.setValidators(
        this.isRegister ? [Validators.required, Validators.minLength(8), Validators.maxLength(72)] : Validators.required
      );
      password?.updateValueAndValidity({ emitEvent: false });
      this.authForm.reset();
      this.authForm.updateValueAndValidity();
      this.errorMessage = '';
    });
    this.route.queryParamMap.subscribe(params => {
      this.sessionExpired = params.get('expired') === 'true';
    });
  }

  fieldInvalid(fieldName: string): boolean {
    const field = this.authForm.get(fieldName);
    return Boolean(field?.invalid && (field.dirty || field.touched));
  }

  submit(): void {
    this.authForm.markAllAsTouched();
    if (this.authForm.invalid || this.isSubmitting) return;

    this.errorMessage = '';
    this.isSubmitting = true;
    const values = this.authForm.getRawValue();
    const request = this.isRegister
      ? this.auth.register({ fullName: values.fullName.trim(), email: values.email.trim(), password: values.password })
      : this.auth.login({ email: values.email.trim(), password: values.password });

    request.subscribe({
      next: session => {
        this.isSubmitting = false;
        void this.router.navigate([session.user.role === 'ADMIN' ? '/admin' : '/app']);
      },
      error: error => {
        this.isSubmitting = false;
        this.errorMessage = this.describeError(error);
      }
    });
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.detail === 'string') return error.error.detail;
      if (error.status === 0) return 'No se pudo conectar con el servicio. Verifica que el API esté disponible.';
    }
    return this.isRegister
      ? 'No se pudo crear la cuenta. Inténtalo de nuevo.'
      : 'No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo.';
  }
}
