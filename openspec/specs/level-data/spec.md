# level-data Specification

## Purpose
Define cómo se describe un nivel como datos que la simulación consume, en lugar
de constantes globales. Establece el contenido mínimo de esa descripción y su
comprobación de integridad. Es un formato transitorio que evolucionará con el
editor de niveles, pero ya desacopla las reglas de un nivel concreto.

## Requirements

### Requirement: Descripción de nivel como datos
Un nivel SHALL describirse mediante un documento JSON versionado, serializable y
sin funciones ni referencias a Phaser, que contenga: el identificador de formato
`xantar-level`, el número de versión, un nombre, el número de columnas y de
filas, el tamaño de unidad del nivel (`segments`, opcional) y tres capas de
cuadrícula (`structure`, `ingredients` y `actors`), cada una como una lista de
`filas` cadenas de `columnas` caracteres. Los caracteres
SHALL interpretarse con el registro de piezas. La simulación SHALL obtener toda
la geometría y colocaciones del nivel exclusivamente de este documento. Los
tramos de plataforma contiguos de una misma fila SHALL tratarse como un único
tramo continuo.

#### Scenario: Cambiar el nivel sin tocar las reglas
- **WHEN** se inicia la simulación con un documento de nivel distinto pero
  válido
- **THEN** chef, enemigos, ingredientes y plataformas aparecen según ese
  documento sin modificar código de reglas

#### Scenario: Descripción serializable
- **WHEN** un documento de nivel se convierte a JSON y se vuelve a leer
- **THEN** la simulación iniciada con el resultado se comporta igual que con
  el original

### Requirement: Nivel clásico migrado
El proyecto SHALL incluir el nivel clásico como un documento de nivel en el
fichero `src/levels/classic.level.json`, con una cuadrícula de 20×15: cuatro
filas de plataforma, cuatro columnas de escalera con sus cruces, cuatro platos de
cuatro casillas, cuatro ingredientes de cuatro segmentos por plato, el inicio del
chef en la fila de plataforma inferior y tres enemigos (perrito, pepinillo y
huevo) en la fila superior.

#### Scenario: Paridad de geometría
- **WHEN** se carga el nivel clásico
- **THEN** la simulación contiene cuatro pilas de cuatro ingredientes
  (panecillo inferior, carne, lechuga, panecillo superior, de abajo arriba),
  cada una sobre su plato; un chef en la fila de plataforma inferior; y tres
  enemigos en la fila superior que también son los puntos de aparición

#### Scenario: Nivel clásico jugable
- **WHEN** se valida el nivel clásico
- **THEN** no se produce ninguna incidencia

### Requirement: Comprobación de integridad al cargar
Al cargar un documento de nivel, el sistema SHALL comprobar su integridad
estructural y rechazarlo con un error descriptivo que indique, cuando proceda,
la capa, la fila y la columna, si: el formato o la versión no están soportados;
alguna capa no tiene exactamente `filas` filas de `columnas` caracteres; algún
carácter no corresponde a una pieza del registro para esa capa; una racha de
casillas de una pieza de varias casillas no tiene una longitud múltiplo de su
ancho (para ingredientes y platos, el tamaño de unidad del nivel); falta la posición inicial del chef o hay más de una; o un segmento de
ingrediente no tiene una casilla de plataforma debajo en la capa `structure`. La
validación de jugabilidad (alcanzabilidad, destinos de caída) es una
comprobación distinta y queda fuera de este requisito.

#### Scenario: Ingrediente fuera del tablero
- **WHEN** una fila de la capa de ingredientes tiene más caracteres que las
  columnas del nivel
- **THEN** la carga falla con un error que indica la capa, la fila y el motivo

#### Scenario: Nivel sin posición de chef
- **WHEN** se carga un nivel sin ninguna marca de inicio del chef
- **THEN** la carga falla con un error descriptivo

#### Scenario: Símbolo desconocido
- **WHEN** una capa contiene un carácter que ninguna pieza del registro usa en
  esa capa
- **THEN** la carga falla con un error que indica el carácter, la capa, la fila
  y la columna

#### Scenario: Racha de ingrediente incompleta
- **WHEN** una fila de la capa de ingredientes contiene una racha de seis
  casillas iguales en un nivel con unidades de cuatro casillas
- **THEN** la carga falla con un error que indica la fila y la columna de la
  racha

#### Scenario: Ingrediente sin plataforma
- **WHEN** un segmento de ingrediente está en una casilla sin plataforma en la
  capa `structure`
- **THEN** la carga falla con un error que indica la fila y la columna

### Requirement: Importación y exportación en JSON
El sistema SHALL ofrecer una función que lea un documento de nivel desde texto
JSON y una que lo escriba, de modo que escribir y volver a leer un documento dé
el mismo nivel. La escritura SHALL ser estable (el mismo documento produce el
mismo texto) y legible (una cadena por fila de cada capa). Un texto que no sea
JSON válido, o un documento con una versión posterior a la soportada, SHALL
rechazarse con un error descriptivo.

#### Scenario: Ida y vuelta
- **WHEN** se escribe el nivel clásico a texto y se vuelve a leer
- **THEN** se obtiene un documento igual y la simulación se comporta igual

#### Scenario: Texto no válido
- **WHEN** se lee un texto que no es JSON
- **THEN** la lectura falla con un error descriptivo

#### Scenario: Versión futura
- **WHEN** se lee un documento cuya versión es posterior a la soportada
- **THEN** la lectura falla indicando la versión encontrada y la soportada

### Requirement: Tamaño de las unidades del nivel
Un documento de nivel SHALL poder declarar el tamaño de sus unidades con el campo
`segments`, cuyos valores permitidos son 2, 3 y 4; si se omite, SHALL valer 4. El
tamaño de unidad SHALL ser el número de segmentos de cada ingrediente y el ancho
en casillas de cada ingrediente y de cada plato del nivel. Un valor no permitido
SHALL rechazarse con un error descriptivo.

#### Scenario: Minihamburguesas
- **WHEN** se carga un nivel con `segments` igual a 3 y rachas de seis casillas
  de ingrediente
- **THEN** se crean dos ingredientes de tres segmentos cada uno

#### Scenario: Tamaño por defecto
- **WHEN** se carga un nivel sin el campo `segments`
- **THEN** sus ingredientes y platos tienen cuatro casillas

#### Scenario: Tamaño no permitido
- **WHEN** se carga un nivel con `segments` igual a 5
- **THEN** la carga falla indicando el valor y los valores permitidos
