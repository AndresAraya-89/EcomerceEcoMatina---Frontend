import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Inicio } from "./features/inicio/inicio";
import { Footer } from "./shared/components/footer/footer";
import { Header } from "./shared/components/header/header";
import { Toast } from "./shared/components/toast/toast";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Inicio, Footer, Header, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AgromatinaFront');
}
