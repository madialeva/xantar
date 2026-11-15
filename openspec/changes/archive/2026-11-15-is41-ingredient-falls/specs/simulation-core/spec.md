## MODIFIED Requirements

### Requirement: Eventos de simulación
Cada tick SHALL poder producir eventos tipados que describen lo ocurrido
(ingredientes que empiezan a caer, ingrediente que toca un piso o su plato,
enemigo aplastado, enemigos montados que salen del tablero, enemigo aturdido,
hamburguesa completada, pimienta lanzada, chef golpeado, cambio de puntuación,
nivel completado, fin de partida). Los eventos SHALL contener los datos
necesarios para que la vista reaccione sin consultar reglas internas.

#### Scenario: Aplastar un enemigo
- **WHEN** un ingrediente en caída aplasta a un enemigo
- **THEN** se emite un evento de enemigo aplastado que identifica al enemigo,
  su posición y los puntos concedidos

#### Scenario: Tick sin sucesos
- **WHEN** un tick no provoca ningún suceso relevante
- **THEN** no se emite ningún evento

#### Scenario: Tocar un piso intermedio
- **WHEN** un ingrediente con un enemigo montado toca un piso en el que solo se
  detiene un momento
- **THEN** se emite el evento de ingrediente que toca un piso, aunque después
  siga cayendo

#### Scenario: Soltar a los enemigos montados
- **WHEN** termina su caída un ingrediente con dos enemigos montados
- **THEN** se emite un evento que identifica al ingrediente y a los dos
  enemigos con su posición, con 1000 puntos
