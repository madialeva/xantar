# Tasks

## 1. Rama y preparación

- [x] 1.1 Asignar la issue #14 al milestone `v1.0.0`, crear la rama `change/is14-web-deployment` desde la issue (`gh issue develop`) a partir de `develop/v1.0.0` actualizada y comentar en la issue el enlace a la carpeta del change; verificar con `git branch --show-current`, `git log --oneline -1` (último commit de `develop/v1.0.0`) y `gh issue view 14` (milestone y comentario)

## 2. Salir en el navegador

- [x] 2.1 Implementar en `src/view/platform/Platform.ts` la función pura `returnUrl(referrer, current)` (misma origin, distinta ruta que la del juego, sin tener en cuenta query ni hash; si no, `null`) y el `quit` de `WebPlatform` inyectado por `createPlatform` (`history.back()` con historial, `location.assign` sin él, `null` sin URL de origen); actualizar el comentario de `Platform.quit`; verificar con pruebas de `returnUrl` (referrer vacío, otro origin, otro puerto, la propia página con query o hash, portada `/` e `/index.html` → URL) y de `createPlatform` con un `host` falso (sin referrer → `quit` nulo; con referrer y `history.length` 2 → `back`; con `history.length` 1 → `assign` con la URL)
- [x] 2.2 Verificar en `npm run dev` que, abierto directamente, el menú principal no muestra Salir y Esc no cambia la selección, y con `npm run smoke` en verde que el escritorio sigue mostrando Salir
- [x] 2.3 Documentar Salir en el navegador en `README.md` ("How to play": en la web, Salir vuelve a la página desde la que se abrió el juego) y en `docs/MANUAL.md` (§8.4/§8.8, plataforma web y página de origen); verificar con `npm run format:check` y que los nombres citados existen en el código

## 3. Web personal (repositorio `madialeva.github.io`)

Los cambios de este grupo viven en el otro repositorio y los confirma el autor junto con su trabajo pendiente. En Xantar solo se marcan las tareas.

- [x] 3.1 En `deploy.sh`, excluir `*/js/xantar/*` del quitacomentarios (junto a `js/3rd/`) con un comentario que explique por qué; verificar leyendo el `find` resultante y con `bash -n deploy.sh`
- [x] 3.2 Cambiar el botón GAME de `src/index.html` a `href="js/xantar/index.html"` y borrar el juego antiguo de `src/` (`game.html`, `js/game/`, `js/3rd/phaser-arcade-physics.min.js`, `music/tap-back.mp3`); verificar con `grep -rn "game.html\|phaser\|tap-back" src` sin resultados
- [x] 3.3 Actualizar el `README.md` y el `AGENTS.md` de la web (estructura sin el juego antiguo, Xantar en `js/xantar/` generado desde el repositorio de Xantar con `npm run publish:site`, que no se edita a mano, exclusión en `deploy.sh`, nombre `madialeva.github.io` en lugar de `angazo.github.io`); verificar releyendo que no queda ninguna referencia a `game.html`, `TapScene` ni `StartScene`

## 4. Script de publicación

- [x] 4.1 Implementar `scripts/publish-site.mjs` y `npm run publish:site` (ruta por `XANTAR_SITE_DIR` o `../madialeva.github.io`, validación de `deploy.sh` y `src/index.html` antes de compilar, `npm run build`, vaciado de `src/js/xantar/` y copia de `dist/`, ejecución de `deploy.sh` con la web como `cwd`, resumen de pasos siguientes); verificar con `npm run lint`, con `XANTAR_SITE_DIR` apuntando a una carpeta temporal que no es la web (error con la ruta y la carpeta intacta) y con un error de tipos provocado a propósito (termina con error sin tocar la web)
- [x] 4.2 Ejecutar `npm run publish:site` contra la web real; verificar con `diff -r dist <web>/src/js/xantar` y `diff -r dist <web>/docs/js/xantar` sin diferencias, que `docs/` ya no contiene `game.html`, `js/game/` ni `assets/`, y que una segunda ejecución no deja bundles con hash anteriores
- [x] 4.3 Documentar la publicación en `docs/MANUAL.md` (§6 comandos y §9.4 reescrita: web personal, ruta, script, `XANTAR_SITE_DIR`, revisión local y commit y push en la web), en la tabla de comandos de `AGENTS.md` y en `docs/GAMEDEV_FUNDAMENTALS.md` §20 (despliegue estático en una subruta y por qué las rutas relativas lo permiten); verificar con `npm run format:check` y que el comando documentado se ejecuta tal cual

## 5. Integración y publicación

- [x] 5.1 Servir la web en local (`python3 -m http.server -d docs` en la web) y recorrer portada → GAME → título → menú con Salir → partida → pausa → Salir al menú → Salir → portada, en escritorio y con la emulación de móvil del navegador; verificar que no hay errores de CSP ni 404 en la consola y que tras Salir no queda pantalla completa
- [x] 5.2 Añadir en `README.md` ("Where to play" → Browser) el enlace a `https://madialeva.github.io/js/xantar/`, manteniendo las instrucciones locales; verificar con `npm run format:check` y las comprobaciones de entrega (`lint`, `typecheck`, `test`, `build`)
- [ ] 5.3 Tras el commit y el push de la web por parte del autor, verificar en `https://madialeva.github.io/` el recorrido de 5.1 en un navegador de escritorio y en un móvil real (orientación horizontal, música tras el primer toque, Salir vuelve a la portada) (lo verifica el autor)

## 6. Salir sin pantalla completa ni orientación forzada

- [x] 6.1 Añadir `exitFullscreen(host)` en `src/view/ui/fullscreen.ts` (libera la orientación con `screen.orientation.unlock()` y sale de la pantalla completa si la hay; siempre resuelve) y hacer que el `quit` de `WebPlatform` lo espere, como mucho un segundo, antes de volver; verificar con pruebas de `createPlatform` sobre un `host` falso (orden `unlock` → salida de pantalla completa → `back`; sin pantalla completa, solo `unlock` y `back`; una salida que nunca se resuelve no impide volver)
- [x] 6.2 Actualizar `docs/MANUAL.md` §8.4 (qué hace Salir en el navegador antes de volver) y volver a publicar con `npm run publish:site`; verificar con las comprobaciones de entrega, el recorrido de 5.1 (tras Salir, la portada sin pantalla completa) y `diff -r dist <web>/docs/js/xantar` sin diferencias
- [ ] 6.3 Tras el commit y el push de la web, verificar en un Android real con Firefox y la rotación automática apagada que Salir devuelve la portada en vertical (lo verifica el autor)
