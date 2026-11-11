import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../services/auth.service';
import { LoanApplication, LoanApplicationsService } from './loan-applications.service';

describe('LoanApplicationsService', () => {
  let service: LoanApplicationsService;
  let http: HttpTestingController;

  const application: LoanApplication = {
    id: 'loan-1',
    applicantId: 'user-1',
    applicantName: 'María Gómez',
    applicantEmail: 'maria@example.com',
    amount: 5000,
    termMonths: 12,
    purpose: 'Estudios y formación',
    status: 'PENDING',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LoanApplicationsService]
    });
    service = TestBed.inject(LoanApplicationsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the signed-in user loan list', () => {
    service.loadMine().subscribe();
    http.expectOne(`${API_URL}/loans`).flush([application]);

    expect(service.applications).toEqual([application]);
  });

  it('creates a request using the API payload and adds the response to the list', () => {
    const request = { amount: 5000, termMonths: 12, purpose: 'Estudios y formación' };
    service.create(request).subscribe();
    const apiRequest = http.expectOne(`${API_URL}/loans`);

    expect(apiRequest.request.method).toBe('POST');
    expect(apiRequest.request.body).toEqual(request);
    apiRequest.flush(application);
    expect(service.applications).toEqual([application]);
  });

  it('uses the admin list and status endpoints', () => {
    service.loadAll().subscribe();
    http.expectOne(`${API_URL}/admin/loans`).flush([application]);

    service.resolve(application.id, 'APPROVED').subscribe();
    const apiRequest = http.expectOne(`${API_URL}/admin/loans/${application.id}/status`);
    expect(apiRequest.request.method).toBe('PATCH');
    expect(apiRequest.request.body).toEqual({ status: 'APPROVED' });
    apiRequest.flush({ ...application, status: 'APPROVED' });
    expect(service.applications[0].status).toBe('APPROVED');
  });
});
