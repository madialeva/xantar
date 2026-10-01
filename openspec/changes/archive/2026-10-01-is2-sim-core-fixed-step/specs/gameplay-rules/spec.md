# Spec Delta

## Purpose

Formaliza como línea base las reglas de juego que hoy implementa el POC de
Xantar, para que la refactorización a un núcleo de simulación conserve la
jugabilidad y los cambios posteriores (segmentos de ingrediente, movimiento
sobre grafo, dificultad por nivel) puedan expresarse como modificaciones de
estas reglas.

## ADDED Requirements

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
El chef SHALL poder iniciar la subida o bajada cuando hay entrada arriba o
abajo y existe una escalera en esa dirección a una distancia horizontal no
superior a 0,6 tiles de su posición. Al iniciar, SHALL centrarse en la columna
de la escalera y recorrerla a 80/32 tiles por segundo hasta la plataforma de
destino, sin poder moverse lateralmente ni invertir el sentido durante el
recorrido.

#### Scenario: Subir por una escalera cercana
- **WHEN** el chef está a 0,3 tiles de una escalera que sube y se pulsa arriba
- **THEN** se centra en la escalera y asciende hasta la plataforma superior

#### Scenario: Sin escalera en esa dirección
- **WHEN** se pulsa arriba y no hay escalera hacia arriba dentro de 0,6 tiles
- **THEN** el chef no se mueve verticalmente

#### Scenario: Entrada durante la subida
- **WHEN** el chef está subiendo y se pulsa izquierda
- **THEN** la posición horizontal no cambia hasta terminar el recorrido

### Requirement: Recorrido de un ingrediente
Un ingrediente inmóvil se SHALL activar cuando el chef, caminando por su fila,
entra en su rango horizontal (con tolerancia de 2/32 tiles) por un extremo y
alcanza el extremo contrario (a 6/32 tiles o menos del borde). Salir del rango
o cambiar de fila antes de alcanzar el extremo contrario SHALL cancelar el
recorrido en curso.

#### Scenario: Recorrido completo
- **WHEN** el chef entra por el extremo izquierdo de un ingrediente y camina
  hasta su extremo derecho
- **THEN** el ingrediente se activa

#### Scenario: Recorrido abandonado
- **WHEN** el chef entra por el extremo izquierdo, sale del rango por el mismo
  lado y vuelve a entrar
- **THEN** el recorrido se reinicia y solo se activa tras alcanzar el extremo
  contrario

### Requirement: Caída en cadena
Al activarse un ingrediente, este y todos los ingredientes inmóviles situados
por debajo en su misma columna de caída SHALL caer una plataforma, empezando
por el más bajo y con 7 ticks de retardo entre ingredientes sucesivos. Cada
caída SHALL durar 12 ticks. Se SHALL conceder 50 puntos por cada ingrediente
afectado, en el instante de la activación.

#### Scenario: Activar el ingrediente superior
- **WHEN** se activa el ingrediente más alto de una columna de cuatro
- **THEN** caen los cuatro, el inferior primero, y se conceden 200 puntos

#### Scenario: Activar el ingrediente inferior
- **WHEN** se activa el ingrediente más bajo de una columna
- **THEN** cae solo ese ingrediente

### Requirement: Apilado en el plato
Un ingrediente situado en la última plataforma de su columna que cae SHALL
apilarse sobre el plato de esa columna, cada pieza sobre la anterior. Cuando
una columna tiene todos sus ingredientes ya aterrizados sobre el plato, la
hamburguesa se SHALL dar por completada, concediendo 400 puntos y una pimienta adicional. El orden de
apilado SHALL ser el orden de caída y conservar el orden vertical inicial de
la columna.

#### Scenario: Hamburguesa completa
- **WHEN** caen sobre el plato los cuatro ingredientes de una columna
- **THEN** se conceden 400 puntos, se suma una pimienta y se emite el evento de
  hamburguesa completada

### Requirement: Aplastamiento de enemigos
Cuando un ingrediente empieza a caer, todo enemigo activo dentro del rango
horizontal de su columna y con fila comprendida entre la fila de origen y la de
destino (ambas incluidas) SHALL quedar aplastado. Cada aplastamiento SHALL
incrementar el contador de combo en uno y conceder 100 puntos multiplicados por
el valor del combo. El enemigo aplastado SHALL reaparecer a los 150 ticks en la
fila superior, en una columna de escalera elegida con el generador aleatorio. El
combo SHALL reiniciarse al perder una vida.

#### Scenario: Aplastamientos consecutivos
- **WHEN** caídas sucesivas aplastan a dos enemigos antes de perder una vida
- **THEN** el primero concede 100 puntos y el segundo 200

#### Scenario: Reaparición
- **WHEN** han pasado 150 ticks desde un aplastamiento
- **THEN** el enemigo vuelve a estar activo en la fila superior sobre una
  columna de escalera

### Requirement: Comportamiento de los enemigos
Cada enemigo activo SHALL recorrer las plataformas a 68/32 tiles por segundo y
reevaluar su decisión cada entre 30 y 66 ticks (intervalo elegido con el
generador aleatorio). Si está en una fila distinta a la del chef, SHALL dirigirse
hacia la escalera de esa fila más cercana en horizontal que conduzca hacia la
fila del chef y, al llegar a ella, recorrerla a 68/32 tiles por segundo. Si está
en la misma fila, SHALL dirigirse hacia el chef, con una probabilidad del 20 %
de invertir el sentido en cada decisión. Un enemigo aturdido SHALL permanecer
inmóvil.

#### Scenario: Chef en otra fila
- **WHEN** un enemigo está en la fila superior y el chef en la inferior
- **THEN** el enemigo se dirige a una escalera descendente y baja por ella

#### Scenario: Chef en la misma fila
- **WHEN** enemigo y chef comparten fila
- **THEN** el enemigo se acerca horizontalmente al chef, salvo inversiones
  ocasionales de sentido

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
