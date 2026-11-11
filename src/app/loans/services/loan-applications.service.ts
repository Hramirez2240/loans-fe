import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_URL } from '../../services/auth.service';

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LoanApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  amount: number;
  termMonths: number;
  purpose: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanRequest {
  amount: number;
  termMonths: number;
  purpose: string;
}

@Injectable()
export class LoanApplicationsService {
  private readonly applicationsSubject = new BehaviorSubject<LoanApplication[]>([]);

  constructor(private http: HttpClient) {}

  get applications(): LoanApplication[] {
    return this.applicationsSubject.value;
  }

  loadMine(): Observable<LoanApplication[]> {
    return this.load(`${API_URL}/loans`);
  }

  loadAll(): Observable<LoanApplication[]> {
    return this.load(`${API_URL}/admin/loans`);
  }

  create(request: CreateLoanRequest): Observable<LoanApplication> {
    return this.http.post<LoanApplication>(`${API_URL}/loans`, request).pipe(
      tap(application => this.applicationsSubject.next([application, ...this.applications]))
    );
  }

  resolve(id: string, status: Exclude<ApplicationStatus, 'PENDING'>): Observable<LoanApplication> {
    return this.http.patch<LoanApplication>(`${API_URL}/admin/loans/${id}/status`, { status }).pipe(
      tap(updated => this.applicationsSubject.next(
        this.applications.map(application => application.id === updated.id ? updated : application)
      ))
    );
  }

  private load(url: string): Observable<LoanApplication[]> {
    return this.http.get<LoanApplication[]>(url).pipe(
      tap(applications => this.applicationsSubject.next(applications))
    );
  }
}
