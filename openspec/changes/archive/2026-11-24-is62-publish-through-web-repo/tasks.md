# Tasks

## 1. Rama y carpeta del cambio

- [x] 1.1 Crear desde la issue #62 la rama `change/is62-publish-through-web-repo` a partir de `develop/v1.0.0` actualizada (`gh issue develop 62 --base develop/v1.0.0 --name change/is62-publish-through-web-repo --checkout`), llevando la carpeta del cambio (sin commit: los commits de este cambio los hace el autor); verificar con `git branch --show-current`, `gh issue view 62` y `openspec list`

## 2. Publicación de la web en el repositorio público (`../web`)

- [x] 2.1 Cambiar `deploy.sh` de la web:
  - destino en `WEB_PUBLIC_DIR` (por defecto `../madialeva.github.io`, relativo al repositorio de la web);
  - antes del `rsync`, comprobar que el destino es la raíz de un repositorio git con `origin` en `madialeva/madialeva.github.io` y que existe `src/index.html`, y si no, terminar con un error que nombre la ruta;
  - `rsync -a --delete` de `src/` a esa raíz con las exclusiones de hoy;
  - el quitacomentarios sobre el destino, sin tocar `js/3rd/` ni `js/xantar/`.
  - Verificar:
    - `./deploy.sh` deja la raíz del repositorio público igual que `src/` (`diff -r`, salvo los `.js` sin comentarios);
    - `.git` del público intacto (`git -C ../madialeva.github.io status` funciona y solo muestra ficheros del sitio);
    - `WEB_PUBLIC_DIR=/tmp/...` y una carpeta sin el `origin` correcto fallan sin escribir nada.
- [x] 2.2 Borrar `docs/` de la web y reescribir su `AGENTS.md` y su `README.md` (en español):
  - los dos repositorios y el flujo de commit en los dos;
  - `./deploy.sh` y `WEB_PUBLIC_DIR`;
  - que el repositorio público es generado entero (salvo los ficheros que empiezan por punto) y que GitHub Pages sirve `main` desde la raíz;
  - `npm run publish:site` de Xantar con `XANTAR_WEB_DIR`;
  - sin `CNAME`.
  - Verificar con `grep -rn "docs/\|CNAME" AGENTS.md README.md` sin restos del flujo antiguo.

## 3. Comando de Xantar

- [x] 3.1 Cambiar `scripts/publish-site.mjs`:
  - `XANTAR_WEB_DIR` (por defecto `../web`) en lugar de `XANTAR_SITE_DIR`, con la misma comprobación de `deploy.sh` y `src/index.html`;
  - errores y pasos finales: revisar con `python3 -m http.server -d ../madialeva.github.io`, commit en los dos repositorios de la web, push de los dos y GitHub Pages en `main` desde la raíz.
  - Verificar:
    - `npm run publish:site` deja `src/js/xantar/` de la web y `js/xantar/` del público iguales byte a byte a `dist/` (`diff -r`);
    - `XANTAR_WEB_DIR=/tmp/...` falla nombrando la ruta sin compilar ni escribir;
    - `npm run lint`.
- [x] 3.2 Documentar en `docs/MANUAL.md` (§9.4 con los dos repositorios, las dos variables y los pasos de commit y push, y la tabla de comandos) y en `AGENTS.md` (tabla de comandos); verificar con `npm run format:check` y las comprobaciones de entrega

## 4. Integración

- [x] 4.1 Servir el repositorio público en local y comprobar en el navegador (o con una captura de Electron): la portada abre, GAME lleva a Xantar en `js/xantar/`, suena la música tras el primer toque y Salir vuelve a la portada; ejecutar `openspec validate is62-publish-through-web-repo --strict`
- [x] 4.2 Primer commit y push de `../web` y `../madialeva.github.io`, GitHub Pages activado en el público sobre `main` desde la raíz y el juego jugable en https://madialeva.github.io/js/xantar/ (lo hace y lo verifica el autor)

## Workflow follow-up

- El autor hace el push de la rama de Xantar; PR hacia `develop/v1.0.0` con `Closes #62`.
- Archivar el cambio tras la confirmación del autor y sincronizar las specs; la publicación automática desde GitHub Actions ya tiene issue (#35).
