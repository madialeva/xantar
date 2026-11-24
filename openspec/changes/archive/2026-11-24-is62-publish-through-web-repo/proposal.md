# Proposal

## Why

La web personal del autor era un solo repositorio (`madialeva.github.io`): sus
fuentes en `src/` y lo publicado en `docs/`, que generaba su `deploy.sh`.
`npm run publish:site` copiaba el build de Xantar en `src/js/xantar/` de ese
repositorio y ejecutaba su `deploy.sh`. El autor ha separado la web en dos
repositorios (#62):

- **`madialeva/web`** (clonado en `../web`): el código fuente de la web, con
  `src/` y `deploy.sh`.
- **`madialeva/madialeva.github.io`** (clonado en `../madialeva.github.io`): el
  sitio publicado, recreado desde cero con lo que había en `docs/` en su raíz,
  que GitHub Pages servirá directamente.

El comando de Xantar y la publicación de la web tienen que seguir el reparto
nuevo: Xantar lleva su build a las fuentes de la web y, desde ellas, la
publicación de la web lo lleva todo al repositorio público.

## What Changes

- **Xantar.** `npm run publish:site` compila la versión web, sustituye entero
  `src/js/xantar/` en el repositorio de las fuentes de la web (por defecto el
  hermano `../web`, configurable con `XANTAR_WEB_DIR`) y ejecuta la
  publicación de la web. Comprueba antes de tocar nada que la ruta es ese
  repositorio y no hace commit ni push.
- **Fuentes de la web (`../web`).**
  - Su `deploy.sh` publica `src/` en la raíz del repositorio público (por
    defecto el hermano `../madialeva.github.io`, configurable con
    `WEB_PUBLIC_DIR`) en lugar de en `docs/`.
  - Comprueba que el destino es el repositorio público (su `origin` es
    `madialeva/madialeva.github.io`) antes de escribir nada, conserva su `.git`
    y sigue copiando el juego tal cual.
  - Fuera la carpeta `docs/`, que ya no se usa; `AGENTS.md` y `README.md`
    describen el flujo nuevo y dejan de hablar de un `CNAME` que no existe.
- **Repositorio público.** No se edita a mano: lo regenera la publicación de la
  web. GitHub Pages lo sirve desde la raíz de `main`.
- **Lo que no cambia:** el juego sigue en https://madialeva.github.io/js/xantar/
  y el botón GAME de la portada lo abre.
- **BREAKING (herramientas):** `XANTAR_SITE_DIR` pasa a llamarse
  `XANTAR_WEB_DIR` y apunta a las fuentes de la web, no al repositorio
  publicado.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `web-publishing`: "Publicación con un solo comando" (el build va a las
  fuentes de la web y la publicación de la web lo lleva al repositorio
  público) y "Salvaguardas de la publicación" (comprobar los dos repositorios
  y conservar el `.git` del público).

## Impact

- Xantar: `scripts/publish-site.mjs`, `docs/MANUAL.md` (§9.4 y la tabla de
  comandos) y `AGENTS.md` (tabla de comandos).
- Fuentes de la web (`../web`): `deploy.sh`, `AGENTS.md`, `README.md` y la
  carpeta `docs/`, que se borra. Ese repositorio y el público aún no tienen
  commits: el autor hace los primeros cuando lo revise.
- GitHub: la issue #62 (hito `v1.0.0`). En los ajustes del repositorio
  público, GitHub Pages tiene que servir la rama `main` desde la raíz; lo
  configura el autor.
- Sin dependencias nuevas.
