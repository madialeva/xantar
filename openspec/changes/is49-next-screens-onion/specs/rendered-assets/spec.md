## MODIFIED Requirements

### Requirement: Fotogramas de baile
Cada enemigo SHALL tener varias imágenes de su cuerpo, del mismo tamaño, para
su baile. La salchicha y el huevo SHALL tener cinco, que van de un extremo de
su baile al otro pasando por la postura base en el centro: la salchicha doblada
de cóncava a convexa y la clara del huevo ondulando. La cebolla SHALL tener
seis, que recorren media vuelta de su rodaja en pasos iguales, desde de frente,
que es su postura base, pasando por de canto.

#### Scenario: Fotogramas de la salchicha
- **WHEN** se consultan los fotogramas del cuerpo de la salchicha
- **THEN** son cinco, el central es su cuerpo recto y los de los extremos están
  doblados hacia lados opuestos

#### Scenario: Fotogramas de la cebolla
- **WHEN** se consultan los fotogramas del cuerpo de la cebolla
- **THEN** son seis, el primero es la rodaja de frente y el cuarto, la rodaja
  de canto

### Requirement: Gráficos renderizados reproducibles
Los segmentos de los cuatro ingredientes, todas las partes del chef y de los
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

## ADDED Requirements

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
