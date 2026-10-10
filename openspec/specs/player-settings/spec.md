# player-settings Specification

## Purpose
Guardar entre sesiones las preferencias del jugador (idioma y tema) y su mejor
puntuación, en el navegador y en la aplicación de escritorio, sin que unos datos
ausentes o dañados impidan jugar.

## Requirements

### Requirement: Ajustes persistentes
El juego SHALL guardar en el almacenamiento local del navegador el idioma, el
tema elegido ("Automático" o un id de tema), la mejor puntuación, el volumen de
la música, el volumen de los efectos, el silencio y las teclas asignadas a cada
acción reasignable, en un único registro versionado. Los ajustes SHALL leerse
al arrancar y guardarse al cambiar. El almacenamiento SHALL funcionar igual en
el navegador y en la aplicación de escritorio. Un registro guardado antes de
existir los campos de sonido y teclas SHALL seguir leyéndose, con esos campos
en sus valores por defecto.

#### Scenario: Ajustes tras reiniciar
- **WHEN** el jugador elige inglés y el tema `midnight`, cierra el juego y lo
  vuelve a abrir
- **THEN** el juego arranca en inglés con el tema `midnight`

#### Scenario: Sonido y teclas tras reiniciar
- **WHEN** el jugador pone la música a 3, silencia el juego y asigna X a la
  pimienta, cierra el juego y lo vuelve a abrir
- **THEN** la música está a 3, el juego está en silencio y X lanza la pimienta

#### Scenario: Registro anterior
- **WHEN** el registro guardado solo tiene idioma, tema y récord
- **THEN** se conservan esos tres valores y el sonido y las teclas toman sus
  valores por defecto

### Requirement: Datos ausentes o dañados
Si no hay ajustes guardados, o el registro no se puede leer, tiene una versión
desconocida o contiene valores no válidos, el juego SHALL usar los valores por
defecto en los campos afectados, conservar los válidos y seguir funcionando. Las
teclas asignadas SHALL validarse como un conjunto: si alguna acción no tiene
tecla, tiene más de dos, usa una tecla reservada o comparte tecla con otra
acción, todas las asignaciones SHALL tomar sus valores por defecto. Si el
almacenamiento no está disponible, el juego SHALL funcionar sin guardar.

#### Scenario: Registro dañado
- **WHEN** el registro guardado no es JSON válido
- **THEN** el juego arranca con idioma según el navegador, tema "Automático",
  récord 0, volúmenes y silencio por defecto y teclas por defecto

#### Scenario: Un campo no válido
- **WHEN** el registro tiene un idioma desconocido y un récord de 9 000
- **THEN** el idioma se toma del navegador y el récord sigue siendo 9 000

#### Scenario: Almacenamiento bloqueado
- **WHEN** el navegador impide usar el almacenamiento local
- **THEN** el juego funciona y simplemente no recuerda los ajustes

#### Scenario: Teclas en conflicto
- **WHEN** el registro asigna la misma tecla a la pimienta y a la pausa
- **THEN** todas las acciones usan las teclas por defecto y el resto de
  ajustes se conserva

#### Scenario: Volumen fuera de rango
- **WHEN** el registro tiene un volumen de música de 15
- **THEN** la música usa su volumen por defecto

### Requirement: Mejor puntuación
La mejor puntuación SHALL actualizarse cuando una partida termine, por fin de
partida o por salir al menú, con una puntuación mayor que la guardada. Una
puntuación menor o igual SHALL NOT modificarla.

#### Scenario: Partida peor que el récord
- **WHEN** una partida termina con 3 000 puntos y el récord es 8 000
- **THEN** el récord sigue siendo 8 000

#### Scenario: Tema guardado que ya no existe
- **WHEN** el tema guardado es un id que ya no está registrado
- **THEN** se trata como "Automático" y el juego avisa en la consola
