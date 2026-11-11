import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApplicationStatus, LoanApplication, LoanApplicationsService } from './services/loan-applications.service';
import { AuthService } from '../services/auth.service';

type AppView = 'home' | 'new' | 'applications';

@Component({
  selector: 'app-loans',
  templateUrl: './loans.component.html'
})
export class LoansComponent implements OnInit {
  view: AppView = 'home';
  isSubmitting = false;
  loadingApplications = false;
  processingId: string | null = null;
  notice = '';
  pageError = '';
  readonly terms = [6, 12, 18, 24, 36, 48, 60];
  readonly loanForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private loansService: LoanApplicationsService,
    private auth: AuthService,
    private router: Router
  ) {
    this.loanForm = this.formBuilder.group({
      purpose: ['', Validators.required],
      amount: [5000, [Validators.required, Validators.min(500), Validators.max(25000)]],
      term: ['', [Validators.required, Validators.min(6), Validators.max(60)]],
      consent: [false, Validators.requiredTrue]
    });
  }

  get isAdmin(): boolean {
    return this.auth.currentUser?.role === 'ADMIN';
  }

  get currentUser() {
    return this.auth.currentUser;
  }

  get applications(): LoanApplication[] {
    return this.loansService.applications;
  }

  get pageTitle(): string {
    if (this.view === 'new') return 'Nueva solicitud';
    if (this.view === 'applications') return this.isAdmin ? 'Todas las solicitudes' : 'Mis solicitudes';
    return this.isAdmin ? 'Administración' : 'Resumen';
  }

  get pendingCount(): number {
    return this.applications.filter(application => application.status === 'PENDING').length;
  }

  get activeAmount(): number {
    return this.applications.filter(application => application.status === 'APPROVED')
      .reduce((total, application) => total + application.amount, 0);
  }

  get recentApplications(): LoanApplication[] {
    return [...this.applications]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 5);
  }

  get monthlyPayment(): number {
    const amount = Number(this.loanForm.get('amount')?.value) || 0;
    const term = Number(this.loanForm.get('term')?.value) || 0;
    if (!amount || !term) return 0;
    const monthlyRate = 0.079 / 12;
    return amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -term));
  }

  ngOnInit(): void {
    this.loadApplications();
  }

  setView(view: AppView): void {
    if (this.isAdmin && view === 'new') return;
    this.view = view;
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  fieldInvalid(fieldName: string): boolean {
    const field = this.loanForm.get(fieldName);
    return Boolean(field?.invalid && (field.dirty || field.touched));
  }

  submitApplication(): void {
    this.loanForm.markAllAsTouched();
    if (this.loanForm.invalid || this.isSubmitting || this.isAdmin) return;

    this.isSubmitting = true;
    this.pageError = '';
    const values = this.loanForm.getRawValue();
    this.loansService.create({
      purpose: values.purpose,
      amount: Number(values.amount),
      termMonths: Number(values.term)
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notice = 'Solicitud enviada. Puedes consultar su estado en cualquier momento.';
        this.view = 'home';
        this.loanForm.reset({ purpose: '', amount: 5000, term: '', consent: false });
        this.clearNotice();
      },
      error: error => {
        this.isSubmitting = false;
        this.pageError = this.describeError(error, 'No se pudo enviar la solicitud.');
      }
    });
  }

  resolveApplication(id: string, status: Exclude<ApplicationStatus, 'PENDING'>): void {
    if (!this.isAdmin || this.processingId) return;

    this.processingId = id;
    this.pageError = '';
    this.loansService.resolve(id, status).subscribe({
      next: () => {
        this.processingId = null;
        this.notice = status === 'APPROVED' ? 'Solicitud aprobada.' : 'Solicitud rechazada.';
        this.clearNotice();
      },
      error: error => {
        this.processingId = null;
        this.pageError = this.describeError(error, 'No se pudo actualizar la solicitud.');
      }
    });
  }

  statusLabel(status: ApplicationStatus): string {
    return status === 'PENDING' ? 'En revisión' : status === 'APPROVED' ? 'Aprobada' : 'Rechazada';
  }

  statusClass(status: ApplicationStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  private loadApplications(): void {
    this.loadingApplications = true;
    this.pageError = '';
    const request = this.isAdmin ? this.loansService.loadAll() : this.loansService.loadMine();
    request.subscribe({
      next: () => this.loadingApplications = false,
      error: error => {
        this.loadingApplications = false;
        this.pageError = this.describeError(error, 'No se pudieron cargar las solicitudes.');
      }
    });
  }

  private describeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.detail === 'string') return error.error.detail;
      if (error.status === 0) return 'No se pudo conectar con el servicio. Verifica que el API esté disponible.';
    }
    return fallback;
  }

  private clearNotice(): void {
    window.setTimeout(() => this.notice = '', 3500);
  }
}
