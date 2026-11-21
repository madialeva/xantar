## ADDED Requirements

### Requirement: Escaleras dentro de los pisos y altura libre
La validación SHALL señalar como aviso, con el código `ladder-at-floor-end`,
cada escalera que toca un piso en la primera o la última casilla de su tramo,
donde los enemigos no llegan a ella, y, con el código `floor-headroom`, cada
tramo de casillas de piso o de pasarela que tiene justo encima, en la fila
anterior, una plataforma, una pasarela o un plato, que la cabeza de quien anda
por debajo atravesaría.

#### Scenario: Escalera en el extremo de un piso
- **WHEN** se valida un nivel con un piso cuya última casilla es un cruce con
  una escalera
- **THEN** se informa un aviso `ladder-at-floor-end` en esa fila y columna

#### Scenario: Escalera una casilla hacia dentro
- **WHEN** los dos pisos que une una escalera siguen al menos una casilla más
  allá de ella por cada lado
- **THEN** no se informa ningún aviso `ladder-at-floor-end` por esa escalera

#### Scenario: Piso pegado a otro
- **WHEN** un piso pasa justo por debajo de otro, en la fila siguiente
- **THEN** se informa un aviso `floor-headroom` en la primera casilla del tramo
  de debajo que lo tiene encima

#### Scenario: Pisos a un tramo
- **WHEN** dos pisos están separados por dos filas
- **THEN** no se informa ningún aviso `floor-headroom`
