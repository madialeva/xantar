## MODIFIED Requirements

### Requirement: Grafo derivado del nivel
Al cargar un nivel, el sistema SHALL derivar un grafo con dos tipos de aristas:
tramos de plataforma, formados por las casillas de plataforma contiguas de una
misma fila (`=` y `+`), y tramos de escalera, que unen dos cruces consecutivos de
una misma columna cuyas casillas intermedias son escalera. Los cruces SHALL
situarse en el centro de la columna. Una escalera con un extremo sin plataforma
SHALL NOT generar tramo de escalera.

#### Scenario: Nivel clásico
- **WHEN** se deriva el grafo del nivel clásico
- **THEN** contiene diez tramos de plataforma y veintinueve tramos de escalera

#### Scenario: Plataforma interrumpida
- **WHEN** una fila tiene dos grupos de casillas de plataforma separados por un
  hueco
- **THEN** son dos tramos de plataforma distintos

#### Scenario: Escalera colgante
- **WHEN** una escalera termina sin casilla de plataforma en un extremo
- **THEN** no se crea ningún tramo de escalera para ese extremo

### Requirement: Posición sobre el grafo
La posición de un chef o un enemigo SHALL expresarse como una arista y un
desplazamiento a lo largo de ella; su posición en casillas SHALL ser una función
determinista de ambos. Sobre un tramo de plataforma el desplazamiento SHALL
limitarse a 12 unidades de cada extremo. Sobre un tramo de escalera el
desplazamiento SHALL limitarse a la longitud del tramo; al alcanzar un extremo, la
entidad SHALL quedar sobre el tramo de plataforma de ese extremo, centrada en la
columna de la escalera.

#### Scenario: Posición de una plataforma
- **WHEN** una entidad está a un desplazamiento de 3,5 casillas sobre el tramo de
  plataforma de la fila 5 que empieza en la columna 0
- **THEN** su posición en casillas es x = 3,5 e y = 5

#### Scenario: Llegar al extremo de una escalera
- **WHEN** una entidad sube hasta el extremo superior de una escalera
- **THEN** queda sobre el tramo de plataforma superior en la columna de la
  escalera

#### Scenario: Límite del tramo
- **WHEN** una entidad intenta avanzar más allá de 12 unidades del extremo de
  su tramo de plataforma
- **THEN** su desplazamiento se detiene en ese límite

### Requirement: Alcanzabilidad
El sistema SHALL poder calcular el conjunto de tramos del grafo alcanzables desde
una posición.

#### Scenario: Plataformas conectadas
- **WHEN** se calcula la alcanzabilidad desde el inicio del chef en el nivel
  clásico
- **THEN** son alcanzables los diez tramos de plataforma
