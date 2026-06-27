import { Component } from '@angular/core';
import { HeroSection } from "./hero-section/hero-section";
import { SeccionCategoriaRapidas } from "./seccion-categoria-rapidas/seccion-categoria-rapidas";
import { SeccionOfertas } from "./seccion-ofertas/seccion-ofertas";
import { SeccionCategoriasTecnicas } from "./seccion-categorias-tecnicas/seccion-categorias-tecnicas";
import { ChatbotWidget } from "../../shared/components/chatbot-widget/chatbot-widget";

@Component({
  selector: 'app-inicio',
  imports: [HeroSection, SeccionCategoriaRapidas, SeccionOfertas, SeccionCategoriasTecnicas, ChatbotWidget],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {

}
