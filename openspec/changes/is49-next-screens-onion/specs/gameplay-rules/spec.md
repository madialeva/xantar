## MODIFIED Requirements

### Requirement: Fin de nivel
Cuando todas las hamburguesas del nivel estén completadas, la partida SHALL
pasar a `levelClear` y el número de nivel SHALL incrementarse en uno. Al
terminar `levelClear`, o antes si llega la acción de confirmar, el tablero SHALL
reconstruirse desde la descripción de la pantalla que corresponde al nuevo
nivel (requisito «Orden de las pantallas») conservando puntuación, vidas y
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

#### Scenario: Tablero de otra pantalla
- **WHEN** en Normal termina `levelClear` tras completar la primera pantalla
- **THEN** el tablero nuevo tiene los pisos, los ingredientes, los platos, el
  inicio del chef y los enemigos de la segunda pantalla, fuera del tablero
  hasta que pasan sus retrasos de entrada

## ADDED Requirements

### Requirement: Orden de las pantallas
Cada tablero SHALL jugarse en la pantalla que corresponde a su número de nivel,
siguiendo el orden de las pantallas del juego: en Normal y en Difícil, una
pantalla por nivel, y en Fácil, cada pantalla en dos niveles seguidos. Después
de la última pantalla SHALL volverse a la primera. Perder una vida SHALL NOT
cambiar de pantalla, y una partida nueva SHALL empezar en el nivel 1, en la
primera pantalla.

#### Scenario: Pantalla siguiente en Normal
- **WHEN** en Normal se completa el nivel 1
- **THEN** el nivel 2 se juega en la segunda pantalla

#### Scenario: Vuelta a la primera pantalla
- **WHEN** en Difícil se completa el nivel 4, que se juega en la cuarta y
  última pantalla
- **THEN** el nivel 5 se juega en la primera pantalla

#### Scenario: Cada pantalla dos veces en Fácil
- **WHEN** en Fácil se completan los niveles 1 y 2
- **THEN** los dos se han jugado en la primera pantalla y el nivel 3 se juega
  en la segunda

#### Scenario: Vuelta en Fácil
- **WHEN** en Fácil se completa el nivel 8, que se juega en la cuarta pantalla
- **THEN** el nivel 9 se juega en la primera pantalla

#### Scenario: Perder una vida
- **WHEN** el chef pierde una vida en la tercera pantalla y le quedan vidas
- **THEN** la partida sigue en la tercera pantalla, con el mismo nivel

#### Scenario: Partida nueva
- **WHEN** se empieza una partida nueva después de llegar a la tercera pantalla
- **THEN** el nivel es 1 y el tablero es el de la primera pantalla
