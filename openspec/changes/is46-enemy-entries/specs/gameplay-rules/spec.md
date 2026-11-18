## ADDED Requirements

### Requirement: Entrada de los enemigos
Al empezar cada tablero y al volver a `ready` tras perder una vida, los
enemigos SHALL estar fuera del tablero. Cuando pasa el retraso de su entrada,
contado desde que empieza `playing`, cada enemigo SHALL aparecer en su
marcador y, si está en una pasarela, entrar andando por ella a 68 unidades por
segundo hasta la plataforma, desde donde persigue al chef. Mientras entra SHALL
comportarse como un enemigo activo.

#### Scenario: Nadie en el tablero al empezar
- **WHEN** empieza la fase `playing` de un tablero cuyas entradas tienen
  retrasos de 500 ms o más
- **THEN** no hay ningún enemigo activo en el tablero hasta que pasa el primer
  retraso

#### Scenario: Entrar por una pasarela
- **WHEN** pasa el retraso de un enemigo cuyo marcador está en el extremo
  exterior de una pasarela de cuatro casillas
- **THEN** aparece en el marcador, avanza cada tick 68 unidades por segundo
  hacia el piso y, al llegar a la plataforma, sigue al chef por el grafo de
  navegación

#### Scenario: Aturdido mientras entra
- **WHEN** la pimienta alcanza a un enemigo que está entrando por su pasarela
- **THEN** se queda quieto en la pasarela mientras dura el aturdimiento y luego
  termina de entrar

#### Scenario: Volver a entrar tras perder una vida
- **WHEN** el chef pierde una vida y termina `ready`
- **THEN** los enemigos vuelven a entrar desde sus marcadores con sus retrasos,
  como al empezar el tablero

## MODIFIED Requirements

### Requirement: Aplastamiento de enemigos
Mientras un ingrediente cae o rebota, SHALL aplastar en ese tick a todo enemigo
activo no montado en él que esté dentro de sus casillas en horizontal y cuya
altura, de los pies a 32 unidades por encima (la altura de un enemigo), contenga
la base del ingrediente. Cada aplastamiento SHALL incrementar el combo en uno y
conceder 100 puntos multiplicados por el valor del combo. El enemigo aplastado
SHALL volver a los 150 ticks entrando por uno de los marcadores de enemigo del
nivel, elegido con el generador aleatorio, como en su entrada. El combo SHALL
reiniciarse al perder una vida.

#### Scenario: Aplastamientos consecutivos
- **WHEN** caídas sucesivas aplastan a dos enemigos antes de perder una vida
- **THEN** el primero concede 100 puntos y el segundo 200

#### Scenario: Reaparición
- **WHEN** han pasado 150 ticks desde un aplastamiento
- **THEN** el enemigo vuelve a estar activo en uno de los marcadores de enemigo
  del nivel y, si está en una pasarela, entra andando por ella

#### Scenario: Aplastado al alcanzarlo
- **WHEN** un ingrediente empieza a caer con un enemigo aturdido en la
  plataforma de su soporte, dentro de sus casillas
- **THEN** el enemigo no se aplasta al empezar la caída sino en el tick en que
  la base del ingrediente baja de 32 unidades por encima de sus pies

#### Scenario: Salir a tiempo
- **WHEN** el enemigo sale de las casillas del ingrediente antes de que su base
  le alcance
- **THEN** no se aplasta

#### Scenario: Meterse debajo
- **WHEN** un enemigo entra en las casillas de un ingrediente que está cayendo y
  cuya base ya está a su altura
- **THEN** se aplasta en ese tick

#### Scenario: Enemigo en una escalera
- **WHEN** un enemigo está en una escalera dentro de las casillas de un
  ingrediente que cae y la base del ingrediente llega a su altura
- **THEN** se aplasta

#### Scenario: El chef no se aplasta
- **WHEN** un ingrediente cae sobre la plataforma en la que está el chef
- **THEN** el chef no sufre ningún efecto

### Requirement: Bonificación por enemigos montados
Cuando un ingrediente con enemigos montados termina su caída, esos enemigos
SHALL salir del tablero y, a los 150 ticks, volver en la plataforma de la fila
donde se ha quedado el ingrediente, en la misma posición horizontal que
llevaban, como en el original; si el ingrediente ha terminado en su plato,
SHALL volver en la plataforma más baja por encima del plato, en esa misma
posición horizontal, justo encima de la hamburguesa. Se SHALL conceder 500
puntos por el primero, doblando la bonificación con cada uno más (1000 con dos,
2000 con tres, 4000 con cuatro…), sin cambiar el combo. Se SHALL emitir un
evento con el ingrediente, la posición de cada enemigo y los puntos.

#### Scenario: Un enemigo
- **WHEN** termina su caída un ingrediente con un enemigo montado
- **THEN** se conceden 500 puntos, además de los 50 del ingrediente, el enemigo
  deja de estar activo y el combo no cambia

#### Scenario: Tres enemigos
- **WHEN** termina su caída un ingrediente con tres enemigos montados
- **THEN** se conceden 2000 puntos de bonificación y los tres vuelven a los 150
  ticks donde se quedó el ingrediente

#### Scenario: Vuelve donde paró
- **WHEN** han pasado 150 ticks desde que un ingrediente con un enemigo montado
  terminó su caída en un piso
- **THEN** el enemigo está activo sobre la plataforma de ese piso, en la
  posición horizontal en la que viajaba, y persigue al chef desde allí

#### Scenario: Llegar al plato
- **WHEN** han pasado 150 ticks desde que un ingrediente con un enemigo montado
  terminó su caída en su plato
- **THEN** el enemigo está activo sobre la plataforma más baja por encima de ese
  plato, en la posición horizontal en la que viajaba
