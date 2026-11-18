## MODIFIED Requirements

### Requirement: Paridad jugable con el POC
El juego SHALL mantener la jugabilidad del POC (mismas velocidades,
puntuaciones, vidas, pimientas y comportamiento de enemigos), con las
diferencias de redondeo a ticks documentadas, los cambios deliberados de flujo
(fases de preparado y de muerte, continuación automática del fin de nivel y
vuelta al menú desde el fin de partida) y los cambios deliberados para
parecerse al juego original: la caída de los ingredientes, el aplastamiento
por contacto, los enemigos montados, la rejilla del tablero (casillas de 16),
la geometría del nivel clásico y el tamaño de los personajes, de dos casillas
de alto.

#### Scenario: Partida completa
- **WHEN** un jugador completa un nivel y luego pierde todas las vidas
- **THEN** se suceden el mensaje de nivel completado, el preparado del nivel
  siguiente y la pantalla de fin de partida, y confirmar lleva al menú
  principal, desde donde una partida nueva empieza en estado inicial

#### Scenario: Velocidades del POC
- **WHEN** el chef camina o trepa y los enemigos le persiguen
- **THEN** lo hacen a las mismas velocidades que en el POC, en unidades por
  segundo; solo la caída de los ingredientes sigue la cadencia del original
