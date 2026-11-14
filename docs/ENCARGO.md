ENCARGO DEFINITIVO · LIFE OS
Rediseño total + corrección completa + listo para publicar

Eres un ingeniero senior de producto (diseño + front-end + QA). Trabaja como lo haría Claude: lee antes de escribir, cuestiona tus propios supuestos, verifica con evidencia y di la verdad cuando algo no funciona. Todo el texto de la interfaz y toda la documentación, en español (es-ES).

==================================================
0. PASO 0 (antes de tocar nada)
==================================================
Guarda este mensaje ÍNTEGRO en docs/ENCARGO.md. Crea docs/PROGRESO.md (checklist de todo lo que hay aquí; solo se marca con evidencia) y docs/DECISIONES.md. Tu contexto se compactará durante el trabajo y perderás instrucciones: al empezar cada fase, y antes de dar nada por terminado, vuelve a leer docs/ENCARGO.md completo.

==================================================
1. OBJETIVO Y PRIORIDADES
==================================================
LIFE OS es mi sistema operativo personal (PWA, un solo usuario, español, coste 0 €). No me gusta NADA el diseño actual (v4): ni los colores, ni la composición, ni los botones. También tiene errores y funciones a medias. Quiero que, cuando termines, yo pueda PUBLICARLA sin tocar nada y usarla a diario en mi Chromebook (Acer 314) y en mi iPhone 14.

Prioridades, por este orden:
1) DISEÑO: rediseño completo, no un retoque. Debe parecer una app de primer nivel hecha por un estudio de producto.
2) FUNCIONAMIENTO: cada control hace lo que dice, siempre, sin excepciones. Nada a medias.
3) ROBUSTEZ Y FUTURO: que no se rompa con datos raros, con otro dispositivo, con actualizaciones ni con el paso del tiempo, y que arreglarla en el futuro sea fácil (tests, módulos, documentación).

"Terminado" significa lo de la sección 11. Si no se cumple todo, no estás terminado.

==================================================
2. REGLAS INNEGOCIABLES
==================================================
- Coste 0 €. Cero dependencias de ejecución (runtime). Se permiten dependencias de DESARROLLO gratuitas (Playwright, @axe-core/playwright, ESLint, etc.). Prohibido: CDNs, fuentes remotas, analítica, telemetría, cookies, APIs de pago.
- Privacidad: todo es local. La app no hace NINGUNA petición de red a otro origen, nunca (hay un test que lo comprueba).
- Rama: work/life-os-v1 (o la rama work/* actual de este proyecto). Nunca main. No toques Vision Finance ni ICT Trading Intelligence.
- Publicación: tú NO publicas ni despliegas a producción. Dejas la rama en estado publicable y escribes PUBLICAR.md con los pasos exactos; la decisión y la publicación son mías. No generes vistas previas intermedias: una sola, al final (si no puedes crearla, dame las instrucciones).
- Mis datos son sagrados: copia de seguridad automática antes de cualquier migración, migración con tests y vuelta atrás posible. Jamás borres ni sobrescribas datos existentes sin que yo lo pida en la interfaz.
- Prohibido en lo entregado: lorem ipsum, TODO/FIXME, console.log, debugger, botones muertos, "próximamente", datos falsos disfrazados de reales.

==================================================
3. CÓMO TRABAJAS (estricto y autónomo)
==================================================
AUTONOMÍA: no me hagas preguntas; no podré contestar. Decide, anota en docs/DECISIONES.md (decisión, alternativas, motivo) y sigue. Solo te detienes ante algo destructivo e irreversible o que choque con la sección 2.

NO TE VALIDES NADA: algo no está bien porque lo "veas bien" leyendo el código. Está bien si lo ejecutaste y lo observaste (salida de comando, captura, test). Prohibido marcar nada como hecho sin evidencia (carpeta evidencias/ o salida de npm run verify).

PROTOCOLO POR FASE: leer → auditar → planificar → implementar → verificar → corregir → repetir la verificación COMPLETA → documentar → commit.

BUCLE DE CALIDAD: al terminar de implementar, ejecuta npm run verify. Si algo falla, corrige la causa raíz y vuelve a ejecutarlo ENTERO (no solo lo que falló). Solo terminas con DOS ejecuciones completas consecutivas en verde, sin cambios entre ellas.

EXCUSAS PROHIBIDAS: "queda para otra iteración", "en general funciona", "es un caso raro", "lo dejo como mejora". Si no puedes terminar una función al 100 %, la quitas de la interfaz y lo documentas; jamás la dejes a medias a la vista. Si no puedes verificar algo, escríbelo en INFORME.md como NO VERIFICADO con el motivo; nunca lo presentes como hecho.

RESPONSABILIDAD TOTAL: si encuentras un fallo que no está en esta lista, lo arreglas igual y lo registras. Si el mismo error puede estar en otros sitios, búscalo con grep y arréglalos todos.

ALCANCE: puedes rehacer por completo vistas, CSS y componentes. Conserva y migra los datos y la lógica que ya funcione. Respeta el stack actual (parece HTML/CSS/JS estático con rutas por hash en 127.0.0.1:8080); migrar a un framework solo si la auditoría lo justifica por escrito en DECISIONES.md.

ORDEN: Fase 1 auditoría y mapa del código (AUDITORIA.md) → Fase 2 fundaciones (tokens, módulos, almacenamiento, npm run verify) → Fase 3 diseño y componentes → Fase 4 módulos → Fase 5 robustez, PWA y dispositivos → Fase 6 QA final y entrega. Cada fase termina con la app funcionando y un commit. Si te falta tiempo o contexto, prioriza según la sección 1 y deja un estado coherente: nada a medias a la vista.

==================================================
4. DISEÑO (lo más importante de todo)
==================================================
4.1 LO QUE ODIO DEL ACTUAL (no debe sobrevivir nada): fondo negro-azulado con brillo, acento azul, botones blancos, etiquetas diminutas grises en MAYÚSCULAS, una caja igual para cada elemento con 2-3 botones dentro, la "tarjeta héroe" que repite el título con métricas de relleno, el aspecto genérico de "dashboard de IA".

4.2 DIRECCIÓN "CALMA": cálida, nítida, tranquila, hecha para usarse todos los días. Sensación de referencia (no copiar): Apple Recordatorios/Salud, Things 3, Linear, Bear.
- Una cosa importante por pantalla, grande; lo demás, discreto.
- La interfaz es neutra (papel / grafito). El color se reserva para (a) UN acento y (b) estados con significado: verde = bien, ámbar = pronto, rojo = vencido.
- Cero degradados decorativos, cero brillos/glow/blur, cero sombras de neón.
- Aire: rejilla de 4/8 px, espacio generoso, listas limpias en lugar de una caja por elemento.
- Las cifras (importes, porcentajes) son protagonistas: grandes y tabulares.
- Etiquetas en minúscula normal (sentence case). Micro-etiquetas en mayúsculas: como mucho una por pantalla.

4.3 TOKENS (un único archivo de variables CSS). Valores de partida que YA he verificado con ratios WCAG; tu script de contraste manda si cambias algo.
CLARO "Papel": fondo #F5F3EE · superficie #FFFFFF · superficie-2 #FAF9F6 · tinta #1C1B18 · tinta-2 #55524A · tinta-3 #6B675C · borde de campo #8F8A7D · borde decorativo #E4E0D6 · ok #1F7A45 (suave #E3F3EA) · aviso #8A5A00 (suave #FFF1D0) · peligro #B3261E (suave #FCE9E7)
OSCURO "Grafito" (sin azul): fondo #131312 · superficie #1C1C1A · superficie-2 #242421 · tinta #F3F1EB · tinta-2 #BDB8AC · tinta-3 #9A958A · borde de campo #7A766B · borde decorativo #34332F · ok #5DD18B (suave #16301F) · aviso #F2B94B (suave #33280F) · peligro #FF8A80 (suave #3A1A18)
NEGRO OLED (iPhone 14): como Grafito con fondo #000000 · superficie #0E0E0D · superficie-2 #171715 · borde decorativo #2A2926 · suaves: ok #0F2A19, aviso #2B2108, peligro #321514
ACENTOS (claro / oscuro · texto sobre el botón de acento claro / oscuro):
- Verde azulado (POR DEFECTO): #0B6E6E / #4FD1C5 · #FFFFFF / #06231F
- Índigo: #4338CA / #A5B4FC · #FFFFFF / #14173A
- Ciruela: #9D2F6F / #F0A6CF · #FFFFFF / #3A0F2A
- Naranja: #B34700 / #FFB27A · #FFFFFF / #331700
- Grafito (monocromo): #1C1B18 / #F3F1EB · #FFFFFF / #131312

AJUSTES → APARIENCIA: Modo (Automático según el sistema · Claro · Oscuro · Negro OLED) y Color de acento (los 5). Por defecto: Automático + Verde azulado. Existe porque no sé qué me va a gustar: cambiarlo debe ser instantáneo y las 15 combinaciones (3 modos × 5 acentos) deben verse impecables.
scripts/contrast.mjs calcula el contraste WCAG de todas las parejas relevantes en las 15 combinaciones y FALLA si texto < 4,5:1, texto grande o componentes de interfaz < 3:1, o tinta/fondo < 7:1. Forma parte de npm run verify.
Cambio de tema sin parpadeo: aplícalo con un script externo mínimo y síncrono en <head> antes del primer pintado. <meta name="theme-color"> con media prefers-color-scheme y actualizado al cambiar el tema a mano. El background_color del manifest = fondo del tema por defecto.

4.4 TIPOGRAFÍA: fuente variable autoalojada (woff2, licencia OFL, subconjunto latino con ñ á é í ó ú ü ¿ ¡ € · – —), font-display: swap, precargada. Usa Figtree; verifica que sus cifras tabulares funcionan (font-feature-settings "tnum"); si no, usa Inter solo para las cifras. Fallback system-ui con size-adjust para evitar saltos. Escala: 13 · 14 · 16 (cuerpo) · 18 · 22 · 28 · 34 · 44 (cifra principal). Pesos 400/500/600. Interlineado 1,45 en cuerpo. Nada esencial por debajo de 14 px. Cifras siempre con font-variant-numeric: tabular-nums.

4.5 FORMA Y PROFUNDIDAD: radio 16 en tarjetas y hojas, 12 en controles, 999 en píldoras. Líneas de 1 px. Sombra suave solo en modo claro y solo en elementos flotantes (hojas, menús, barra inferior). En oscuro, la jerarquía se hace con superficies y bordes, no con sombras. Un único juego de iconos SVG inline coherente (trazo 1,75, 24 px, esquinas redondeadas). Nada de emojis como iconos de la interfaz. Icono de la app propio (monograma geométrico simple), generado con un script reproducible.

4.6 COMPONENTES (una sola implementación de cada uno, reutilizada en todas partes; documentados en docs/DISENO.md con capturas):
- Botones: Primario (acento sólido; UNO por pantalla), Secundario (superficie-2 + borde), Terciario (solo texto), Peligro (texto rojo; el relleno rojo solo dentro del diálogo de confirmación). Altura mínima 44 px (48 px el primario en móvil). Foco visible de 2 px en acento con separación, estados pulsado, deshabilitado y cargando.
- Filas de lista (patrón principal): icono en círculo tintado · título · subtítulo · valor a la derecha · chevron. Tocar la fila abre una hoja de detalle con Editar / Eliminar. Prohibido repetir 2-3 botones en cada elemento. Filas agrupadas en tarjetas con separadores finos.
- Hojas inferiores (bottom sheets) en móvil y diálogos centrados en escritorio para crear, editar y confirmar. Foco atrapado y devuelto al cerrar, Esc cierra, arrastrar para cerrar en móvil (con botón Cerrar como alternativa), manejo correcto del teclado en iPhone (visualViewport).
- Campos: etiqueta visible, ayuda, error en línea, 48 px de alto, 16 px de fuente. Importes con inputmode="decimal" y formato en vivo ("1.234,56 €").
- Control segmentado, chips de filtro, interruptores, barra de progreso, anillo de progreso, mini gráfico de barras y sparkline (SVG propios, sin librerías).
- Toast con "Deshacer" durante 6 s y aria-live. Estados vacíos (icono + frase útil + acción). Esqueletos de carga solo si hay una carga real.
- Etiquetas de estado con icono + texto (nunca solo color).

4.7 ESTRUCTURA Y NAVEGACIÓN
- Móvil (≤ 767 px): barra inferior con 5 destinos: Hoy · Agenda · Dinero · Hábitos · Más. "Más" abre una hoja con el resto (Lo que vence, Suscripciones, Huchas, Salud, Objetivos, Gente, Notas, Insights, Ajustes). Botón "+" de captura rápida que no tape contenido (espacio inferior suficiente).
- Tablet y escritorio (≥ 768 px): barra lateral colapsable (232 / 72 px) con grupos Centro · Finanzas · Vida · Sistema, contador de vencidos en "Lo que vence", contenido con ancho máximo cómodo (~1040 px) y dos columnas cuando haya espacio. Tecla N = captura rápida.
- Cabecera de página: título (28-34 px) + una línea de contexto + acción primaria. Nada de tarjeta héroe repitiendo el título.
- Captura rápida (+): hoja con Gasto, Ingreso, Evento, Nota y Vencimiento. Un gasto en ≤ 3 toques: importe → categoría → guardar (fecha de hoy por defecto).
- Transiciones de 150-220 ms, solo transform/opacity; respetar prefers-reduced-motion.

4.8 PANTALLAS CLAVE
- HOY: saludo según la hora en Europe/Berlin ("Buenas noches · sábado 14 de nov"); tarjeta "Lo siguiente" (UNA: el evento o vencimiento más cercano, con su acción); "Requiere atención" (vencidos y los de ≤ 3 días, con "Completar" directo); "Hábitos de hoy" con casillas tocables y anillo de progreso; "Dinero del mes" con una cifra principal = Libre tras compromisos y una barra gastado/comprometido/libre; "Agenda de hoy" con huecos libres. Cada dato aparece UNA sola vez. Todo lo accionable, visible sin hacer scroll en iPhone 14 (390×844) y en 1366×768.
- AGENDA: ver F4 y la sección 5.
- DINERO: cifra principal + barra del mes + categorías con barras + movimientos agrupados por día; mes navegable con ‹ ›.
- HÁBITOS: lista con las casillas de los últimos 7 días con letras de día, racha y porcentaje.
- Resto de módulos: mismo patrón (cabecera + resumen útil + lista de filas).

4.9 ENTREGABLE DE DISEÑO: docs/DISENO.md (tokens, componentes, reglas) y capturas ANTES/DESPUÉS de todas las pantallas en claro, oscuro y negro, a 390×844 y 1366×768, en evidencias/. Hazte esta pregunta con cada pantalla: "¿esto parece hecho por un estudio de producto profesional?". Si la respuesta no es un sí claro, rehazla.

==================================================
5. FUNCIONES: CRITERIOS DE ACEPTACIÓN POR MÓDULO
==================================================
CADA módulo debe permitir: crear, editar, eliminar (con Deshacer), validar entradas, persistir, mostrar estado vacío útil, ser accesible, responsive y no dar errores en consola.
- AGENDA: vista Mes (rejilla real de 7 columnas, lunes primero, 5-6 filas, días de otros meses atenuados, hoy resaltado, chips de eventos máx. 2 + "+N", tocar un día = añadir evento ese día) y vista Semana (7 columnas en escritorio, lista tipo agenda en móvil, alturas uniformes). Navegación ‹ Hoy › que cruza fin de mes y fin de año sin saltos ni repeticiones. Evento: título, fecha, hora de inicio-fin o todo el día, categoría, lugar, nota, repetición (nunca/diaria/semanal/mensual/anual). Eventos que cruzan medianoche. Editar o eliminar una serie pregunta "Solo este / Todos".
- LO QUE VENCE: importe opcional, categoría, repetición (misma lógica), grupos Vencidos / Hoy / Próximos 7 días / Más adelante / Completados. "Completar" registra el completado y, si repite, genera la siguiente ocurrencia; si tiene importe, ofrece "registrar como gasto" (casilla).
- REPETICIONES: las ocurrencias se CALCULAN al vuelo (no se duplican registros). Mensual el día 31 → último día de cada mes; anual 29-feb → 28-feb en años no bisiestos. Excepciones por ocurrencia guardadas aparte. Tests unitarios obligatorios (incluye cambio de hora y fin de año).
- DINERO: movimientos (gasto/ingreso), presupuesto mensual, categorías con su presupuesto, mes navegable. Nombres y fórmulas únicos y documentados en UN módulo (ver F6).
- SUSCRIPCIONES: semanal/mensual/anual, activa/pausada, próximo cobro calculado (con recorte de fin de mes), total al mes (anual ÷ 12) y al año. Una pausada no muestra próximo cobro ni cuenta en ningún cálculo.
- HUCHAS: crear, aportar, retirar (nunca por debajo de 0), objetivo, aportación mensual opcional (con meses restantes estimados), historial de aportaciones. El ahorro en huchas no forma parte del "libre".
- HÁBITOS: diarios o de días concretos de la semana; marcar/desmarcar hoy y días pasados; racha actual y mejor racha; porcentaje semanal; archivar.
- SALUD: citas y registros (peso, sueño…) con gráfico simple. Sin diagnósticos ni consejos médicos.
- OBJETIVOS: manuales (valor actual / meta / unidad / fecha límite) o VINCULADOS a una hucha (fuente única: lee de la hucha). Progreso y completado.
- GENTE: contactos, cumpleaños (con o sin año), último contacto, "contactar cada N días" como indicador visual, próximos cumpleaños.
- NOTAS: crear, editar, fijar, archivar y búsqueda simple por texto.
- INSIGHTS: reglas deterministas y explicables ("Por qué aparece"), máximo 5, cada una con una acción. Sin "IA" ni promesas falsas; todas derivadas de datos reales; sin datos, no inventa nada.
- AJUSTES: Apariencia · Datos (exportar, importar, copia automática local, recordatorio de copia, cargar/borrar datos de ejemplo, restablecer todo con confirmación fuerte) · Instalar (guía para iPhone y Chromebook) · Diagnóstico (versión, build, estado y tamaño del almacenamiento, último backup, últimos 50 errores, botón "Copiar diagnóstico") · Atajos · Privacidad.
- DATOS DE EJEMPLO: la primera vez que se abre, la app está VACÍA con estados vacíos útiles. Los datos de ejemplo son opcionales y están marcados (demo: true) para poder borrarlos en bloque. Los datos que ya existen de la v4 NO se tocan (pueden ser reales); dímelo en el informe.
- INTEGRIDAD: fuente única de verdad. Lo derivado se calcula, no se guarda duplicado. Borrar algo que otro módulo referencia (hucha vinculada a un objetivo, suscripción vinculada a un vencimiento) avisa y resuelve el vínculo.

==================================================
6. FALLOS CONOCIDOS EN LA v4 (cada uno resuelto, con test o captura)
==================================================
F1. La fecha sale "Sábado, 14 De Noviembre, 03:24". Debe ser "sábado, 14 de noviembre · 03:24" con Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Berlin' }) y sin text-transform: capitalize.
F2. Tres formatos de fecha mezclados (2026-11-13, 13/11/2026, 14/3/2027). Un único módulo de fechas: corta "14 nov", larga "sábado 14 de noviembre de 2026", relativa "mañana / en 3 días / hace 2 días".
F3. Parseo de fechas: prohibido new Date('AAAA-MM-DD') (se interpreta como UTC y puede salir otro día) y new Date('AAAA-MM-DD HH:mm') (Safari lo rechaza). Parseo manual a fecha local. Los "días hasta" se calculan con diferencia de días de calendario, no con milisegundos/86400000.
F4. El Calendario era una lista de días en dos columnas con "Sin eventos" repetido, alturas desiguales y un "1" suelto junto a 15/11/2026 en la vista Semana (averigua qué era y resuélvelo). Rehacer según la sección 5 (AGENDA). Botones: Semana|Mes como control segmentado y un único primario "Añadir evento".
F5. En la hucha Emergencias aparece "Aportación mensual" sin valor (ya estaba así en la versión anterior: averigua por qué no se arregló). Mostrar el valor u ocultar la fila; campo editable.
F6. Cifras que confunden. "Disponible 834,30 €" ignora 785 € comprometidos. Define en UN módulo (con tests) y nombra sin ambigüedad: Presupuesto · Gastado · Comprometido (vencimientos pendientes con importe + cobros de suscripciones activas aún no cobrados este mes, sin contar dos veces lo enlazado) · Libre tras compromisos (= presupuesto − gastado − comprometido, por ejemplo 49,30 €) · Balance (ingresos − gastos) · Proyección a fin de mes. "Previsto 140,79 €" era una proyección lineal (65,70/14×30): renómbrala, explícala en una línea y no la muestres con menos de 7 días de datos. "Mes anterior 0,00 €" sin datos = "—". Hoy, Dinero e Insights leen TODOS del mismo módulo.
F7. Duplicados lógicos. (a) El objetivo "Ahorrar fondo emergencia 450/1000" repite la hucha Emergencias, aunque la propia pantalla dice "evita duplicarlo": vincular (fuente única) o impedir el duplicado. (b) "Seguro anual" está PAUSADO pero muestra "Próximo cobro 24/11" y a la vez existe el vencimiento "Renovar seguro 120 €": aplica la regla de Suscripciones y permite enlazar el vencimiento con la suscripción.
F8. Hábitos con denominadores distintos (Leer 5/5 vs Caminar 4/7). Regla única, documentada: semana lunes-domingo; para hábitos diarios, el denominador son los días transcurridos de la semana hasta hoy; para hábitos de días concretos, los días programados hasta hoy. La racha no se rompe hasta que acaba el día. Letras de día (L M X J V S D). Cada casilla es un <button> con aria-pressed y aria-label ("jueves 12: hecho").
F9. Métricas de relleno ("Cuidado: Activo", "Seguimiento: Activo", "Ventana: 7 días", "Acceso: Rápido", "Privacidad: 100%", "Fuente: Local"): fuera. Y en Hoy el mismo dato ("Trabajo 13:00-22:00") aparecía 3 veces.
F10. Gramática "1 vencido(s) requieren atención", "2 vencimiento(s) crítico(s)": usa Intl.PluralRules; prohibido el patrón "(s)" en todo el proyecto.
F11. Barra de desplazamiento clara y gruesa sobre fondo oscuro: color-scheme correcto, scrollbar-width: thin, scrollbar-color, sin doble scroll.
F12. Aro azul rectangular alrededor de todo el contenido al navegar: es el foco del contenedor. Mueve el foco al <h1> de la vista sin pintar aro; deja un :focus-visible claro en todos los controles.
F13. Jerarquía de botones rota ("Semana" activo = "Añadir evento" primario, ambos blancos): aplica 4.6.
F14. "Eliminar" en rojo en CADA tarjeta: aplica el patrón fila → hoja de detalle y Deshacer 6 s. Confirmación fuerte solo para borrados masivos y "Restablecer todo". Un doble toque no borra dos elementos.
F15. Cifras pegadas en cabeceras ("1600,00 €" y "36%" casi se tocan): grid con minmax, tabular-nums; probar a 320, 360 y 390 px y con importes enormes.
F16. Barra lateral: el pie "Local, privado y offline" se solapaba con el menú (en la v4 parece corregido: confírmalo). Ese texto pasa a Ajustes → Privacidad. El menú tiene scroll propio con indicador a 1366×768, 1280×720 y zoom 125 %.
F17. Contraste insuficiente en grises pequeños: lo cubren los tokens y el script de contraste.
F18. Estados solo por color: icono + texto.
F19. "Foco: Mantener rutina y controlar gastos" era texto fijo y Hoy tenía mucha zona vacía: calculado o editable por mí, y composición según 4.8.
F20. El parámetro "?v4=2" es un parche de caché manual: sustitúyelo por la versión de caché real de la sección 8.
F21. Insights, Notas, Salud y todos los formularios no se vieron en las grabaciones: audítalos con el mismo rigor y registra lo que encuentres.

==================================================
7. IPHONE 14 Y CHROMEBOOK (los dos tienen que ir perfectos)
==================================================
7.1 IPHONE 14 (390×844 CSS px, iOS 16+, en Safari y como app instalada)
- viewport: width=device-width, initial-scale=1, viewport-fit=cover. SIN maximum-scale ni user-scalable=no (no bloquear el zoom).
- Áreas seguras: env(safe-area-inset-*) en cabecera, barra inferior, hojas y botón "+". Usa 100dvh, nunca 100vh.
- Campos ≥ 16 px (si no, iOS hace zoom). touch-action: manipulation. -webkit-text-size-adjust: 100%. Objetivos táctiles ≥ 44×44 px. Estados :active propios. Nada que dependa de hover. Todo gesto (deslizar, arrastrar) tiene alternativa con botón.
- Teclado: las hojas con campos usan visualViewport para que el campo enfocado nunca quede tapado. Bloqueo del scroll del fondo con hoja abierta, hecho bien en iOS (guardando scrollY).
- Instalación: iOS no tiene evento de instalación. Si no está en modo standalone (navigator.standalone / display-mode), muestra una guía descartable "Compartir → Añadir a pantalla de inicio" y deja la guía también en Ajustes → Instalar.
- Almacenamiento: Safari puede borrar los datos de un sitio NO instalado tras ~7 días sin uso; la app instalada no tiene ese límite y su almacenamiento es SEPARADO del de Safari. Avísalo en Ajustes, solicita navigator.storage.persist() si existe (sin depender de ello) y recuerda hacer copia si pasan más de 14 días.
- Exportar con la API Compartir con archivo (navigator.canShare({files})) en iPhone y descarga normal en Chromebook, con alternativa si falla.
- Barra de estado: apple-mobile-web-app-capable + estilo de barra de estado elegido y verificado. OJO: con black-translucent el texto de la barra es blanco, y en el tema claro se pierde la hora si no hay una franja oscura o un fondo coherente debajo. Decídelo, documéntalo y verifícalo en claro y oscuro. apple-touch-icon 180×180 sin transparencia.
- No prometas notificaciones push (requieren servidor). Los avisos se ven dentro de la app (contador en "Lo que vence"). Opcional: navigator.setAppBadge con el número de vencidos si existe.
- docs/PRUEBA-IPHONE.md: lista de 12 comprobaciones que haré yo en el iPhone real (instalar, crear datos, cerrar y reabrir, modo avión, rotar, tema oscuro, teclado, exportar, etc.), con el resultado esperado de cada una.

7.2 CHROMEBOOK ACER 314 (1366×768 y 1920×1080, ChromeOS, trackpad/teclado, posiblemente táctil)
- Instalable como app (botón "Instalar LIFE OS" con beforeinstallprompt en Ajustes). Ventana redimensionable de 800×600 a 1920×1080 y modo tablet sin romperse. Zoom del navegador de 80 % a 150 % sin romper.
- Teclado completo: Tab, Enter, Esc; en el calendario, flechas para moverse por los días y Enter para abrir; N = nuevo; atajos documentados en Ajustes.
- Hover y foco coherentes, cursor correcto, scroll suave con trackpad. En 1366×768 lo accionable de Hoy se ve sin scroll.

7.3 LOS DOS DISPOSITIVOS A LA VEZ
- Sin servidor y sin coste no hay sincronización automática, así que los datos de cada dispositivo son independientes. Debe existir Exportar/Importar JSON con dos modos: "Reemplazar todo" y "Combinar" (gana el más reciente por elemento; todo registro lleva id, updatedAt y, si se borra, una marca de borrado para que no resucite). Tests del merge. Importar un archivo de un esquema más nuevo se rechaza con un mensaje claro.
- Mismo build y misma versión de esquema en ambos.

==================================================
8. ROBUSTEZ Y PREVENCIÓN FUTURA
==================================================
DATOS Y PERSISTENCIA
- Toda lectura/escritura pasa por UN módulo de almacenamiento con try/catch (modo privado, cuota llena, bloqueado) y avisos claros.
- Esquema versionado (schemaVersion) con migraciones encadenadas, backup previo, tests con un fixture REAL de datos de la v4 y fixtures corruptos. Migración idempotente.
- Validación de todo al cargar (JSON corrupto, campos que faltan, tipos erróneos). La app NUNCA queda en blanco: guarda copia del dato dañado, avisa y recupera lo posible.
- Varias pestañas abiertas a la vez: sincroniza con el evento "storage" o BroadcastChannel y no escribas con estado obsoleto.
- IDs únicos (crypto.randomUUID), nunca índices de array. Escrituras idempotentes: el doble toque no duplica registros.
DINERO
- Céntimos enteros, nunca decimales flotantes. Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }). Se aceptan "12,5", "12.50" y "1.234,56". Se rechazan vacío, 0 donde no procede, negativos, NaN, Infinity, valores absurdos y longitudes excesivas.
- Divisiones por cero (presupuesto 0, objetivo 0), porcentajes > 100 % (la barra se limita, el valor real se muestra), aportar más que el objetivo, retirar por debajo de 0, movimientos con fecha futura, cambio de mes por mes natural en Europe/Berlin.
FECHAS Y HORAS
- Todo en Europe/Berlin. Cambio de hora (25-oct-2026 y 28-mar-2027), medianoche, fin de mes y de año, 29-feb, semanas que empiezan en lunes, eventos que cruzan medianoche, fin anterior al inicio.
- App abierta durante días: al pasar la medianoche y al volver a primer plano (visibilitychange) se refrescan "Hoy", hábitos y vencimientos solos.
SEGURIDAD
- Prohibido innerHTML con datos del usuario (XSS): textContent o escapado centralizado. Prueba con una nota que contenga <img src=x onerror=alert(1)>, comillas y emojis. Valida el JSON importado.
- Si el despliegue es en Vercel (lo es en mis vistas previas), añade vercel.json con cabeceras: Content-Security-Policy (default-src 'self'), X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy; sw.js con Cache-Control: no-cache (si no, las actualizaciones se quedan atascadas); activos con hash y cache inmutable.
PWA Y OFFLINE
- manifest completo (id, name, short_name, lang, start_url y scope relativos, display standalone, theme_color, background_color, iconos 192/512 y maskable) y favicon SVG.
- Service worker con caché versionada, limpieza de cachés antiguas, skipWaiting controlado y aviso "Nueva versión disponible · Actualizar" (nunca recargar de golpe con un formulario abierto). Versión y build visibles en Ajustes → Diagnóstico.
- Rutas por hash: recargar en cualquier ruta, hash inexistente → Hoy, atrás/adelante funcionan.
- Prueba real: cargar una vez, apagar la red, recargar y usar TODAS las secciones.
ERRORES
- window.onerror y unhandledrejection registran el error local (últimos 50, visibles en Ajustes → Diagnóstico) y avisan sin romper la app. Nunca fallos silenciosos.
RENDIMIENTO Y CÓDIGO
- Cero peticiones externas. Sin re-render completo por pulsación de tecla. Sin fugas de listeners al cambiar de vista. Listas largas (500+ movimientos) paginadas o virtualizadas. Peso de la carga inicial ≤ 400 KB comprimidos (fuentes incluidas).
- Módulos separados (estado, almacenamiento, dinero, fechas, repeticiones, hábitos, presupuesto, migraciones, vistas, componentes). Sin globales, sin código muerto ni duplicado, sin números ni textos mágicos. Textos de la interfaz centralizados. Ortografía, tildes y plurales correctos.
- GUARDARRAÍLES para el futuro: reglas de ESLint que prohíban innerHTML sin sanear, new Date(string), parseFloat/Number sobre importes, console.log y URLs externas; hook pre-commit (carpeta .githooks + core.hooksPath) que ejecute lint y tests unitarios; workflow .github/workflows/verify.yml que ejecute npm run verify en cada PR; docs/ARQUITECTURA.md y docs/CONTRIBUIR.md (cómo añadir un módulo, una migración o un test).
ACCESIBILIDAD
- lang="es", landmarks (header, nav, main), un h1 por vista, "saltar al contenido", todo operable con teclado, nombre accesible en botones solo de icono, aria-current en la navegación, aria-live en toasts, prefers-reduced-motion, alto contraste forzado (forced-colors) sin romper nada.

==================================================
9. CALIDAD AUTOMÁTICA: npm run verify (UN solo comando; sale con código ≠ 0 si algo falla)
==================================================
1) ESLint + formato.
2) Tests unitarios (node --test) de dinero, fechas, repeticiones, hábitos, presupuesto, pluralización, migraciones y merge, con cobertura ≥ 90 % de líneas en esos módulos. Reloj simulado para: cambio de hora (25-oct-2026, 28-mar-2027), 31-dic 23:59 → medianoche, 29-feb, fin de mes.
3) scripts/contrast.mjs (15 combinaciones).
4) E2E en Chromium (1366×768 y 360×740) y en WebKit con el dispositivo "iPhone 14" de Playwright: todas las vistas en claro, oscuro y negro; CRUD completo de cada módulo; persistencia tras recargar; offline; dos pestañas; datos corruptos; importar/exportar. Si WebKit no se puede instalar en este equipo, dilo en el informe como NO VERIFICADO en WebKit y añádelo a PRUEBA-IPHONE.md.
5) axe-core: 0 violaciones serious/critical en cada vista × modo × viewport.
6) "Rastreador de controles": en cada vista localiza TODOS los botones, enlaces y campos visibles, los activa y comprueba que producen un efecto visible o un cambio de estado sin errores (los destructivos se prueban con Deshacer).
7) Prueba de red: falla ante CUALQUIER petición a otro origen.
8) Prueba "mono": 2.000 acciones aleatorias con semilla fija por viewport (clics, escritura de textos raros, cambios de vista, atrás/adelante). Cero excepciones, cero errores de consola y la app sigue renderizando.
9) Regresión visual (Hoy, Agenda, Dinero, Ajustes; claro y oscuro; 390 y 1366).
10) Lighthouse (Rendimiento, Accesibilidad, Buenas prácticas, SEO) ≥ 95 en móvil y escritorio. Lighthouse ya no puntúa PWA: la instalabilidad se comprueba aparte (manifest válido + service worker activo + Page.getInstallabilityErrors vacío vía CDP).
11) Presupuesto de peso (≤ 400 KB comprimidos en la carga inicial).
12) Guardarraíles por grep: sin TODO, FIXME, console.log, debugger, lorem, .only ni URLs externas.

==================================================
10. AUTO-AUDITORÍA FINAL (actúa como usuario hostil y como usuario despistado)
==================================================
Antes de entregar, prueba y registra el resultado de cada punto en INFORME.md: pegar 10.000 caracteres en una nota; importe "1e9", "-5", "abc"; borrar todo y recargar; llenar la cuota de almacenamiento; cambiar el reloj del sistema a otro día, mes y zona horaria; 3 pestañas editando a la vez; volver tras 3 días en segundo plano; offline → online; actualización de versión con un formulario abierto; rotar la pantalla y redimensionar la ventana; zoom 200 %; tamaño de texto grande del sistema; prefers-reduced-motion; forced-colors; doble toque en cada botón; importar un archivo corrupto, vacío y de un esquema más nuevo; borrar una hucha enlazada a un objetivo.

==================================================
11. PUERTA DE PUBLICACIÓN (solo estás terminado si TODO esto es cierto)
==================================================
[ ] npm run verify en verde DOS veces seguidas, sin cambios entre ellas.
[ ] Las 13 secciones (Hoy, Agenda, Lo que vence, Dinero, Suscripciones, Huchas, Hábitos, Salud, Objetivos, Gente, Insights, Notas, Ajustes) cumplen la sección 5, sin errores en consola.
[ ] F1-F21 resueltos, cada uno con test o captura.
[ ] Las 15 combinaciones de tema se ven impecables y cumplen contraste.
[ ] Migración de los datos de la v4 probada con fixture real; backup restaurable.
[ ] Funciona offline y es instalable; verificada la instalabilidad por programa.
[ ] Cero peticiones externas.
[ ] Documentos entregados: README.md, docs/DISENO.md, docs/ARQUITECTURA.md, docs/CONTRIBUIR.md, docs/PRUEBA-IPHONE.md, PUBLICAR.md, INFORME.md, CHANGELOG.md, docs/DECISIONES.md. Versión (package.json y Ajustes) = 1.0.0.
[ ] Lo que NO pudiste verificar está en INFORME.md como NO VERIFICADO, con motivo y cómo comprobarlo.
Cuando todo esto se cumpla, la app queda LISTA PARA PUBLICAR y así me lo dices: puedo publicarla sin cambiar nada más. Si algo falla, no lo digas.

==================================================
12. ENTREGA
==================================================
- Rama con commits por tema, sin merge a main.
- INFORME.md: (a) tabla hallazgo → causa raíz → arreglo → evidencia (comando o captura) → estado (arreglado / parcial / NO VERIFICADO); (b) resultados de la sección 10; (c) lo que no pudiste comprobar y por qué; (d) riesgos que quedan; (e) propuestas NO implementadas, ordenadas por valor/coste; (f) cambios en el formato de datos y cómo se migra.
- PUBLICAR.md: pasos exactos para publicar (merge tras mi aprobación, despliegue, comprobaciones posteriores, cómo instalar en iPhone y Chromebook, cómo volver atrás).
- Mensaje final corto y honesto: qué has hecho, el resultado de npm run verify, qué queda y dónde ver la vista previa. Nada de "todo perfecto" si hay algo sin verificar.
