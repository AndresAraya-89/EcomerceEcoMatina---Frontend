import { Component } from '@angular/core';
import { Header } from "../../shared/components/header/header";
import { HeroSection } from "./hero-section/hero-section";
import { SeccionCategoriaRapidas } from "./seccion-categoria-rapidas/seccion-categoria-rapidas";
import { SeccionCategoriasTecnicas } from "./seccion-categorias-tecnicas/seccion-categorias-tecnicas";

@Component({
  selector: 'app-inicio',
  imports: [Header, HeroSection, SeccionCategoriaRapidas, SeccionCategoriasTecnicas],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {

}
