# Spec Delta

## Purpose

Define cómo se describe un nivel como datos que la simulación consume, en lugar
de constantes globales. Establece el contenido mínimo de esa descripción y su
comprobación de integridad. Es un formato transitorio que evolucionará con el
editor de niveles, pero ya desacopla las reglas de un nivel concreto.

## ADDED Requirements

### Requirement: Descripción de nivel como datos
Un nivel SHALL describirse mediante una estructura de datos serializable, sin
funciones ni referencias a Phaser, que contenga: dimensiones del tablero en
tiles; tramos de plataforma (fila y rango de columnas); escaleras (columna y
filas superior e inferior); platos (fila y rango de columnas); ingredientes
(tipo, fila y rango de columnas); posición inicial del chef; posiciones
iniciales y tipos de los enemigos; y puntos de reaparición de enemigos. La
simulación SHALL obtener toda la geometría y colocaciones del nivel
exclusivamente de esta estructura. Los tramos de plataforma contiguos o
solapados de una misma fila SHALL tratarse como un único tramo continuo.

#### Scenario: Cambiar el nivel sin tocar las reglas
- **WHEN** se inicia la simulación con una descripción de nivel distinta pero
  válida
- **THEN** chef, enemigos, ingredientes y plataformas aparecen según esa
  descripción sin modificar código de reglas

#### Scenario: Descripción serializable
- **WHEN** una descripción de nivel se convierte a JSON y se vuelve a leer
- **THEN** la simulación iniciada con el resultado se comporta igual que con
  la original

### Requirement: Nivel clásico migrado
El proyecto SHALL incluir el nivel actual del POC expresado en este formato, con
la misma geometría: cuatro filas de plataforma, cuatro columnas de escalera y
cuatro columnas de ingredientes apiladas sobre cuatro platos, con las mismas
posiciones iniciales de chef y enemigos.

#### Scenario: Paridad de geometría
- **WHEN** se carga el nivel clásico
- **THEN** la simulación contiene cuatro pilas de cuatro ingredientes
  (panecillo inferior, carne, lechuga, panecillo superior, de abajo arriba),
  cada una sobre su plato; un chef en la fila de plataforma inferior; tres
  enemigos (perrito, pepinillo y huevo) en la fila superior; y puntos de
  reaparición en la fila superior sobre las cuatro columnas de escalera

### Requirement: Comprobación de integridad al cargar
Al cargar un nivel, el sistema SHALL comprobar su integridad estructural y
rechazarlo con un error descriptivo si: alguna entidad queda fuera de los
límites del tablero; un ingrediente o escalera no se apoya sobre un tramo de
plataforma en la fila indicada; o falta la posición inicial del chef. La
validación de jugabilidad completa (alcanzabilidad, destinos de caída) queda
fuera de este requisito.

#### Scenario: Ingrediente fuera del tablero
- **WHEN** se carga un nivel con un ingrediente cuyas columnas exceden el ancho
  del tablero
- **THEN** la carga falla con un error que identifica el ingrediente y el
  motivo

#### Scenario: Nivel sin posición de chef
- **WHEN** se carga un nivel sin posición inicial del chef
- **THEN** la carga falla con un error descriptivo

### Requirement: Agrupación de ingredientes en columnas de caída
Al cargar un nivel, el sistema SHALL agrupar los ingredientes que comparten el
mismo rango de columnas en una columna de caída ordenada por fila, y asociar
cada columna con el plato situado bajo ese rango. Esta agrupación SHALL derivarse
de los datos del nivel y no declararse en ellos.

#### Scenario: Columna derivada
- **WHEN** se cargan cuatro ingredientes con el mismo rango de columnas en
  filas distintas
- **THEN** forman una única columna de caída ordenada de la fila superior a la
  inferior, asociada al plato bajo ese rango

#### Scenario: Ingrediente sin plato debajo
- **WHEN** una columna de caída no tiene plato bajo su rango
- **THEN** la carga falla con un error descriptivo
