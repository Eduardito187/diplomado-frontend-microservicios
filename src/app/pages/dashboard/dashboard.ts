import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { forkJoin, catchError, of, finalize } from 'rxjs';
import { PatientService } from '../../core/services/patient.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ProductionService } from '../../core/services/production.service';
import { Auth } from '../../core/services/auth';
import { SECTION_ROLES } from '../../core/config/roles';
import { Patient } from '../../core/models/patient.model';
import { Nutritionist } from '../../core/models/appointment.model';
import { Producto } from '../../core/models/production.model';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [StatCard, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly patientSvc = inject(PatientService);
  private readonly aptSvc = inject(AppointmentService);
  private readonly prodSvc = inject(ProductionService);
  private readonly auth = inject(Auth);

  readonly loading = signal(true);
  readonly patients = signal<Patient[]>([]);
  readonly nutritionists = signal<Nutritionist[]>([]);
  readonly productos = signal<Producto[]>([]);

  readonly canSeePatients = this.auth.hasAnyRole(SECTION_ROLES.patients);
  readonly canSeeAppointments = this.auth.hasAnyRole(SECTION_ROLES.appointments);
  readonly canSeeProduction = this.auth.hasAnyRole(SECTION_ROLES.production);

  readonly totalPatients = computed(() => this.patients().length);
  readonly totalNutritionists = computed(() => this.nutritionists().length);
  readonly totalProductos = computed(() => this.productos().length);
  readonly activeSubscriptions = computed(
    () => this.patients().filter((p) => (p.subscriptionStatus ?? '').toUpperCase() === 'ACTIVE').length
  );

  readonly recentPatients = computed(() => this.patients().slice(0, 5));
  readonly recentNutritionists = computed(() => this.nutritionists().slice(0, 5));

  ngOnInit(): void {
    forkJoin({
      patients: this.canSeePatients
        ? this.patientSvc.getAll().pipe(catchError(() => of([] as Patient[])))
        : of([] as Patient[]),
      nutritionists: this.canSeeAppointments
        ? this.aptSvc.getNutritionists().pipe(catchError(() => of([] as Nutritionist[])))
        : of([] as Nutritionist[]),
      productos: this.canSeeProduction
        ? this.prodSvc.getProductos().pipe(catchError(() => of([] as Producto[])))
        : of([] as Producto[]),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ patients, nutritionists, productos }) => {
        this.patients.set(patients);
        this.nutritionists.set(nutritionists);
        this.productos.set(productos);
      });
  }

  initials(name = ''): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0] ?? '')
      .join('')
      .toUpperCase();
  }

  fullName(p: Patient): string {
    return `${p.name ?? ''} ${p.lastname ?? ''}`.trim();
  }

  nutritionistFullName(n: Nutritionist): string {
    return `${n.name} ${n.lastname}`;
  }
}
