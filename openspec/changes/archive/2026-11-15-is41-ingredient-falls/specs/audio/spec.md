## MODIFIED Requirements

### Requirement: Sonidos a partir de los eventos de la partida
La partida SHALL producir un efecto de sonido distinto al lanzar pimienta, al
pisar un segmento, al empezar a caer ingredientes, al tocar un ingrediente un
piso o su plato, al aplastar un enemigo o soltar a los enemigos montados (el
mismo efecto), al aturdir a un enemigo, al completar una hamburguesa, al perder
una vida, al empezar la fase de preparado, al completar el nivel y al terminar
la partida. Cuando un mismo efecto se repite muchas veces en muy poco tiempo
(varios segmentos o ingredientes a la vez), SHALL limitarse para no sonar
amontonado. Los menús SHALL sonar al mover la selección, al elegir y al volver.

#### Scenario: Aplastar un enemigo
- **WHEN** un ingrediente aplasta a un enemigo
- **THEN** suena el efecto de aplastar

#### Scenario: Cascada de ingredientes
- **WHEN** en el mismo instante aterrizan tres ingredientes
- **THEN** el efecto de aterrizar suena sin acumular tres copias superpuestas
  a todo volumen

#### Scenario: Soltar a los enemigos montados
- **WHEN** termina su caída un ingrediente con enemigos montados
- **THEN** suena el efecto de aplastar

#### Scenario: Piso intermedio
- **WHEN** un ingrediente con un enemigo montado toca un piso en el que solo se
  detiene un momento
- **THEN** suena el efecto de aterrizar
