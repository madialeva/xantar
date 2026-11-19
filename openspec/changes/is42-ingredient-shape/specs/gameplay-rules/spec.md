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
ingrediente y el segmento. Cada segmento SHALL tener una profundidad en
escalones: al pisar un segmento nuevo, ese segmento SHALL pasar a un escalón y
cada segmento ya pisado del mismo ingrediente SHALL bajar uno más. Fuera del
reposo sobre una plataforma, todas las profundidades SHALL ser cero.

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
