# game-flow Specification

## Purpose
Organizar el juego en pantallas con un recorrido claro (arranque, título, menú,
opciones, partida con su HUD y pausa) y transiciones entre ellas sin recargar la
página, como en un juego completo.

## Requirements

### Requirement: Recorrido de pantallas
El juego SHALL seguir este recorrido: arranque (preparación de gráficos), título,
menú principal y partida. Desde el menú principal SHALL poderse empezar una
partida y abrir las opciones; desde las opciones, volver al menú. Volver al menú
desde la partida SHALL hacerse cambiando de escena, sin recargar la página, y
SHALL dejar la siguiente partida en estado inicial.

#### Scenario: Primer arranque
- **WHEN** se abre el juego
- **THEN** tras la preparación de gráficos se muestra el título y, al primer
  clic, toque o tecla, el menú principal

#### Scenario: Volver al menú y jugar de nuevo
- **WHEN** el jugador sale al menú en mitad de una partida y elige Jugar
- **THEN** empieza una partida con puntuación 0, 3 vidas, 5 pimientas y nivel 1,
  sin que la página se haya recargado

### Requirement: Título
La pantalla de título SHALL esperar al primer clic, toque, tecla o botón del
mando del jugador para solicitar la pantalla completa y arrancar la música de
título, y después SHALL pasar al menú principal. Si la pantalla completa no está
disponible o se rechaza (por ejemplo, porque el navegador no acepta un botón del
mando como gesto), el juego SHALL continuar igualmente.

#### Scenario: Pantalla completa rechazada
- **WHEN** el navegador rechaza la pantalla completa
- **THEN** el juego pasa igualmente al menú principal

#### Scenario: Empezar con el mando
- **WHEN** el jugador pulsa A en el mando en la pantalla de título
- **THEN** el juego pasa al menú principal

### Requirement: Menú principal y opciones
El menú principal SHALL ofrecer Jugar y Opciones y SHALL mostrar la mejor
puntuación guardada. Las opciones SHALL permitir elegir el idioma (español o
inglés), el tema ("Automático" o cualquier tema registrado), el volumen de la
música, el volumen de los efectos y el silencio, aplicar el cambio al momento y
guardarlo, y SHALL dar acceso a la página de Controles. Los menús SHALL
manejarse con las acciones (moverse, confirmar y volver) desde el teclado o el
mando, y con clic o toque sobre cada opción.

#### Scenario: Cambiar el idioma
- **WHEN** el jugador elige English en las opciones
- **THEN** los textos de las opciones, del menú y de la partida aparecen en
  inglés, también tras cerrar y volver a abrir el juego

#### Scenario: Elegir con el ratón
- **WHEN** el jugador hace clic sobre Jugar en el menú principal
- **THEN** empieza la partida

#### Scenario: Opciones con el mando
- **WHEN** el jugador baja con la cruceta del mando hasta Opciones, pulsa A,
  baja hasta Música y pulsa la cruceta a la izquierda
- **THEN** el volumen de la música baja un punto y se guarda

### Requirement: Salir del juego
El menú principal SHALL ofrecer Salir como última opción cuando el juego tiene
adónde salir. En la aplicación de escritorio, Salir SHALL mostrarse siempre y
SHALL cerrar la aplicación. En el navegador, Salir SHALL mostrarse solo si el
juego se abrió desde otra página del mismo origen (por ejemplo, la portada de la
web personal), y elegirlo SHALL devolver al jugador a esa página. Si el juego se
abrió sin página de origen, desde otro origen o desde sí mismo, Salir SHALL NOT
mostrarse, porque una página no puede cerrar su pestaña. En el menú principal,
cuando Salir está disponible, Esc SHALL llevar la selección a Salir sin salir
del juego; salir SHALL requerir elegir Salir.

#### Scenario: Salir en el escritorio
- **WHEN** el jugador elige Salir en el menú principal de la aplicación de
  escritorio
- **THEN** la aplicación se cierra

#### Scenario: Esc en el menú principal
- **WHEN** el jugador pulsa Esc en el menú principal de la aplicación de
  escritorio
- **THEN** la selección pasa a Salir y la aplicación sigue abierta

#### Scenario: Salir hacia la portada
- **WHEN** el jugador abre el juego con el botón de la portada de la web
  personal y elige Salir en el menú principal
- **THEN** el navegador vuelve a la portada, sin pantalla completa

#### Scenario: Esc en el navegador con página de origen
- **WHEN** el jugador, tras abrir el juego desde la portada, pulsa Esc en el
  menú principal
- **THEN** la selección pasa a Salir y el juego sigue abierto

#### Scenario: Navegador
- **WHEN** se abre el menú principal en el navegador con el juego abierto
  directamente (dirección escrita o servidor de desarrollo)
- **THEN** no aparece la opción Salir

#### Scenario: Juego abierto desde otro sitio
- **WHEN** el jugador llega al juego desde un enlace de otro origen
- **THEN** el menú principal no muestra Salir

### Requirement: HUD en una escena paralela
Durante la partida, los paneles laterales, los mensajes de fase, la pantalla de
fin de partida y el menú de pausa SHALL dibujarse en una escena propia que se
ejecuta en paralelo a la del tablero y que se informa del estado de la partida
sin acceder a las reglas.

#### Scenario: HUD visible en pausa
- **WHEN** la partida está en pausa
- **THEN** los paneles siguen visibles y el menú de pausa se dibuja por encima
  del tablero

### Requirement: Pausa
Durante la partida, la acción de pausa (Esc, la tecla asignada a pausa o Start
en el mando), el botón de pausa del panel derecho, que la ventana pierda el
foco o que se desconecte un mando SHALL pausar la partida. En pausa, la
simulación SHALL NOT avanzar, las animaciones y efectos SHALL quedar detenidos y
SHALL mostrarse un menú con Continuar y Salir al menú. Al continuar, la partida SHALL reanudarse exactamente
donde estaba, sin recuperar de golpe el tiempo pasado en pausa. La acción de
pausa SHALL también reanudar.

#### Scenario: Pausar y continuar
- **WHEN** el jugador pausa con Esc durante 10 s y luego elige Continuar
- **THEN** chef, enemigos e ingredientes siguen en el mismo punto y la
  simulación no ejecuta de golpe los ticks de esos 10 s

#### Scenario: Perder el foco
- **WHEN** el jugador cambia de pestaña o de ventana durante la partida
- **THEN** al volver la partida está en pausa con el menú de pausa visible

#### Scenario: Salir desde la pausa
- **WHEN** el jugador elige Salir al menú en el menú de pausa
- **THEN** se muestra el menú principal y la puntuación de esa partida cuenta
  para el récord

#### Scenario: Mando desconectado
- **WHEN** se desconecta el mando durante la partida
- **THEN** la partida se pausa con el menú de pausa visible

### Requirement: Fin de partida
Al llegar la partida a `gameOver`, el juego SHALL mostrar la puntuación final y,
si supera la mejor guardada, un aviso de nuevo récord. Confirmar (la acción de
confirmar desde el teclado o el mando, el botón táctil de pimienta, o un clic o
toque) SHALL volver al menú principal.

#### Scenario: Nuevo récord
- **WHEN** una partida termina con 12 500 puntos y el récord guardado era 8 000
- **THEN** la pantalla de fin de partida avisa del nuevo récord y el menú
  principal muestra 12 500 como mejor puntuación

#### Scenario: Volver con el mando
- **WHEN** el jugador pulsa A en el mando en la pantalla de fin de partida
- **THEN** se muestra el menú principal
