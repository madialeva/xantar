# Spec Delta

## Purpose

Dar vida a los personajes con un estilo vectorial: cada personaje se compone de
partes independientes que se animan con interpolaciones según el estado que
informa la simulación, sin influir en ella.

## ADDED Requirements

### Requirement: Personajes por partes
El chef y cada tipo de enemigo SHALL dibujarse como un conjunto de partes
independientes (al menos cuerpo y ojos; en el chef también cabeza, gorro,
brazos y piernas), cada una con su gráfico del tema, su punto de giro y su
posición relativa. La composición de cada personaje SHALL describirse como
datos, de modo que un tema pueda sustituir el gráfico de una parte sin cambiar
la composición.

#### Scenario: Sustituir el gorro del chef
- **WHEN** un tema aporta su propia fuente SVG para el gorro del chef
- **THEN** el chef se dibuja con ese gorro en la misma posición y con las mismas
  animaciones

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
posición, giro y escala: rebote al andar, balanceo de brazos y piernas al
trepar, aplastamiento y estiramiento (*squash & stretch*) al ser golpeado o al
aterrizar un ingrediente, y tambaleo al estar aturdido. Los personajes SHALL
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
