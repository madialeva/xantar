## MODIFIED Requirements

### Requirement: Menú principal y opciones
El menú principal SHALL ofrecer Jugar y Opciones y SHALL mostrar la mejor
puntuación guardada. Las opciones SHALL permitir elegir el idioma (español o
inglés), el volumen de la música, el volumen de los efectos y el silencio,
aplicar el cambio al momento y guardarlo, y SHALL dar acceso a la página de
Controles. Las opciones SHALL NOT ofrecer elegir un tema. Los menús SHALL
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

#### Scenario: Sin opción de tema
- **WHEN** el jugador abre las opciones
- **THEN** no aparece ninguna opción de tema
