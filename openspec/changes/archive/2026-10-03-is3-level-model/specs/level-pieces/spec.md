# Spec Delta

## Purpose

Define el registro de piezas de nivel: el vocabulario con el que se construye un
nivel (plataformas, escaleras, platos, ingredientes, inicio del chef y
enemigos), separado de su aspecto, y que puede ampliarse con piezas nuevas sin
modificar las reglas del núcleo. Es la base de la paleta del futuro editor.

## ADDED Requirements

### Requirement: Registro de piezas
Cada pieza SHALL definirse por un identificador único, un símbolo de un carácter
único dentro de su capa, la capa a la que pertenece (`structure`, `ingredients`
o `actors`), su ancho en casillas (un número fijo o el tamaño de unidad del
nivel) y la forma en que aporta al nivel. El registro
SHALL resolver un símbolo de una capa a su pieza. Una pieza SHALL NOT contener
colores, texturas ni referencias a la capa gráfica.

#### Scenario: Resolver un símbolo
- **WHEN** se pide al registro el símbolo `=` de la capa `structure`
- **THEN** devuelve la pieza plataforma

#### Scenario: Símbolo repetido en la misma capa
- **WHEN** se registra una pieza con un símbolo ya usado en su capa
- **THEN** el registro rechaza la pieza con un error descriptivo

#### Scenario: Mismo símbolo en capas distintas
- **WHEN** se registran dos piezas con el mismo símbolo en capas distintas
- **THEN** el registro las acepta y resuelve cada una por su capa

### Requirement: Piezas de la versión 1
El registro por defecto SHALL contener, en la capa `structure`: `.` vacío, `=`
plataforma, `H` escalera, `+` cruce (plataforma con escalera) y `_` plato (ancho
igual al tamaño de unidad del nivel); en la capa `ingredients`: `T` pan superior,
`L` lechuga, `P` carne y `B` pan inferior (ancho igual al tamaño de unidad del
nivel, cuatro por defecto); y en la capa `actors`: `C`
inicio del chef y `h`, `p`, `e` aparición de perrito, pepinillo y huevo (ancho de
una casilla).

#### Scenario: Cargar todas las piezas
- **WHEN** se carga un nivel que usa todos los símbolos de la versión 1
- **THEN** cada símbolo se interpreta como su pieza y el nivel se construye sin
  errores

### Requirement: Piezas de varias casillas
Una racha de casillas contiguas de la misma pieza en una fila SHALL dividirse en
unidades consecutivas del ancho de la pieza (para ingredientes y platos, el
tamaño de unidad del nivel), de izquierda a derecha. Una unidad
SHALL NOT ocupar más de una fila. Una racha cuya longitud no es múltiplo del
ancho de la pieza SHALL rechazarse indicando su posición.

#### Scenario: Dos unidades contiguas
- **WHEN** una fila de la capa `ingredients` tiene ocho casillas contiguas `T`
- **THEN** se crean dos ingredientes de pan superior de cuatro segmentos cada uno

#### Scenario: Unidades de tres casillas
- **WHEN** el nivel declara unidades de tres casillas y una fila de la capa
  `ingredients` tiene seis casillas contiguas `T`
- **THEN** se crean dos ingredientes de pan superior de tres segmentos cada uno

#### Scenario: Racha de longitud incorrecta
- **WHEN** una fila tiene seis casillas contiguas `T`
- **THEN** la carga falla indicando la fila y la columna de la racha

### Requirement: Piezas ampliables
Registrar una pieza nueva SHALL hacerla disponible para cargar niveles que la
usen, sin modificar la lógica de reglas de la simulación. Una pieza no registrada
SHALL rechazarse al cargar.

#### Scenario: Pieza nueva
- **WHEN** se registra una pieza de prueba en la capa `actors` y se carga un
  nivel que la usa
- **THEN** el nivel se carga y la pieza aporta lo que declara

#### Scenario: Pieza no registrada
- **WHEN** se carga un nivel que usa un símbolo no registrado
- **THEN** la carga falla indicando el símbolo y su posición
