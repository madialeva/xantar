# Design

## Context

Motivación en `proposal.md`. Estado actual de las dos partes:

- **Xantar**: `vite.config.ts` usa `base: './'`, así que `dist/` (`index.html`,
  `assets/index-<hash>.js` de ~1,5 MB, `assets/index-<hash>.css` y
  `music/tap-back.mp3`; 3,5 MB en total) funciona desde cualquier subruta. Se ha
  comprobado sirviéndolo bajo `/js/xantar/`. La CSP del build solo admite
  `'self'`, válido en GitHub Pages. `Platform` (Strategy) tiene dos
  implementaciones: `DesktopPlatform` (con `quit`) y `WebPlatform`
  (`quit = null`). `MenuScene` añade Salir y el atajo de Esc solo si
  `platform.quit` existe. `createPlatform(host)` recibe `window` como `object`.
- **Web personal** (`/home/arume/src/madialeva.github.io`, Pages desde `main` →
  `/docs`): `deploy.sh` hace `rsync -av --delete src/ → docs/` (excluye
  ficheros ocultos) y después pasa un quitacomentarios casero a todos los `.js`
  de `docs/` salvo `js/3rd/`. Ese quitacomentarios no reconoce expresiones
  regulares y rompe el código minificado. `src/js/xantar/` ya existe vacía. El
  botón GAME apunta a `game.html`, un esqueleto Phaser (`TapScene`,
  `StartScene`) sin juego. El repositorio tiene trabajo sin confirmar del autor
  (portada `vagalume`, `deploy.sh`, estilos) que se confirmará junto con este
  change.

## Goals / Non-Goals

**Goals:**

- Publicar con un comando, sin pasos manuales propensos a error, y que lo
  publicado sea byte a byte el `dist/` de Xantar.
- Salir en el navegador sin acoplar el juego a la web personal: el juego no
  conoce la URL de la portada.

**Non-Goals:**

- Workflow de GitHub Actions que publique automáticamente desde Xantar (necesita
  un token con escritura en el otro repositorio). Queda como follow-up de #14.
- Dividir el bundle en trozos o reducir su tamaño (aviso de Vite de chunk
  > 500 kB).
- Caché offline (service worker) o instalación como PWA.
- Retocar la portada `vagalume` o `js/starfield.js` (fuera del juego antiguo;
  es trabajo del autor en curso).
- Mostrar la versión del juego en la portada.
- Que el toque en GAME de la portada deje ya el juego en pantalla completa. El
  navegador sale de la pantalla completa al cambiar de página y solo deja
  entrar con un gesto dentro de la propia página, así que la pantalla de título
  se ve con la barra del navegador hasta el primer toque. Evitarlo exigiría
  abrir el juego dentro de la portada (un `iframe` a pantalla completa) o
  instalarlo como PWA.

## Decisions

### Ruta `js/xantar/` en la web personal

Es la ruta que eligió el autor, y la carpeta ya existe. `xantar/` en la raíz
daría una URL más limpia, pero no aporta nada funcional. El juego no depende de
la ruta (rutas relativas), así que moverlo más adelante solo afectaría al
script y al botón.

### Script de publicación en Xantar (`scripts/publish-site.mjs`)

Se ejecuta con `npm run publish:site` y hace esto:

1. Resuelve la web personal: variable `XANTAR_SITE_DIR` o, por defecto,
   `../madialeva.github.io` relativo a la raíz de Xantar.
2. Valida que contiene `deploy.sh` y `src/index.html`. Si no, termina con error
   nombrando la ruta, antes de compilar o borrar nada.
3. Ejecuta `npm run build` (comprobación de tipos y build). Si falla, termina
   sin tocar la web.
4. Vacía `src/js/xantar/` y copia `dist/` dentro (`fs.rm` + `fs.cp`, sin
   `rsync`, para que funcione igual en Windows).
5. Ejecuta `deploy.sh` de la web con su directorio como `cwd`.
6. Muestra los pasos siguientes: revisar en local y hacer commit y push en la
   web.

Alternativas descartadas:

- **Que `deploy.sh` de la web compile Xantar.** Acopla la web al toolchain de
  Xantar en cada despliegue, incluso cuando solo cambia la portada.
- **Copiar a mano.** Deja ficheros con hash de builds anteriores y es fácil
  olvidar `deploy.sh`.
- **Escribir directamente en `docs/js/xantar/`.** El `rsync --delete` del
  siguiente `deploy.sh` lo borraría.

Es un `.mjs` de Node sin dependencias, como los otros scripts de `scripts/`.
Lo cubre el lint existente (`oxlint … scripts`).

### `deploy.sh` copia el juego sin tocarlo

El `find` del quitacomentarios añade `-not -path '*/js/xantar/*'`, igual que
`js/3rd/`, con un comentario que lo explica. Ningún otro paso de `deploy.sh`
transforma ficheros. `rsync` copia `assets/` y `music/` tal cual.

### Salir en el navegador: volver a la página de origen

`WebPlatform` recibe su `quit` en el constructor. `createPlatform(host)` lo
calcula así:

- Una función pura `returnUrl(referrer, current)` devuelve la URL de origen o
  `null`. Devuelve `null` si `document.referrer` está vacío, no es de la misma
  origin (`URL.origin`) o es la propia página del juego (misma ruta, sin tener
  en cuenta query ni hash). Se prueba con cadenas, sin DOM.
- Con URL de origen, `quit` hace `history.back()` si hay historial
  (`history.length > 1`) y, si no, `location.assign(url)`. Esto cubre el juego
  abierto en una pestaña nueva. Volver con `back` no apila una entrada nueva:
  el "atrás" de la portada no devuelve al juego, y la portada se restaura
  desde la caché del navegador.
- Sin URL de origen, `quit` es `null` y todo sigue como hoy. El servidor de
  desarrollo y la prueba de humo no cambian.

Antes de navegar, `quit` libera el bloqueo de orientación
(`screen.orientation.unlock()`) y sale de la pantalla completa
(`document.exitFullscreen()`, esperado como mucho un segundo, como al entrar).
Navegar estando aún en pantalla completa y con la orientación bloqueada en
horizontal hacía que Firefox para Android mostrara la portada en horizontal
aunque la rotación automática estuviera apagada. Al salir de la pantalla
completa se libera también el bloqueo de Esc. `MenuScene` no cambia: ya añade
Salir y el atajo de Esc cuando `platform.quit` existe. Se reutiliza la etiqueta
`menu.quit` (SALIR / QUIT), así que no hay textos nuevos.

Alternativas descartadas:

- **URL de la portada fija en el build (`VITE_EXIT_URL`).** Acopla el build a
  un sitio concreto y no sirve en `npm run preview` ni en otras ubicaciones.
- **Parámetro `?exit=…` en el enlace.** Permite redirecciones abiertas si no se
  valida, y la validación acabaría en la misma comprobación de origin que el
  referrer, con un requisito más para quien enlaza.
- **Siempre `location.assign(referrer)`.** Es más predecible, pero acumula
  entradas en el historial (portada → juego → portada).

`createPlatform` sigue recibiendo `host: object` y lee `document`, `location`
e `history` con tipos estrechos. Así se prueba con objetos falsos, como ya se
hace con el puente de escritorio.

### Retirada del juego antiguo

Se borran de `src/` de la web `game.html`, `js/game/` (`TapScene`,
`StartScene`), `js/3rd/phaser-arcade-physics.min.js` y `music/tap-back.mp3`
(Xantar trae su propia copia en `js/xantar/music/`). `deploy.sh` los quita de
`docs/` con `--delete`. `docs/assets/` (`logo.png`, `red.png`, `space.png`) ya
no existe en `src/`, así que también desaparece en el siguiente despliegue. Es
lo esperado: no lo usa nada.

## Risks / Trade-offs

- [Navegadores o extensiones que ocultan el referrer (`Referrer-Policy:
  no-referrer`)] → Salir no aparece y se vuelve con "atrás", como hoy. GitHub
  Pages no envía esa cabecera y la política por defecto
  (`strict-origin-when-cross-origin`) conserva la URL completa en el mismo
  origin.
- [`history.back()` con un historial manipulado por el usuario (por ejemplo,
  portada → juego → otra web → "atrás" al juego)] → volvería a la entrada
  anterior, que sigue siendo la portada en el flujo normal. Se acepta.
- [El repositorio de la web crece unos 400 kB comprimidos por cada publicación
  (bundle nuevo con hash)] → se acepta. Publicar es manual y poco frecuente.
- [El script borra `src/js/xantar/` de otro repositorio] → solo después de
  validar la ruta. Esa carpeta solo contiene el build y se regenera.
- [El script ejecuta `deploy.sh`, que también procesa el trabajo en curso de la
  portada] → es el flujo normal de la web. El autor revisa el `git status` de
  la web antes de hacer commit.

## Migration Plan

1. Implementar y probar en Xantar (plataforma web y script).
2. Cambios de la web: exclusión en `deploy.sh`, botón y retirada del juego
   antiguo.
3. `npm run publish:site` y revisión local de la web servida desde `docs/`
   (`python3 -m http.server -d docs`): portada → GAME → jugar → Salir → portada.
4. El autor hace commit en la web (junto con su trabajo pendiente) y push a
   `main`. GitHub Pages publica. Verificación en
   `https://madialeva.github.io/`.

Vuelta atrás: revertir el commit de la web. Xantar no depende de la web.
