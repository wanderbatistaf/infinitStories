import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routes } from './app.routes';
import {AuthGuard} from "./auth.guard";
import {AuthService} from "./_services/auth.service"; // Certifique-se de que o caminho está correto

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [AuthService, AuthGuard]
})
export class AppComponent {
  title = 'infinite-story-shelf';
}
