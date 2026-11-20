## MODIFIED Requirements

### Requirement: Ajustes persistentes
El juego SHALL guardar en el almacenamiento local del navegador el idioma, la
mejor puntuación, el volumen de la música, el volumen de los efectos, el
silencio, las teclas asignadas a cada acción reasignable y la dificultad
(Fácil, Normal o Difícil), en un único registro versionado. Los ajustes SHALL
leerse al arrancar y guardarse al cambiar. El almacenamiento SHALL funcionar
igual en el navegador y en la aplicación de escritorio. Un registro guardado
antes de existir los campos de sonido, teclas o dificultad SHALL seguir
leyéndose, con esos campos en sus valores por defecto (Normal para la
dificultad), y un registro que conserve el campo de tema de versiones
anteriores SHALL leerse igual, ignorando ese campo.

#### Scenario: Ajustes tras reiniciar
- **WHEN** el jugador elige inglés, cierra el juego y lo vuelve a abrir
- **THEN** el juego arranca en inglés

#### Scenario: Sonido y teclas tras reiniciar
- **WHEN** el jugador pone la música a 3, silencia el juego y asigna X a la
  pimienta, cierra el juego y lo vuelve a abrir
- **THEN** la música está a 3, el juego está en silencio y X lanza la pimienta

#### Scenario: Dificultad tras reiniciar
- **WHEN** el jugador elige Fácil, cierra el juego y lo vuelve a abrir
- **THEN** la dificultad sigue en Fácil

#### Scenario: Registro anterior
- **WHEN** el registro guardado solo tiene idioma, tema y récord
- **THEN** se conservan el idioma y el récord, el tema se ignora y el sonido,
  las teclas y la dificultad toman sus valores por defecto

#### Scenario: Registro sin dificultad
- **WHEN** el registro guardado tiene todos los campos salvo la dificultad
- **THEN** se conservan los demás ajustes y la dificultad es Normal

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
- **THEN** el juego arranca con idioma según el navegador, récord 0, volúmenes
  y silencio por defecto, teclas por defecto y dificultad Normal

#### Scenario: Un campo no válido
- **WHEN** el registro tiene un idioma desconocido y un récord de 9 000
- **THEN** el idioma se toma del navegador y el récord sigue siendo 9 000

#### Scenario: Dificultad desconocida
- **WHEN** el registro tiene la dificultad `"imposible"` y la música a 3
- **THEN** la dificultad es Normal y la música sigue a 3

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
