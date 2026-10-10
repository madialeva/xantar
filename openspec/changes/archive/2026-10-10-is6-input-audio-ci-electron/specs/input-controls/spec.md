# Spec Delta

## Purpose

Controlar el juego con acciones independientes del dispositivo (teclado
reasignable, mando y controles táctiles), de modo que la partida y los menús
funcionen igual con cualquiera de ellos y nunca dependan de una tecla concreta.

## ADDED Requirements

### Requirement: Acciones en lugar de teclas
La partida y los menús SHALL reaccionar a acciones (arriba, abajo, izquierda,
derecha, pimienta, confirmar, volver, pausa y silencio) y SHALL NOT depender de
teclas o botones concretos. El teclado, el mando y los controles táctiles SHALL
poder usarse a la vez; una acción está activa si cualquiera de ellos la activa.
La entrada que recibe la simulación SHALL seguir siendo la misma (direcciones,
pimienta y confirmar).

#### Scenario: Teclado y mando a la vez
- **WHEN** el jugador mantiene la flecha derecha del teclado y pulsa A en el
  mando
- **THEN** el chef camina a la derecha y lanza una pimienta

#### Scenario: Una pulsación, una pimienta
- **WHEN** el jugador mantiene pulsado el botón de pimienta durante un segundo
- **THEN** se lanza como máximo una pimienta

### Requirement: Controles de teclado por defecto
Sin asignaciones guardadas, el teclado SHALL usar: flechas o WASD para moverse,
Espacio para la pimienta, P para pausar y M para silenciar. Además, de forma
fija y no reasignable: Esc vuelve en los menús y pausa o reanuda la partida;
Enter confirma; y las teclas de la pimienta también confirman. Los menús se
manejan con las mismas teclas de dirección que la partida.

#### Scenario: Menús con teclas reasignadas
- **WHEN** el jugador ha asignado I y K a arriba y abajo y abre el menú
  principal
- **THEN** I y K mueven la selección y Enter elige

#### Scenario: Primera partida con teclado
- **WHEN** el jugador, sin ajustes guardados, pulsa D y luego Espacio en la
  partida
- **THEN** el chef camina a la derecha y lanza una pimienta

### Requirement: Reasignación de teclas
Las opciones SHALL ofrecer una página de Controles que muestre, para cada
acción reasignable (arriba, abajo, izquierda, derecha, pimienta, pausa y
silencio), hasta dos teclas, y que permita cambiar cualquiera de ellas
pulsando la tecla nueva. Esc SHALL cancelar el cambio. Las teclas reservadas
(Esc, Enter y F11) SHALL NOT poder asignarse. Si la tecla nueva ya estaba
asignada a otra acción, ambas acciones SHALL intercambiarse esa tecla, de modo
que ninguna acción se quede sin tecla. Una opción SHALL restaurar las
asignaciones por defecto. Las teclas SHALL mostrarse con el nombre que tienen
en la distribución de teclado del jugador cuando el navegador lo permita. Los
cambios SHALL aplicarse al momento y guardarse.

#### Scenario: Cambiar la tecla de la pimienta
- **WHEN** el jugador asigna X a la pimienta en Controles y empieza una partida
- **THEN** X lanza la pimienta, también tras cerrar y volver a abrir el juego

#### Scenario: Tecla ya usada
- **WHEN** el jugador asigna W, que ya movía hacia arriba, a la pimienta en
  lugar de Espacio
- **THEN** W lanza la pimienta y Espacio pasa a mover hacia arriba

#### Scenario: Tecla reservada
- **WHEN** el jugador intenta asignar Enter a una acción
- **THEN** la asignación no cambia y la página sigue esperando una tecla válida

#### Scenario: Restaurar
- **WHEN** el jugador elige Restaurar en Controles
- **THEN** todas las acciones vuelven a sus teclas por defecto

### Requirement: Mando
Un mando con mapeo estándar SHALL poder jugar y manejar los menús sin teclado:
la cruceta o el stick izquierdo para moverse y para mover la selección, A para
la pimienta y para confirmar, X también para la pimienta, B para volver y
Start para pausar o reanudar. Mantener una dirección en un menú SHALL repetir el
movimiento tras una pausa inicial. El stick SHALL tener una zona muerta para
que un mando en reposo no mueva al chef. El mapeo del mando SHALL ser fijo.

#### Scenario: Jugar solo con el mando
- **WHEN** el jugador, en el menú principal, pulsa A sobre Jugar y luego mueve
  el stick a la izquierda
- **THEN** empieza la partida y el chef camina a la izquierda

#### Scenario: Stick en reposo
- **WHEN** el stick izquierdo de un mando conectado tiene una pequeña deriva
  sin que nadie lo toque
- **THEN** el chef no se mueve

### Requirement: Controles táctiles
En cuanto el jugador use la pantalla táctil, la partida SHALL mostrar una
cruceta virtual de cuatro direcciones en el panel izquierdo y un botón de
pimienta en el panel derecho. Los controles SHALL admitir varios dedos a la vez
(moverse y lanzar pimienta simultáneamente). Deslizar el dedo dentro de la
cruceta SHALL cambiar de dirección sin levantarlo. Si no se ha usado la
pantalla táctil, los controles SHALL NOT mostrarse.

#### Scenario: Moverse y lanzar pimienta en un móvil
- **WHEN** el jugador mantiene la cruceta hacia la derecha y toca el botón de
  pimienta con otro dedo
- **THEN** el chef sigue caminando a la derecha y lanza una pimienta

#### Scenario: Ordenador sin pantalla táctil
- **WHEN** se juega con teclado y ratón
- **THEN** no aparecen la cruceta ni el botón de pimienta

### Requirement: Siempre en horizontal en pantallas táctiles
En un dispositivo táctil sujeto en vertical, el juego SHALL mostrarse girado un
cuarto de vuelta, ocupando la pantalla con su disposición horizontal, de modo
que se juegue en horizontal sin depender de que el dispositivo tenga activada la
rotación de pantalla y sin pedir al jugador que lo gire. Los toques SHALL
corresponder a lo que se ve en el juego girado. Cambiar la orientación del
dispositivo SHALL NOT interrumpir ni pausar la partida.

#### Scenario: Móvil en vertical con la rotación bloqueada
- **WHEN** el jugador abre el juego con el móvil en vertical y la rotación de
  pantalla desactivada
- **THEN** el título y el menú aparecen en horizontal ocupando la pantalla y,
  al tocar Jugar, empieza la partida

#### Scenario: Controles táctiles con el juego girado
- **WHEN** con el juego girado el jugador mantiene la cruceta hacia la derecha
  y toca el botón de pimienta
- **THEN** el chef camina a la derecha y lanza una pimienta

#### Scenario: Girar el móvil durante la partida
- **WHEN** el jugador pasa el móvil de vertical a horizontal en mitad de la
  partida
- **THEN** la partida sigue sin pausarse, ahora sin girar

### Requirement: Sin acciones atascadas
Si la ventana pierde el foco o un mando se desconecta, todas las acciones que
estaban activas por ese motivo SHALL liberarse, de modo que al volver ninguna
dirección ni botón siga pulsado sin que el jugador lo esté pulsando.

#### Scenario: Soltar la tecla fuera de la ventana
- **WHEN** el jugador mantiene la flecha derecha, cambia de ventana, la suelta
  allí y vuelve al juego
- **THEN** el chef no sigue caminando a la derecha al reanudar
