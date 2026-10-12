# Proposal

## Why

Xantar ya se compila como aplicación web estática con rutas relativas, pero solo
se puede jugar en local. La web personal del autor (https://madialeva.github.io,
repositorio `madialeva/madialeva.github.io`, publicada por GitHub Pages desde
`docs/`) tiene en su portada un botón GAME que abre un juego Phaser de prueba
sin contenido. Es el sitio natural para publicar Xantar y cerrar la issue #14.
Además, en el navegador el menú principal no ofrece forma de volver a la
portada: hoy solo se sale con el botón "atrás" del navegador.

## What Changes

- Nuevo script `npm run publish:site` en Xantar. Compila la versión web y
  sustituye el contenido de `src/js/xantar/` del repositorio de la web personal
  (por defecto `../madialeva.github.io`, configurable), y después ejecuta el
  `deploy.sh` de la web para regenerar `docs/`. Antes de borrar nada, comprueba
  que la carpeta destino pertenece de verdad a ese repositorio.
- En la web personal (cambios en el otro repositorio, hechos desde este change):
  - `deploy.sh` excluye `js/xantar/` del quitacomentarios, igual que ya excluye
    `js/3rd/`, porque estropearía el bundle minificado.
  - El botón GAME de `index.html` abre `js/xantar/index.html`.
  - Se retira el juego de prueba (`game.html`, `js/game/`,
    `js/3rd/phaser-arcade-physics.min.js`, `music/tap-back.mp3`), que queda
    sustituido por Xantar.
  - Se actualizan su `README.md` y su `AGENTS.md`.
- En el navegador, el menú principal muestra **Salir** cuando el juego se abrió
  desde otra página del mismo sitio (la portada). Al elegirlo, el jugador vuelve
  a esa página. Si el juego se abrió directamente (URL escrita, servidor de
  desarrollo), Salir sigue sin aparecer, como hasta ahora. En la aplicación de
  escritorio no cambia nada.
- Usabilidad en el móvil: en Opciones, tocar el volumen de la música o de los
  efectos lo sube un punto y, desde el máximo, vuelve al mínimo, porque con el
  dedo no hay forma de bajarlo. Las flechas (teclado, mando) siguen subiendo y
  bajando sin dar la vuelta.
- Documentación de Xantar: enlace al juego publicado en `README.md` ("Where to
  play"), flujo de publicación en `docs/MANUAL.md` y en la tabla de comandos de
  `AGENTS.md`, y el concepto de despliegue estático en
  `docs/GAMEDEV_FUNDAMENTALS.md`.

## Capabilities

### New Capabilities

- `web-publishing`: publicación de la versión web en la web personal. Cubre la
  ruta pública, el script de publicación y sus salvaguardas, la integración con
  `deploy.sh` y el botón de la portada.

### Modified Capabilities

- `game-flow`: el requisito "Salir del juego en la versión de escritorio" pasa a
  "Salir del juego". En el navegador, Salir se muestra y vuelve a la página de
  origen cuando el juego se abrió desde el mismo sitio.
- `audio`: el requisito "Volumen y silencio configurables" añade que elegir un
  volumen (tocarlo, hacer clic o confirmar) lo sube y da la vuelta al mínimo
  desde el máximo.

## Impact

- Código de Xantar: `src/view/ui/MenuList.ts` y `src/scenes/MenuScene.ts`
  (volumen que da la vuelta al elegirlo), `src/view/platform/Platform.ts` (la plataforma web obtiene
  un `quit` según la página de origen) y su prueba. Nuevo
  `scripts/publish-site.mjs` y su entrada en `package.json`. No hay
  dependencias nuevas.
- Repositorio `madialeva.github.io`: `deploy.sh`, `src/index.html`,
  `src/js/xantar/` (build generado, versionado en ese repositorio), borrado del
  juego de prueba, `README.md` y `AGENTS.md`. El autor hace el commit y el push
  de ese repositorio, junto con su trabajo pendiente.
- Issue #14: se asigna al milestone `v1.0.0` y se cierra con el PR de este
  change. Su alcance de un workflow automático de GitHub Actions queda como
  follow-up.
