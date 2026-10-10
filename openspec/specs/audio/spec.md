# audio Specification

## Purpose
Dar al juego sonido completo y controlable: música y efectos en canales con
volumen propio, efectos de estilo arcade generados por el propio juego y
sincronizados con lo que ocurre en la partida, silencio y respeto al foco de la
ventana.

## Requirements

### Requirement: Canales de música y efectos
El sonido del juego SHALL repartirse en dos canales, música y efectos, cada uno
con su volumen de 0 a 10, y SHALL existir un silencio global que los apaga
ambos sin perder sus volúmenes. Cambiar un volumen SHALL afectar también a los
sonidos que ya están sonando en ese canal. Si el navegador no ofrece Web Audio,
el juego SHALL funcionar sin efectos de sonido.

#### Scenario: Bajar la música sin tocar los efectos
- **WHEN** el jugador pone la música a 0 y deja los efectos a 8
- **THEN** la música de título deja de oírse y los sonidos de los menús siguen
  oyéndose

#### Scenario: Silencio y vuelta
- **WHEN** el jugador silencia el juego y luego quita el silencio
- **THEN** música y efectos vuelven con los volúmenes que tenían

### Requirement: Efectos de sonido generados por el juego
Los efectos de sonido SHALL generarse por síntesis al arrancar el juego, a
partir de descripciones incluidas en el código, sin ficheros de audio. La misma
descripción SHALL producir siempre el mismo sonido. Ningún efecto SHALL saturar
(amplitud fuera de rango) ni durar más de 3 s.

#### Scenario: Juego sin ficheros de efectos
- **WHEN** se compila el juego
- **THEN** el paquete no contiene ficheros de audio de efectos y todos los
  efectos suenan

### Requirement: Sonidos a partir de los eventos de la partida
La partida SHALL producir un efecto de sonido distinto al lanzar pimienta, al
pisar un segmento, al empezar a caer ingredientes, al aterrizar un ingrediente,
al aplastar un enemigo, al aturdir a un enemigo, al completar una hamburguesa,
al perder una vida, al empezar la fase de preparado, al completar el nivel y al
terminar la partida. Cuando un mismo efecto se repite muchas veces en muy poco
tiempo (varios segmentos o ingredientes a la vez), SHALL limitarse para no
sonar amontonado. Los menús SHALL sonar al mover la selección, al elegir y al
volver.

#### Scenario: Aplastar un enemigo
- **WHEN** un ingrediente aplasta a un enemigo
- **THEN** suena el efecto de aplastar

#### Scenario: Cascada de ingredientes
- **WHEN** en el mismo instante aterrizan tres ingredientes
- **THEN** el efecto de aterrizar suena sin acumular tres copias superpuestas
  a todo volumen

### Requirement: Volumen y silencio configurables
Las opciones SHALL permitir cambiar el volumen de la música, el de los efectos
y el silencio global, y SHALL aplicarlos al momento y guardarlos. La acción de
silencio SHALL activar o desactivar el silencio en cualquier pantalla, también
durante la partida.

#### Scenario: Silenciar en partida
- **WHEN** el jugador pulsa M durante la partida
- **THEN** el juego queda en silencio y Opciones muestra el sonido como
  silenciado, también tras cerrar y volver a abrir el juego

### Requirement: Audio y foco de la ventana
Cuando la ventana pierde el foco o la pestaña queda oculta, todo el sonido SHALL
pausarse, y SHALL reanudarse al volver.

#### Scenario: Cambiar de pestaña en el menú
- **WHEN** suena la música de título y el jugador cambia de pestaña
- **THEN** la música se detiene y continúa al volver a la pestaña

### Requirement: Primer gesto en web y escritorio
La música de título SHALL empezar con el primer gesto del jugador en el título,
igual en el navegador y en la aplicación de escritorio, sin excepciones de la
política de reproducción automática.

#### Scenario: Título en el móvil
- **WHEN** el jugador toca la pantalla de título en un navegador móvil
- **THEN** empieza a sonar la música de título
