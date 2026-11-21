# gameplay-rules Specification

## Purpose
Formaliza como línea base las reglas de juego que hoy implementa el POC de
Xantar, para que la refactorización a un núcleo de simulación conserve la
jugabilidad y los cambios posteriores (segmentos de ingrediente, movimiento
sobre grafo, dificultad por nivel) puedan expresarse como modificaciones de
estas reglas.

## Requirements

### Requirement: Movimiento horizontal del chef
El chef SHALL desplazarse horizontalmente sobre una plataforma a 86 unidades
por segundo mientras haya entrada izquierda o derecha, orientándose hacia el
último sentido pulsado, y SHALL permanecer dentro del tramo continuo de
plataforma en el que se encuentra, con un margen de 12 unidades respecto a cada
extremo del tramo (en el nivel clásico, solo los tramos del piso superior y del
inferior ocupan todo el ancho del campo de juego). Con ambas direcciones
pulsadas a la vez, el desplazamiento neto SHALL ser nulo.

#### Scenario: Caminar a la derecha
- **WHEN** la entrada derecha se mantiene durante 60 ticks en una plataforma
- **THEN** el chef avanza 86 unidades y mira a la derecha

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
moverse a 2,6875 filas por segundo (56,4 unidades por segundo; un tramo de
dos filas en 0,74 s, como en el original) únicamente mientras haya entrada
arriba o abajo, SHALL poder detenerse al soltar la entrada y SHALL poder invertir el
sentido en cualquier punto de la escalera. Cuando el chef está a 12,8 unidades
o menos de uno de los extremos de la escalera (la altura de una plataforma), la
entrada lateral SHALL hacerle pasar a la plataforma de ese extremo y caminar en
ese sentido; en el resto de la escalera la entrada lateral SHALL ignorarse. Al
alcanzar uno de sus extremos, el chef SHALL quedar sobre la plataforma de ese
extremo, desde la que puede caminar o engancharse a otra escalera; pero si en
ese cruce la escalera sigue en la misma columna y en el mismo sentido, SHALL
pasar a la escalera siguiente en ese mismo tick, con lo que le quede del paso,
sin detenerse ni quedar sobre la plataforma. Sobre una plataforma, la entrada
lateral SHALL tener prioridad sobre la vertical: con entrada lateral el chef
camina y no se engancha a una escalera.

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
- **THEN** pasa a la escalera siguiente en ese mismo tick y sigue a 2,6875
  filas por segundo, sin detenerse en el cruce

#### Scenario: Cruce bajo un ingrediente
- **WHEN** el chef sube sin parar por escaleras consecutivas cuya columna pasa
  bajo un ingrediente quieto
- **THEN** no pisa ningún segmento de ese ingrediente

### Requirement: Pisado de segmentos
Cada ingrediente SHALL estar formado por tantos segmentos de una casilla como
indique el nivel (2, 3 o 4; 4 por defecto). El chef SHALL pisar un segmento de
un ingrediente quieto cuando, estando sobre la plataforma de la fila del
ingrediente, su posición horizontal entra en la casilla de ese segmento; el chef
SHALL NOT pisar segmentos mientras está sobre una escalera. Un segmento pisado
SHALL permanecer pisado hasta que el ingrediente caiga o el chef pierda una
vida, aunque el chef se aleje. Cuando todos los segmentos de un ingrediente
están pisados, el ingrediente SHALL activarse. Al terminar su caída sobre otra
plataforma, sus segmentos SHALL volver a estar sin pisar. Cada segmento pisado
SHALL emitir un evento con el ingrediente y el segmento. Cada segmento SHALL
tener una profundidad en escalones: al pisar un segmento nuevo, ese segmento
SHALL pasar a un escalón y cada segmento ya pisado del mismo ingrediente SHALL
bajar uno más. Fuera del reposo sobre una plataforma, todas las profundidades
SHALL ser cero.

#### Scenario: Recorrido completo
- **WHEN** el chef camina por la plataforma de un lado a otro de un ingrediente
  sin salirse
- **THEN** pisa todos los segmentos en orden y el ingrediente se activa al
  pisar el último

#### Scenario: Recorrido abandonado
- **WHEN** el chef pisa dos segmentos de un ingrediente de cuatro, se aleja y
  vuelve más tarde a pisar los otros dos sin haber perdido ninguna vida
- **THEN** el ingrediente se activa al pisar el cuarto, sin haber reiniciado los
  dos primeros

#### Scenario: Recorrido interrumpido por perder una vida
- **WHEN** el chef pisa dos segmentos de un ingrediente de cuatro, pierde una
  vida y, al volver a jugar, pisa los otros dos
- **THEN** el ingrediente no se activa: los dos primeros volvieron a estar sin
  pisar al perder la vida

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

#### Scenario: Rampa al cruzar un ingrediente
- **WHEN** el chef pisa de izquierda a derecha los tres primeros segmentos de
  un ingrediente de cuatro
- **THEN** sus profundidades son 3, 2, 1 y 0 escalones

#### Scenario: Rampa en sentido contrario
- **WHEN** el chef pisa de derecha a izquierda los tres últimos segmentos de un
  ingrediente de cuatro
- **THEN** sus profundidades son 0, 1, 2 y 3 escalones

#### Scenario: Volver a pisar un segmento pisado
- **WHEN** el chef vuelve a pasar por un segmento que ya estaba pisado
- **THEN** ninguna profundidad del ingrediente cambia

#### Scenario: Profundidad al caer
- **WHEN** el chef pisa el último segmento y el ingrediente empieza a caer
- **THEN** todas sus profundidades son cero mientras cae

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

### Requirement: Comportamiento de los enemigos
Cada enemigo activo SHALL recorrer las plataformas a su velocidad de andar del
momento (requisito «Velocidad de los enemigos según la dificultad») y reevaluar
su decisión cada entre 30 y 66 ticks (intervalo elegido con el generador
aleatorio). Si el chef no está en el mismo tramo continuo de plataforma que el
enemigo, este SHALL dirigirse por el camino más corto del grafo de navegación
hacia el chef: caminar hasta el cruce de la primera escalera de ese camino y,
al llegar, recorrerla entera a su velocidad de subir del momento en el sentido
decidido en ese momento. Si el chef está en el mismo tramo, el enemigo SHALL
dirigirse hacia él, con una probabilidad del 20 % de invertir el sentido en
cada decisión. Si no existe camino hasta el chef, SHALL dirigirse
horizontalmente hacia él con las mismas inversiones. Al llegar al extremo de una
escalera, el enemigo SHALL reevaluar su decisión de inmediato en lugar de seguir
el sentido anterior. Un enemigo aturdido SHALL permanecer inmóvil y uno montado
en un ingrediente SHALL moverse solo con el ingrediente.

#### Scenario: Chef en otra fila
- **WHEN** un enemigo está en la plataforma superior y el chef en la inferior
- **THEN** el enemigo se dirige a una escalera descendente y baja por ella

#### Scenario: Subir más despacio que andar
- **WHEN** en Normal, al empezar el tablero, un enemigo recorre una escalera
- **THEN** avanza por ella a 1,6875 filas por segundo (35,4 unidades): la
  mitad de filas por segundo que casillas por segundo anda

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
unidades verticales del chef y el tablero no está asegurado, el chef SHALL
perder una vida y la partida SHALL pasar a la fase `dying`, en la que nada se
mueve (con el tablero asegurado, ver «Muerte aparente con el tablero
asegurado»). Al terminar `dying` con vidas restantes, chef y enemigos SHALL volver a
sus posiciones iniciales, los ingredientes quietos en una plataforma SHALL
quedar con todos sus segmentos sin pisar, los apilados SHALL seguir apilados y
los que estaban cayendo SHALL terminar su caída al volver a `playing`; la
partida SHALL pasar a `ready`. Si era la última vida, SHALL pasar a `gameOver`.

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

#### Scenario: Tablero asegurado
- **WHEN** un enemigo no aturdido alcanza al chef con el tablero asegurado
- **THEN** no se pierde ninguna vida; la fase pasa a `dying` y, al completarse
  el tablero, a `levelClear`

#### Scenario: Ingredientes tras perder una vida
- **WHEN** el chef pierde una vida con segmentos pisados en varios
  ingredientes quietos y otros ingredientes ya apilados
- **THEN** tras las fases de muerte y preparado los ingredientes quietos tienen
  todos sus segmentos sin pisar y profundidad cero, y los apilados siguen
  apilados

#### Scenario: Ingrediente cayendo al perder una vida
- **WHEN** el chef pierde una vida mientras un ingrediente cae hacia el piso
  de abajo
- **THEN** el ingrediente se queda quieto durante `dying` y `ready` y termina
  su caída al volver a `playing`

### Requirement: Fin de nivel
Cuando todas las hamburguesas del nivel estén completadas, la partida SHALL
pasar a `levelClear` y el número de nivel SHALL incrementarse en uno. Al
terminar `levelClear`, o antes si llega la acción de confirmar, el tablero SHALL
reconstruirse desde la descripción de la pantalla que corresponde al nuevo
nivel (requisito «Orden de las pantallas») conservando puntuación, vidas y
pimientas, y la partida SHALL pasar a `ready`.

#### Scenario: Última hamburguesa
- **WHEN** se completa la última hamburguesa pendiente
- **THEN** la fase es `levelClear` y el nivel aumenta en uno

#### Scenario: Continuar al siguiente nivel
- **WHEN** pasan 3 s en `levelClear` sin ninguna entrada
- **THEN** ingredientes, chef y enemigos vuelven a su posición inicial, se
  conservan puntuación, vidas y pimientas y la fase pasa a `ready`

#### Scenario: Adelantar la continuación
- **WHEN** llega la acción de confirmar durante `levelClear`
- **THEN** el tablero se reconstruye en ese mismo tick y la fase pasa a `ready`

#### Scenario: Tablero de otra pantalla
- **WHEN** en Normal termina `levelClear` tras completar la primera pantalla
- **THEN** el tablero nuevo tiene los pisos, los ingredientes, los platos, el
  inicio del chef y los enemigos de la segunda pantalla, fuera del tablero
  hasta que pasan sus retrasos de entrada

### Requirement: Velocidad y rebote de la caída
Un ingrediente que cae SHALL bajar a velocidad constante, 7,0625 filas por
segundo (148,3 unidades por segundo), la del original a la escala del tablero
(un píxel del original es 1/8 de fila). Al golpear a otro ingrediente SHALL subir 13 unidades en 5 ticks,
quedarse quieto 13 ticks y seguir bajando a la misma velocidad hacia el mismo
soporte. Si su base alcanza a un ingrediente que ya está cayendo o rebotando,
SHALL rebotar igual sin cambiar la caída del otro. Al llegar a un piso SHALL
quedar quieto en él sin rebotar.

#### Scenario: Velocidad constante
- **WHEN** un ingrediente cae cuatro filas (84 unidades, dos tramos de
  escalera) hasta un piso vacío
- **THEN** baja lo mismo en cada tick y llega a ese piso al cabo de 34 ticks

#### Scenario: Rebote al golpear
- **WHEN** la base de un ingrediente que cae alcanza la parte de arriba de otro
  quieto
- **THEN** el golpeado empieza a caer en ese tick, y el que golpea sube 13
  unidades en los 5 ticks siguientes, se queda quieto 13 ticks y vuelve a bajar
  a 7,0625 filas por segundo hasta su soporte

#### Scenario: Alcanzar a uno que ya cae
- **WHEN** la base de un ingrediente alcanza a otro que está rebotando
- **THEN** rebota igual y la caída del otro no cambia

### Requirement: Grosor de los ingredientes
Cada tipo de ingrediente SHALL tener un grosor fijo, el que se ve en su arte al
apilarlo: pan de abajo 11 unidades, carne 12, lechuga 8 y pan de arriba 13.
La parte de arriba de un ingrediente quieto SHALL quedar a su grosor por encima
de su base, en un piso o en el plato, y cada ingrediente apilado SHALL quedar
sobre el plato a la suma de los grosores de los que tiene debajo.

#### Scenario: Golpear a una lechuga
- **WHEN** la base de un ingrediente que cae llega a 8 unidades por encima del
  piso en el que está quieta una lechuga, dentro de sus casillas
- **THEN** la lechuga es golpeada

#### Scenario: Altura en el plato
- **WHEN** en un plato están apilados el pan de abajo y la carne
- **THEN** el siguiente ingrediente de ese plato queda a 23 unidades por
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

### Requirement: Entrada de los enemigos
Al empezar cada tablero y al volver a `ready` tras perder una vida, los
enemigos SHALL estar fuera del tablero. Cuando pasa el retraso de su entrada,
contado desde que empieza `playing`, cada enemigo SHALL aparecer en su
marcador y, si está en una pasarela, entrar andando por ella a su velocidad de
andar del momento hasta la plataforma, desde donde persigue al chef. Mientras
entra SHALL comportarse como un enemigo activo.

#### Scenario: Nadie en el tablero al empezar
- **WHEN** empieza la fase `playing` de un tablero cuyas entradas tienen
  retrasos de 500 ms o más
- **THEN** no hay ningún enemigo activo en el tablero hasta que pasa el primer
  retraso

#### Scenario: Entrar por una pasarela
- **WHEN** pasa el retraso de un enemigo cuyo marcador está en el extremo
  exterior de una pasarela de cuatro casillas
- **THEN** aparece en el marcador, avanza cada tick a su velocidad de andar
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

### Requirement: Velocidad de los enemigos según la dificultad
Los enemigos SHALL andar a 54 unidades por segundo y subir o bajar escaleras a
1,6875 filas por segundo (35,4 unidades), multiplicadas por el factor de ritmo
de la dificultad de la partida. En
Fácil el factor SHALL ser siempre 0,85 y en Difícil, siempre 1,25. En Normal
SHALL seguir la curva del requisito «Curva de ritmo en Normal». Una partida
creada sin indicar la dificultad SHALL ser Normal. La dificultad SHALL NOT
cambiar la velocidad del chef ni la de las caídas.

#### Scenario: Fácil
- **WHEN** en una partida en Fácil un enemigo anda 60 ticks seguidos por una
  plataforma, al empezar el tablero o pasados dos minutos de juego
- **THEN** avanza 45,9 unidades

#### Scenario: Difícil
- **WHEN** en una partida en Difícil un enemigo sube por una escalera durante
  60 ticks al empezar el tablero
- **THEN** sube 2,109 filas (44,3 unidades)

#### Scenario: Normal al empezar el tablero
- **WHEN** en una partida en Normal, en el nivel 1, un enemigo anda 60 ticks y
  luego sube por una escalera otros 60, antes de 1305 ticks de juego
- **THEN** avanza 54 unidades andando y sube 1,6875 filas (35,4 unidades) por
  la escalera

#### Scenario: Sin dificultad indicada
- **WHEN** se crea una partida sin indicar la dificultad
- **THEN** los enemigos siguen la curva de Normal

### Requirement: Curva de ritmo en Normal
En Normal, el factor de ritmo SHALL recorrer los escalones 1, 1,03, 1,07 y
1,25. Cada tablero SHALL empezar en el primer escalón, salvo desde el nivel 4,
que SHALL empezar en el tercero. El factor SHALL subir un escalón cada 1305
ticks (21,75 s) de tiempo de juego, sin pasar del último. El tiempo de juego
SHALL contar solo los ticks de `playing` y SHALL volver a cero al empezar cada
tablero y al volver a jugar tras perder una vida.

#### Scenario: Escalones del nivel 1
- **WHEN** en Normal, en el nivel 1, han pasado 1305, 2610 y 3915 ticks de
  juego sin perder ninguna vida
- **THEN** el factor de ritmo es 1,03, 1,07 y 1,25, respectivamente

#### Scenario: Tope de la curva
- **WHEN** en Normal, en el nivel 1, han pasado 10 000 ticks de juego sin
  perder ninguna vida
- **THEN** el factor de ritmo es 1,25

#### Scenario: Perder una vida
- **WHEN** en Normal, con el factor de ritmo en 1,25, el chef pierde una vida
  y termina `ready`
- **THEN** los enemigos vuelven a entrar con el factor de ritmo en 1

#### Scenario: Tablero nuevo
- **WHEN** en Normal se completa el nivel 1 con el factor de ritmo en 1,25
- **THEN** el nivel 2 empieza con el factor de ritmo en 1

#### Scenario: Desde el nivel 4
- **WHEN** en Normal empieza el nivel 4 y pasan 1305 ticks de juego
- **THEN** el factor de ritmo es 1,07 al empezar y 1,25 a los 1305 ticks

#### Scenario: Tiempo fuera de juego
- **WHEN** la partida pasa 1305 ticks entre `ready`, `dying` y la pausa
- **THEN** el factor de ritmo no cambia

### Requirement: Tablero asegurado
Cuando el chef suelta un ingrediente y las caídas en curso, junto con las que
estas provoquen, bastan para completar todas las hamburguesas sin más pisadas,
el tablero SHALL quedar asegurado desde ese tick hasta que se reconstruye. Con
el tablero asegurado, el contacto con un enemigo SHALL NOT quitar vidas; el
chef SHALL caer como en el requisito «Muerte aparente con el tablero
asegurado». Sin contacto, el chef SHALL seguir jugando y el nivel SHALL
completarse como siempre.

#### Scenario: Último ingrediente camino del plato
- **WHEN** el chef pisa el último segmento del único ingrediente que falta,
  situado en el piso más bajo, y un enemigo le alcanza antes de que ese
  ingrediente llegue al plato
- **THEN** no se pierde ninguna vida, la fase pasa a `dying` y, al quedar
  completa la hamburguesa, a `levelClear` con el nivel aumentado en uno

#### Scenario: Ingrediente con enemigos montados desde un piso superior
- **WHEN** el chef suelta desde dos pisos por encima del más bajo el último
  ingrediente que falta, con un enemigo montado que lo hará bajar hasta el
  plato, y otro enemigo le alcanza durante la caída
- **THEN** no se pierde ninguna vida y el nivel se completa al llegar el
  ingrediente al plato

#### Scenario: Cadena que completa el tablero
- **WHEN** solo faltan los dos ingredientes de una columna, el chef suelta el
  de arriba con un enemigo montado, este golpea al de abajo, quieto en el piso
  más bajo, y los dos acaban en el plato, y un enemigo alcanza al chef antes de
  que lleguen
- **THEN** no se pierde ninguna vida, porque el tablero quedó asegurado en el
  tick en que el chef soltó el de arriba

#### Scenario: Contacto en el mismo tick
- **WHEN** en el mismo tick el chef pisa el último segmento del ingrediente que
  completa el tablero y un enemigo le alcanza
- **THEN** no se pierde ninguna vida

#### Scenario: Sin contacto
- **WHEN** el chef suelta el último ingrediente y ningún enemigo le alcanza
  antes de que se complete la hamburguesa
- **THEN** la fase sigue en `playing` hasta que pasa a `levelClear`

#### Scenario: Caída que no basta
- **WHEN** el chef suelta un ingrediente que se quedará en un piso intermedio,
  aún faltan ingredientes por bajar y un enemigo le alcanza
- **THEN** pierde una vida como siempre

### Requirement: Muerte aparente con el tablero asegurado
Si un enemigo alcanza al chef con el tablero asegurado, SHALL emitirse el
evento de chef golpeado sin restar ninguna vida y la partida SHALL pasar a
`dying`. En ella los enemigos SHALL quedarse quietos, salvo los montados, que
bajan con su ingrediente, y las caídas SHALL seguir con sus golpes,
aplastamientos y puntos. En el tick en que se completa la última hamburguesa,
la partida SHALL pasar a `levelClear` con el nivel aumentado en uno, sin
esperar a que se cumplan los 2 s de `dying`.

#### Scenario: Atrapado mientras cae el último ingrediente
- **WHEN** un enemigo alcanza al chef con 3 vidas mientras el último
  ingrediente cae hacia su plato
- **THEN** se emite el evento de chef golpeado con 3 vidas, la fase pasa a
  `dying`, el ingrediente sigue cayendo y, al completarse la hamburguesa, la
  fase pasa a `levelClear` con 3 vidas

#### Scenario: Enemigos quietos
- **WHEN** el chef está en `dying` con el tablero asegurado
- **THEN** ningún enemigo que no vaya montado cambia de posición

#### Scenario: Enemigo montado mientras el chef está caído
- **WHEN** el chef está en `dying` con el tablero asegurado y el último
  ingrediente baja con un enemigo montado
- **THEN** el enemigo baja con el ingrediente y, al quedar este quieto, sale
  del tablero con su bonificación

#### Scenario: Revivir enseguida
- **WHEN** la última hamburguesa se completa 10 ticks después de que atrapen al
  chef con el tablero asegurado
- **THEN** la fase pasa a `levelClear` en ese tick, antes de los 2 s de
  `dying`

### Requirement: Orden de las pantallas
Cada tablero SHALL jugarse en la pantalla que corresponde a su número de nivel,
siguiendo el orden de las pantallas del juego: en Normal y en Difícil, una
pantalla por nivel, y en Fácil, cada pantalla en dos niveles seguidos. Después
de la última pantalla SHALL volverse a la primera. Perder una vida SHALL NOT
cambiar de pantalla, y una partida nueva SHALL empezar en el nivel 1, en la
primera pantalla.

#### Scenario: Pantalla siguiente en Normal
- **WHEN** en Normal se completa el nivel 1
- **THEN** el nivel 2 se juega en la segunda pantalla

#### Scenario: Vuelta a la primera pantalla
- **WHEN** en Difícil se completa el nivel 4, que se juega en la cuarta y
  última pantalla
- **THEN** el nivel 5 se juega en la primera pantalla

#### Scenario: Cada pantalla dos veces en Fácil
- **WHEN** en Fácil se completan los niveles 1 y 2
- **THEN** los dos se han jugado en la primera pantalla y el nivel 3 se juega
  en la segunda

#### Scenario: Vuelta en Fácil
- **WHEN** en Fácil se completa el nivel 8, que se juega en la cuarta pantalla
- **THEN** el nivel 9 se juega en la primera pantalla

#### Scenario: Perder una vida
- **WHEN** el chef pierde una vida en la tercera pantalla y le quedan vidas
- **THEN** la partida sigue en la tercera pantalla, con el mismo nivel

#### Scenario: Partida nueva
- **WHEN** se empieza una partida nueva después de llegar a la tercera pantalla
- **THEN** el nivel es 1 y el tablero es el de la primera pantalla
