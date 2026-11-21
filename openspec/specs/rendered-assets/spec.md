# rendered-assets Specification

## Purpose
Dar a los ingredientes y a los personajes un aspecto realista y apetecible con
imágenes renderizadas en 3D a partir de modelos procedurales reproducibles, que
el juego usa como cualquier otro gráfico del catálogo.

## Requirements

### Requirement: Gráficos renderizados reproducibles
Los segmentos de los seis ingredientes, todas las partes del chef y de los
tres enemigos, y la escalera con sus largueros SHALL dibujarse con imágenes PNG
con transparencia generadas por scripts versionados en el repositorio, que
construyen los modelos de forma procedural y los renderizan sin intervención
manual. Volver a ejecutar los
scripts con la misma versión de la herramienta SHALL producir las mismas
imágenes salvo el ruido de muestreo. El juego SHALL NOT necesitar la
herramienta de render para compilarse, probarse ni ejecutarse: las imágenes
generadas SHALL versionarse junto al resto del arte.

#### Scenario: Regenerar el arte
- **WHEN** se ejecutan los scripts de render de ingredientes, personajes y
  laberinto
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
con volumen, el pan de abajo con su corteza y la miga del corte, el queso como
una loncha fina de cheddar, amarilla anaranjada y brillante, que se derrite por
el borde de delante en lágrimas de punta redonda, y el tomate como rodajas de
piel roja brillante, una por segmento, algo inclinadas para que se vea el corte
con sus semillas. El pan de
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

#### Scenario: Queso fundido sobre la carne
- **WHEN** un queso está apilado sobre una carne en el plato
- **THEN** se ve una loncha fina amarilla anaranjada sobre la carne, con dos
  lágrimas por segmento colgando por delante de la carne

#### Scenario: Rodajas de tomate
- **WHEN** se dibuja un tomate de cuatro segmentos quieto en un piso
- **THEN** se ven cuatro rodajas rojas y brillantes, una por segmento, con el
  corte a la vista: carne roja, cámaras con semillas claras y el centro más
  claro

### Requirement: Aspecto de la cebolla
La cebolla SHALL ser una rodaja gruesa de cebolla morada, de pie sobre dos
piernas: de frente se ven anillos concéntricos blancos con el borde violeta
dentro de una piel morada, y de canto, una barra morada. SHALL verse jugosa y
brillante, con los ojos asomando por encima del borde de arriba, y medir de
alto, en su postura base, aproximadamente lo mismo que el chef.

#### Scenario: Cebolla de frente
- **WHEN** se dibuja la cebolla en su postura base
- **THEN** se ve una rodaja redonda con anillos blancos y violetas rodeados de
  piel morada, y los ojos por encima de ella

#### Scenario: Altura de la cebolla
- **WHEN** la cebolla y el chef están de pie en la misma plataforma, la cebolla
  en su postura base
- **THEN** lo más alto de los ojos de la cebolla queda a una altura parecida a
  lo alto del gorro del chef, sin pasar de 34 unidades, y la cebolla apoya los
  pies en la plataforma

### Requirement: Escalera renderizada
La escalera SHALL ser de madera de abedul, clara y cremosa, para que el
tablero no se vea oscuro, con dos largueros y peldaños redondos, y SHALL dibujarse fila a fila con una misma imagen de la altura de una
fila que se repite sin costuras: cuatro peldaños por fila, más juntos que en las
primeras versiones pero menos que en el original. En cada cruce SHALL verse
pasar los largueros a través de la plataforma.

#### Scenario: Escalera de varias filas
- **WHEN** se dibuja una escalera que une dos pisos separados por cuatro filas
- **THEN** se ve como una sola escalera continua, con los peldaños a la misma
  distancia de uno a otro y sin cortes entre filas

#### Scenario: Cruce
- **WHEN** una escalera atraviesa un piso
- **THEN** sus largueros se ven pasar por la ranura de la plataforma

#### Scenario: Escalera clara
- **WHEN** se dibuja el tablero
- **THEN** las escaleras se ven de un tono de madera claro, que resalta sobre
  el fondo oscuro

### Requirement: Fotogramas del cuerpo
El cuerpo de un enemigo que baila cambiando de forma SHALL tener varias
imágenes del mismo tamaño. El chorizo SHALL tener cinco, de un extremo de su
doblez al otro pasando por el cuerpo recto en el centro. La cebolla SHALL tener
seis, que recorren media vuelta de su rodaja en pasos iguales desde de frente,
su postura base. La mazorca, que baila moviendo sus partes, SHALL tener una
sola imagen de su cuerpo.

#### Scenario: Fotogramas del chorizo
- **WHEN** se consultan los fotogramas del cuerpo del chorizo
- **THEN** son cinco, el central es su cuerpo recto y los de los extremos están
  doblados hacia lados opuestos

#### Scenario: Fotogramas de la cebolla
- **WHEN** se consultan los fotogramas del cuerpo de la cebolla
- **THEN** son seis, el primero es la rodaja de frente y el cuarto, la rodaja
  de canto

#### Scenario: Cuerpo de la mazorca
- **WHEN** se consultan los fotogramas del cuerpo de la mazorca
- **THEN** no tiene ninguno aparte de su cuerpo

### Requirement: Aspecto del chorizo
El chorizo SHALL ser un chorizo fresco gallego de pie sobre dos piernas, gordo y
de tripa lisa y brillante, rojo pimentón con vetas de grasa naranjas y
amarillas. SHALL tener los dos extremos redondeados y atados con cordel rojo, y
arriba, por encima del atado, la punta de la tripa con un cabo de cordel
suelto. SHALL medir de alto, de los pies a lo alto de la punta,
aproximadamente lo mismo que el chef.

#### Scenario: Chorizo de frente
- **WHEN** se dibuja el chorizo en su postura base
- **THEN** se ve una tripa roja anaranjada y lisa con vetas de grasa, atada con
  cordel rojo arriba y abajo, con su punta y un cabo de cordel por encima

#### Scenario: Altura del chorizo
- **WHEN** el chorizo y el chef están de pie en la misma plataforma
- **THEN** lo más alto de la punta del chorizo queda a una altura parecida a lo
  alto del gorro del chef, sin pasar de 34 unidades

### Requirement: Aspecto de la mazorca
La mazorca SHALL ser una mazorca de maíz amarillo de pie sobre dos piernas
verdes, con filas de granos brillantes, las hojas de la vaina peladas hacia
abajo alrededor de su base como una falda y un mechón de pelo de maíz rubio en
la punta. SHALL medir de alto, de los pies a lo alto del pelo,
aproximadamente lo mismo que el chef.

#### Scenario: Mazorca de frente
- **WHEN** se dibuja la mazorca en su postura base
- **THEN** se ven las filas de granos amarillos, la falda de hojas verdes
  alrededor de su base y el mechón de pelo en la punta

#### Scenario: Altura de la mazorca
- **WHEN** la mazorca y el chef están de pie en la misma plataforma
- **THEN** lo más alto de su pelo queda a una altura parecida a lo alto del
  gorro del chef, sin pasar de 34 unidades

### Requirement: Boca sonriente
El chorizo y la mazorca SHALL tener, bajo los ojos, una boca sonriente: abierta,
con las comisuras hacia arriba, una sola fila de dientes continua a lo largo
del borde de arriba y una lengua al fondo. La boca SHALL formar parte de la
imagen del cuerpo, de modo que se doble o se incline con él.

#### Scenario: Sonrisa del chorizo
- **WHEN** se dibuja el chorizo doblado en un extremo de su baile
- **THEN** su boca sonriente se ve doblada con el cuerpo, con la fila de
  dientes entera y sin dientes sueltos

#### Scenario: Sonrisa de la mazorca
- **WHEN** se dibuja la mazorca en su postura base
- **THEN** se ve su boca sonriente entre los granos, bajo los ojos, sin granos
  delante de ella
