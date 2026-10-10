# Spec Delta

## MODIFIED Requirements

### Requirement: Eventos a efectos
La vista SHALL reaccionar a los eventos de simulación para producir los efectos
visuales y de interfaz del juego: destello de cámara al perder una vida, nube de
pimienta, actualización de la puntuación, pimientas, vidas y nivel en los
paneles laterales, mensaje de preparado durante `ready`, mensaje de nivel
completado durante `levelClear` y pantalla de fin de partida. Además SHALL
producir un adorno breve al pisar un segmento, al aterrizar un ingrediente, al
aplastar un enemigo y al completar una hamburguesa. Todos los efectos SHALL
dibujarse con los gráficos del tema activo y todos los textos SHALL mostrarse en
el idioma activo.

#### Scenario: Perder una vida
- **WHEN** la simulación emite el evento de chef golpeado
- **THEN** la vista muestra el destello de cámara, el chef mantiene la
  animación de golpeado mientras dura `dying` y el contador de vidas del panel
  se actualiza

#### Scenario: Preparado
- **WHEN** la fase pasa a `ready`
- **THEN** la vista muestra el mensaje de preparado sobre el tablero hasta que
  la fase pasa a `playing`

#### Scenario: Fin de partida
- **WHEN** la fase pasa a `gameOver`
- **THEN** la vista muestra la pantalla de fin de partida con la puntuación
  final y, al confirmar, vuelve al menú principal

#### Scenario: Aplastar un enemigo
- **WHEN** la simulación emite el evento de enemigo aplastado
- **THEN** la vista muestra un efecto de aplastamiento en la posición del
  evento, aunque el enemigo ya no esté activo

### Requirement: Paridad jugable con el POC
El juego SHALL mantener la jugabilidad del POC (mismas velocidades,
puntuaciones, vidas, pimientas y comportamiento de enemigos), con las
diferencias de redondeo a ticks documentadas y los cambios deliberados de flujo:
fases de preparado y de muerte, continuación automática del fin de nivel y
vuelta al menú desde el fin de partida.

#### Scenario: Partida completa
- **WHEN** un jugador completa un nivel y luego pierde todas las vidas
- **THEN** se suceden el mensaje de nivel completado, el preparado del nivel
  siguiente y la pantalla de fin de partida, y confirmar lleva al menú
  principal, desde donde una partida nueva empieza en estado inicial
