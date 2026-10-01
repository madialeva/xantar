# Spec Delta

## Purpose

Define el papel de la capa de Phaser como adaptador de vista: ejecuta el núcleo
de simulación a paso fijo, dibuja su estado de forma suave y traduce sus
eventos en efectos visuales y de interfaz, sin contener reglas de juego.

## ADDED Requirements

### Requirement: La vista no contiene reglas de juego
La capa de Phaser SHALL limitarse a leer el estado de la simulación, recoger la
entrada del jugador, dibujar y reaccionar a eventos. Las decisiones de jugabilidad
(colisiones, puntuación, caída, inteligencia de enemigos, vidas) SHALL residir
exclusivamente en el núcleo.

#### Scenario: Cambiar una regla
- **WHEN** se modifica una regla de juego (por ejemplo, los puntos por ingrediente)
- **THEN** el cambio se realiza solo en el núcleo y la vista lo refleja sin
  modificaciones

### Requirement: Ejecución a paso fijo
En cada fotograma, la vista SHALL alimentar el acumulador con el tiempo real
transcurrido y ejecutar en el núcleo el número de ticks resultante. Una
pulsación puntual de pimienta detectada entre dos fotogramas SHALL presentarse
al primer tick del siguiente avance y no perderse aunque ese fotograma ejecute
cero ticks.

#### Scenario: Monitor de alta frecuencia
- **WHEN** el juego se ejecuta a 144 fotogramas por segundo
- **THEN** la velocidad de chef y enemigos es la misma que a 60 fotogramas por
  segundo

#### Scenario: Pulsación entre ticks
- **WHEN** el jugador pulsa la tecla de pimienta en un fotograma que no ejecuta
  ningún tick
- **THEN** la pimienta se lanza en el siguiente tick ejecutado

### Requirement: Dibujo interpolado
La vista SHALL dibujar chef, enemigos e ingredientes interpolando entre el estado
de los dos últimos ticks según la fracción de tick acumulada, de modo que el
movimiento sea continuo con independencia de la frecuencia del monitor. La
vista SHALL convertir unidades lógicas a píxeles multiplicando por el tamaño de
tile de la configuración.

#### Scenario: Movimiento suave
- **WHEN** el chef camina y el monitor refresca más rápido que la simulación
- **THEN** su posición dibujada cambia en cada fotograma

### Requirement: Eventos a efectos
La vista SHALL reaccionar a los eventos de simulación para producir los efectos
visuales y de interfaz que ya ofrece el POC: destello de cámara al perder una
vida, nube de pimienta, actualización del panel de puntuación, pimientas, vidas y
nivel, y pantallas de fin de nivel y fin de partida con confirmación mediante
Enter.

#### Scenario: Perder una vida
- **WHEN** la simulación emite el evento de chef golpeado
- **THEN** la vista muestra el destello de cámara y actualiza el contador de
  vidas

#### Scenario: Fin de partida
- **WHEN** el estado pasa a `gameOver`
- **THEN** la vista muestra la pantalla de fin de partida y, al pulsar Enter,
  solicita una partida nueva

### Requirement: Sin estado de juego persistente en temporizadores de Phaser
La vista SHALL NOT delegar en tweens ni temporizadores de Phaser ningún estado
del que dependan las reglas (caídas, aturdimiento, reapariciones). Las animaciones
de la vista MAY usar tweens únicamente como adorno visual sin efecto sobre la
simulación.

#### Scenario: Reiniciar el tablero durante una caída
- **WHEN** el tablero se reinicia mientras hay ingredientes cayendo
- **THEN** no queda ningún efecto pendiente que altere el tablero nuevo

### Requirement: Paridad jugable con el POC
Tras la refactorización, el juego SHALL mantener la jugabilidad del POC: mismas
velocidades, puntuaciones, vidas, pimientas, comportamiento de enemigos y flujo
de fin de nivel y fin de partida, con las diferencias de redondeo a ticks
documentadas en el diseño.

#### Scenario: Partida completa
- **WHEN** un jugador completa un nivel y luego pierde todas las vidas
- **THEN** se suceden las pantallas de nivel completado y de fin de partida y el
  reinicio con Enter deja el juego en estado inicial
