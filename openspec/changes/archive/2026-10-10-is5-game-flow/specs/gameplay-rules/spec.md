# Spec Delta

## MODIFIED Requirements

### Requirement: Contacto con enemigos y vidas
La partida SHALL comenzar con 3 vidas. Si un enemigo activo y no aturdido está a
menos de 16/32 tiles horizontales y 18/32 tiles verticales del chef, el chef SHALL
perder una vida y la partida SHALL pasar a la fase `dying`, en la que nada se
mueve. Al terminar `dying` con vidas restantes, chef y enemigos SHALL volver a
sus posiciones iniciales, conservando el estado de los ingredientes, y la
partida SHALL pasar a `ready`; si era la última vida, SHALL pasar a `gameOver`.

#### Scenario: Contacto con vidas restantes
- **WHEN** un enemigo no aturdido alcanza al chef con 2 vidas
- **THEN** queda 1 vida, la fase pasa a `dying` y, cuando termina, las
  posiciones se reinician y la fase pasa a `ready`

#### Scenario: Última vida
- **WHEN** un enemigo no aturdido alcanza al chef con 1 vida
- **THEN** la fase pasa a `dying` y, cuando termina, a `gameOver`

#### Scenario: Enemigo aturdido
- **WHEN** un enemigo aturdido coincide en posición con el chef
- **THEN** no se pierde ninguna vida

#### Scenario: Ingredientes tras perder una vida
- **WHEN** el chef pierde una vida con segmentos pisados e ingredientes ya
  apilados
- **THEN** tras las fases de muerte y preparado los segmentos siguen pisados y
  los ingredientes siguen apilados

### Requirement: Fin de nivel
Cuando todas las hamburguesas del nivel estén completadas, la partida SHALL
pasar a `levelClear` y el número de nivel SHALL incrementarse en uno. Al
terminar `levelClear`, o antes si llega la acción de confirmar, el tablero SHALL
reconstruirse desde la descripción del nivel conservando puntuación, vidas y
pimientas, y la partida SHALL pasar a `ready`.

#### Scenario: Última hamburguesa
- **WHEN** se completa la última hamburguesa pendiente
- **THEN** la fase es `levelClear` y el nivel aumenta en uno

#### Scenario: Continuar al siguiente nivel
- **WHEN** pasan 3 s en `levelClear` sin ninguna entrada
- **THEN** ingredientes, chef y enemigos vuelven a su posición inicial, se
  conservan puntuación, vidas y pimientas y la fase pasa a `ready`

#### Scenario: Adelantar la continuación
- **WHEN** llega la acción de confirmar durante `levelClear`
- **THEN** el tablero se reconstruye en ese mismo tick y la fase pasa a `ready`
