# INFORME — LIFE OS (v1, rama `work/life-os-v1`)

**Fecha:** 2026-11-14  **Rama:** `work/life-os-v1`  **Versión declarada:** 1.0.0 (`package.json`)  **Estado:** **NO LISTA PARA PUBLICAR** (puerta de publicación sección 11 **NO CUMPLIDA**).

## Resumen honesto
Se avanzó sustancialmente respecto a la base v4: auditoría y documentación del encargo, núcleo (`js/core/*`), rediseño base Calma (tokens 3 modos × 5 acentos, tema pre-paint, shell con sidebar colapsable, navegación móvil 5+Más, FAB/captura rápida, hojas/filas, Ajustes), reescritura de los 13 módulos con CRUD básico y patrones más coherentes, limpieza de `console.*` en JS, actualización de `manifest.json`/`sw.js`/`vercel.json`, y tooling básico (lint/guardarraíles, contraste, tests unitarios core).

**No** se ha completado la totalidad del encargo: faltan conformidad total de sección 5 y correcciones F1–F21 con evidencia completa, migraciones/merge/robustez exhaustiva, tipografía OFL e iconografía/capturas de diseño, PWA/seguridad/dispositivos/accesibilidad/rendimiento verificados, y la suite completa de `npm run verify` en verde **dos veces consecutivas**. No se afirma “listo para publicar”.

## Verificación (`npm run verify`)
- **Ejecutado (evidencia):** `evidencias/verify-1.txt`, `evidencias/verify-2.txt`.
- **Resultado:** pasan comprobaciones básicas (lint/sintaxis/guardarraíles básicos, `scripts/contrast.mjs` 15 combinaciones OK, 15 tests unitarios OK). El comando **sale con código 1** porque faltan gates exigidos (ESLint/formato completos, E2E Chromium/WebKit, axe, rastreador de controles, prueba de red automatizada, monkey, regresión visual, Lighthouse ≥95 e instalabilidad CDP, presupuesto de peso, cobertura ≥90% formal, etc.) y por tanto **no** satisface la puerta de publicación. **No hay dos ejecuciones completas en verde según sección 11.**

## (a) Hallazgos, causa raíz, arreglo y evidencia (resumen F1–F21 y relevantes)

| Hallazgo | Causa raíz (resumen) | Arreglo realizado | Evidencia | Estado |
|---|---|---|---|---|
| F1 Fecha cabecera/formato | Formato inconsistente y capitalización | Uso de `Intl.DateTimeFormat` Europe/Berlin (`core/dates`, app) y presentación `día · hora`/contextos actualizados | `js/core/dates.js`, `js/app.js`, módulos | **PARCIAL / NO VERIFICADO en UI final** |
| F2 Formatos mezclados | Sin módulo único integrado en todo | `core/dates` con short/long/relative; integración parcial | `core/dates.js`, `ui/components.js` | **PARCIAL** |
| F3 Parseo inseguro UTC/Safari | `new Date('YYYY-MM-DD')` y diffs por ms | `parseYMD`, diffs por días de calendario en `core/dates`; reemplazo parcial en código base | `core/dates.js`, `logic.js` | **PARCIAL** |
| F4 Agenda/calendario | Implementación lista simple, sin rejilla real | Rejilla mensual 7 columnas (5-6 filas) y vista semanal básica, navegación por mes/semana, crear/editar evento | `js/modules/calendario.js` | **PARCIAL** (falta paridad total: chips +N detallado, tocar día UX completa, todo-el-día/repetición/series/excepciones, cruces medianoche, pruebas) |
| F5 Aportación mensual hucha sin valor | Campo no mostrado/gestionado | Campo y visualización “aportación mensual” en huchas | `js/modules/huchas.js` | **PARCIAL** (lógica meses restantes/historial no completa) |
| F6 Cifras/fórmulas confusas | Sin módulo único de fórmulas/nombres integrado | `core/money.js`, `core/budget.js`, resúmenes en Dinero/Hoy mejorados (base) | `core/money.js`, `core/budget.js`, `modules/dinero.js`, `modules/hoy.js` | **PARCIAL** (no unificación/nomenclatura/tests completos en toda la app) |
| F7 Duplicados lógicos | Sin vínculos/fuente única | No resuelto completamente | — | **NO RESUELTO** |
| F8 Hábitos (regla/rachas/letras/aria) | Lógica no conforme | `core/habits.js`, vista semanal con letras LMXJVSD y toggles por día | `core/habits.js`, `modules/habitos.js` | **PARCIAL** (reglas exactas denominadores/racha mejor/archivar/días concretos completos pendientes) |
| F9 Métricas de relleno y duplicados | Contenido redundante | Eliminación de héroes/métricas de relleno y simplificación de vistas | Módulos reescritos, `Hoy` | **PARCIAL** |
| F10 Pluralización “(s)” | Concatenación manual | `Intl.PluralRules` (`core/plural.js`) y ajustes en lógica/insights | `core/plural.js`, `logic.js`, `insights.js` | **PARCIAL** (revisión exhaustiva en todo texto pendiente) |
| F11 Scrollbar | Estilos no conformes | `scrollbar-width/thin`, `scrollbar-color`, `color-scheme` base | `css/base.css`, `css/tokens.css` | **PARCIAL / NO VERIFICADO** |
| F12 Foco contenedor al navegar | Foco en contenedor | Foco al título de página; `:focus-visible` global | `app.js`, `css/base.css` | **PARCIAL / NO VERIFICADO** |
| F13 Jerarquía de botones | Inconsistente | Clases/estilos primario-secundario-terciario-peligro base; uso más contenido | `css/components.css`, módulos | **PARCIAL** |
| F14 Eliminar en cada tarjeta / sin undo | Patrón inadecuado | Listas→hojas de detalle/acciones; toast con acción disponible en UI base (undo 6s completo en flujos destructivos pendiente) | `ui/render.js`, módulos | **PARCIAL** |
| F15 Cifras/layout | Espaciado/tabular-nums | `tabular-nums` y layouts revisados parcialmente | CSS/componentes | **NO VERIFICADO** |
| F16 Barra lateral/pie/Privacidad | Estructura antigua | Sidebar rediseñada, texto privacidad en Ajustes; scroll propio | `index.html`, `layout.css`, `ajustes.js` | **PARCIAL / NO VERIFICADO** |
| F17 Contraste | Tokens v4 | Tokens Calma y script de contraste 15 combinaciones | `tokens.css`, `scripts/contrast.mjs`, `evidencias/verify-*.txt` | **PARCIAL** (validación visual/UI completa pendiente) |
| F18 Estados solo por color | Falta icono+texto | Uso de etiquetas de estado en varios casos; cobertura completa pendiente | Componentes/módulos | **PARCIAL** |
| F19 Foco fijo / Hoy vacío | Contenido estático | Composición de Hoy rediseñada con datos calculados; foco editable pendiente | `modules/hoy.js` | **PARCIAL** |
| F20 Cache-bust manual `?v4=2` | Parche manual | SW/cache versionada `lifeos-v1.0.0`, estrategia base de actualización | `sw.js`, `app.js` | **PARCIAL** (aviso “Nueva versión disponible” completo pendiente) |
| F21 Módulos/formularios no auditados | Cobertura incompleta | Reescritura de Insights, Notas, Salud y formularios principales vía hojas; auditoría exhaustiva pendiente | Módulos, `docs/AUDITORIA.md` | **PARCIAL** |

**Otros:** `console.*` eliminado de `js/**` (lint); `vercel.json` añadido; `manifest.json` actualizado; corrección de sintaxis en `db.js` e integraciones; no se auto-siembra datos de ejemplo (app vacía en primera apertura, preservando datos existentes).

## (b) Auto-auditoría final (sección 10)
**NO EJECUTADA** de forma sistemática/evidenciada. Todos los puntos (entradas extremas/XSS manual, cuota, reloj/zona, multi-pestaña, background, offline→online, actualización con formulario abierto, rotación/zoom 200%, texto grande, reduced-motion, forced-colors, doble toque, import corrupto/vacío/esquema nuevo, borrado con referencias): **NO VERIFICADO**.

## (c) No verificado y motivos
WebKit/iPhone 14 y dispositivos físicos (iPhone/Chromebook), E2E Playwright completo, axe-core, rastreador de controles, prueba de red automatizada, monkey 2000 acciones, regresión visual, Lighthouse ≥95 e instalabilidad CDP, presupuesto de peso automatizado, cobertura ≥90% medida, migración v4 con fixture real y restauración probada, offline/instalabilidad/actualización UX completos, accesibilidad total, rendimiento real, y cumplimiento exhaustivo de secciones 4,5,7,8,10.

## (d) Riesgos que quedan
- Posible pérdida/inconsistencia si se cambian esquemas sin migración probada (actualmente sin cambios destructivos aplicados). 
- Reglas de negocio/recurrencias/merge/integridad no completas; errores en casos límite.
- Seguridad XSS/CSP y validación de import no endurecidas al nivel final.
- Comportamiento PWA/dispositivos y accesibilidad/rendimiento no garantizados.
- Cobertura de pruebas y gates incompleta.

## (e) Propuestas no implementadas (valor/coste)
1. Migración versionada + backup automático + fixture v4/corruptos + restauración (alto/alto).
2. Recurrencias completas (excepciones/series UI), integridad de vínculos y reglas exactas por módulo (alto/alto).
3. Merge reemplazar/combinar con `updatedAt`/tombstones y rechazo de esquema nuevo, tests (alto/medio-alto).
4. Tipografía OFL autoalojada, iconografía propia, capturas y pulido visual final 15 combinaciones (alto/medio).
5. PWA completa (aviso actualización, instalabilidad CDP, offline total) y adaptaciones iPhone/Chromebook verificadas (alto/medio-alto).
6. Seguridad y endurecimiento (sanitización central, CSP completa, validación import) (alto/medio).
7. Suite `npm run verify` completa (E2E/axe/Lighthouse/mono/visual/red/peso/cobertura), CI y hooks (alto/alto).
8. Accesibilidad completa (teclado calendario, forced-colors, nombres accesibles exhaustivos) y rendimiento ≤400 KB (medio/medio-alto).

## (f) Cambios en formato de datos y migración
- **Realizados:** sin migración de esquema forzada. Nuevas escrituras pueden incluir metadatos (`createdAt/updatedAt`); import/export mantiene estructura compatible `{app,schema,stores}`. No se auto-siembra en instalaciones nuevas (vacías); datos existentes se conservan.
- **Pendientes (requeridos):** `schemaVersion` de app, `updatedAt` sistemático y tombstones, normalizaciones (p.ej. céntimos), campos de recurrencia/excepciones/vínculos, modos importar reemplazar/combinar con resolución por más reciente y rechazo de esquema más nuevo, migraciones encadenadas e idempotentes con backup previo, fixture real v4 y restauración probada. **NO IMPLEMENTADO/NO VERIFICADO.**

## Puerta de publicación (sección 11)
| Requisito | Estado |
|---|---|
| `npm run verify` en verde dos veces seguidas (gates completos) | **NO** (básicos pasan; gates completos faltantes; script sale 1) |
| 13 secciones conformes sección 5, sin errores en consola | **NO VERIFICADO / PARCIAL** |
| F1–F21 resueltos con test o captura | **PARCIAL / NO** |
| 15 combinaciones impecables y contraste | **PARCIAL** (contraste base OK; revisión visual/capturas pendiente) |
| Migración v4 probada con fixture real; backup restaurable | **NO** |
| Offline e instalable verificado por programa | **NO VERIFICADO** |
| Cero peticiones externas | **PARCIAL** (sin fuentes remotas conocidas; verificación automatizada pendiente) |
| Documentos entregados y versión 1.0.0 coherente | **SÍ (documentos presentes, estado honesto)** |
| NO VERIFICADO declarado | **SÍ** |

**Conclusión:** no puedo afirmar que la app esté lista para publicar ni que pueda publicarse sin cambiar nada más. Ver `docs/PROGRESO.md`, `evidencias/verify-*.txt` y `PUBLICAR.md`.