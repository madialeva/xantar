# Spec Delta

## MODIFIED Requirements

### Requirement: Selección del tema
El tema con que se dibuja un nivel SHALL elegirse al empezar ese nivel con esta
prioridad: el parámetro de URL `theme` si está presente; después el tema que el
jugador haya elegido en las opciones, salvo que haya elegido "Automático";
después el campo `theme` del documento de nivel y, si no hay ninguno, el tema
por defecto. Un id que no corresponda a un tema registrado SHALL ignorarse con
un aviso en la consola que indique el id y su origen, y SHALL pasarse al
siguiente de la prioridad. Un tema desconocido SHALL NOT impedir jugar el nivel.

#### Scenario: Nivel que declara su tema
- **WHEN** se juega un nivel cuyo documento tiene `theme` igual a `midnight`,
  la opción del jugador es "Automático" y la URL no indica tema
- **THEN** el nivel se dibuja con el tema `midnight`

#### Scenario: Tema elegido por el jugador
- **WHEN** el jugador elige `midnight` en las opciones y juega el nivel clásico,
  que declara `classic`
- **THEN** el nivel se dibuja con el tema `midnight`

#### Scenario: Revestir el nivel clásico desde la URL
- **WHEN** se abre el juego con `?theme=midnight` y el jugador tiene elegido
  `classic` en las opciones
- **THEN** el nivel clásico se juega igual y se dibuja con la paleta y los
  gráficos de `midnight`

#### Scenario: Tema desconocido en el nivel
- **WHEN** se juega un nivel cuyo documento declara un tema que no está
  registrado, la opción del jugador es "Automático" y la URL no indica tema
- **THEN** el nivel se juega con el tema por defecto y la consola muestra un
  aviso con el id y que procede del nivel

#### Scenario: Tema desconocido en la URL
- **WHEN** se abre el juego con un id de tema que no está registrado en la URL
- **THEN** se usa el siguiente de la prioridad y la consola muestra un aviso
