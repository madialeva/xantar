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
La pantalla de título SHALL esperar al primer clic, toque o tecla del jugador
para solicitar la pantalla completa y arrancar la música de título, y después
SHALL pasar al menú principal. Si la pantalla completa no está disponible o se
rechaza, el juego SHALL continuar igualmente.

#### Scenario: Pantalla completa rechazada
- **WHEN** el navegador rechaza la pantalla completa
- **THEN** el juego pasa igualmente al menú principal

### Requirement: Menú principal y opciones
El menú principal SHALL ofrecer Jugar y Opciones y SHALL mostrar la mejor
puntuación guardada. Las opciones SHALL permitir elegir el idioma (español o
inglés) y el tema ("Automático" o cualquier tema registrado), aplicar el cambio
al momento y guardarlo. Los menús SHALL manejarse con teclado (flechas o WASD
para moverse, Enter o Espacio para elegir, Esc para volver) y con clic o toque
sobre cada opción.

#### Scenario: Cambiar el idioma
- **WHEN** el jugador elige English en las opciones
- **THEN** los textos de las opciones, del menú y de la partida aparecen en
  inglés, también tras cerrar y volver a abrir el juego

#### Scenario: Elegir con el ratón
- **WHEN** el jugador hace clic sobre Jugar en el menú principal
- **THEN** empieza la partida

### Requirement: Salir del juego en la versión de escritorio
En la aplicación de escritorio, el menú principal SHALL ofrecer Salir como
última opción, que cierra la aplicación. En el navegador, Salir SHALL NOT
mostrarse, porque una página no puede cerrar su pestaña. En el menú principal,
Esc SHALL llevar la selección a Salir sin cerrar la aplicación; cerrarla SHALL
requerir elegir Salir.

#### Scenario: Salir en el escritorio
- **WHEN** el jugador elige Salir en el menú principal de la aplicación de
  escritorio
- **THEN** la aplicación se cierra

#### Scenario: Esc en el menú principal
- **WHEN** el jugador pulsa Esc en el menú principal de la aplicación de
  escritorio
- **THEN** la selección pasa a Salir y la aplicación sigue abierta

#### Scenario: Navegador
- **WHEN** se abre el menú principal en el navegador
- **THEN** no aparece la opción Salir

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
Durante la partida, Esc o P, el botón de pausa del panel derecho o que la
ventana pierda el foco SHALL pausar la partida. En pausa, la simulación SHALL NOT
avanzar, las animaciones y efectos SHALL quedar detenidos y SHALL mostrarse un
menú con Continuar y Salir al menú. Al continuar, la partida SHALL reanudarse
exactamente donde estaba, sin recuperar de golpe el tiempo pasado en pausa. Esc
o P SHALL también reanudar.

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

### Requirement: Fin de partida
Al llegar la partida a `gameOver`, el juego SHALL mostrar la puntuación final y,
si supera la mejor guardada, un aviso de nuevo récord. Confirmar (Enter, Espacio,
clic o toque) SHALL volver al menú principal.

#### Scenario: Nuevo récord
- **WHEN** una partida termina con 12 500 puntos y el récord guardado era 8 000
- **THEN** la pantalla de fin de partida avisa del nuevo récord y el menú
  principal muestra 12 500 como mejor puntuación
