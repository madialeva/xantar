## MODIFIED Requirements

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

## ADDED Requirements

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
