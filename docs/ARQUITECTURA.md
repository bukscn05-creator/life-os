# Arquitectura — LIFE OS (estado actual)

## Visión general
- **Tipo:** PWA estática, local-first, ES modules, hash routing (`#/ruta`), render de módulo en `#module-root`.
- **Entrada:** `index.html` → `js/theme-init.js` (tema pre-paint) → `js/app.js` (boot: shell, estado, render, routing, SW).
- **Persistencia:** IndexedDB `lifeos` v1 (`js/db.js`) con stores: `events, deadlines, transactions, budgets, subscriptions, habits, habitEntries, healthEntries, appointments, goals, people, savingsPots, notes, preferences`. Estado en memoria en `app.js`.
- **UI:** `js/ui/render.js` (render de módulo, hojas, toasts), `js/ui/components.js` (helpers/compat). Estilos en `css/tokens.css`, `css/base.css`, `css/layout.css`, `css/components.css`.
- **Módulos:** `js/modules/{hoy,calendario,vence,dinero,suscripciones,huchas,habitos,salud,objetivos,gente,insights,notas,ajustes}.js`; lógica compartida en `logic.js`.
- **Core:** `js/core/{dates,money,plural,ids,recurrence,budget,habits,storage}.js` (utilidades y bases de dominio).

## Datos y operaciones
- Registros con `id` (preferencia `crypto.randomUUID` vía `core/ids` en nuevos flujos) y marcas temporales básicas en escrituras recientes; compatibilidad con datos legacy numéricos/formatos previos.
- Backup/export JSON `{app,schema,exportedAt,stores}`; import con validación básica (reemplazo). **Pendiente:** `schemaVersion` de app completo, migraciones encadenadas/idempotentes con backup automático, validación robusta/corrupción con recuperación, merge por `updatedAt`/tombstones y modos reemplazar/combinar completos.
- **Pendiente:** módulo único de almacenamiento con manejo exhaustivo de errores/cuota/modo privado, sincronización multi-pestaña, idempotencia total ante doble toque en todas las rutas.

## Dominio
- Fechas: utilidades Europe/Berlin y parseo seguro en `core/dates` (uso parcial en app/módulos).
- Dinero: utilidades de céntimos/parseo/formato en `core/money` y `core/budget` (uso parcial); coexistencia con importes numéricos legacy.
- Recurrencias, hábitos y presupuesto: bases en `core/recurrence`, `core/habits`, `core/budget`; integración completa en UI/series/excepciones/reglas exactas **pendiente**.

## PWA y seguridad
- `manifest.json` y `sw.js` (cache `lifeos-v1.0.0`, precache, actualización base). `vercel.json` con cabeceras básicas y `sw.js` no-cache.
- **Pendiente:** aviso controlado de nueva versión, instalabilidad verificada, CSP `default-src 'self'` completa, sanitización/XSS y validación de import endurecidas de forma central.

## Calidad
- `scripts/lint-basic.mjs` (sintaxis/guardarraíles básicos), `scripts/contrast.mjs`, `tests/unit/*.mjs`, `scripts/verify.mjs`. Evidencias parciales en `evidencias/verify-*.txt`. Gates completos de sección 11 **no implementados/no verificados**.