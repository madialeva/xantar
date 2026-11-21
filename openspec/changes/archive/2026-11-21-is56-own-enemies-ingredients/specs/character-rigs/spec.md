## MODIFIED Requirements

### Requirement: Personajes por partes
El chef y cada tipo de enemigo SHALL dibujarse como un conjunto de partes
independientes, cada una con su gráfico renderizado, su punto de giro y su
posición relativa: el chef con cuerpo, cabeza, ojos, gorro, coleta, dos brazos
y dos piernas, y cada enemigo con cuerpo, ojos y dos piernas; además, el
chorizo con la punta atada de su tripa y la mazorca con su falda de hojas, una
parte por delante del cuerpo y otra por detrás, y su mechón de pelo. Los brazos
del chef SHALL girar alrededor del hombro sin que se vea separación entre el
brazo y el cuerpo. El chef SHALL medir de pie 32 unidades (dos caracteres del
original a escala ×2) de los pies a lo alto del gorro, y los enemigos SHALL
tener aproximadamente la misma altura, con los pies en el suelo de su
plataforma. Para ir con las casillas, más anchas que las del original, cada
personaje SHALL dibujarse dos unidades más ancho por cada 32 de su arte (34/32)
sin cambiar su altura. La composición de cada personaje, incluidos su escala y
su ensanche, SHALL describirse como datos.

#### Scenario: Sustituir el gorro del chef
- **WHEN** se vuelve a generar el gráfico del gorro del chef con otro modelo
- **THEN** el chef se dibuja con ese gorro en la misma posición y con las mismas
  animaciones, sin cambiar la composición

#### Scenario: Brazos del chef al andar
- **WHEN** el chef anda y balancea los brazos
- **THEN** cada brazo gira alrededor de su hombro y sigue unido al cuerpo

#### Scenario: Altura del chef
- **WHEN** el chef está quieto de pie en una plataforma
- **THEN** mide 32 unidades, con una tolerancia de una unidad, de la suela de
  los zapatos a lo alto del gorro, y la suela queda sobre el suelo de la
  plataforma

#### Scenario: Ancho de los personajes
- **WHEN** el chef o un enemigo se dibuja en el tablero
- **THEN** se ve 34/32 veces más ancho que su arte a su escala, con la misma
  altura

#### Scenario: Altura de los enemigos
- **WHEN** el chef y un enemigo están de pie en la misma plataforma
- **THEN** la parte más alta de ambos queda a una altura parecida, ninguno pasa
  de 34 unidades de alto y los dos apoyan los pies en la plataforma

#### Scenario: Partes propias del chorizo y de la mazorca
- **WHEN** se dibujan un chorizo y una mazorca en su postura base
- **THEN** la punta atada del chorizo asoma por encima de su cuerpo, la falda de
  hojas de la mazorca rodea la base de la mazorca por delante y por detrás, con
  las piernas saliendo por debajo, y su mechón de pelo sale de la punta

## REMOVED Requirements

### Requirement: Bailes de los enemigos
**Reason**: La salchicha y el huevo salen del juego; el baile de cada enemigo
pasa a describirse con el chorizo, la cebolla y la mazorca.
**Migration**: Ver el requisito "Baile de cada enemigo".

## ADDED Requirements

### Requirement: Baile de cada enemigo
Al andar, cada enemigo SHALL bailar a su manera, al ritmo de sus piernas: el
chorizo se dobla de cóncavo a convexo mientras su punta atada se bambolea, la
cebolla gira como una moneda y la mazorca balancea la cadera mientras su falda
de hojas y su pelo van a la contra. La cebolla SHALL girar también en la
escalera. Los ojos SHALL acompañar al cuerpo. Al dejar de andar, el cuerpo
SHALL volver a su postura base.

#### Scenario: El chorizo baila
- **WHEN** el chorizo anda por una plataforma
- **THEN** su cuerpo pasa de doblado hacia un lado a doblado hacia el otro en
  cada paso, sus ojos se desplazan con la doblez y su punta atada se inclina a
  un lado y a otro

#### Scenario: La mazorca baila el hula
- **WHEN** la mazorca anda por una plataforma
- **THEN** su cuerpo se inclina hacia un lado en un paso y hacia el otro en el
  siguiente, sus ojos y su pelo siguen lo alto del cuerpo, y su falda de hojas y
  su pelo se inclinan hacia el lado contrario

#### Scenario: La cebolla gira al andar
- **WHEN** la cebolla anda por una plataforma
- **THEN** su rodaja pasa una y otra vez de verse de frente a verse de canto y
  de nuevo de frente, y sus ojos bajan y suben con el borde de arriba de la
  rodaja

#### Scenario: La cebolla gira en la escalera
- **WHEN** la cebolla sube por una escalera
- **THEN** su rodaja sigue girando mientras sube

#### Scenario: Cebolla aturdida
- **WHEN** la cebolla queda aturdida por la pimienta
- **THEN** deja de girar y se ve de frente mientras dura el aturdimiento

#### Scenario: Deja de andar
- **WHEN** un enemigo pasa de andar a trepar
- **THEN** su cuerpo vuelve a su postura base antes de empezar a trepar, y la
  falda, el pelo o la punta atada vuelven a la suya
