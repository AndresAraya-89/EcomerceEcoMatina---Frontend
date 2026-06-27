import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from "./shared/components/footer/footer";
import { Header } from "./shared/components/header/header";
import { Toast } from "./shared/components/toast/toast";
import { WhatsappButton } from "./shared/components/whatsapp-button/whatsapp-button";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Header, Toast, WhatsappButton],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AgromatinaFront');
}
