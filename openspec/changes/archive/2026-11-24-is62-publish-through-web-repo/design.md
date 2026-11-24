# Design

## Context

Estado de partida (ver `proposal.md` para el porqué):

- **Xantar**: `scripts/publish-site.mjs` resuelve la web con `XANTAR_SITE_DIR`
  (por defecto `../madialeva.github.io`), comprueba que tiene `deploy.sh` y
  `src/index.html`, compila, sustituye `src/js/xantar/` por `dist/` y ejecuta
  `deploy.sh` en esa carpeta.
- **`../web`** (sin commits; su repositorio en GitHub está vacío): `src/` con
  la portada, sus estilos, sus scripts y un build antiguo de Xantar en
  `src/js/xantar/`; un `deploy.sh` que hace `rsync --delete` de `src/` a
  `docs/` y quita los comentarios de los `.js` salvo en `js/3rd/` y
  `js/xantar/`; una carpeta `docs/` que ya no sirve; y `AGENTS.md` y
  `README.md` de la web antigua, que hablan de un `CNAME` que no existe.
- **`../madialeva.github.io`** (sin commits; recreado vacío en GitHub): en su
  raíz, sin seguimiento, lo que antes era `docs/`.

## Goals / Non-Goals

**Goals:**

- Un solo comando en Xantar sigue dejando el juego publicado en los dos
  repositorios de la web, listos para hacer commit.
- La web se puede publicar sola desde su repositorio, sin pasar por Xantar.
- Ningún paso puede escribir en una carpeta equivocada ni tocar el `.git` del
  repositorio público.

**Non-Goals:**

- Publicar desde GitHub Actions (#35).
- Hacer commit o push en cualquiera de los repositorios: lo hace el autor.
- Cambiar la portada, el botón GAME o la dirección del juego.

## Decisions

### 1. Una cadena de dos pasos, cada uno en su repositorio

Xantar → fuentes de la web → repositorio público:
1. `npm run publish:site` compila, sustituye `src/js/xantar/` de `../web` por
   `dist/` y ejecuta `deploy.sh` de `../web`.
2. `deploy.sh` de la web publica `src/` en el repositorio público.

Cada repositorio conoce solo al siguiente: Xantar no sabe dónde está el
repositorio público, y la web se publica igual tanto si el cambio viene de
Xantar como de su propia portada.

*Alternativa descartada:* que Xantar copie también al repositorio público. Se
saltaría el paso de la web (el quitacomentarios y sus comprobaciones) y habría
dos sitios que saben cómo se publica la web.

### 2. Rutas por defecto y variables

| Paso | Variable | Por defecto | Comprobación antes de tocar nada |
|---|---|---|---|
| Xantar → fuentes | `XANTAR_WEB_DIR` | `../web` | la carpeta tiene `deploy.sh` y `src/index.html` |
| Fuentes → público | `WEB_PUBLIC_DIR` | `../madialeva.github.io`, relativo al repositorio de la web | la raíz de un repositorio git cuyo `origin` es `madialeva/madialeva.github.io` |

`XANTAR_SITE_DIR` desaparece en lugar de mantenerse como alias: apuntaba al
repositorio publicado y ahora la ruta es otra cosa. `npm run publish:site` deja
pasar `WEB_PUBLIC_DIR` a `deploy.sh` a través del entorno.

La comprobación del público usa el `origin` (con `.git` o sin él, por SSH o
HTTPS) porque es lo único que distingue ese repositorio de cualquier otra
carpeta con un `index.html`. Si falla, `deploy.sh` termina con un error que
nombra la ruta antes del `rsync`.

### 3. El repositorio público es generado entero

`deploy.sh` hace `rsync -a --delete` de `src/` a la raíz del repositorio
público, con las mismas exclusiones de hoy (`*.swp`, `*.tmp`, `.*`).
- Sin `--delete-excluded`, `rsync` no borra en el destino lo excluido: el
  `.git` del repositorio público (y cualquier fichero que empiece por punto,
  como un `.nojekyll` si algún día hace falta) queda intacto.
- Todo lo demás del repositorio público es salida de la publicación: un fichero
  que no venga de `src/` se borra. Se documenta en los dos `AGENTS.md` y en el
  `README.md` de la web.

El quitacomentarios trabaja sobre el destino como hasta ahora y sigue excluyendo
`js/3rd/` y `js/xantar/`, así que el juego llega byte a byte igual que `dist/`.

### 4. Limpieza del repositorio de la web

- Se borra `docs/` (copia del sitio antiguo, ya en el repositorio público).
- `AGENTS.md` y `README.md` (en español, como pide su convenio) describen:
  - los dos repositorios;
  - `./deploy.sh` y `WEB_PUBLIC_DIR`;
  - que el repositorio público no se edita a mano;
  - que GitHub Pages sirve `main` desde la raíz;
  - el flujo de commit en los dos repositorios.
- Se quitan las menciones a `CNAME`: la web usa el dominio de GitHub Pages
  (`madialeva.github.io`) y no lo necesita.
- `.gitignore` no cambia (`openspec/`, `tmp/` y los de los editores siguen
  ignorados).

### 5. Mensajes y documentación de Xantar

Al terminar, `publish-site.mjs` imprime los pasos siguientes:
1. revisar en local con `python3 -m http.server -d ../madialeva.github.io`;
2. hacer commit en `../web` (las fuentes) y en `../madialeva.github.io`;
3. hacer push de los dos.

Se actualizan la §9.4 de `docs/MANUAL.md` (y la tabla de comandos) y la tabla
de comandos de `AGENTS.md`. La dirección del juego en `README.md` no cambia.

## Risks / Trade-offs

- **[Un fichero puesto a mano en el repositorio público desaparece en la
  siguiente publicación]** → Está documentado que ese repositorio es generado;
  lo que haga falta allí va en `src/` de la web (o, si empieza por punto, se
  conserva).
- **[GitHub Pages sigue configurado para servir `docs/` o no está activado]** →
  El repositorio público se ha recreado: el autor activa Pages sobre `main`
  desde la raíz antes del primer push que deba verse; se recuerda en los pasos
  que imprime el script y en los `README`.
- **[Alguien con un script propio usaba `XANTAR_SITE_DIR`]** → Solo lo usaba el
  autor; el cambio de nombre se documenta en el manual.

## Migration Plan

1. Rama `change/is62-publish-through-web-repo` desde `develop/v1.0.0`.
2. Cambios en `../web` y en Xantar, sin commits: en este cambio los hace el autor.
3. `npm run publish:site` deja los dos repositorios de la web listos.
4. El autor:
   - revisa en local;
   - hace el primer commit de cada repositorio de la web y el push;
   - activa GitHub Pages en el público (rama `main`, raíz);
   - comprueba https://madialeva.github.io/js/xantar/.
5. Vuelta atrás: el comando y `deploy.sh` no hacen commit; basta con descartar
   los cambios sin confirmar de los repositorios de la web y revertir los
   commits de Xantar.
