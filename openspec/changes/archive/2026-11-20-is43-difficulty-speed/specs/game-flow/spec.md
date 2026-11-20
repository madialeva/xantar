## MODIFIED Requirements

### Requirement: Menú principal y opciones
El menú principal SHALL ofrecer Jugar y Opciones y SHALL mostrar la mejor
puntuación guardada. Las opciones SHALL permitir elegir la dificultad (Fácil,
Normal o Difícil), el idioma (español o inglés), el volumen de la música, el
volumen de los efectos y el silencio, aplicar el cambio al momento y
guardarlo, y SHALL dar acceso a la página de Controles. La dificultad elegida
SHALL aplicarse a las partidas que empiecen después de elegirla. Las opciones
SHALL NOT ofrecer elegir un tema. Los menús SHALL manejarse con las acciones
(moverse, confirmar y volver) desde el teclado o el mando, y con clic o toque
sobre cada opción.

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

#### Scenario: Elegir la dificultad
- **WHEN** el jugador abre las opciones, se pone en Dificultad, que está en
  Normal, pulsa a la izquierda, vuelve al menú y elige Jugar
- **THEN** la opción muestra Fácil, se guarda y la partida empieza en Fácil

#### Scenario: Recorrer las dificultades
- **WHEN** el jugador pulsa a la derecha tres veces sobre Dificultad, que está
  en Normal
- **THEN** la opción muestra Difícil, Fácil y Normal, por ese orden

#### Scenario: Sin opción de tema
- **WHEN** el jugador abre las opciones
- **THEN** no aparece ninguna opción de tema
