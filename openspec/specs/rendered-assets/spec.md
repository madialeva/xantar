# rendered-assets Specification

## Purpose
Dar a los ingredientes y a los personajes un aspecto realista y apetecible con
imágenes renderizadas en 3D a partir de modelos procedurales reproducibles, que
el juego usa como cualquier otro gráfico del catálogo.

## Requirements

### Requirement: Gráficos renderizados reproducibles
Los segmentos de los cuatro ingredientes y todas las partes del chef y de los
tres enemigos SHALL dibujarse con imágenes PNG con transparencia generadas por
scripts versionados en el repositorio, que construyen los modelos de forma
procedural y los renderizan sin intervención manual. Volver a ejecutar los
scripts con la misma versión de la herramienta SHALL producir las mismas
imágenes salvo el ruido de muestreo. El juego SHALL NOT necesitar la
herramienta de render para compilarse, probarse ni ejecutarse: las imágenes
generadas SHALL versionarse junto al resto del arte.

#### Scenario: Regenerar el arte
- **WHEN** se ejecutan los scripts de render de ingredientes y personajes
- **THEN** se reescriben las imágenes PNG de esos gráficos y el juego las usa
  sin otros cambios

#### Scenario: Compilar sin la herramienta de render
- **WHEN** se ejecutan el build y las pruebas en una máquina sin la herramienta
  de render instalada
- **THEN** ambos terminan correctamente con las imágenes versionadas

### Requirement: Tamaño y encuadre de las imágenes
Cada imagen renderizada SHALL medir su tamaño lógico del catálogo multiplicado
por 4 y SHALL encuadrar el gráfico exactamente como lo coloca el juego: los
ingredientes apoyados en la base de su imagen y las partes de los personajes en
la posición y con el punto de giro de su rig. Todas las imágenes SHALL
compartir la misma iluminación, con la luz principal desde arriba a la
izquierda, para que el conjunto sea coherente.

#### Scenario: Segmento de pan
- **WHEN** se genera un segmento del pan de arriba, de tamaño lógico 16×18
- **THEN** la imagen mide 64×72 píxeles y el pan se apoya en su borde
  inferior

#### Scenario: Pierna de un enemigo
- **WHEN** el rig gira la pierna de un enemigo alrededor de la cadera
- **THEN** la cadera de la imagen coincide con el punto de giro y el zapato
  queda a la altura del suelo en la postura base

### Requirement: Tramo central sin costuras
Las imágenes de un ingrediente SHALL renderizarse de modo que su tramo central
pueda repetirse a continuación de sí mismo y entre los dos extremos sin que se
vean costuras: la forma, la luz, las texturas y los detalles (como las semillas
de sésamo) SHALL repetirse exactamente una vez por casilla.

#### Scenario: Ingrediente de cuatro casillas
- **WHEN** se dibuja un ingrediente de cuatro casillas con extremo izquierdo,
  dos tramos centrales y extremo derecho
- **THEN** se ve como una sola pieza continua, sin cortes entre segmentos
  mientras ninguno está pisado

### Requirement: Aspecto de los ingredientes
Los ingredientes SHALL parecer comida de verdad vista ligeramente desde arriba:
el pan de arriba dorado y brillante con semillas de sésamo, la carne a la brasa
con tonos claros y oscuros y marcas de parrilla, la lechuga como hojas rizadas
con volumen, y el pan de abajo con su corteza y la miga del corte. El pan de
arriba SHALL tener forma de cúpula también a lo largo: su altura SHALL bajar
hacia las puntas dentro del primer y el último segmento, hasta menos de la
mitad de su altura central, mientras que los segmentos centrales SHALL
conservar la altura completa. La carne SHALL ser un marrón de carne a la brasa
lo bastante claro para distinguirse a simple vista del fondo del tablero, y la
lechuga, la carne y el pan de abajo SHALL verse con un grosor cercano al del
original.

#### Scenario: Hamburguesa en el plato
- **WHEN** los cuatro ingredientes de una hamburguesa están apilados en su plato
- **THEN** la carne se ve sobre la miga del pan de abajo y la lechuga asoma
  entre la carne y el pan de arriba

#### Scenario: Pan de arriba visto de frente
- **WHEN** se dibuja un pan de arriba de cuatro segmentos sin pisar
- **THEN** su perfil sube desde unas puntas bajas hasta la altura completa a lo
  largo de los segmentos de los extremos, sin extremos verticales, y es plano a
  lo largo de los dos segmentos centrales

#### Scenario: Carne sobre el fondo del tablero
- **WHEN** se dibuja una carne quieta en un piso
- **THEN** su color medio es claramente más claro que el fondo del tablero,
  sin llegar al de los panes, y las marcas de parrilla siguen viéndose oscuras

#### Scenario: Lechuga y carne con volumen
- **WHEN** se dibujan una lechuga y una carne quietas junto al pan de arriba
- **THEN** la carne se ve casi tan gruesa como el pan de arriba y la lechuga
  algo más fina que la carne

#### Scenario: Pan de abajo con volumen
- **WHEN** se dibuja un pan de abajo quieto junto a una carne
- **THEN** se ve casi tan grueso como la carne, con la corteza y la miga del
  corte a la vista

### Requirement: Fotogramas de baile
Cada enemigo SHALL tener cinco imágenes de su cuerpo, del mismo tamaño, que van
de un extremo de su baile al otro pasando por la postura base en el centro: la
salchicha doblada de cóncava a convexa, el pepinillo contoneándose en S y la
clara del huevo ondulando.

#### Scenario: Fotogramas de la salchicha
- **WHEN** se consultan los fotogramas del cuerpo de la salchicha
- **THEN** son cinco, el central es su cuerpo recto y los de los extremos están
  doblados hacia lados opuestos
