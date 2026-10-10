# Spec Delta

## MODIFIED Requirements

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
