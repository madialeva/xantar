# character-rigs Specification

## Purpose
Dar vida a los personajes: cada personaje se compone de partes renderizadas
independientes que se animan con interpolaciones, y con fotogramas cuando hay
que cambiar su forma, según el estado que informa la simulación, sin influir en
ella.

## Requirements

### Requirement: Personajes por partes
El chef y cada tipo de enemigo SHALL dibujarse como un conjunto de partes
independientes, cada una con su gráfico renderizado, su punto de giro y su
posición relativa: el chef con cuerpo, cabeza, ojos, gorro, coleta, dos brazos
y dos piernas, y cada enemigo con cuerpo, ojos y dos piernas. Los brazos del
chef SHALL girar alrededor del hombro sin que se vea separación entre el brazo
y el cuerpo. Los enemigos SHALL tener aproximadamente la misma altura que el
chef. La composición de cada personaje SHALL describirse como datos.

#### Scenario: Sustituir el gorro del chef
- **WHEN** se vuelve a generar el gráfico del gorro del chef con otro modelo
- **THEN** el chef se dibuja con ese gorro en la misma posición y con las mismas
  animaciones, sin cambiar la composición

#### Scenario: Brazos del chef al andar
- **WHEN** el chef anda y balancea los brazos
- **THEN** cada brazo gira alrededor de su hombro y sigue unido al cuerpo

#### Scenario: Altura de los enemigos
- **WHEN** el chef y un enemigo están de pie en la misma plataforma
- **THEN** la parte más alta de ambos queda a una altura parecida y los dos
  apoyan los pies en la plataforma

### Requirement: Estados de animación
La animación de cada personaje SHALL derivarse del estado de la simulación en
cada fotograma: el chef SHALL distinguir quieto, andando, en escalera parado,
trepando y golpeado; cada enemigo SHALL distinguir andando, trepando, aturdido
e inactivo. Al cambiar de estado, la animación del estado anterior SHALL
detenerse y las partes SHALL volver a su postura base antes de empezar la nueva.

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

### Requirement: Animaciones con interpolación y squash & stretch
Las animaciones de las partes SHALL hacerse con interpolaciones (tweens) de
posición, giro y escala: rebote al andar, balanceo de brazos, piernas y coleta,
aplastamiento y estiramiento (*squash & stretch*) al ser golpeado o al aterrizar
un ingrediente, y tambaleo al estar aturdido. Una parte MAY además alternar
entre los fotogramas renderizados de su gráfico cuando el cambio de forma no se
puede conseguir con una interpolación; fuera de ese caso los personajes SHALL
NOT usar animaciones fotograma a fotograma.

#### Scenario: Ingrediente que aterriza
- **WHEN** la simulación emite el evento de ingrediente aterrizado
- **THEN** el ingrediente se aplasta y recupera su forma en una animación breve
  sin cambiar su posición lógica

### Requirement: Animación sin efecto en la simulación
Las animaciones de los personajes SHALL ser solo adorno: SHALL NOT alterar la
posición dibujada del personaje en la rejilla más allá de un desplazamiento
visual acotado, SHALL NOT retrasar ni adelantar eventos de la simulación y
SHALL NOT quedar pendientes al reiniciar el tablero.

#### Scenario: Reiniciar con una animación en curso
- **WHEN** el tablero se reinicia mientras el chef está en la animación de
  golpeado
- **THEN** el chef aparece en su postura base en el nuevo tablero sin restos de
  la animación anterior

#### Scenario: Misma partida, mismas reglas
- **WHEN** se reproduce la misma secuencia de entradas con la misma semilla con
  y sin las animaciones nuevas
- **THEN** la simulación produce los mismos eventos y el mismo estado final

### Requirement: Bailes de los enemigos
Al andar, cada enemigo SHALL bailar a su manera, al ritmo de sus piernas: la
salchicha alterna su cuerpo de cóncavo a convexo, el pepinillo se contonea en S
y el huevo ondula la clara mientras rebota. Los ojos SHALL acompañar el
movimiento del cuerpo. Al dejar de andar, el cuerpo SHALL volver a su
fotograma base.

#### Scenario: La salchicha baila
- **WHEN** la salchicha anda por una plataforma
- **THEN** su cuerpo pasa de doblado hacia un lado a doblado hacia el otro en
  cada paso y sus ojos se desplazan con la doblez

#### Scenario: Deja de andar
- **WHEN** un enemigo pasa de andar a trepar
- **THEN** su cuerpo vuelve a su fotograma base antes de empezar a trepar

### Requirement: Coleta del chef
La coleta del chef SHALL ser una parte propia que se balancea al andar, se mece
en reposo y sale despedida al ser golpeado.

#### Scenario: La chef anda
- **WHEN** el chef anda
- **THEN** la coleta se balancea a un lado y a otro al ritmo de los pasos
