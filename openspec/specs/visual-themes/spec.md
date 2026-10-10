# visual-themes Specification

## Purpose
Permitir revestir el mismo nivel con aspectos distintos: un tema define la
paleta y puede sustituir los gráficos de piezas y personajes sin tocar el nivel
ni las reglas.

## Requirements

### Requirement: Definición de tema
Un tema SHALL tener un identificador, un nombre, una paleta que asigna un color
a cada token de la guía de estilo y, opcionalmente, una fuente SVG propia para
cualquier gráfico identificado por el id de su pieza, ingrediente, personaje o
elemento del HUD. Los gráficos de las piezas SHALL identificarse por el id que
la pieza tiene en el registro de piezas. Un tema MAY activar el efecto de
resplandor (*bloom*) sobre la imagen del juego; el efecto SHALL NOT heredarse
del tema por defecto y SHALL omitirse sin error cuando el renderizador no lo
admita.

#### Scenario: Tema que solo cambia colores
- **WHEN** un tema define únicamente su paleta
- **THEN** todos los gráficos se dibujan con las fuentes del tema por defecto y
  los colores de la paleta de ese tema

#### Scenario: Tema que sustituye una pieza
- **WHEN** un tema aporta su propia fuente SVG para la pieza `platform`
- **THEN** las plataformas se dibujan con esa fuente y el resto de gráficos con
  las del tema por defecto

#### Scenario: Tema con resplandor
- **WHEN** se juega con el tema `midnight`, que activa el resplandor
- **THEN** la imagen del juego se dibuja con resplandor, y con el tema
  `classic` se dibuja sin él

### Requirement: Herencia del tema por defecto
El sistema SHALL tener un tema por defecto (`classic`) completo: paleta con
todos los tokens y una fuente SVG para cada gráfico. Cualquier token o gráfico
que un tema no defina SHALL tomarse del tema por defecto.

#### Scenario: Token ausente
- **WHEN** un tema no define el color del token de sombra
- **THEN** las sombras se dibujan con el color de ese token en el tema por
  defecto

### Requirement: Comprobación de temas
El sistema SHALL comprobar, en las pruebas automáticas, que cada tema
registrado solo usa tokens que existen en la paleta del tema por defecto, que
sus colores son válidos y que solo sustituye gráficos que existen en el tema
por defecto.

#### Scenario: Tema con un gráfico desconocido
- **WHEN** un tema aporta una fuente SVG para un id que no corresponde a
  ningún gráfico del tema por defecto
- **THEN** la comprobación de temas falla indicando el tema y el id

### Requirement: Selección del tema
El tema con que se dibuja un nivel SHALL elegirse al empezar ese nivel con esta
prioridad: el parámetro de URL `theme` si está presente, después el campo
`theme` del documento de nivel y, si no hay ninguno, el tema por defecto. Un id
que no corresponda a un tema registrado SHALL ignorarse con un aviso en la
consola que indique el id y su origen, y SHALL pasarse al siguiente de la
prioridad. Un tema desconocido SHALL NOT impedir jugar el nivel.

#### Scenario: Nivel que declara su tema
- **WHEN** se juega un nivel cuyo documento tiene `theme` igual a `midnight`
  y la URL no indica tema
- **THEN** el nivel se dibuja con el tema `midnight`

#### Scenario: Revestir el nivel clásico desde la URL
- **WHEN** se abre el juego con `?theme=midnight` y el nivel clásico declara
  el tema `classic`
- **THEN** el nivel clásico se juega igual y se dibuja con la paleta y los
  gráficos de `midnight`

#### Scenario: Tema desconocido en el nivel
- **WHEN** se juega un nivel cuyo documento declara un tema que no está
  registrado y la URL no indica tema
- **THEN** el nivel se juega con el tema por defecto y la consola muestra un
  aviso con el id y que procede del nivel

#### Scenario: Tema desconocido en la URL
- **WHEN** se abre el juego con un id de tema que no está registrado en la URL
- **THEN** se usa el tema del nivel (o el tema por defecto) y la consola
  muestra un aviso

### Requirement: Temas entregados
El juego SHALL incluir al menos dos temas: el tema por defecto (`classic`) y
el tema alternativo `midnight`, que cambia la paleta y sustituye al menos un
gráfico de pieza. El nivel clásico SHALL declarar el tema `classic`.

#### Scenario: Listado de temas
- **WHEN** se consulta el registro de temas
- **THEN** contiene `classic` y `midnight`
