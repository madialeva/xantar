# Spec Delta

## MODIFIED Requirements

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
