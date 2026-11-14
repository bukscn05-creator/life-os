# Auditoría — LIFE OS (Fase 1)

**Fecha:** 2026-11-14 (Europe/Berlin)  
**Rama de trabajo:** `work/life-os-v1` (creada desde `master`, commit base `741e046`)  
**Stack actual:** HTML/CSS/JS estático (ES modules), hash routing, IndexedDB `lifeos` v1 (14 stores), Service Worker, manifest PWA, sin build, sin dependencias runtime. Servidor local `127.0.0.1:8080`.

## 1. Mapa del código

| Área | Archivos | Rol |
|---|---|---|
| Shell/entrada | `index.html`, `manifest.json`, `sw.js`, `assets/icon-*.svg` | App shell, PWA, caché v4.0.0 |
| Estilos | `css/base.css`, `css/layout.css`, `css/components.css` | Tokens/layout/componentes (v4, identidad “instrumento”) |
| Núcleo | `js/app.js`, `js/router.js`, `js/db.js` | Boot, routing hash, estado en memoria, IndexedDB/backup |
| UI | `js/ui/render.js`, `js/ui/components.js` | Render de módulo, toasts, helpers (esc, card, fmtEUR/fmtDate, pills, progress) |
| Lógica | `js/modules/logic.js` | Finanzas/atención/hábitos/siguiente acción (determinista) |
| Módulos/vistas | `js/modules/{hoy,calendario,vence,dinero,suscripciones,habitos,salud,objetivos,gente,huchas,insights,notas}.js`, `mock-data.js` | 12 vistas con render+bind (Insights sin bind) |
| Integraciones | `js/integrations/*.js` | Stubs desactivados (sin red) |
| Tests/docs previos | `tests/manual-checklist.md`, `README.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PROJECT_STATUS.md`, `WORKLOG.md` | Manual/informativo |

## 2. Datos y esquema actual

- **DB:** `indexedDB.open('lifeos', 1)`. Stores (14): `events, deadlines, transactions, budgets, subscriptions, habits, habitEntries, healthEntries, appointments, goals, people, savingsPots, notes, preferences`. `keyPath: 'id'`, índices básicos (fecha/categoría/activo/etc.).
- **Seed:** `loadState()` llama `seed(store, mockData[store])` para cada store **si está vacío** (primera apertura). `mockData` genera fechas relativas con `new Date()` y `toISOString().slice(0,10)`; no marca `demo:true`. Preferencias incluyen `timezone/currency/locale/weekFocus` (`id:'pref'`).
- **Registros:** IDs ad hoc (`e_`/`n_`+`Date.now()`, etc.), sin `updatedAt`/tombstones; importes en `number` (floats), fechas como strings `YYYY-MM-DD`/HH:mm; sin esquema versionado de app ni migraciones encadenadas, sin backup automático previo a migración, sin merge.
- **Backup:** export `{app:'LIFE_OS', schema:1, exportedAt, stores}`; import con validación mínima y `overwrite:true` (confirm), reemplazo total por store. Sin modo combinar, sin rechazo explícito por esquema más nuevo más allá de validación básica.

## 3. Estado frente al encargo (brechas principales)

### Diseño/UX (sección 4)
- **No cumple Calma:** paleta/tokens actuales (v4) no son Papel/Grafito/OLED ni los 5 acentos especificados; no hay Ajustes→Apariencia (modo auto/claro/oscuro/OLED + acento), ni script de contraste 15 combinaciones, ni tema sin parpadeo pre-paint. Tipografía Inter desde Google Fonts import en CSS (petición externa en v4) — **viola regla de cero peticiones externas/CDNs/fuentes remotas** y no es Figtree autoalojada woff2 OFL.
- Navegación: sidebar fija (232px, no colapsable 232/72) + barra inferior móvil de 5 destinos distintos a los requeridos; no existe “Más” con hoja completa ni módulo **Ajustes**; sin captura rápida (+/N) con hoja Gasto/Ingreso/Evento/Nota/Vencimiento. Cabeceras/héroes y composición no siguen patrón Calma (fila→hoja detalle, un primario, sin métricas de relleno).
- Formularios/edición vía `window.prompt/confirm`; sin hojas/dialogs accesibles, sin validación en línea, sin Deshacer 6s con aria-live, sin toast undo. Botones repetidos “Eliminar” en tarjetas (anti-patrón F14).

### Funcionalidad por módulo (sección 5)
- **Agenda:** semana/mes simplificados (lista de días), sin rejilla real 7 columnas/5-6 filas, sin chips +N, sin tocar día para añadir, sin todo-el-día/repetición/series/excepciones/medianoche; navegación ±30 días aproximada en mes.
- **Lo que vence:** sin repetición, sin “Completar” que genere siguiente ocurrencia ni ofrezca registrar gasto enlazado; sin flujo de edición completo tipo hoja.
- **Repeticiones:** inexistentes (no cálculo al vuelo, no excepciones, sin tests).
- **Dinero:** sin mes navegable UI completa, sin categorías con presupuesto gestionado plenamente en UI, fórmulas/nombres no centralizados en módulo único documentado (F6 parcial en `logic.js` pero no conforme a definición exigida); importes float; sin validaciones estrictas de entrada.
- **Suscripciones:** solo mensual/anual, sin semanal; próximo cobro manual/no recalculado por recorte fin de mes según regla; pausada aún puede mostrar/afectar según lógica actual.
- **Huchas:** sin retirar, sin historial de aportaciones, sin aportación mensual opcional/meses restantes; F5 (aportación mensual sin valor) presente en nota mock/UI.
- **Hábitos:** sin días concretos de semana, sin marcar días pasados arbitrarios con regla exacta, sin racha mejor/archivar, sin letras LMXJVSD/aria según spec.
- **Salud:** sin gráfico simple de registros.
- **Objetivos:** sin vínculo a hucha (fuente única) ni prevención de duplicado; F7(a) presente.
- **Gente:** sin “contactar cada N días” como indicador configurable, sin manejo cumpleaños con/sin año completo según spec.
- **Notas:** sin archivar ni búsqueda por texto.
- **Insights:** máximo 3 en v4 (spec pide máx 5, cada uno con acción), sin acciones asociadas.
- **Ajustes:** módulo inexistente (apariencia, datos/backup/merge/ejemplos/reset, instalar, diagnóstico/errores, atajos, privacidad).
- **Datos ejemplo:** se siembran automáticamente en primera apertura (no vacío con estados útiles) y sin `demo:true`/borrado en bloque; riesgo sobre datos reales v4 existentes.

### Fallos conocidos F1–F21 (estado observado en código v4)
- **F1:** `topbar-date` usa `toLocaleString` + capitalización de CSS/texto implícita en contexto (“Sábado, 14 De Noviembre…” reportado) — **no conforme**.
- **F2/F3:** formatos/parseo dispersos (`fmtDate` usa `new Date(iso)`; `daysUntil` mezcla TZ; comparaciones de strings y `new Date('YYYY-MM-DDT00:00:00')` en lugares; `86400000` en lógica) — **no conforme**.
- **F4:** calendario no es rejilla 7x5-6 real; controles no son segmented + primario único según 4.6.
- **F5:** nota “Aportación mensual” sin valor en hucha Emergencias.
- **F6:** nombres/fórmulas no unificados ni documentados en módulo único; “Disponible”/proyección/mes anterior no conforme exactamente.
- **F7:** objetivo emergencia duplica hucha; suscripción pausada y vencimiento seguro no enlazados/reglas no aplicadas.
- **F8:** lógica de denominador/racha/letras/aria no conforme.
- **F9:** métricas de relleno presentes en varias vistas.
- **F10:** patrón `(s)`/pluralización manual presente.
- **F11–F12:** scrollbars/foco de contenedor a revisar/corregir según spec.
- **F13:** jerarquía de botones inconsistente.
- **F14:** eliminar en tarjetas sin undo 6s/patrón hoja.
- **F15:** grids/cifras a validar en anchos pequeños.
- **F16:** pie movido visualmente pero texto/privacidad no en Ajustes; scroll de menú a verificar en viewports/zoom.
- **F17–F18:** dependen de nuevos tokens/estados con icono+texto.
- **F19:** foco fijo en preferencias.
- **F20:** `?v4=2` usado manualmente en pruebas/flujo; SW versionado pero cache-bust manual existe en práctica.
- **F21:** auditoría profunda pendiente de Insights/Notas/Salud/formularios.

### Robustez, PWA, seguridad, dispositivos (secciones 7–8)
- Sin módulo único de almacenamiento con manejo completo de errores/cuota/modo privado; sin `schemaVersion` app, migraciones encadenadas con backup previo/test fixture v4, ni validación robusta ante corrupción con recuperación. Sin sync multi-pestaña. IDs no UUID; escrituras no idempotentes ante doble toque.
- Dinero en floats, sin céntimos enteros ni parseo/validación estricta es-ES; sin módulo único de fórmulas/tests.
- Fechas sin módulo único Europe/Berlin ni parseo manual seguro en todas partes; sin refresco a medianoche/visibilitychange.
- Uso extensivo de `innerHTML` con plantillas; se escapa en muchos sitios (`esc`) pero no hay capa centralizada/sanitización garantizada ni pruebas XSS especificadas; import no valida estrictamente esquema/contenido. Sin `vercel.json`/cabeceras CSP exigidas. SW sin estrategia de actualización con aviso controlado “Nueva versión disponible”.
- Manifest incompleto vs spec (id, iconos maskable/180 touch, etc. a verificar/mejorar), sin guía instalación iOS/Chromebook en Ajustes, sin `navigator.storage.persist`/avisos, sin compartir archivo con Web Share API+fallback.
- `console.info/warn/error` presentes; sin registro de últimos 50 errores en Diagnóstico ni manejadores globales con UI requerida.

### Calidad automatizada (sección 9)
- No existe `package.json`, `npm run verify`, ESLint, tests unitarios/E2E/axe/Lighthouse/contrast/greps/presupuesto/cobertura/CI/hooks definidos en repo. **Ningún gate automatizado del encargo está implementado actualmente.**

## 4. Riesgos y dependencias
- Migrar datos reales v4 (schema 1 actual) a un esquema nuevo requiere fixture real, backup y restauración verificable — alto riesgo si se hace mal.
- Alcance del encargo (rediseño Calma completo, 13 secciones con comportamiento avanzado, recurrences/merge, tooling completo y `verify` verde 2x) excede ampliamente lo realizable en una sola sesión/agente sin iteraciones largas; se priorizará coherencia, preservación de datos y honestidad en informe.

## 5. Plan inmediato (priorizado)
1. Consolidar docs/fundaciones y rama (hecho/parcial). 2. Crear módulos núcleo (fechas, dinero, pluralización) y corregir fallos críticos transversales (F1,F2,F3,F10 base). 3. Implementar tokens/tema Calma y estructura Ajustes. 4. Avanzar módulos y PWA/robustez según tiempo, dejando **nada a medias visible** y documentando NO VERIFICADO/pendientes en `INFORME.md`.
