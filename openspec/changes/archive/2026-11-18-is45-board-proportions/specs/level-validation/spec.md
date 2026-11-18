## ADDED Requirements

### Requirement: Escaleras de cocineros enteros
La validación SHALL señalar como aviso, con el código `ladder-odd-span`, cada
tramo de escalera que une dos cruces separados por un número impar de filas,
porque no mide un número entero de alturas del chef. El aviso SHALL indicar la
fila y la columna del extremo superior del tramo.

#### Scenario: Escalera de dos filas
- **WHEN** se valida un nivel con un tramo de escalera entre las filas 5 y 7
- **THEN** no se informa ninguna incidencia por ese tramo

#### Scenario: Escalera de tres filas
- **WHEN** se valida un nivel con un tramo de escalera entre las filas 5 y 8
- **THEN** se informa un aviso `ladder-odd-span` en la fila 5 y la columna de la
  escalera, y el nivel se puede cargar igualmente
