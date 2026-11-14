# LIFE OS (v1 — trabajo en curso, no publicable)

Sistema operativo personal local-first (PWA) para un solo usuario (es-ES, Europe/Berlin, EUR), coste 0 €.

> **Estado:** rama `work/life-os-v1`. **No está listo para publicar**: la puerta de publicación (sección 11 de `docs/ENCARGO.md`) **no se cumple**. Ver `INFORME.md` y `PUBLICAR.md`.

## Módulos implementados

| Módulo | Archivo | Descripción |
|--------|---------|-------------|
| Command Center | `js/modules/hoy.js` | Dashboard principal con resumen unificado, métricas, resumen inteligente, acciones rápidas |
| Finanzas | `js/modules/dinero.js` | Transacciones, presupuestos, balance, libre tras compromisos |
| Ahorro | `js/modules/huchas.js` | Huchas, metas de ahorro, aportaciones |
| Suscripciones | `js/modules/suscripciones.js` | Cobros recurrentes, totales mensuales/anuales |
| Productividad | `js/modules/habitos.js` | Hábitos, seguimiento semanal, rachas |
| Calendario | `js/modules/calendario.js` | Eventos, vistas mes/semana, recurrencia |
| Vencimientos | `js/modules/vence.js` | Deadlines, agrupados por estado, recurrencia |
| Objetivos | `js/modules/objetivos.js` | Metas, progreso, unidades |
| Proyectos | `js/modules/proyectos.js` | Proyectos, etapas, avance financiero, contador de tareas |
| Conocimiento | `js/modules/notas.js` | Notas, fijar, búsqueda |
| Salud | `js/modules/salud.js` | Citas, registros de salud |
| Gente | `js/modules/gente.js` | Contactos, cumpleaños |
| Insights | `js/modules/insights.js` | Análisis con hechos, estimaciones, predicciones, recomendaciones |
| Agentic OS | `js/modules/agente.js` | Lista de agentes, historial de ejecuciones, chat con agente |
| Automatizaciones | `js/modules/automaciones.js` | Triggers, condiciones, acciones, historial de ejecuciones |
| Integraciones | `js/modules/integraciones.js` | 8 integraciones (Gmail, Calendar, GitHub, Notion, Finanzas, IA, Productividad, APIs) |
| Ajustes | `js/modules/ajustes.js` | Apariencia, datos, privacidad, diagnóstico |

## AGENTIC OS (Sistema de Agentes)

8 agentes especializados con coordinador central:
- **Finanzas:** parsear dinero, validar presupuesto, registrar ingresos/gastos, resumen financiero
- **Productividad:** crear/actualizar/priorizar tareas, marcar hábitos
- **Calendario:** crear/actualizar eventos, obtener eventos de hoy/semana
- **Asistente Personal:** analizar contexto, sugerir tareas, briefing diario, elementos de atención
- **Investigación:** buscar conocimiento, analizar documentos, extraer información
- **Proyectos:** crear/actualizar proyectos, obtener progreso
- **Conocimiento:** guardar/recuperar/buscar notas
- **Automatización:** crear/ejecutar/listar automatizaciones

## Ejecución local
```bash
python3 -m http.server 8080 --bind 127.0.0.1
# abrir http://127.0.0.1:8080/
```

## Verificación
```bash
npm run verify
```
Comprobaciones básicas implementadas (lint/sintaxis/guardarraíles básicos, contraste 15 combinaciones, tests unitarios core) pasan en el estado actual, pero el comando **sale con código 1** porque faltan gates exigidos por la sección 11 (E2E/axe/Lighthouse/instalabilidad CDP, red, monkey, visual, presupuesto, cobertura formal, etc.) y no hay evidencia de cumplimiento completo. Evidencias parciales: `evidencias/verify-1.txt`, `evidencias/verify-2.txt`.

## Privacidad y datos
- Local-first (IndexedDB), sin backend, sin analítica/telemetría/cookies/APIs de pago.
- Objetivo de cero peticiones a otros orígenes: sin fuentes remotas conocidas en el código; verificación automatizada completa **NO VERIFICADA**.
- Datos existentes deben preservarse; migraciones completas y merge avanzado **pendientes/no verificados**.
- Integraciones en modo simulado; sin conexiones reales a servicios externos sin autorización explícita.

## Documentación
- `docs/ENCARGO.md`, `docs/PROGRESO.md`, `docs/DECISIONES.md`, `docs/AUDITORIA.md`
- `docs/DISENO.md`, `docs/ARQUITECTURA.md`, `docs/CONTRIBUIR.md`, `docs/PRUEBA-IPHONE.md`
- `docs/REFERENCE_ANALYSIS.md` (análisis de vídeos de referencia)
- `AGENTIC_OS_INTEGRATION.md` (documentación de integración de AGENTIC OS)
- `reports/KILO_TERMINAL_REPORT.md` (reporte de recuperación P0)
- `PUBLICAR.md`, `INFORME.md`, `CHANGELOG.md`