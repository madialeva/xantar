# Spec Delta

## MODIFIED Requirements

### Requirement: Descripción de nivel como datos
Un nivel SHALL describirse mediante un documento JSON versionado, serializable y
sin funciones ni referencias a Phaser, que contenga: el identificador de formato
`xantar-level`, el número de versión, un nombre, el número de columnas y de
filas, el tamaño de unidad del nivel (`segments`, opcional), el tema visual del
nivel (`theme`, opcional) y tres capas de cuadrícula (`structure`,
`ingredients` y `actors`), cada una como una lista de `filas` cadenas de
`columnas` caracteres. Los caracteres SHALL interpretarse con el registro de
piezas. La simulación SHALL obtener toda la geometría y colocaciones del nivel
exclusivamente de este documento. Los tramos de plataforma contiguos de una
misma fila SHALL tratarse como un único tramo continuo.

#### Scenario: Cambiar el nivel sin tocar las reglas
- **WHEN** se inicia la simulación con un documento de nivel distinto pero
  válido
- **THEN** chef, enemigos, ingredientes y plataformas aparecen según ese
  documento sin modificar código de reglas

#### Scenario: Descripción serializable
- **WHEN** un documento de nivel se convierte a JSON y se vuelve a leer
- **THEN** la simulación iniciada con el resultado se comporta igual que con
  el original

## ADDED Requirements

### Requirement: Tema visual del nivel
Un documento de nivel SHALL poder declarar su tema visual con el campo opcional
`theme`, cuyo valor SHALL ser un identificador de minúsculas, cifras y guiones
que empiece por letra. La simulación SHALL NOT usar este campo: un mismo nivel
con temas distintos SHALL comportarse igual. Un valor que no sea una cadena con
ese formato SHALL rechazarse con un error descriptivo. La carga SHALL NOT
comprobar que el tema exista; esa resolución corresponde a la vista. La
exportación SHALL conservar el campo cuando está presente y SHALL omitirlo
cuando no lo está. Añadir el campo no cambia la versión del formato.

#### Scenario: Nivel con tema
- **WHEN** se lee un documento con `theme` igual a `midnight`
- **THEN** el documento leído conserva el tema `midnight` y al exportarlo el
  texto incluye el campo `theme`

#### Scenario: Nivel sin tema
- **WHEN** se lee un documento sin el campo `theme` y se vuelve a exportar
- **THEN** el texto exportado no contiene el campo `theme`

#### Scenario: Tema mal formado
- **WHEN** se lee un documento con `theme` igual a `Mid Night` o a un número
- **THEN** la lectura falla indicando el campo y el formato esperado

#### Scenario: El tema no altera la partida
- **WHEN** se ejecuta la misma secuencia de entradas con la misma semilla sobre
  el nivel clásico con y sin `theme`
- **THEN** la simulación produce los mismos eventos y el mismo estado final
