# Tasks

## 1. Rama y preparación

- [x] 1.1 Crear la rama `change/is5-game-flow` desde la issue #5 (`gh issue develop`) a partir de `develop/v1.0.0` actualizada y comentar en la issue el enlace a la carpeta del change; verificar con `git branch --show-current` y `git log --oneline -1` que parte del último commit de `develop/v1.0.0`

## 2. Fases de partida en la simulación

- [x] 2.1 Añadir `confirm` a `SimInput` y `NO_INPUT`, las constantes `READY_TICKS`, `DYING_TICKS` y `LEVEL_CLEAR_TICKS` a `rules.ts` y el evento `phaseChanged`; verificar con `npm run typecheck` y las pruebas de eventos
- [x] 2.2 Implementar `GamePhase`, `PhaseHost` y las fases `ReadyPhase`, `PlayingPhase`, `DyingPhase`, `LevelClearPhase` y `GameOverPhase` en `src/sim/phases/`, y hacer que `Simulation` delegue en ellas (`phase` sustituye a `status`, desaparece `nextLevel()`, `newGame()` deja la partida en `ready`); verificar con pruebas de cada transición: preparado inicial sin movimiento, contacto → `dying` → `ready` con ingredientes conservados, última vida → `gameOver`, nivel completado → continuación automática a los 180 ticks y adelantada con `confirm`, `confirm` sin efecto en `playing` y `newGame()` desde `gameOver`
- [x] 2.3 Adaptar las pruebas existentes de `Simulation` (reglas, contacto, nivel superado, determinismo) a las fases y añadir a la de determinismo los ticks de cambio de fase; verificar con `npm run test` en verde

## 3. Textos por idioma

- [x] 3.1 Implementar `src/i18n/` con el catálogo español de referencia, el catálogo inglés tipado como `Catalog`, `format` (plurales con `Intl.PluralRules`, números con `Intl.NumberFormat`), `Translator`, `Localization` y `detectLanguage`; verificar con pruebas de parámetros, plurales en ambos idiomas, separador de miles, detección (`es-MX` → español, catalán → inglés, lista vacía → inglés) y aviso a los suscriptores al cambiar de idioma, y comprobar a mano que quitar una clave del catálogo inglés hace fallar `npm run typecheck`
- [x] 3.2 Llevar al catálogo todos los textos de la interfaz (carga, título, menús, opciones, HUD, preparado, nivel completado, fin de partida con récord, pausa); verificar con `grep` que no quedan textos visibles escritos en escenas ni componentes

## 4. Ajustes del jugador y récord

- [x] 4.1 Implementar `src/settings/` (`PlayerSettings`, `parseSettings`, `SettingsStore`, `LocalStorageSettingsStore`, `MemorySettingsStore`, `Settings` con `submitScore`); verificar con pruebas de registro ausente, JSON roto, versión desconocida, un campo no válido conservando el resto, almacenamiento que lanza al leer y al escribir, récord mayor, menor e igual, y guardado en cada cambio

## 5. Tema con la opción del jugador

- [x] 5.1 Ampliar `chooseTheme` con `optionTheme` (prioridad URL → opción salvo `auto` → nivel → `classic`, aviso con origen "the settings" para un tema guardado que ya no existe); verificar con pruebas de las combinaciones de la prioridad

## 6. Escenas, HUD paralelo, menús y pausa

- [x] 6.1 Implementar `GameSession` (estado de la partida para el HUD, avisos tipados y órdenes de pausa, reanudación y salida) y `MenuList` (teclado y clic o toque); verificar con pruebas de `GameSession` (suscripción, récord en directo, órdenes) y `npm run typecheck`
- [x] 6.2 Crear `TitleScene` (sustituye a `TapScene`: primer clic, toque o tecla → pantalla completa si se puede, música y menú) y `MenuScene` (principal con Jugar, Opciones y récord; opciones con Idioma, Tema y Volver, aplicados y guardados al momento); cablear `Settings`, `Localization` y `GameSession` en `src/main.ts` y el atributo `lang` del documento; verificar en `npm run dev` el recorrido título → menú → opciones → menú en los dos idiomas, con teclado y con ratón, y que el idioma y el tema se recuerdan al recargar
- [x] 6.3 Crear `HudScene` (paneles con récord y botón de pausa, mensajes de preparado y nivel completado, fin de partida con aviso de récord, menú de pausa) y reducir `GameScene` al tablero: lanzar y detener el HUD, entrada con `confirm` y Esc/P, pausa con `scene.pause()` y `stepper.reset()` al reanudar, pausa al perder el foco, salida al menú con `scene.start` y envío de la puntuación a `Settings`; quitar el temporizador de golpe de `ChefView` en favor de la fase `dying`; verificar en `npm run dev` preparado, muerte, continuación automática y adelantada, fin de partida con y sin récord, pausa por tecla, botón y cambio de pestaña, y que jugar de nuevo desde el menú empieza en estado inicial
- [x] 6.4 Adaptar los escenarios de `tools/smoke/scenarios.ts` al título y al menú y añadir `menu` (menú y opciones en español e inglés) y `pause`; verificar con `npm run smoke` y `npm run smoke -- menu` y `pause` en verde, y revisar las capturas
- [x] 6.5 Añadir Salir al menú principal en la versión de escritorio (puente `quit()` en el preload, IPC `app:quit` en el proceso principal, `quitApp` inyectado en `MenuScene`, Esc en el menú principal selecciona Salir, textos en los catálogos) y hacer que la prueba de humo cargue el preload real y registre los cierres; verificar con un escenario `quit` (Esc selecciona Salir, Enter pide cerrar, `expectQuit` en verde) y que en el navegador (`npm run dev`) no aparece Salir

## 7. Documentación

- [x] 7.1 Actualizar `README.md` (menú, opciones de idioma y tema, pausa con Esc o P, récord, fin de nivel automático, tabla de controles) y la fila de #5 en la hoja de ruta; verificar con `npm run format:check` y relectura
- [x] 7.2 Actualizar `docs/MANUAL.md` (flujo de escenas, fases de partida, `GameSession`, ajustes y recetas "Añadir un texto", "Añadir un idioma" y "Añadir una opción") y `docs/GAMEDEV_FUNDAMENTALS.md` (apartados de flujo del juego, pausa e internacionalización, ya implementados en Xantar); verificar con `npm run format:check` y que los nombres citados existen en el código

## 8. Verificación final

- [x] 8.1 Ejecutar `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build` y `npm run smoke`, y verificar que todo termina con código 0
- [ ] 8.2 Revisión manual del autor: recorrido completo de pantallas en navegador y Electron, cambio de idioma y tema, pausa (tecla, botón y cambio de pestaña), preparado, muerte, fin de nivel automático y adelantado, fin de partida con récord y que las duraciones de las fases se sienten bien
