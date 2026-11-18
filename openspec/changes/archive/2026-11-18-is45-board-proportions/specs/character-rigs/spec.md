## MODIFIED Requirements

### Requirement: Personajes por partes
El chef y cada tipo de enemigo SHALL dibujarse como un conjunto de partes
independientes, cada una con su gráfico renderizado, su punto de giro y su
posición relativa: el chef con cuerpo, cabeza, ojos, gorro, coleta, dos brazos
y dos piernas, y cada enemigo con cuerpo, ojos y dos piernas. Los brazos del
chef SHALL girar alrededor del hombro sin que se vea separación entre el brazo
y el cuerpo. El chef SHALL medir de pie 32 unidades (dos casillas del
tablero) de los pies a lo alto del gorro, y los enemigos SHALL tener
aproximadamente la misma altura, con los pies en el suelo de su plataforma. La composición de
cada personaje, incluida su escala, SHALL describirse como datos.

#### Scenario: Sustituir el gorro del chef
- **WHEN** se vuelve a generar el gráfico del gorro del chef con otro modelo
- **THEN** el chef se dibuja con ese gorro en la misma posición y con las mismas
  animaciones, sin cambiar la composición

#### Scenario: Brazos del chef al andar
- **WHEN** el chef anda y balancea los brazos
- **THEN** cada brazo gira alrededor de su hombro y sigue unido al cuerpo

#### Scenario: Altura del chef
- **WHEN** el chef está quieto de pie en una plataforma
- **THEN** mide 32 unidades, con una tolerancia de una unidad, de la suela de
  los zapatos a lo alto del gorro, y la suela queda sobre el suelo de la
  plataforma

#### Scenario: Altura de los enemigos
- **WHEN** el chef y un enemigo están de pie en la misma plataforma
- **THEN** la parte más alta de ambos queda a una altura parecida, ninguno pasa
  de 34 unidades de alto y los dos apoyan los pies en la plataforma

### Requirement: Animaciones con interpolación y squash & stretch
Las animaciones de las partes SHALL hacerse con interpolaciones (tweens) de
posición, giro y escala: rebote al andar, balanceo de brazos, piernas y coleta,
aplastamiento y estiramiento (*squash & stretch*) al ser golpeado, hundimiento
breve de un ingrediente al tocar un piso, y tambaleo al estar aturdido. Una
parte MAY además alternar entre los fotogramas renderizados de su gráfico cuando
el cambio de forma no se puede conseguir con una interpolación; fuera de ese
caso los personajes SHALL NOT usar animaciones fotograma a fotograma.

#### Scenario: Ingrediente que aterriza
- **WHEN** la simulación emite el evento de ingrediente que toca un piso
- **THEN** el ingrediente se dibuja 8 unidades más abajo y vuelve a su altura
  en 60 ms, sin cambiar su posición lógica

#### Scenario: Ingrediente que llega al plato
- **WHEN** la simulación emite el evento de ingrediente que toca su plato
- **THEN** el ingrediente no se hunde: su rebote es el que da la simulación
