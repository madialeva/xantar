# desktop-shell Specification

## Purpose
Que la aplicación de escritorio ejecute el juego con las protecciones que
recomienda Electron (aislamiento, política de contenidos, navegación y permisos
restringidos) y se comporte como una aplicación nativa (instancia única,
pantalla completa, iconos), con una política de firma explícita.

## Requirements

### Requirement: Contenido servido por un protocolo propio
La aplicación de escritorio SHALL cargar el juego desde un protocolo propio de
la aplicación en lugar de `file://`, de modo que imágenes, audio y datos se
carguen igual que en la web. El protocolo SHALL servir solo ficheros del juego
compilado y SHALL responder "no encontrado" a cualquier ruta fuera de él.

#### Scenario: Ruta fuera del juego
- **WHEN** la página pide una ruta del protocolo que sale de la carpeta del
  juego compilado (por ejemplo, con `..`)
- **THEN** la respuesta es "no encontrado" y no se lee el fichero

#### Scenario: Música en el escritorio
- **WHEN** se abre la aplicación de escritorio y se toca el título
- **THEN** la música de título, cargada por el cargador del juego, suena

### Requirement: Página aislada
La página del juego SHALL ejecutarse con aislamiento de contexto, en sandbox y
sin integración de Node. Lo único expuesto a la página SHALL ser un puente
mínimo para saber que es la aplicación de escritorio, cerrarla y cambiar la
pantalla completa.

#### Scenario: Sin acceso a Node
- **WHEN** la página intenta usar `require` o `process`
- **THEN** no existen

### Requirement: Política de seguridad de contenidos
El juego compilado, en la web y en el escritorio, SHALL declarar una política de
seguridad de contenidos que solo permita scripts, estilos y datos del propio
origen (más `data:` y `blob:` donde el juego los genera) y que no permita
objetos incrustados. El juego SHALL funcionar sin provocar ninguna violación de
esa política.

#### Scenario: Script externo
- **WHEN** algo intenta cargar en la página un script de otro origen
- **THEN** el navegador lo bloquea

### Requirement: Navegación, ventanas y permisos restringidos
La aplicación de escritorio SHALL impedir que la página navegue fuera del
juego, SHALL NOT abrir ventanas nuevas y SHALL denegar las solicitudes de
permisos de la página.

#### Scenario: Enlace externo
- **WHEN** la página intenta navegar a una dirección web externa o abrir una
  ventana
- **THEN** la navegación se cancela y no se abre ninguna ventana

### Requirement: Instancia única
Solo SHALL poder ejecutarse una instancia de la aplicación de escritorio. Abrirla
de nuevo SHALL traer al frente la ventana existente.

#### Scenario: Doble apertura
- **WHEN** el jugador abre la aplicación estando ya abierta
- **THEN** no se abre otra ventana y la existente pasa al frente

### Requirement: Pantalla completa nativa
En la aplicación de escritorio, el primer gesto en el título SHALL poner la
ventana en pantalla completa nativa, y F11 SHALL alternar la pantalla completa
en cualquier momento. Esc SHALL quedar libre para el juego (pausar y volver) y
SHALL NOT salir de la pantalla completa.

#### Scenario: F11
- **WHEN** el jugador pulsa F11 con la ventana en pantalla completa
- **THEN** la ventana vuelve a su tamaño normal y el juego sigue

#### Scenario: Esc en pantalla completa
- **WHEN** el jugador pulsa Esc durante la partida en pantalla completa
- **THEN** la partida se pausa y la ventana sigue en pantalla completa

### Requirement: Iconos y endurecimiento del ejecutable
Los instaladores y la aplicación SHALL usar el icono propio del juego en los
tres sistemas. El ejecutable empaquetado SHALL NOT poder usarse como intérprete
de Node ni aceptar opciones de depuración o de Node por línea de órdenes o
variables de entorno, y SHALL cargar la aplicación solo desde su paquete.

#### Scenario: Icono en el sistema
- **WHEN** se instala la aplicación en Windows, macOS o Linux
- **THEN** el lanzador y la ventana muestran el icono de Xantar

### Requirement: Distribución sin firma en la v1.0.0
Los instaladores de la v1.0.0 SHALL generarse sin firma de código ni
notarización, y la documentación para jugadores SHALL explicar los avisos del
sistema operativo al instalarlos y cómo continuar.

#### Scenario: Aviso de Windows
- **WHEN** un jugador abre el instalador de Windows y aparece el aviso de
  SmartScreen
- **THEN** el README le indica cómo continuar la instalación
