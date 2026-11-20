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
