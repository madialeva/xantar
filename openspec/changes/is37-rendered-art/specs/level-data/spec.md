## MODIFIED Requirements

### Requirement: Descripción de nivel como datos
Un nivel SHALL describirse mediante un documento JSON versionado, serializable y
sin funciones ni referencias a Phaser, que contenga: el identificador de formato
`xantar-level`, el número de versión, un nombre, el número de columnas y de
filas, el tamaño de unidad del nivel (`segments`, opcional) y tres capas de
cuadrícula (`structure`, `ingredients` y `actors`), cada una como una lista de
`filas` cadenas de `columnas` caracteres. Los caracteres SHALL interpretarse con
el registro de piezas. La simulación SHALL obtener toda la geometría y
colocaciones del nivel exclusivamente de este documento. Los tramos de
plataforma contiguos de una misma fila SHALL tratarse como un único tramo
continuo.

#### Scenario: Cambiar el nivel sin tocar las reglas
- **WHEN** se inicia la simulación con un documento de nivel distinto pero
  válido
- **THEN** chef, enemigos, ingredientes y plataformas aparecen según ese
  documento sin modificar código de reglas

#### Scenario: Descripción serializable
- **WHEN** un documento de nivel se convierte a JSON y se vuelve a leer
- **THEN** la simulación iniciada con el resultado se comporta igual que con
  el original

## REMOVED Requirements

### Requirement: Tema visual del nivel
**Reason**: Se retira el concepto de tema; el juego tiene un único aspecto.
**Migration**: Un documento que aún traiga el campo `theme` se sigue leyendo y
el campo se ignora; la exportación ya no lo escribe. La versión del formato no
cambia.
