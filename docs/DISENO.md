# Diseño — LIFE OS (Calma, estado actual)

> **Estado:** Implementación **parcial** de la dirección “Calma” (sección 4). No se declara conformidad visual total ni evidencia completa de capturas.

## Dirección aplicada
- Interfaz neutra (papel/grafito/OLED) con acento configurable, sin degradados/brillos/neón. Shell con cabecera de página (título + contexto + acción), listas en filas dentro de superficies, hojas para detalle/edición, botón de captura rápida (+/atajo N).
- Navegación: móvil con barra inferior (Hoy, Agenda, Dinero, Hábitos, Más) y FAB; escritorio con barra lateral colapsable por grupos y contenido centrado (ancho máximo ~1040px).
- Reducción de anti-patrones v4: eliminadas métricas de relleno evidentes, repetición masiva de botones “Eliminar” en tarjetas (detalle/edición en hojas o acciones contextuales), y ajustes de jerarquía/formato.

## Tokens y tema
- `css/tokens.css`: modos Claro/Oscuro/OLED y 5 acentos (verde azulado por defecto, índigo, ciruela, naranja, grafito) con mapeo a variables. `js/theme-init.js` aplica modo/acento antes del primer pintado; Ajustes→Apariencia permite cambiar y persiste preferencia.
- `scripts/contrast.mjs`: verifica pares relevantes en 15 combinaciones (evidencia: ejecución OK en `npm run verify` / `evidencias/verify-*.txt`). **Pendiente:** revisión visual fina de todas las pantallas y estados.

## Tipografía e iconos
- **Pendiente:** fuente variable autoalojada OFL (woff2, subconjunto, preload) y conjunto SVG unificado generado/documentado. Estado actual: tipografía de sistema (fallback) y marcadores simples; cifras con `tabular-nums` donde aplica.

## Componentes
- Implementados base: encabezado de página, superficies/secciones, filas (`row-list/row-item`), hojas (`openSheet` con foco básico y cierre por Esc/fondo), toast con acción, estados vacíos, campos básicos, barras/progreso, segmentado, rejilla de calendario mensual simple, vista semanal básica de hábitos.
- **Pendiente/no verificado:** biblioteca única completa y documentada con capturas, todos los patrones exigidos (campos con formato en vivo de importes, arrastre para cerrar en móvil con alternativa, manejo completo visualViewport en iPhone, gráficos SVG propios, esqueletos solo si aplica, icono+texto sistemático en todos los estados, etc.).

## Capturas
- **NO VERIFICADO:** no se han generado capturas ANTES/DESPUÉS sistemáticas en claro/oscuro/negro a 390×844 y 1366×768 en `evidencias/` conforme a 4.9. Revisión subjetiva “estudio de producto” **no evidenciada**.