import { Component, Input, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { DespachoRuta } from '../../../core/models/production.model';

@Component({
  selector: 'app-despacho-map',
  standalone: true,
  template: `<div class="despacho-map-wrap"></div>`,
  styles: [`.despacho-map-wrap { height: 220px; border-radius: 0 0 10px 10px; overflow: hidden; z-index: 0; }`],
})
export class DespachoMap implements AfterViewInit, OnDestroy {
  @Input() ruta!: DespachoRuta;

  private map?: L.Map;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 150);
  }

  private initMap(): void {
    const container = this.el.nativeElement.querySelector('.despacho-map-wrap');
    if (!container || !this.ruta) return;

    const { origen, destino } = this.ruta;
    const center: [number, number] = [
      (origen.lat + destino.lat) / 2,
      (origen.lng + destino.lng) / 2,
    ];

    this.map = L.map(container, { zoomControl: true, scrollWheelZoom: false }).setView(center, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    const origenIcon = L.divIcon({
      html: `<div style="width:20px;height:20px;background:#15803d;border-radius:50% 50% 50% 0;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:rotate(-45deg)"></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 20],
      popupAnchor: [0, -22],
    });

    const destinoIcon = L.divIcon({
      html: `<div style="width:20px;height:20px;background:#dc2626;border-radius:50% 50% 50% 0;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:rotate(-45deg)"></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 20],
      popupAnchor: [0, -22],
    });

    L.marker([origen.lat, origen.lng], { icon: origenIcon })
      .addTo(this.map)
      .bindPopup('<strong style="color:#15803d">📦 Origen</strong>');

    L.marker([destino.lat, destino.lng], { icon: destinoIcon })
      .addTo(this.map)
      .bindPopup('<strong style="color:#dc2626">🏠 Destino</strong>');

    L.polyline(
      [[origen.lat, origen.lng], [destino.lat, destino.lng]],
      { color: '#2563eb', weight: 4, dashArray: '8 5', opacity: 0.85 },
    ).addTo(this.map);

    const bounds = L.latLngBounds(
      [origen.lat, origen.lng],
      [destino.lat, destino.lng],
    );
    this.map.fitBounds(bounds, { padding: [40, 40] });
    this.map.invalidateSize();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
