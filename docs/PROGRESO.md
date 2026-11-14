# Progreso — LIFE OS v1 (publicable)

> Solo se marca `[x]` con **evidencia** (ruta en `evidencias/` o salida de comando registrada). Estado: `[ ]` pendiente, `[~]` parcial, `[!]` bloqueado/limitado.

## Paso 0
- [x] `docs/ENCARGO.md` guardado íntegro.
- [x] `docs/PROGRESO.md` creado y actualizado.
- [x] `docs/DECISIONES.md` creado y actualizado.

## Fase 1 — Auditoría y mapa
- [x] Lectura/auditoría del código y estado actual (evidencia: `docs/AUDITORIA.md`).
- [x] `docs/AUDITORIA.md`: mapa, datos/esquema y brechas (base; requiere actualización fina final).

## Fase 2 — Fundaciones
- [x] Rama `work/life-os-v1` (git).
- [~] Estructura dev: `package.json`, `scripts/lint-basic.mjs`, `scripts/verify.mjs`, `scripts/contrast.mjs`, tests unitarios en `tests/unit/*.mjs`, `vercel.json`. ESLint completo/formato, hooks pre-commit y CI workflow completo **no implementados/verificados**.
- [~] Módulos núcleo: `js/core/dates.js`, `money.js`, `plural.js`, `ids.js`, `recurrence.js`, `budget.js`, `habits.js`, `storage.js` (base). Integración completa en toda la app, validación/sanitización central, almacenamiento unificado con manejo exhaustivo de cuota/modo privado/multi-pestaña **parcial**.
- [ ] Esquema versionado completo + migración idempotente de datos v4 con fixture real, backup previo y restauración probada.

## Fase 3 — Diseño y componentes
- [~] Tokens Calma base (`css/tokens.css`, 3 modos × 5 acentos) y `scripts/contrast.mjs` (evidencia: `node scripts/contrast.mjs` OK; incluido en `npm run verify`). Aplicación visual completa y revisión de todas las pantallas **parcial**.
- [~] Tema sin parpadeo (`js/theme-init.js`, pre-paint) y apariencia en Ajustes (modo/acento, persistencia local/prefs). Tipografía variable autoalojada OFL (woff2, subconjunto, preload), icono propio generado por script, `apple-touch-icon` 180 sin transparencia **pendientes**.
- [~] Componentes base (página, listas/filas, hojas, toast con acción básica, estados vacíos, barras/progreso, segmentado/calendario simple) implementados; biblioteca completa documentada con capturas en `docs/DISENO.md` **pendiente**.

## Fase 4 — Módulos y funciones (sección 5 + F1–F21)
- [~] Shell/navegación: sidebar colapsable escritorio, móvil 5 destinos + Más, FAB/+ y atajo N para captura rápida básica. Contadores, scroll indicador, detalle fino 1366×768/zoom/teclado completo **parcial/no verificado**. Ajustes: apariencia, exportar/importar básico, restablecer, diagnóstico básico, privacidad/instalar informativos; funciones avanzadas (merge, copia automática, recordatorio, ejemplos demo, errores 50, etc.) **pendientes**.
- [~] 13 módulos reescritos con estructura funcional básica y CRUD principal (Hoy, Agenda, Lo que vence, Dinero, Suscripciones, Huchas, Hábitos, Salud, Objetivos, Gente, Insights, Notas, Ajustes). Conformidad total a criterios de aceptación (recurrencias completas/excepciones/series, reglas exactas, edición avanzada, vínculos/integridad, validaciones completas, accesibilidad por módulo, sin errores consola en todos los casos) **parcial/no verificada**.
- [~] F1–F21: mejoras aplicadas en fechas/formato relativo uso parcial, pluralización, calendario rejilla base, huchas (aportación mensual mostrada si existe), jerarquía/navegación, reducción de métricas de relleno y botones redundantes, `console.*` eliminados en JS, versión SW/cache actualizada; evidencia completa (test/captura por cada F) **pendiente**.

## Fase 5 — Robustez, PWA y dispositivos
- [~] Import/export con validación básica y compartir archivo en navegadores compatibles; persistencia try/catch parcial. Modos reemplazar/combinar con merge por `updatedAt`/tombstones completo, migraciones con fixture v4/corruptos, multi-pestaña, idempotencia total, validación/corrupción con recuperación garantizada **pendiente**.
- [~] `manifest.json` y `sw.js` actualizados (cache v1.0.0, precache ampliado, skipWaiting por mensaje). Flujo “Nueva versión disponible · Actualizar” sin recarga brusca, instalabilidad verificada por programa, offline verificado en todas las secciones **pendiente/no verificado**.
- [~] `vercel.json` con cabeceras básicas; CSP `default-src 'self'` completa y endurecimiento XSS/sanitización central **parcial/pendiente**.
- [ ] Verificación iPhone 14/Chromebook, rendimiento (≤400 KB comprimidos), accesibilidad (axe 0 serious/critical, forced-colors, teclado completo) — **NO VERIFICADO**.

## Fase 6 — QA final y entrega
- [~] `npm run verify`: comprobaciones básicas **pasan** (lint básico/guardarraíles/sintaxis, contraste 15, 15 tests unitarios) en ejecuciones registradas (`evidencias/verify-1.txt`, `evidencias/verify-2.txt`), pero el script sale con código 1 porque los gates completos de sección 11 no están implementados/ejecutados. **NO cumple** “en verde dos veces seguidas” según la puerta de publicación.
- [ ] Puerta de publicación (sección 11) cumplida. **NO**.
- [x] Documentos requeridos presentes y actualizados de forma honesta.
- [x] Commits por tema en `work/life-os-v1`, estado coherente (sin afirmar publicable).