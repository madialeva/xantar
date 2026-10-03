# gameplay-rules Specification

## Purpose
Formaliza como línea base las reglas de juego que hoy implementa el POC de
Xantar, para que la refactorización a un núcleo de simulación conserve la
jugabilidad y los cambios posteriores (segmentos de ingrediente, movimiento
sobre grafo, dificultad por nivel) puedan expresarse como modificaciones de
estas reglas.

## Requirements

### Requirement: Movimiento horizontal del chef
El chef SHALL desplazarse horizontalmente sobre una plataforma a 115/32 tiles
por segundo mientras haya entrada izquierda o derecha, orientándose hacia el
último sentido pulsado, y SHALL permanecer dentro del tramo continuo de
plataforma en el que se encuentra, con un margen de 12/32 tiles respecto a cada
extremo del tramo (en el nivel clásico, el tramo ocupa todo el ancho del
tablero). Con ambas direcciones pulsadas a la vez, el desplazamiento neto SHALL
ser nulo.

#### Scenario: Caminar a la derecha
- **WHEN** la entrada derecha se mantiene durante 60 ticks en una plataforma
- **THEN** el chef avanza 115/32 tiles y mira a la derecha

#### Scenario: Extremo del tramo
- **WHEN** el chef camina contra el extremo izquierdo de su tramo de plataforma
- **THEN** su posición se detiene a 12/32 tiles de ese extremo

### Requirement: Escaleras del chef
El chef SHALL poder engancharse a una escalera cuando hay entrada arriba o
abajo y existe, en esa dirección, un cruce de escalera con su plataforma a una
distancia horizontal no superior a 0,6 casillas de su posición; al engancharse
SHALL centrarse en la columna de la escalera. Sobre una escalera, el chef SHALL
moverse a 80/32 casillas por segundo únicamente mientras haya entrada arriba o
abajo, SHALL poder detenerse al soltar la entrada y SHALL poder invertir el
sentido en cualquier punto de la escalera. Cuando el chef está a 0,4 casillas
o menos de uno de los extremos de la escalera (la altura de una plataforma), la
entrada lateral SHALL hacerle pasar a la plataforma de ese extremo y caminar en
ese sentido; en el resto de la escalera la entrada lateral SHALL ignorarse. Al
alcanzar uno de sus extremos, el chef SHALL quedar sobre la plataforma de ese
extremo, desde la que puede caminar o engancharse a otra escalera. Sobre una
plataforma, la entrada lateral SHALL tener prioridad sobre la vertical: con
entrada lateral el chef camina y no se engancha a una escalera.

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
- **WHEN** el chef está sobre una escalera lejos de sus extremos y se pulsa
  izquierda
- **THEN** la posición horizontal no cambia

#### Scenario: Pasar a una plataforma intermedia
- **WHEN** el chef sube por una escalera, llega a 0,4 casillas o menos de una
  plataforma y se pulsa izquierda
- **THEN** pasa a esa plataforma y camina hacia la izquierda

#### Scenario: Pasar a una plataforma al bajar
- **WHEN** el chef baja por una escalera, llega a 0,4 casillas o menos de una
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
horizontalmente hacia él con las mismas inversiones. Al llegar al extremo de una
escalera, el enemigo SHALL reevaluar su decisión de inmediato en lugar de seguir
el sentido anterior. Un enemigo aturdido SHALL permanecer inmóvil.

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

### Requirement: Pimienta
El chef SHALL comenzar cada partida con 5 pimientas. Lanzar una pimienta con al
menos una disponible SHALL restarla, crear una nube a 24/32 tiles por delante
del chef y aturdir a todo enemigo activo que esté por delante del chef, a menos
de 44/32 tiles horizontales de la nube y a menos de 26/32 tiles verticales del
chef. El aturdimiento SHALL durar 300 ticks. Sin pimientas disponibles, la
acción no tiene efecto.

#### Scenario: Aturdir a un enemigo cercano
- **WHEN** el chef lanza pimienta con un enemigo a 1 tile por delante en la
  misma fila
- **THEN** la pimienta disponible disminuye en uno y el enemigo queda aturdido
  300 ticks

#### Scenario: Sin pimienta
- **WHEN** el chef no tiene pimientas y pulsa lanzar
- **THEN** no cambia ningún estado y no se emite evento de pimienta

### Requirement: Contacto con enemigos y vidas
La partida SHALL comenzar con 3 vidas. Si un enemigo activo y no aturdido está a
menos de 16/32 tiles horizontales y 18/32 tiles verticales del chef, el chef SHALL
perder una vida. Tras perder una vida con vidas restantes, chef y enemigos SHALL
volver a sus posiciones iniciales; al perder la última, el estado SHALL pasar a
`gameOver`.

#### Scenario: Contacto con vidas restantes
- **WHEN** un enemigo no aturdido alcanza al chef con 2 vidas
- **THEN** quedan 1 vida y las posiciones se reinician

#### Scenario: Última vida
- **WHEN** un enemigo no aturdido alcanza al chef con 1 vida
- **THEN** el estado pasa a `gameOver`

#### Scenario: Enemigo aturdido
- **WHEN** un enemigo aturdido coincide en posición con el chef
- **THEN** no se pierde ninguna vida

### Requirement: Fin de nivel
Cuando todas las hamburguesas del nivel estén completadas, el estado SHALL
pasar a `levelClear` y el número de nivel SHALL incrementarse en uno. Al
continuar, el tablero SHALL reconstruirse desde la descripción del nivel
conservando puntuación, vidas y pimientas.

#### Scenario: Última hamburguesa
- **WHEN** se completa la última hamburguesa pendiente
- **THEN** el estado es `levelClear` y el nivel aumenta en uno

#### Scenario: Continuar al siguiente nivel
- **WHEN** la vista solicita continuar desde `levelClear`
- **THEN** ingredientes, chef y enemigos vuelven a su posición inicial y se
  conservan puntuación, vidas y pimientas
