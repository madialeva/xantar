# screen-layout Specification

## Purpose
Organizar la pantalla en un tablero central de 20×15 casillas con paneles
laterales para el HUD, aprovechando el ancho de pantallas panorámicas y de
móviles en horizontal sin bandas negras.

## Requirements

### Requirement: Tablero central intacto
El tablero SHALL ocupar siempre 640×480 unidades lógicas (20×15 casillas de 32)
centradas horizontalmente en el área de juego, con la misma altura que esta.
Ningún elemento del HUD SHALL dibujarse sobre el tablero salvo las pantallas de
fin de nivel y fin de partida.

#### Scenario: Fila superior despejada
- **WHEN** el chef o un enemigo está en la fila 0 del tablero
- **THEN** se ve completo, sin texto ni botones del HUD encima

### Requirement: Área de juego adaptable
La altura lógica del área de juego SHALL ser 480 unidades. Su ancho lógico SHALL
adaptarse a la proporción de la ventana entre un mínimo de 832 unidades (dos
paneles de 96) y un máximo de 1152 unidades (proporción 2,4:1). Dentro de ese
intervalo el área de juego SHALL llenar la ventana sin bandas; fuera de él, el
área SHALL ajustarse a la ventana conservando su proporción, con bandas en el
lado sobrante.

#### Scenario: Pantalla 16:9
- **WHEN** la ventana mide 1920×1080
- **THEN** el área de juego mide 853×480 unidades lógicas, llena la ventana y
  cada panel lateral mide unas 106 unidades de ancho

#### Scenario: Móvil en horizontal
- **WHEN** la ventana tiene proporción 19,5:9
- **THEN** el área de juego llena la ventana sin bandas y los paneles son más
  anchos que en 16:9

#### Scenario: Pantalla 4:3
- **WHEN** la ventana mide 1024×768
- **THEN** el área de juego de 832×480 se ajusta al ancho de la ventana y
  quedan bandas arriba y abajo

#### Scenario: Cambio de tamaño de la ventana
- **WHEN** se cambia el tamaño de la ventana o la orientación del dispositivo
  durante la partida
- **THEN** el tablero sigue centrado, los paneles se recolocan y la partida
  continúa sin reiniciarse

### Requirement: HUD en los paneles laterales
El panel izquierdo SHALL mostrar la puntuación, la mejor puntuación guardada y
el nivel. El panel derecho SHALL mostrar las vidas restantes y las pimientas
como iconos acompañados de su número, y el botón de pausa. Cuando se usan los
controles táctiles, la cruceta virtual SHALL ocupar la parte inferior del panel
izquierdo y el botón de pimienta la parte inferior del panel derecho, sin tapar
la información de los paneles. El contenido de cada panel, incluidos los
controles táctiles, SHALL caber en el ancho mínimo de panel y SHALL repartirse
en el ancho disponible cuando el panel es más ancho; los controles táctiles
SHALL crecer con el panel hasta un tamaño máximo.

#### Scenario: Puntuación larga en el panel mínimo
- **WHEN** la puntuación y el récord tienen seis cifras y el panel mide 96
  unidades
- **THEN** ambos se ven completos dentro del panel

#### Scenario: Salir desde el panel
- **WHEN** el jugador pulsa el botón de pausa del panel derecho durante la
  partida y elige Salir al menú
- **THEN** la partida se pausa, se muestra el menú de pausa y, al elegir
  Salir al menú, aparece el menú principal sin recargar la página

#### Scenario: Récord superado en directo
- **WHEN** la puntuación de la partida supera el récord guardado
- **THEN** el récord del panel muestra la puntuación actual mientras siga
  siendo la mayor

#### Scenario: Controles táctiles en un móvil apaisado
- **WHEN** se juega con la pantalla táctil en un móvil 19,5:9 apaisado
- **THEN** la cruceta y el botón de pimienta se ven completos en los paneles,
  por debajo de la puntuación, las vidas y las pimientas, sin tapar el tablero

### Requirement: Resolución del lienzo según el nivel de escala
El lienzo SHALL dibujarse a una resolución igual al tamaño lógico del área de
juego multiplicado por el nivel de escala de dibujo, y la vista SHALL seguir
trabajando en unidades lógicas. Los textos del HUD SHALL generarse a esa misma
resolución.

#### Scenario: Texto nítido
- **WHEN** el juego se muestra a pantalla completa en 1920×1080 con nivel de
  escala 2
- **THEN** los textos del HUD se ven nítidos
