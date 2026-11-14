# CHANGELOG — LIFE OS

## 1.0.0 — trabajo en curso (no publicable)
**Rama:** `work/life-os-v1`  **Estado:** puerta de publicación **NO CUMPLIDA**.

### Añadido
- Documentación y seguimiento: `docs/ENCARGO.md`, `docs/PROGRESO.md`, `docs/DECISIONES.md`, `docs/AUDITORIA.md`, `INFORME.md`, `PUBLICAR.md`, `README.md`, `docs/DISENO.md`, `docs/ARQUITECTURA.md`, `docs/CONTRIBUIR.md`, `docs/PRUEBA-IPHONE.md`.
- Núcleo: `js/core/{dates,money,plural,ids,recurrence,budget,habits,storage}.js` (bases de fechas Europe/Berlin, céntimos/parseo, pluralización, recurrencias, presupuesto, hábitos, ids/storage).
- UI y diseño base Calma: `css/tokens.css` (3 modos × 5 acentos), `js/theme-init.js`, nuevo shell (sidebar colapsable, navegación móvil 5+Más, FAB/captura rápida), hojas/diálogos y componentes base en `js/ui/*` y CSS.
- Módulo `Ajustes` (`js/modules/ajustes.js`) y reescritura de módulos `hoy, calendario, vence, dinero, suscripciones, huchas, habitos, salud, objetivos, gente, insights, notas`.
- Calidad: `scripts/contrast.mjs`, `scripts/lint-basic.mjs`, `scripts/verify.mjs`, tests unitarios `tests/unit/{dates,money,plural,recurrence}.mjs`, `vercel.json`, evidencias `evidencias/verify-1.txt` y `evidencias/verify-2.txt`.
- `package.json` con scripts (`lint`, `test:unit`, `contrast`, `verify`).
- **AGENTIC OS (Fase 1-2):** `js/agents/{agent-types,tool-types,skill-types,execution-engine,automation-engine,execution-logger,agent-config,agent-manager,agent-implementations}.js` (8 agentes especializados: finanzas, productividad, calendario, asistente personal, investigación, proyectos, conocimiento, automatización; coordinador central, motor de ejecución, registro de agentes, herramientas/skills, permisos, auditoría).
- **Command Center (Fase 2):** `js/modules/hoy.js` reescrito con resumen unificado de todos los módulos, métricas rápidas, resumen inteligente, acciones rápidas conectadas a Agentic OS.
- **Interfaz AGENTIC OS (Fase 2):** `js/modules/agente.js` con lista de agentes, historial de ejecuciones, chat con agente, acciones rápidas.
- **Projects OS (Fase 3):** `js/modules/proyectos.js` con CRUD de proyectos, estados (planificación/activo/pausado/completado/cancelado), seguimiento de avance financiero, contador de tareas. Store `projects` añadido a `js/db.js` (DB_VERSION 2→3 con migración).
- **Automation OS (Fase 4):** `js/modules/automaciones.js` con UI para crear/editar/eliminar/activar/ejecutar automatizaciones. Triggers: diario, semanal, mensual, días de semana, si monto supera umbral. Acciones: notificación, transacción, tarea, evento.
- **Plugin & Integration OS (Fase 4):** `js/integrations/registry.js` expandido con 8 integraciones (Gmail, Google Calendar, GitHub, Notion, Servicios Financieros, Servicios IA, Herramientas de Productividad, APIs Externas). `js/modules/integraciones.js` con UI de conectar/desconectar/sincronizar y información de seguridad.
- **Inteligencia OS / Insights (Fase 5):** `js/modules/insights.js` expandido con 6 tipos de insight (hecho verificado, estimación, predicción, recomendación, alerta, tendencia), estadísticas rápidas, leyenda explicativa, advertencias sobre predicciones no garantizadas.
- **PWA/SW (Fase 6):** `sw.js` actualizado con CACHE_VERSION `lifeos-v2.0.0` y precache de todos los nuevos módulos (agents, proyectos, automaciones, integraciones, agente).

### Cambiado
- Eliminada petición externa de fuentes; formato de fecha/hora de cabecera ajustado.
- `manifest.json` y `sw.js` actualizados (cache `lifeos-v2.0.0`, precache ampliado, manejo de actualización base).
- Eliminados `console.*` del código `js/` y limpiadas integraciones/stubs; correcciones de sintaxis y compatibilidad de módulos.
- `js/app.js`: desacoplado AGENTIC OS del arranque principal (inicialización tolerante a fallos), añadidas rutas `#/agente`, `#/proyectos`, `#/automaciones`, `#/integraciones` y menú móvil correspondiente.

### Pendiente / No verificado
- Conformidad total de las 13 secciones y F1–F21 con evidencia completa; recurrencias/excepciones/series completas; merge (reemplazar/combinar) robusto y migración v4 con fixture/backup/restauración probada.
- Tipografía autoalojada OFL, iconos/capturas de diseño, Ajustes y Diagnóstico completos, iPhone/Chromebook verificados, accesibilidad (axe/teclado/forced-colors) y rendimiento/presupuesto verificados.
- PWA/offline/instalabilidad y actualización UX verificados por programa, seguridad XSS/CSP endurecida, y **`npm run verify` completo de sección 11 en verde dos veces consecutivas**. Ver `INFORME.md`.