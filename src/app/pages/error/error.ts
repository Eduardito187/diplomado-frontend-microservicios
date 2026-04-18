import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export interface ErrorInfo {
  code: number;
  title: string;
  description: string;
  icon: string;
  cta: 'home' | 'login' | 'back';
}

const UNKNOWN: ErrorInfo = {
  code: 0,
  title: 'Error desconocido',
  description: 'Algo salió mal y no pudimos identificar la causa.',
  icon: 'bi-question-octagon',
  cta: 'home',
};

export const ERROR_MAP: Record<number, ErrorInfo> = {
  400: {
    code: 400,
    title: 'Solicitud incorrecta',
    description: 'La petición enviada no es válida. Revisa los datos e inténtalo de nuevo.',
    icon: 'bi-exclamation-diamond',
    cta: 'back',
  },
  401: {
    code: 401,
    title: 'No autenticado',
    description: 'Tu sesión expiró o no has iniciado sesión.',
    icon: 'bi-shield-lock',
    cta: 'login',
  },
  403: {
    code: 403,
    title: 'Acceso denegado',
    description: 'No tienes permisos para acceder a este recurso.',
    icon: 'bi-slash-circle',
    cta: 'home',
  },
  404: {
    code: 404,
    title: 'Página no encontrada',
    description: 'La ruta que intentas visitar no existe o fue movida.',
    icon: 'bi-compass',
    cta: 'home',
  },
  405: {
    code: 405,
    title: 'Método no permitido',
    description: 'La operación solicitada no está permitida en este recurso.',
    icon: 'bi-ban',
    cta: 'back',
  },
  408: {
    code: 408,
    title: 'Tiempo de espera agotado',
    description: 'El servidor tardó demasiado en responder.',
    icon: 'bi-hourglass-split',
    cta: 'back',
  },
  409: {
    code: 409,
    title: 'Conflicto',
    description: 'La petición entra en conflicto con el estado actual del recurso.',
    icon: 'bi-exclamation-triangle',
    cta: 'back',
  },
  410: {
    code: 410,
    title: 'Recurso ya no disponible',
    description: 'El recurso solicitado ya no existe y no volverá a estar disponible.',
    icon: 'bi-trash',
    cta: 'home',
  },
  418: {
    code: 418,
    title: 'Soy una tetera',
    description: 'Este servidor se niega a preparar café.',
    icon: 'bi-cup-hot',
    cta: 'home',
  },
  422: {
    code: 422,
    title: 'Datos inválidos',
    description: 'El contenido enviado es correcto en formato pero no pasa las validaciones.',
    icon: 'bi-clipboard-x',
    cta: 'back',
  },
  429: {
    code: 429,
    title: 'Demasiadas solicitudes',
    description: 'Has hecho muchas peticiones en poco tiempo. Espera un momento.',
    icon: 'bi-speedometer2',
    cta: 'back',
  },
  500: {
    code: 500,
    title: 'Error interno del servidor',
    description: 'Ocurrió un error inesperado. Nuestro equipo ha sido notificado.',
    icon: 'bi-bug',
    cta: 'home',
  },
  501: {
    code: 501,
    title: 'No implementado',
    description: 'La funcionalidad solicitada aún no está disponible.',
    icon: 'bi-tools',
    cta: 'home',
  },
  502: {
    code: 502,
    title: 'Bad Gateway',
    description: 'El gateway recibió una respuesta inválida de un microservicio.',
    icon: 'bi-diagram-3',
    cta: 'back',
  },
  503: {
    code: 503,
    title: 'Servicio no disponible',
    description: 'El servicio está temporalmente fuera de línea. Intenta más tarde.',
    icon: 'bi-plug',
    cta: 'back',
  },
  504: {
    code: 504,
    title: 'Gateway Timeout',
    description: 'El gateway no recibió respuesta del microservicio a tiempo.',
    icon: 'bi-clock-history',
    cta: 'back',
  },
};

@Component({
  selector: 'app-error-page',
  imports: [RouterLink],
  templateUrl: './error.html',
  styleUrl: './error.scss',
})
export class ErrorPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly codeParam = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('code') ?? '')),
    { initialValue: '' }
  );

  readonly info = computed<ErrorInfo>(() => {
    const raw = this.codeParam();
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return UNKNOWN;
    return ERROR_MAP[n] ?? { ...UNKNOWN, code: n, title: `Error ${n}` };
  });

  goBack(): void {
    history.length > 1 ? history.back() : this.router.navigateByUrl('/');
  }
}
