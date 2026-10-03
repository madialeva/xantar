# level-validation Specification

## Purpose
Define la validación de jugabilidad de un nivel ya cargado: qué incidencias
detecta, cómo se informan y cuándo impiden jugar. Garantiza que los niveles,
incluidos los creados por usuarios, se pueden completar y da al editor una lista
de problemas que mostrar.

## Requirements

### Requirement: Incidencias estructuradas
La validación SHALL devolver una lista de incidencias sin lanzar errores; cada
incidencia SHALL tener una severidad (`error` o `warning`), un código estable, un
mensaje descriptivo y, cuando proceda, la fila y la columna a las que se refiere.
La validación SHALL informar de todas las incidencias encontradas, no solo de la
primera.

#### Scenario: Nivel sin problemas
- **WHEN** se valida un nivel jugable
- **THEN** la lista de incidencias está vacía

#### Scenario: Varias incidencias
- **WHEN** se valida un nivel con una escalera colgante y un ingrediente
  inalcanzable
- **THEN** la lista contiene ambas incidencias

### Requirement: Reglas de jugabilidad
La validación SHALL señalar como errores: un ingrediente inalcanzable por el
chef desde su posición inicial siguiendo el grafo de navegación; un ingrediente
cuya caída vertical no termina en un plato; una escalera con un extremo sin
plataforma (escalera colgante); y un nivel sin ningún ingrediente. SHALL señalar
como avisos: un plato al que no llega ningún ingrediente; una plataforma
inalcanzable por el chef; y un punto de aparición de enemigos inalcanzable por el
chef.

#### Scenario: Ingrediente inalcanzable
- **WHEN** un ingrediente está sobre una plataforma a la que el chef no puede
  llegar
- **THEN** se informa un error de ingrediente inalcanzable en su posición

#### Scenario: Destino que no es un plato
- **WHEN** la caída vertical de un ingrediente sale del tablero sin encontrar un
  plato
- **THEN** se informa un error de destino sin plato en la posición del
  ingrediente

#### Scenario: Escalera colgante
- **WHEN** un extremo de una escalera no tiene casilla de plataforma
- **THEN** se informa un error de escalera colgante en la posición de ese
  extremo

#### Scenario: Nivel sin ingredientes
- **WHEN** el nivel no contiene ningún ingrediente
- **THEN** se informa un error de nivel sin ingredientes

#### Scenario: Plato vacío
- **WHEN** a un plato no llega ningún ingrediente
- **THEN** se informa un aviso de plato sin ingredientes

#### Scenario: Plataforma o aparición inalcanzable
- **WHEN** una plataforma o un punto de aparición de enemigos no es alcanzable
  por el chef
- **THEN** se informa un aviso en su posición

### Requirement: Política de carga
La carga de un nivel SHALL rechazarlo por defecto si la validación produce al
menos una incidencia de severidad `error`, con un mensaje que lista los errores.
La carga SHALL poder solicitar que se acepten niveles con errores de jugabilidad,
para uso del editor. Los avisos SHALL NOT impedir nunca la carga.

#### Scenario: Carga estricta
- **WHEN** se carga con la política por defecto un nivel con un error de
  jugabilidad
- **THEN** la carga falla y el mensaje lista el error

#### Scenario: Carga permisiva
- **WHEN** se carga el mismo nivel solicitando aceptar errores de jugabilidad
- **THEN** la carga devuelve el nivel y la validación sigue informando el error

#### Scenario: Solo avisos
- **WHEN** se carga con la política por defecto un nivel que solo tiene avisos
- **THEN** la carga tiene éxito
