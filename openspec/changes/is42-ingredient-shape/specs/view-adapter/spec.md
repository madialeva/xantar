## MODIFIED Requirements

### Requirement: Segmentos de ingrediente
La vista SHALL dibujar cada ingrediente con sus segmentos (2, 3 o 4 según el
nivel), cada uno con el gráfico que corresponde a su posición (extremo
izquierdo, tramo central o extremo derecho), y SHALL bajar cada segmento según
su profundidad en la simulación, una distancia fija por escalón, de modo que un
ingrediente a medio pisar se vea inclinado. Al caer, aterrizar o reiniciarse el
tablero, el dibujo SHALL reflejar el estado de los segmentos de la simulación
sin decidir por sí misma qué segmentos están pisados. En un ingrediente de tres
o más segmentos, la vista SHALL arquearlo, bajando los dos segmentos de los
extremos, mientras rebota y durante un momento tras tocar un piso.

#### Scenario: Pisar un segmento
- **WHEN** la simulación informa de que un segmento está pisado
- **THEN** la vista lo dibuja más bajo que los segmentos sin pisar del
  ingrediente

#### Scenario: Ingrediente a medio pisar
- **WHEN** las profundidades de un ingrediente de cuatro segmentos son 3, 2, 1
  y 0 escalones
- **THEN** la vista dibuja cada segmento un escalón más alto que el anterior,
  de izquierda a derecha, y el último a la altura de reposo

#### Scenario: Aterrizaje
- **WHEN** un ingrediente aterriza y sus segmentos vuelven a estar sin pisar
- **THEN** la vista dibuja todos los segmentos a la misma altura, salvo el arco
  breve del aterrizaje

#### Scenario: Caída plana
- **WHEN** un ingrediente cae tras pisar su último segmento
- **THEN** la vista dibuja todos sus segmentos a la misma altura mientras cae

#### Scenario: Arco del rebote
- **WHEN** un ingrediente de cuatro segmentos rebota tras golpear a otro o al
  llegar al plato
- **THEN** la vista dibuja sus dos extremos un poco más bajos que los dos
  segmentos centrales hasta que vuelve a bajar

#### Scenario: Arco al tocar un piso
- **WHEN** un ingrediente de cuatro segmentos toca un piso
- **THEN** la vista dibuja sus dos extremos un poco más bajos que los centrales
  durante un momento y luego los dibuja a la misma altura

#### Scenario: Ingrediente de dos segmentos
- **WHEN** un ingrediente de dos segmentos rebota o toca un piso
- **THEN** la vista no lo arquea
