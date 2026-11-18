## MODIFIED Requirements

### Requirement: Piezas de la versión 1
El registro por defecto SHALL contener, en la capa `structure`: `.` vacío, `=`
plataforma, `H` escalera, `+` cruce (plataforma con escalera), `_` plato (ancho
igual al tamaño de unidad del nivel) y `-` pasarela de entrada (el tramo por el
que entran los enemigos, que no forma parte de los pisos del chef); en la capa
`ingredients`: `T` pan superior, `L` lechuga, `P` carne y `B` pan inferior
(ancho igual al tamaño de unidad del nivel, cuatro por defecto); y en la capa
`actors`: `C` inicio del chef y `h`, `p`, `e` aparición de perrito, pepinillo y
huevo (ancho de una casilla).

#### Scenario: Cargar todas las piezas
- **WHEN** se carga un nivel que usa todos los símbolos de la versión 1
- **THEN** cada símbolo se interpreta como su pieza y el nivel se construye sin
  errores

#### Scenario: Pasarela fuera de los pisos del chef
- **WHEN** se carga un nivel con una pasarela `-` pegada al extremo de una
  plataforma
- **THEN** la pasarela no forma parte de ningún tramo de plataforma del grafo
  de navegación
