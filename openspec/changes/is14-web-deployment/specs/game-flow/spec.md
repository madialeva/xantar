# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Salir del juego en la versión de escritorio`
- TO: `### Requirement: Salir del juego`

## MODIFIED Requirements

### Requirement: Salir del juego
El menú principal SHALL ofrecer Salir como última opción cuando el juego tiene
adónde salir. En la aplicación de escritorio, Salir SHALL mostrarse siempre y
SHALL cerrar la aplicación. En el navegador, Salir SHALL mostrarse solo si el
juego se abrió desde otra página del mismo origen (por ejemplo, la portada de la
web personal), y elegirlo SHALL devolver al jugador a esa página fuera de
pantalla completa y sin la orientación forzada por el juego, de modo que la
página se vea en la orientación propia del dispositivo. Si el juego se
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

#### Scenario: Salir en un móvil con la rotación fija en vertical
- **WHEN** el jugador, en un móvil Android con la rotación automática apagada,
  juega en pantalla completa (girado a horizontal) y elige Salir
- **THEN** la portada se muestra en vertical

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
