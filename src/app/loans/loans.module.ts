import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { LoansComponent } from './loans.component';
import { LoanApplicationsService } from './services/loan-applications.service';

const routes: Routes = [
  { path: '', component: LoansComponent }
];

@NgModule({
  declarations: [LoansComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  providers: [LoanApplicationsService]
})
export class LoansModule {}
