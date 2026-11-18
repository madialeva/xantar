## MODIFIED Requirements

### Requirement: Movimiento horizontal del chef
El chef SHALL desplazarse horizontalmente sobre una plataforma a 115 unidades
por segundo mientras haya entrada izquierda o derecha, orientándose hacia el
último sentido pulsado, y SHALL permanecer dentro del tramo continuo de
plataforma en el que se encuentra, con un margen de 12 unidades respecto a cada
extremo del tramo (en el nivel clásico, solo los tramos del piso superior y del
inferior ocupan todo el ancho del campo de juego). Con ambas direcciones
pulsadas a la vez, el desplazamiento neto SHALL ser nulo.

#### Scenario: Caminar a la derecha
- **WHEN** la entrada derecha se mantiene durante 60 ticks en una plataforma
- **THEN** el chef avanza 115 unidades y mira a la derecha

#### Scenario: Extremo del tramo
- **WHEN** el chef camina contra el extremo izquierdo de su tramo de plataforma
- **THEN** su posición se detiene a 12 unidades de ese extremo

#### Scenario: Tramo que no llega al borde
- **WHEN** el chef camina hacia la derecha por un tramo del nivel clásico que
  termina antes del borde del campo de juego
- **THEN** se detiene a 12 unidades del final del tramo, sin caer ni pasar al
  tramo siguiente de la misma fila

### Requirement: Escaleras del chef
El chef SHALL poder engancharse a una escalera cuando hay entrada arriba o
abajo y existe, en esa dirección, un cruce de escalera con su plataforma a una
distancia horizontal no superior a 19,2 unidades de su posición; al engancharse
SHALL centrarse en la columna de la escalera. Sobre una escalera, el chef SHALL
moverse a 80 unidades por segundo únicamente mientras haya entrada arriba o
abajo, SHALL poder detenerse al soltar la entrada y SHALL poder invertir el
sentido en cualquier punto de la escalera. Cuando el chef está a 12,8 unidades
o menos de uno de los extremos de la escalera (la altura de una plataforma), la
entrada lateral SHALL hacerle pasar a la plataforma de ese extremo y caminar en
ese sentido; en el resto de la escalera la entrada lateral SHALL ignorarse. Al
alcanzar uno de sus extremos, el chef SHALL quedar sobre la plataforma de ese
extremo, desde la que puede caminar o engancharse a otra escalera. Sobre una
plataforma, la entrada lateral SHALL tener prioridad sobre la vertical: con
entrada lateral el chef camina y no se engancha a una escalera.

#### Scenario: Subir por una escalera cercana
- **WHEN** el chef está a 9,6 unidades de una escalera que sube y mantiene
  arriba
- **THEN** se centra en la escalera y asciende hasta la plataforma superior

#### Scenario: Sin escalera en esa dirección
- **WHEN** se pulsa arriba y no hay escalera hacia arriba dentro de 19,2
  unidades
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
- **WHEN** el chef está sobre una escalera lejos de sus extremos y se pulsa
  izquierda
- **THEN** la posición horizontal no cambia

#### Scenario: Pasar a una plataforma intermedia
- **WHEN** el chef sube por una escalera, llega a 12,8 unidades o menos de una
  plataforma y se pulsa izquierda
- **THEN** pasa a esa plataforma y camina hacia la izquierda

#### Scenario: Pasar a una plataforma al bajar
- **WHEN** el chef baja por una escalera, llega a 12,8 unidades o menos de una
  plataforma y se pulsa derecha
- **THEN** pasa a esa plataforma y camina hacia la derecha

#### Scenario: Prioridad de la entrada lateral en la plataforma
- **WHEN** el chef está en una plataforma junto a una escalera y se pulsan
  arriba y derecha a la vez
- **THEN** camina hacia la derecha y no se engancha a la escalera

#### Scenario: Escaleras consecutivas
- **WHEN** el chef llega a una plataforma que tiene otra escalera en la misma
  columna y mantiene la misma dirección
- **THEN** se engancha a la escalera siguiente y continúa

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
- **THEN** sube 13 unidades en 5 ticks, se queda quieto 13 ticks, vuelve a
  bajar a 113 unidades por segundo hasta su sitio y queda apilado

#### Scenario: Último ingrediente del nivel
- **WHEN** el último ingrediente pendiente del nivel llega a su plato
- **THEN** la fase no pasa a `levelClear` hasta que ese ingrediente termina su
  rebote y queda quieto

### Requirement: Aplastamiento de enemigos
Mientras un ingrediente cae o rebota, SHALL aplastar en ese tick a todo enemigo
activo no montado en él que esté dentro de sus casillas en horizontal y cuya
altura, de los pies a 32 unidades por encima (la altura de un enemigo), contenga
la base del ingrediente. Cada aplastamiento SHALL incrementar el combo en uno y
conceder 100 puntos multiplicados por el valor del combo. El enemigo aplastado
SHALL reaparecer a los 150 ticks en uno de los puntos de aparición del nivel,
elegido con el generador aleatorio. El combo SHALL reiniciarse al perder una
vida.

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

### Requirement: Comportamiento de los enemigos
Cada enemigo activo SHALL recorrer las plataformas a 68 unidades por segundo
y reevaluar su decisión cada entre 30 y 66 ticks (intervalo elegido con el
generador aleatorio). Si el chef no está en el mismo tramo continuo de
plataforma que el enemigo, este SHALL dirigirse por el camino más corto del
grafo de navegación hacia el chef: caminar hasta el cruce de la primera escalera
de ese camino y, al llegar, recorrerla entera a 68 unidades por segundo en el
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

### Requirement: Pimienta
El chef SHALL comenzar cada partida con 5 pimientas. Lanzar una pimienta con al
menos una disponible SHALL restarla, crear una nube a 24 unidades por delante
del chef en la dirección de lanzamiento y aturdir a todo enemigo activo que esté
por delante del chef en esa dirección, a menos de 44 unidades de la nube a lo
largo de la dirección de lanzamiento y a menos de 26 unidades del chef en el eje
perpendicular. El aturdimiento SHALL durar 300 ticks. Sin pimientas
disponibles, la acción no tiene efecto.

La dirección de lanzamiento SHALL ser horizontal, hacia donde mira el chef,
cuando está sobre una plataforma, y vertical cuando está en una escalera: hacia
arriba o hacia abajo según su último movimiento vertical, que al agarrar la
escalera es el sentido con el que la agarró. El estado del chef y el evento de
pimienta lanzada SHALL exponer esa dirección (`left`, `right`, `up`, `down`).

#### Scenario: Aturdir a un enemigo cercano
- **WHEN** el chef lanza pimienta con un enemigo a 32 unidades por delante en la
  misma fila
- **THEN** la pimienta disponible disminuye en uno y el enemigo queda aturdido
  300 ticks

#### Scenario: Lanzar hacia arriba en una escalera
- **WHEN** el chef ha subido por una escalera y lanza pimienta con un enemigo
  bajando por ella a 32 unidades por encima
- **THEN** la nube aparece por encima del chef, el evento indica la dirección
  `up` y el enemigo queda aturdido

#### Scenario: Lanzar hacia abajo en una escalera
- **WHEN** el chef ha bajado por una escalera y lanza pimienta con un enemigo
  esperando en la plataforma del pie de la escalera a menos de 32 unidades
- **THEN** la nube aparece por debajo del chef, el evento indica la dirección
  `down` y el enemigo queda aturdido

#### Scenario: Enemigo detrás en la escalera
- **WHEN** el chef ha subido por una escalera y lanza pimienta con un enemigo
  justo por debajo de él
- **THEN** el enemigo no queda aturdido

#### Scenario: Agarrar la escalera sin moverse todavía
- **WHEN** el chef acaba de agarrar una escalera pulsando abajo y aún no se ha
  desplazado por ella
- **THEN** la dirección de lanzamiento es `down`

#### Scenario: Sin pimienta
- **WHEN** el chef no tiene pimientas y pulsa lanzar
- **THEN** no cambia ningún estado y no se emite evento de pimienta

### Requirement: Contacto con enemigos y vidas
La partida SHALL comenzar con 3 vidas. Si un enemigo activo, no aturdido y no
montado en un ingrediente está a menos de 16 unidades horizontales y 18
unidades verticales del chef, el chef SHALL perder una vida y la partida SHALL
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

### Requirement: Velocidad y rebote de la caída
Un ingrediente que cae SHALL bajar a velocidad constante, 113 unidades por
segundo, la del original a la escala del tablero (un píxel del original son 2
unidades). Al golpear a otro ingrediente SHALL subir 13 unidades en 5 ticks,
quedarse quieto 13 ticks y seguir bajando a la misma velocidad hacia el mismo
soporte. Si su base alcanza a un ingrediente que ya está cayendo o rebotando,
SHALL rebotar igual sin cambiar la caída del otro. Al llegar a un piso SHALL
quedar quieto en él sin rebotar.

#### Scenario: Velocidad constante
- **WHEN** un ingrediente cae 64 unidades (cuatro filas, dos alturas del chef)
  hasta un piso vacío
- **THEN** baja lo mismo en cada tick y llega a ese piso al cabo de 34 ticks

#### Scenario: Rebote al golpear
- **WHEN** la base de un ingrediente que cae alcanza la parte de arriba de otro
  quieto
- **THEN** el golpeado empieza a caer en ese tick, y el que golpea sube 13
  unidades en los 5 ticks siguientes, se queda quieto 13 ticks y vuelve a bajar
  a 113 unidades por segundo hasta su soporte

#### Scenario: Alcanzar a uno que ya cae
- **WHEN** la base de un ingrediente alcanza a otro que está rebotando
- **THEN** rebota igual y la caída del otro no cambia

### Requirement: Grosor de los ingredientes
Cada tipo de ingrediente SHALL tener un grosor fijo, el que se ve en su arte al
apilarlo: pan de abajo 7,4 unidades, carne 8,3, lechuga 4,8 y pan de arriba 13.
La parte de arriba de un ingrediente quieto SHALL quedar a su grosor por encima
de su base, en un piso o en el plato, y cada ingrediente apilado SHALL quedar
sobre el plato a la suma de los grosores de los que tiene debajo.

#### Scenario: Golpear a una lechuga
- **WHEN** la base de un ingrediente que cae llega a 4,8 unidades por encima
  del piso en el que está quieta una lechuga, dentro de sus casillas
- **THEN** la lechuga es golpeada

#### Scenario: Altura en el plato
- **WHEN** en un plato están apilados el pan de abajo y la carne
- **THEN** el siguiente ingrediente de ese plato queda a 15,7 unidades por
  encima del plato
