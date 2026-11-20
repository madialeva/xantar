## MODIFIED Requirements

### Requirement: Estado de partida
La simulación SHALL mantener una fase de partida con los valores `ready`,
`playing`, `dying`, `levelClear` y `gameOver`, y SHALL informar de cada cambio
de fase con un evento que indique la fase anterior y la nueva. Solo en `playing`
los ticks SHALL modificar chef, enemigos e ingredientes; en el resto de fases
los ticks SHALL limitarse a contar el tiempo de la fase, salvo en `dying` con
el tablero asegurado, en la que siguen las caídas y los enemigos montados
(requisito «Muerte aparente con el tablero asegurado» de `gameplay-rules`). Las
fases `ready` (1,5 s), `dying` (2 s) y `levelClear` (3 s) SHALL durar un número
fijo de ticks y pasar solas a la siguiente, salvo `dying` con el tablero
asegurado, que dura hasta que se completa; `gameOver` SHALL mantenerse hasta
que la vista solicite una partida nueva. La partida SHALL empezar en `ready`.

#### Scenario: Tick con la partida terminada
- **WHEN** la fase es `gameOver` y se ejecuta un tick
- **THEN** ninguna entidad cambia de posición ni de estado

#### Scenario: Preparado al empezar
- **WHEN** se crea la simulación y se ejecutan ticks durante 1,5 s
- **THEN** chef y enemigos no se mueven aunque haya entrada, y al terminar la
  fase pasa a `playing` con un evento de cambio de fase

#### Scenario: Empezar una partida nueva tras el fin de partida
- **WHEN** la vista solicita empezar una partida nueva
- **THEN** puntuación, vidas, pimientas y nivel vuelven a sus valores iniciales
  y la fase pasa a `ready`

#### Scenario: Misma partida, mismas fases
- **WHEN** se ejecuta dos veces la misma secuencia de entradas con la misma
  semilla
- **THEN** los cambios de fase ocurren en los mismos ticks

#### Scenario: Caídas con el chef caído en un tablero asegurado
- **WHEN** la fase es `dying` con el tablero asegurado y un ingrediente cae
- **THEN** el ingrediente sigue bajando en cada tick y la fase pasa a
  `levelClear` en el tick en que se completa el tablero
