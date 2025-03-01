import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {FormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: true,
  imports: [
    FormsModule,
    NgIf
  ]
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private router: Router) {}

  login() {
    if (this.username === 'admin' && this.password === '4Ndr3w5077') {
      localStorage.setItem('loggedIn', 'true');  // Salva o login
      this.router.navigate(['/poema']);  // Redireciona para a página principal
    } else {
      this.errorMessage = 'Usuário ou senha incorretos!';
    }
  }
}
