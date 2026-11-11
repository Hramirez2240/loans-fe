import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { LoansComponent } from './loans.component';
import { AuthService } from '../services/auth.service';
import { LoanApplication, LoanApplicationsService } from './services/loan-applications.service';

describe('LoansComponent', () => {
  const applications: LoanApplication[] = [];
  const loans = {
    applications,
    loadMine: jasmine.createSpy('loadMine').and.returnValue(of(applications)),
    loadAll: jasmine.createSpy('loadAll').and.returnValue(of(applications)),
    create: jasmine.createSpy('create').and.returnValue(of({})),
    resolve: jasmine.createSpy('resolve').and.returnValue(of({}))
  };
  const auth = {
    currentUser: { id: '1', fullName: 'María Gómez', email: 'maria@example.com', role: 'USER' as const },
    isAuthenticated: true,
    token: 'test-token',
    logout: jasmine.createSpy('logout')
  };

  beforeEach(() => {
    loans.loadMine.calls.reset();
    loans.loadAll.calls.reset();
    loans.create.calls.reset();
    TestBed.configureTestingModule({
      imports: [CommonModule, ReactiveFormsModule, RouterTestingModule],
      declarations: [LoansComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: LoanApplicationsService, useValue: loans }
      ]
    });
  });

  it('loads the signed-in user dashboard', () => {
    const fixture = TestBed.createComponent(LoansComponent);
    fixture.detectChanges();

    expect(loans.loadMine).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Hola, María Gómez');
    expect(fixture.nativeElement.querySelector('.brand')?.textContent).toContain('Préstamos');
  });

  it('does not send an invalid loan request', () => {
    const fixture = TestBed.createComponent(LoansComponent);
    const component = fixture.componentInstance;
    component.loanForm.patchValue({ purpose: 'Viaje', amount: 250, term: 6, consent: false });

    component.submitApplication();

    expect(component.loanForm.invalid).toBeTrue();
    expect(loans.create).not.toHaveBeenCalled();
  });
});
