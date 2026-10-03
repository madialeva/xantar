# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Recorrido de un ingrediente`
- TO: `### Requirement: Pisado de segmentos`

## MODIFIED Requirements

### Requirement: Escaleras del chef
El chef SHALL poder engancharse a una escalera cuando hay entrada arriba o
abajo y existe, en esa dirección, un cruce de escalera con su plataforma a una
distancia horizontal no superior a 0,6 casillas de su posición; al engancharse
SHALL centrarse en la columna de la escalera. Sobre una escalera, el chef SHALL
moverse a 80/32 casillas por segundo únicamente mientras haya entrada arriba o
abajo, SHALL poder detenerse al soltar la entrada y SHALL poder invertir el
sentido en cualquier punto de la escalera. La entrada lateral SHALL ignorarse
mientras esté sobre una escalera. Al alcanzar uno de sus extremos, el chef SHALL
quedar sobre la plataforma de ese extremo, desde la que puede caminar o
engancharse a otra escalera.

#### Scenario: Subir por una escalera cercana
- **WHEN** el chef está a 0,3 casillas de una escalera que sube y mantiene
  arriba
- **THEN** se centra en la escalera y asciende hasta la plataforma superior

#### Scenario: Sin escalera en esa dirección
- **WHEN** se pulsa arriba y no hay escalera hacia arriba dentro de 0,6 casillas
- **THEN** el chef no se mueve verticalmente

#### Scenario: Detenerse a mitad de la escalera
- **WHEN** el chef sube por una escalera y se suelta la entrada a mitad del
  recorrido
- **THEN** permanece parado en ese punto de la escalera

#### Scenario: Invertir el sentido a mitad de la escalera
- **WHEN** el chef sube por una escalera y se pulsa abajo antes de llegar a la
  plataforma superior
- **THEN** desciende por la misma escalera sin llegar a la plataforma superior

#### Scenario: Entrada durante la subida
- **WHEN** el chef está sobre una escalera y se pulsa izquierda
- **THEN** la posición horizontal no cambia

#### Scenario: Escaleras consecutivas
- **WHEN** el chef llega a una plataforma que tiene otra escalera en la misma
  columna y mantiene la misma dirección
- **THEN** se engancha a la escalera siguiente y continúa

### Requirement: Pisado de segmentos
Cada ingrediente SHALL estar formado por tantos segmentos de una casilla como
indique el nivel (2, 3 o 4; 4 por defecto). El chef SHALL pisar un segmento cuando, estando sobre la plataforma de la fila del
ingrediente, su posición horizontal entra en la casilla de ese segmento; el chef
SHALL NOT pisar segmentos mientras está sobre una escalera. Un segmento pisado
SHALL permanecer pisado hasta que el ingrediente caiga, aunque el chef se aleje.
Cuando todos los segmentos de un ingrediente están pisados, el ingrediente SHALL
activarse. Al aterrizar el ingrediente sobre otra plataforma, sus segmentos
SHALL volver a estar sin pisar. Cada segmento pisado SHALL emitir un
evento con el ingrediente y el segmento.

#### Scenario: Recorrido completo
- **WHEN** el chef camina por la plataforma de un lado a otro de un ingrediente
  sin salirse
- **THEN** pisa todos los segmentos en orden y el ingrediente se activa al
  pisar el último

#### Scenario: Recorrido abandonado
- **WHEN** el chef pisa dos segmentos de un ingrediente de cuatro, se aleja y
  vuelve más tarde a pisar los otros dos
- **THEN** el ingrediente se activa al pisar el cuarto, sin haber reiniciado los
  dos primeros

#### Scenario: Ingrediente de tres segmentos
- **WHEN** el nivel define ingredientes de tres segmentos y el chef pisa los tres
- **THEN** el ingrediente se activa al pisar el tercero

#### Scenario: Segmento sobre una escalera
- **WHEN** el chef sube o baja por una escalera cuya columna coincide con un
  segmento de un ingrediente
- **THEN** no pisa ese segmento mientras esté sobre la escalera

#### Scenario: Aterrizaje
- **WHEN** un ingrediente con todos los segmentos pisados aterriza sobre otra
  plataforma
- **THEN** sus segmentos vuelven a estar sin pisar

### Requirement: Caída en cadena
Al activarse un ingrediente, SHALL caer hasta el primer soporte situado por
debajo: la primera fila con una casilla de plataforma o de plato bajo cualquiera
de sus casillas; si en esa fila hay plato bajo alguna de sus casillas, SHALL
aterrizar sobre el plato. Los ingredientes inmóviles situados en la fila de
aterrizaje cuyas casillas solapen alguna casilla del ingrediente que cae SHALL
ser golpeados y caer también, y así recursivamente. Los ingredientes que caen
por una misma activación SHALL empezar a caer del más bajo al más alto, con 7
ticks de retardo entre sucesivos, y cada caída SHALL durar 12 ticks. Se SHALL
conceder 50 puntos por cada ingrediente que cae (activado o golpeado), en el
instante de la activación.

#### Scenario: Activar el ingrediente superior
- **WHEN** se activa el ingrediente más alto de una columna de cuatro
  ingredientes situados en plataformas consecutivas
- **THEN** caen los cuatro, el inferior primero, cada uno una plataforma, y se
  conceden 200 puntos

#### Scenario: Activar el ingrediente inferior
- **WHEN** se activa el ingrediente más bajo de una columna
- **THEN** cae solo ese ingrediente

#### Scenario: Solo cae lo golpeado
- **WHEN** se activa un ingrediente y la plataforma de aterrizaje está vacía de
  ingredientes aunque haya otro más abajo
- **THEN** cae solo el ingrediente activado y el de más abajo permanece

#### Scenario: Golpe con solape parcial
- **WHEN** un ingrediente aterriza sobre otro que solapa solo una de sus
  casillas
- **THEN** el ingrediente golpeado también cae

### Requirement: Apilado en el plato
Un ingrediente cuyo soporte de aterrizaje es un plato SHALL apilarse sobre él,
cada pieza sobre la anterior. Cada plato SHALL conocer el número de ingredientes
que terminarán en él, calculado al cargar el nivel siguiendo la caída vertical
de cada ingrediente hasta su soporte final. Cuando todos esos ingredientes han
aterrizado sobre el plato, la hamburguesa se SHALL dar por completada,
concediendo 400 puntos y una pimienta adicional. El orden de apilado SHALL ser
el orden de aterrizaje.

#### Scenario: Hamburguesa completa
- **WHEN** aterrizan sobre un plato todos los ingredientes cuyo destino es ese
  plato
- **THEN** se conceden 400 puntos, se suma una pimienta y se emite el evento de
  hamburguesa completada

#### Scenario: Hamburguesa incompleta
- **WHEN** falta por aterrizar el último ingrediente de un plato
- **THEN** el plato no se completa hasta que ese ingrediente aterriza

### Requirement: Aplastamiento de enemigos
Cuando un ingrediente empieza a caer, todo enemigo activo dentro del rango
horizontal de sus casillas y con fila comprendida entre la fila de origen y la
de destino (ambas incluidas) SHALL quedar aplastado. Cada aplastamiento SHALL
incrementar el contador de combo en uno y conceder 100 puntos multiplicados por
el valor del combo. El enemigo aplastado SHALL reaparecer a los 150 ticks en uno
de los puntos de aparición de enemigos del nivel, elegido con el generador
aleatorio. El combo SHALL reiniciarse al perder una vida.

#### Scenario: Aplastamientos consecutivos
- **WHEN** caídas sucesivas aplastan a dos enemigos antes de perder una vida
- **THEN** el primero concede 100 puntos y el segundo 200

#### Scenario: Reaparición
- **WHEN** han pasado 150 ticks desde un aplastamiento
- **THEN** el enemigo vuelve a estar activo en uno de los puntos de aparición
  del nivel

### Requirement: Comportamiento de los enemigos
Cada enemigo activo SHALL recorrer las plataformas a 68/32 casillas por segundo
y reevaluar su decisión cada entre 30 y 66 ticks (intervalo elegido con el
generador aleatorio). Si el chef no está en el mismo tramo continuo de
plataforma que el enemigo, este SHALL dirigirse por el camino más corto del
grafo de navegación hacia el chef: caminar hasta el cruce de la primera escalera
de ese camino y, al llegar, recorrerla entera a 68/32 casillas por segundo en el
sentido decidido en ese momento. Si el chef está en el mismo tramo, el enemigo
SHALL dirigirse hacia él, con una probabilidad del 20 % de invertir el sentido
en cada decisión. Si no existe camino hasta el chef, SHALL dirigirse
horizontalmente hacia él con las mismas inversiones. Un enemigo aturdido SHALL
permanecer inmóvil.

#### Scenario: Chef en otra fila
- **WHEN** un enemigo está en la plataforma superior y el chef en la inferior
- **THEN** el enemigo se dirige a una escalera descendente y baja por ella

#### Scenario: Camino más corto en un nivel irregular
- **WHEN** el chef solo es alcanzable por una escalera que no es la más cercana
  en horizontal al enemigo
- **THEN** el enemigo se dirige a la escalera del camino más corto

#### Scenario: Chef en la misma fila
- **WHEN** enemigo y chef comparten tramo de plataforma
- **THEN** el enemigo se acerca horizontalmente al chef, salvo inversiones
  ocasionales de sentido

#### Scenario: Chef inalcanzable
- **WHEN** no existe camino del grafo entre el enemigo y el chef
- **THEN** el enemigo se mueve horizontalmente hacia el chef sin intentar usar
  escaleras
