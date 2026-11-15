## MODIFIED Requirements

### Requirement: Pisado de segmentos
Cada ingrediente SHALL estar formado por tantos segmentos de una casilla como
indique el nivel (2, 3 o 4; 4 por defecto). El chef SHALL pisar un segmento de
un ingrediente quieto cuando, estando sobre la plataforma de la fila del
ingrediente, su posición horizontal entra en la casilla de ese segmento; el chef
SHALL NOT pisar segmentos mientras está sobre una escalera. Un segmento pisado
SHALL permanecer pisado hasta que el ingrediente caiga, aunque el chef se aleje.
Cuando todos los segmentos de un ingrediente están pisados, el ingrediente SHALL
activarse. Al terminar su caída sobre otra plataforma, sus segmentos SHALL
volver a estar sin pisar. Cada segmento pisado SHALL emitir un evento con el
ingrediente y el segmento.

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
- **WHEN** un ingrediente con todos los segmentos pisados termina su caída sobre
  otra plataforma
- **THEN** sus segmentos vuelven a estar sin pisar

#### Scenario: Ingrediente en movimiento
- **WHEN** el chef camina por la plataforma en la que un ingrediente con enemigos
  montados se ha detenido un momento antes de seguir cayendo
- **THEN** no pisa ninguno de sus segmentos

### Requirement: Caída en cadena
Al activarse, un ingrediente SHALL caer hasta el primer soporte situado por
debajo: la primera fila con una casilla de plataforma o de plato bajo cualquiera
de sus casillas; si en esa fila hay plato bajo alguna de sus casillas, SHALL
acabar sobre el plato. Cuando su base alcanza la parte de arriba de un
ingrediente quieto de esa fila que solapa alguna de sus casillas, ese
ingrediente SHALL ser golpeado y empezar a caer en ese mismo tick, y así
sucesivamente. Se SHALL conceder 50 puntos por cada ingrediente cuando termina
su caída.

#### Scenario: Activar el ingrediente superior
- **WHEN** se activa el ingrediente más alto de una columna de cuatro
  ingredientes situados en plataformas consecutivas
- **THEN** cada uno empieza a caer en el tick en que le alcanza el de encima, de
  arriba abajo, cada uno termina en el soporte siguiente al suyo y se conceden
  200 puntos cuando los cuatro han terminado

#### Scenario: Activar el ingrediente inferior
- **WHEN** se activa el ingrediente más bajo de una columna
- **THEN** cae solo ese ingrediente

#### Scenario: Solo cae lo golpeado
- **WHEN** se activa un ingrediente y la plataforma de aterrizaje está vacía de
  ingredientes aunque haya otro más abajo
- **THEN** cae solo el ingrediente activado y el de más abajo permanece

#### Scenario: Golpe con solape parcial
- **WHEN** un ingrediente cae sobre otro que solapa solo una de sus casillas
- **THEN** el ingrediente golpeado también cae

#### Scenario: Puntos al terminar la caída
- **WHEN** se activa un ingrediente que no golpea a ninguno
- **THEN** no se conceden puntos mientras cae y se conceden 50 en el tick en que
  queda quieto en su soporte

### Requirement: Apilado en el plato
Un ingrediente cuyo soporte es un plato SHALL apilarse sobre él, cada pieza
sobre la anterior. Al llegar a su sitio SHALL rebotar como al golpear a otro
ingrediente y volver a bajar a la velocidad de caída hasta quedar quieto en él.
Cada plato SHALL conocer el número de ingredientes que terminarán en él,
calculado al cargar el nivel siguiendo la caída vertical de cada ingrediente
hasta su soporte final. Cuando todos ellos han quedado quietos sobre el plato,
la hamburguesa se SHALL dar por completada, concediendo 400 puntos y una
pimienta adicional. El orden de apilado SHALL ser el de llegada.

#### Scenario: Hamburguesa completa
- **WHEN** quedan quietos sobre un plato todos los ingredientes cuyo destino es
  ese plato
- **THEN** se conceden 400 puntos, se suma una pimienta y se emite el evento de
  hamburguesa completada

#### Scenario: Hamburguesa incompleta
- **WHEN** falta por llegar el último ingrediente de un plato
- **THEN** el plato no se completa hasta que ese ingrediente queda quieto sobre
  él

#### Scenario: Rebote en el plato
- **WHEN** un ingrediente que cae hacia su plato alcanza su sitio en la pila
- **THEN** sube 20/32 casillas en 5 ticks, se queda quieto 13 ticks, vuelve a
  bajar a 170/32 casillas por segundo hasta su sitio y queda apilado

#### Scenario: Último ingrediente del nivel
- **WHEN** el último ingrediente pendiente del nivel llega a su plato
- **THEN** la fase no pasa a `levelClear` hasta que ese ingrediente termina su
  rebote y queda quieto

### Requirement: Aplastamiento de enemigos
Mientras un ingrediente cae o rebota, SHALL aplastar en ese tick a todo enemigo
activo no montado en él que esté dentro de sus casillas en horizontal y cuya
altura, de los pies a una casilla por encima, contenga la base del ingrediente.
Cada aplastamiento SHALL incrementar el combo en uno y conceder 100 puntos
multiplicados por el valor del combo. El enemigo aplastado SHALL reaparecer a
los 150 ticks en uno de los puntos de aparición del nivel, elegido con el
generador aleatorio. El combo SHALL reiniciarse al perder una vida.

#### Scenario: Aplastamientos consecutivos
- **WHEN** caídas sucesivas aplastan a dos enemigos antes de perder una vida
- **THEN** el primero concede 100 puntos y el segundo 200

#### Scenario: Reaparición
- **WHEN** han pasado 150 ticks desde un aplastamiento
- **THEN** el enemigo vuelve a estar activo en uno de los puntos de aparición
  del nivel

#### Scenario: Aplastado al alcanzarlo
- **WHEN** un ingrediente empieza a caer con un enemigo aturdido en la
  plataforma de su soporte, dentro de sus casillas
- **THEN** el enemigo no se aplasta al empezar la caída sino en el tick en que
  la base del ingrediente baja de una casilla por encima de sus pies

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
horizontalmente hacia él con las mismas inversiones. Al llegar al extremo de una
escalera, el enemigo SHALL reevaluar su decisión de inmediato en lugar de seguir
el sentido anterior. Un enemigo aturdido SHALL permanecer inmóvil y uno montado
en un ingrediente SHALL moverse solo con el ingrediente.

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

#### Scenario: Reevaluar al bajar de una escalera
- **WHEN** un enemigo termina de recorrer una escalera y el chef está en el
  sentido contrario al que llevaba
- **THEN** el enemigo se dirige hacia el chef desde el primer tick en la
  plataforma, sin seguir antes el sentido anterior

#### Scenario: Chef inalcanzable
- **WHEN** no existe camino del grafo entre el enemigo y el chef
- **THEN** el enemigo se mueve horizontalmente hacia el chef sin intentar usar
  escaleras

#### Scenario: Enemigo montado
- **WHEN** un enemigo va montado en un ingrediente que cae
- **THEN** no camina ni decide hacia dónde ir, y su posición vertical es la del
  ingrediente en cada tick

### Requirement: Contacto con enemigos y vidas
La partida SHALL comenzar con 3 vidas. Si un enemigo activo, no aturdido y no
montado en un ingrediente está a menos de 16/32 tiles horizontales y 18/32
tiles verticales del chef, el chef SHALL perder una vida y la partida SHALL
pasar a la fase `dying`, en la que nada se mueve. Al terminar `dying` con vidas
restantes, chef y enemigos SHALL volver a sus posiciones iniciales, conservando
el estado de los ingredientes, y la partida SHALL pasar a `ready`; si era la
última vida, SHALL pasar a `gameOver`.

#### Scenario: Contacto con vidas restantes
- **WHEN** un enemigo no aturdido alcanza al chef con 2 vidas
- **THEN** queda 1 vida, la fase pasa a `dying` y, cuando termina, las
  posiciones se reinician y la fase pasa a `ready`

#### Scenario: Última vida
- **WHEN** un enemigo no aturdido alcanza al chef con 1 vida
- **THEN** la fase pasa a `dying` y, cuando termina, a `gameOver`

#### Scenario: Enemigo aturdido
- **WHEN** un enemigo aturdido coincide en posición con el chef
- **THEN** no se pierde ninguna vida

#### Scenario: Enemigo montado
- **WHEN** un enemigo montado en un ingrediente pasa junto al chef
- **THEN** no se pierde ninguna vida

#### Scenario: Ingredientes tras perder una vida
- **WHEN** el chef pierde una vida con segmentos pisados e ingredientes ya
  apilados
- **THEN** tras las fases de muerte y preparado los segmentos siguen pisados y
  los ingredientes siguen apilados

## ADDED Requirements

### Requirement: Velocidad y rebote de la caída
Un ingrediente que cae SHALL bajar a velocidad constante, 170/32 casillas por
segundo. Al golpear a otro ingrediente SHALL subir 20/32 casillas en 5 ticks,
quedarse quieto 13 ticks y seguir bajando a la misma velocidad hacia el mismo
soporte. Si su base alcanza a un ingrediente que ya está cayendo o rebotando,
SHALL rebotar igual sin cambiar la caída del otro. Al llegar a un piso SHALL
quedar quieto en él sin rebotar.

#### Scenario: Velocidad constante
- **WHEN** un ingrediente cae 3 casillas hasta un piso vacío
- **THEN** baja lo mismo en cada tick y llega a ese piso al cabo de 34 ticks

#### Scenario: Rebote al golpear
- **WHEN** la base de un ingrediente que cae alcanza la parte de arriba de otro
  quieto
- **THEN** el golpeado empieza a caer en ese tick, y el que golpea sube 20/32
  casillas en los 5 ticks siguientes, se queda quieto 13 ticks y vuelve a bajar
  a 170/32 casillas por segundo hasta su soporte

#### Scenario: Alcanzar a uno que ya cae
- **WHEN** la base de un ingrediente alcanza a otro que está rebotando
- **THEN** rebota igual y la caída del otro no cambia

### Requirement: Grosor de los ingredientes
Cada tipo de ingrediente SHALL tener un grosor fijo, el que se ve en su arte al
apilarlo: pan de abajo 7,4/32 casillas, carne 8,3/32, lechuga 4,8/32 y pan de
arriba 13/32. La parte de arriba de un ingrediente quieto SHALL quedar a su
grosor por encima de su base, en un piso o en el plato, y cada ingrediente
apilado SHALL quedar sobre el plato a la suma de los grosores de los que tiene
debajo.

#### Scenario: Golpear a una lechuga
- **WHEN** la base de un ingrediente que cae llega a 4,8/32 casillas por encima
  del piso en el que está quieta una lechuga, dentro de sus casillas
- **THEN** la lechuga es golpeada

#### Scenario: Altura en el plato
- **WHEN** en un plato están apilados el pan de abajo y la carne
- **THEN** el siguiente ingrediente de ese plato queda a 15,7/32 casillas por
  encima del plato

### Requirement: Enemigos montados en un ingrediente
Cuando el chef activa un ingrediente, todo enemigo activo, aturdido o no, que
esté sobre la plataforma de su fila dentro de sus casillas, y no en una
escalera, SHALL quedar montado en él. Con n enemigos montados, el ingrediente
SHALL caer 1 + 2n soportes seguidos, o menos si antes llega a su plato. En cada
piso intermedio SHALL detenerse 16 ticks y seguir hacia el soporte siguiente,
golpeando lo que encuentre como en cualquier caída. Un ingrediente golpeado
SHALL NOT llevar enemigos montados.

#### Scenario: Sin enemigos encima
- **WHEN** el chef activa un ingrediente sin ningún enemigo dentro de sus
  casillas
- **THEN** el ingrediente cae un solo soporte

#### Scenario: Un enemigo montado
- **WHEN** el chef activa el ingrediente más alto de una columna del nivel
  clásico con un enemigo dentro de sus casillas en su plataforma
- **THEN** el ingrediente baja tres pisos, se detiene 16 ticks en cada uno de
  los dos primeros, golpea de nuevo al ingrediente que encuentra en cada piso y
  termina su caída en el tercero

#### Scenario: Dos enemigos montados
- **WHEN** el chef activa el ingrediente más alto de una columna del nivel
  clásico con dos enemigos dentro de sus casillas
- **THEN** el ingrediente sigue cayendo hasta el plato, aunque le quedaran
  soportes por bajar

#### Scenario: Enemigo en la escalera
- **WHEN** el chef activa un ingrediente con un enemigo en una escalera que cruza
  su fila
- **THEN** ese enemigo no queda montado

### Requirement: Viaje de los enemigos montados
Un enemigo montado SHALL bajar con su ingrediente, a su misma altura y sin
andar, y SHALL NOT ser aplastado mientras va montado. Si el chef pierde una
vida durante el viaje, el enemigo SHALL volver a su posición inicial con los
demás y dejar de ir montado, y el ingrediente SHALL terminar la caída prevista
sin conceder la bonificación.

#### Scenario: Bajar con el ingrediente
- **WHEN** un ingrediente con un enemigo montado cae, rebota o se detiene en un
  piso intermedio
- **THEN** el enemigo está en cada tick a la misma altura que la base del
  ingrediente y en la misma posición horizontal que al montarse

#### Scenario: Perder una vida durante el viaje
- **WHEN** otro enemigo alcanza al chef mientras un ingrediente lleva un enemigo
  montado
- **THEN** tras `dying` el enemigo montado está en su posición inicial y, cuando
  el ingrediente termina su caída, no se concede bonificación

### Requirement: Bonificación por enemigos montados
Cuando un ingrediente con enemigos montados termina su caída, esos enemigos
SHALL salir del tablero como los aplastados y reaparecer a los 150 ticks, y se
SHALL conceder 500 puntos por el primero, doblando la bonificación con cada uno
más (1000 con dos, 2000 con tres, 4000 con cuatro…), sin cambiar el combo. Se
SHALL emitir un evento con el ingrediente, la posición de cada enemigo y los
puntos.

#### Scenario: Un enemigo
- **WHEN** termina su caída un ingrediente con un enemigo montado
- **THEN** se conceden 500 puntos, además de los 50 del ingrediente, el enemigo
  deja de estar activo y el combo no cambia

#### Scenario: Tres enemigos
- **WHEN** termina su caída un ingrediente con tres enemigos montados
- **THEN** se conceden 2000 puntos de bonificación y los tres reaparecen a los
  150 ticks en puntos de aparición del nivel
