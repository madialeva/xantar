# Spec Delta

## MODIFIED Requirements

### Requirement: Estado de partida
La simulación SHALL mantener una fase de partida con los valores `ready`,
`playing`, `dying`, `levelClear` y `gameOver`, y SHALL informar de cada cambio
de fase con un evento que indique la fase anterior y la nueva. Solo en `playing`
los ticks SHALL modificar chef, enemigos e ingredientes; en el resto de fases
los ticks SHALL limitarse a contar el tiempo de la fase. Las fases `ready`
(1,5 s), `dying` (2 s) y `levelClear` (3 s) SHALL durar un número fijo de ticks
y pasar solas a la siguiente; `gameOver` SHALL mantenerse hasta que la vista
solicite una partida nueva. La partida SHALL empezar en `ready`.

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

### Requirement: Entrada abstracta
La simulación SHALL recibir en cada tick una entrada abstracta formada por las
acciones izquierda, derecha, arriba, abajo, lanzar pimienta y confirmar, sin
referencia a teclas ni dispositivos. Lanzar pimienta y confirmar SHALL tratarse
como pulsaciones puntuales (una acción por pulsación) y no como estados
sostenidos.

#### Scenario: Pimienta mantenida
- **WHEN** la entrada de pimienta se presenta en un único tick y luego se
  retira
- **THEN** se consume como máximo una pimienta

#### Scenario: Confirmar fuera de una fase que lo admita
- **WHEN** se presenta la acción de confirmar durante `playing`
- **THEN** la partida no cambia
