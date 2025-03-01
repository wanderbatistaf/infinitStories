import { Routes } from '@angular/router';
import {FooterComponentComponent} from "./footer-component/footer-component.component";
import {HomeComponentComponent} from "./home-component/home-component.component";
import {BookDetailComponent} from "./book-detail-component/book-detail.component";
import {AnimatedStackedPagesComponent} from "./animated-stacked-pages/animated-stacked-pages.component";
import {AuthGuard} from "./auth.guard";
import {PoemaComponent} from "./poema-component/poema.component";
import {LoginComponent} from "./login-component/login.component";

export const routes: Routes = [
  { path:'footer', component: FooterComponentComponent },
  { path: '', component: HomeComponentComponent },
  { path: 'book/:id', component: BookDetailComponent },
  { path: 'story', component: BookDetailComponent },
  { path: 'stacked', component: AnimatedStackedPagesComponent },
  { path: 'login', component: LoginComponent },
  { path: 'poema', component: PoemaComponent, canActivate: [AuthGuard] }, // Protegido
  { path: '**', redirectTo: 'login' }
];
