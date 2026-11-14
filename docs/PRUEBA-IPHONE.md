# Prueba en iPhone 14 (manual) — LIFE OS

> **Estado:** Lista requerida. **NO VERIFICADO** en dispositivo real. Completar resultados al probar en iPhone 14 (iOS 16+, Safari y app instalada).

## Comprobaciones (12)

| # | Comprobación | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | Instalar | Safari → guía “Compartir → Añadir a pantalla de inicio” (si no standalone) → instalar | Icono en inicio, abre standalone | NO VERIFICADO |
| 2 | Crear datos | Crear gasto, evento, nota, vencimiento y hábito | Datos guardados y visibles | NO VERIFICADO |
| 3 | Cerrar y reabrir | Cerrar app y reabrir | Datos persisten | NO VERIFICADO |
| 4 | Modo avión | Sin red, recargar y navegar por secciones | Funciona offline sin errores | NO VERIFICADO |
| 5 | Rotar | Horizontal y vertical | Layout correcto, sin solapes | NO VERIFICADO |
| 6 | Tema | Cambiar modo/acento en Ajustes y/o sistema | Temas correctos, legibles, sin parpadeo | NO VERIFICADO |
| 7 | Teclado | Abrir hojas/formularios y enfocar campos | Campo visible (visualViewport), ≥16px sin zoom, scroll fondo bloqueado | NO VERIFICADO |
| 8 | Exportar | Exportar copia | Compartir archivo o descarga alternativa válida | NO VERIFICADO |
| 9 | Importar | Importar JSON | Importación correcta o rechazo claro | NO VERIFICADO |
| 10 | Rendimiento | Navegar y usar controles | Fluido, sin bloqueos/errores visibles | NO VERIFICADO |
| 11 | Áreas seguras | Revisar cabecera, barra inferior, FAB y hojas | safe-area correcta, objetivos ≥44px | NO VERIFICADO |
| 12 | Actualización | Abrir con nueva versión disponible | Aviso “Nueva versión disponible · Actualizar” sin recarga brusca | NO VERIFICADO |

## Notas
- WebKit en Playwright y verificaciones automatizadas iPhone: **NO VERIFICADO** en este entorno (documentado en `INFORME.md`).
- Almacenamiento web puede purgarse en Safari no instalado; app instalada mantiene datos separados. Se recomienda exportar copias periódicas.