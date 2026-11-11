import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard, AuthGuard } from './auth.guard';
import { AuthComponent } from './auth.component';

const routes: Routes = [
  { path: 'login', component: AuthComponent, data: { mode: 'login' } },
  { path: 'register', component: AuthComponent, data: { mode: 'register' } },
  {
    path: 'app',
    canActivate: [AuthGuard],
    loadChildren: () => import('./loans/loans.module').then(module => module.LoansModule)
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadChildren: () => import('./loans/loans.module').then(module => module.LoansModule)
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
