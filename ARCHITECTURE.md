# ARCHITECTURE — LIFE OS

## Visión
PWA local-first en vanilla JS, sin backend en v1. Datos privados en el dispositivo; UI modular por dominio.

## Capas

### Presentación
- `index.html` + `css/base.css`, `css/layout.css`, `css/components.css`, `css/tokens.css` (3 modos × 5 acentos).

### Shell/App
- `js/app.js` (boot, carga/refresco de estado, render, helpers `save/del`, export/import backup, registro SW, inicialización de AgentManager tolerante a fallos).
- `js/router.js` (hash routing).
- `js/theme-init.js` (inicialización de tema sin parpadeo).

### UI
- `js/ui/render.js`, `js/ui/components.js` (helpers, formato, tarjetas, estados vacíos, `esc()` para escape XSS).

### AGENTIC OS (Sistema de Agentes)
- `js/agents/agent-types.js` — AgentDescriptor, Agent, AgentRegistry, AGENT_TYPES, AGENT_STATUSES.
- `js/agents/tool-types.js` — ToolDefinition, ToolRegistry (validación de uso por agente).
- `js/agents/skill-types.js` — SkillDefinition, SkillRegistry.
- `js/agents/execution-engine.js` — Motor de ejecución con cola, cancelación, pausa/reanuda, selección de agente por puntuación.
- `js/agents/automation-engine.js` — Motor de automatizaciones con triggers, condiciones, acciones, validación.
- `js/agents/execution-logger.js` — Registro y auditoría de ejecuciones.
- `js/agents/agent-config.js` — Configuración de 8 agentes predefinidos con permisos y herramientas.
- `js/agents/agent-manager.js` — Coordinador principal: boot, receiveUserRequest (parseo de lenguaje natural), getAgentStatus, configureAgent, shutdown.
- `js/agents/agent-implementations.js` — 8 agentes especializados: finance_agent, productivity_agent, calendar_agent, personal_assistant_agent, research_agent, projects_agent, knowledge_agent, automation_agent.

### Dominio/Módulos (15 módulos)
- `js/modules/hoy.js` — Command Center (resumen unificado, métricas, resumen inteligente, acciones rápidas).
- `js/modules/calendario.js` — Eventos, vistas mes/semana, recurrencia.
- `js/modules/vence.js` — Vencimientos, agrupados por estado, recurrencia.
- `js/modules/dinero.js` — Transacciones, presupuestos, balance.
- `js/modules/suscripciones.js` — Cobros recurrentes, totales mensuales/anuales.
- `js/modules/habitos.js` — Hábitos, seguimiento semanal, rachas.
- `js/modules/salud.js` — Citas, registros de salud.
- `js/modules/objetivos.js` — Metas, progreso, unidades.
- `js/modules/proyectos.js` — Proyectos, etapas, avance financiero, contador de tareas.
- `js/modules/gente.js` — Contactos, cumpleaños.
- `js/modules/huchas.js` — Huchas, metas de ahorro, aportaciones.
- `js/modules/insights.js` — Análisis con hechos, estimaciones, predicciones, recomendaciones, alertas, tendencias.
- `js/modules/notas.js` — Notas, fijar, búsqueda.
- `js/modules/ajustes.js` — Apariencia, datos, privacidad, diagnóstico.
- `js/modules/agente.js` — Interfaz de Agentic OS (lista de agentes, historial, chat).
- `js/modules/automaciones.js` — UI de automatizaciones (triggers, condiciones, acciones).
- `js/modules/integraciones.js` — UI de integraciones (conectar, desconectar, sincronizar).
- `js/modules/logic.js` — Lógica determinista cruzada (finanzas, atención, hábitos, próxima acción).
- `js/modules/mock-data.js` — Seed inicial (no importado, dead code).

### Datos
- `js/db.js` con IndexedDB `lifeos` v3, 15 stores + migrationBackups, índices, transacciones, CRUD async, seed condicional, export/import validado.
- `js/core/storage.js` — Capa de almacenamiento con idempotencia, backup automático, integridad de datos, BroadcastChannel para sincronización entre pestañas.
- `js/core/migrations.js` — Migraciones encadenadas con backup previo, rollback en error, verificación de integridad.

### Offline/PWA
- `manifest.json` (display: standalone, tema configurable).
- `sw.js` con `CACHE_VERSION` `lifeos-v2.0.0`, estrategia cache-first para estáticos, precache ampliado con todos los módulos.
- `vercel.json` con CSP headers (`default-src 'self'`, `frame-ancestors 'none'`, etc.).

### Integraciones (Plugin & Integration OS)
- `js/integrations/registry.js` — 8 integraciones (Gmail, Google Calendar, GitHub, Notion, Servicios Financieros, Servicios IA, Herramientas de Productividad, APIs Externas). Todas desactivadas por defecto, modo simulado.
- `js/integrations/calendar.js`, `backup-cloud.js`, `sync.js` — Stubs preparados.
- Inicialización segura sin activación automática ni envío de datos.

## Principios técnicos
- Sin frameworks/bundlers/dependencias externas.
- Operaciones críticas con `try/catch`; errores comprensibles al usuario.
- IDs estables; no reinicializar DB para corregir bugs; migraciones explícitas en upgrades.
- Backup/restore: JSON con validación de estructura y confirmación antes de sobrescribir.
- Sin envío de datos personales a servicios externos.
- Todas las integraciones en modo simulado; autorización explícita requerida para conexión.

## Estado de entrega (FASE 6)
- Todas las 11 áreas del Master Directive implementadas: Command Center, Finance OS, Productivity OS, Calendar OS, Goals OS, Projects OS, Knowledge OS, Insights OS, Agentic OS, Automation OS, Plugin & Integration OS.
- Verificación básica: lint OK, contraste OK (15 combinaciones), tests unitarios 18/18 OK, verify checks básicos OK.
- Verificación de publicación (sección 11) NO CUMPLIDA: E2E Playwright, axe-core, Lighthouse, presupuesto, cobertura formal, etc. pendientes.
- Publicación sujeta a acceso y autorización.
