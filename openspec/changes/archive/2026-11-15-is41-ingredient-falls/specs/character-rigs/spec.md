## MODIFIED Requirements

### Requirement: Estados de animación
La animación de cada personaje SHALL derivarse del estado de la simulación en
cada fotograma: el chef SHALL distinguir quieto, andando, en escalera parado,
trepando y golpeado; cada enemigo SHALL distinguir andando, trepando, aturdido,
montado en un ingrediente e inactivo. Al cambiar de estado, la animación del
estado anterior SHALL detenerse y las partes SHALL volver a su postura base
antes de empezar la nueva.

#### Scenario: El chef se detiene
- **WHEN** el chef deja de moverse sobre una plataforma
- **THEN** la animación de andar se detiene y el chef queda en la postura de
  quieto

#### Scenario: El chef se detiene en una escalera
- **WHEN** el chef está en una escalera sin pulsar arriba ni abajo
- **THEN** se dibuja en postura de escalera sin animación de trepar

#### Scenario: Enemigo aturdido
- **WHEN** un enemigo queda aturdido por la pimienta
- **THEN** se dibuja con la animación de aturdido hasta que la simulación
  indica que el aturdimiento ha terminado

#### Scenario: Enemigo montado
- **WHEN** un enemigo va montado en un ingrediente que cae
- **THEN** se dibuja en su postura base, sin la animación de andar ni su baile,
  bajando con el ingrediente

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
- **THEN** el ingrediente se dibuja 12 unidades más abajo y vuelve a su altura
  en 60 ms, sin cambiar su posición lógica

#### Scenario: Ingrediente que llega al plato
- **WHEN** la simulación emite el evento de ingrediente que toca su plato
- **THEN** el ingrediente no se hunde: su rebote es el que da la simulación
