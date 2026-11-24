## MODIFIED Requirements

### Requirement: Publicación con un solo comando
El repositorio de Xantar SHALL ofrecer un comando que compile la versión web,
sustituya por completo la copia del juego en las fuentes de la web personal
(`src/js/xantar/`, sin dejar ficheros de compilaciones anteriores) y ejecute la
publicación de la web, que regenera el repositorio público de la web a partir
de esas fuentes. La ruta del repositorio de las fuentes de la web SHALL tener
un valor por defecto (el repositorio hermano `../web`) y SHALL poder cambiarse;
la del repositorio público, también (el hermano `../madialeva.github.io`). El
comando SHALL NOT hacer commit ni push en ninguno de los dos.

#### Scenario: Publicar
- **WHEN** el autor ejecuta el comando de publicación con los dos repositorios
  de la web en sus rutas por defecto
- **THEN** las fuentes de la web contienen el último build de Xantar en
  `src/js/xantar/` y el repositorio público, en `js/xantar/`, los dos sin
  ficheros de builds anteriores, y los dos repositorios quedan con esos
  cambios sin confirmar

#### Scenario: Build fallido
- **WHEN** la compilación de Xantar falla
- **THEN** el comando termina con error y no modifica ninguno de los dos
  repositorios de la web

#### Scenario: Sitio publicado en la raíz
- **WHEN** termina la publicación
- **THEN** la portada de la web está en la raíz del repositorio público
  (`index.html`) y el juego en `js/xantar/index.html`, sin carpeta `docs/`

### Requirement: Salvaguardas de la publicación
Antes de borrar o escribir nada, el comando de publicación SHALL comprobar que
la ruta destino es el repositorio de las fuentes de la web personal (contiene
su script de publicación y su portada) y SHALL terminar con error, sin tocar
ningún fichero, si no lo es. La publicación de la web SHALL comprobar, antes
de escribir, que su destino es el repositorio público de la web y SHALL
conservar su historial de git. La publicación SHALL NOT transformar los
ficheros del juego publicado: los copia tal cual.

#### Scenario: Ruta equivocada
- **WHEN** el autor ejecuta el comando de publicación apuntando a una carpeta
  que no es la web personal
- **THEN** el comando termina con un error que nombra la ruta y no borra ni
  escribe nada

#### Scenario: Bundle intacto tras el despliegue
- **WHEN** se despliega la web personal
- **THEN** los ficheros de `js/xantar/` del repositorio público son idénticos
  byte a byte a los de `dist/` de Xantar

#### Scenario: Repositorio público equivocado
- **WHEN** la publicación de la web apunta a una carpeta que no es el
  repositorio público de la web
- **THEN** termina con un error que nombra la ruta y no borra ni escribe nada
  en ella

#### Scenario: Historial del repositorio público intacto
- **WHEN** se publica la web en el repositorio público
- **THEN** su carpeta `.git` sigue intacta y solo cambian los ficheros del
  sitio
