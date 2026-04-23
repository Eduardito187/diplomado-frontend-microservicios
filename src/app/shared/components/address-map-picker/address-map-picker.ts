import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Subject, debounceTime, switchMap, takeUntil, from, of, catchError } from 'rxjs';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const DEFAULT_CENTER: MapCoordinates = { lat: -17.7833, lng: -63.1822 };
const DEFAULT_ZOOM = 13;
const PICKED_ZOOM = 16;
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

@Component({
  selector: 'app-address-map-picker',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './address-map-picker.html',
  styleUrl: './address-map-picker.scss',
})
export class AddressMapPicker implements AfterViewInit, OnChanges, OnDestroy {
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() height = '300px';
  @Input() searchable = true;

  @Output() readonly coordsChange = new EventEmitter<MapCoordinates>();
  @Output() readonly addressFound = new EventEmitter<string>();

  @ViewChild('mapContainer', { static: true }) private readonly mapEl!: ElementRef<HTMLDivElement>;

  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<NominatimResult[]>([]);
  protected readonly searching = signal(false);
  protected readonly resolvedAddress = signal<string | null>(null);

  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private map?: L.Map;
  private marker?: L.Marker;
  private readonly searchInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initMap());
    this.wireSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    if ((changes['latitude'] || changes['longitude']) && this.hasCoords()) {
      this.placeMarker(this.latitude!, this.longitude!, false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.map?.remove();
  }

  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchInput$.next(value);
  }

  protected useResult(result: NominatimResult): void {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    this.placeMarker(lat, lng, false);
    this.resolvedAddress.set(result.display_name);
    this.addressFound.emit(result.display_name);
    this.searchResults.set([]);
    this.searchQuery.set(result.display_name);
  }

  protected useMyLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => this.placeMarker(pos.coords.latitude, pos.coords.longitude, true),
      () => {},
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }

  private initMap(): void {
    const initial = this.hasCoords()
      ? { lat: this.latitude!, lng: this.longitude! }
      : DEFAULT_CENTER;
    const initialZoom = this.hasCoords() ? PICKED_ZOOM : DEFAULT_ZOOM;

    this.map = L.map(this.mapEl.nativeElement, {
      center: [initial.lat, initial.lng],
      zoom: initialZoom,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    if (this.hasCoords()) {
      this.placeMarker(initial.lat, initial.lng, false);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.zone.run(() => this.placeMarker(e.latlng.lat, e.latlng.lng, true));
    });
  }

  private placeMarker(lat: number, lng: number, reverseGeocode: boolean): void {
    if (!this.map) return;
    const icon = L.icon({
      iconUrl: 'leaflet/marker-icon.png',
      iconRetinaUrl: 'leaflet/marker-icon-2x.png',
      shadowUrl: 'leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon, draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.zone.run(() => {
          this.emitCoords(pos.lat, pos.lng);
          this.reverseGeocode(pos.lat, pos.lng);
        });
      });
    }

    this.map.setView([lat, lng], Math.max(this.map.getZoom(), PICKED_ZOOM));
    this.emitCoords(lat, lng);
    if (reverseGeocode) this.reverseGeocode(lat, lng);
  }

  private emitCoords(lat: number, lng: number): void {
    this.coordsChange.emit({
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
    });
    this.cdr.markForCheck();
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const data = (await res.json()) as { display_name?: string };
      const display = data?.display_name;
      if (!display) return;
      this.zone.run(() => {
        this.resolvedAddress.set(display);
        this.addressFound.emit(display);
      });
    } catch {
      // network errors are non-fatal — coordinates are still valid.
    }
  }

  private wireSearch(): void {
    this.searchInput$
      .pipe(
        debounceTime(400),
        switchMap((q) => {
          const trimmed = q.trim();
          if (trimmed.length < 3) {
            this.searching.set(false);
            return of<NominatimResult[]>([]);
          }
          this.searching.set(true);
          const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&accept-language=es`;
          return from(
            fetch(url, { headers: { Accept: 'application/json' } })
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => [])
          ).pipe(catchError(() => of([] as NominatimResult[])));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((results) => {
        this.searchResults.set(results as NominatimResult[]);
        this.searching.set(false);
      });
  }

  private hasCoords(): boolean {
    return this.latitude !== null && this.longitude !== null
      && !Number.isNaN(this.latitude) && !Number.isNaN(this.longitude);
  }
}
