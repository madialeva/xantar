# Spec Delta

## MODIFIED Requirements

### Requirement: Volumen y silencio configurables
Las opciones SHALL permitir cambiar el volumen de la música, el de los efectos
y el silencio global, y SHALL aplicarlos al momento y guardarlos. Izquierda y
derecha SHALL bajar y subir un volumen un punto, sin pasar de 0 ni de 10.
Elegir un volumen (tocarlo, hacer clic sobre él o confirmar) SHALL subirlo un
punto y, desde 10, SHALL volver a 0, para que con el dedo se pueda recorrer todo
el rango. La acción de silencio SHALL activar o desactivar el silencio en
cualquier pantalla, también durante la partida.

#### Scenario: Silenciar en partida
- **WHEN** el jugador pulsa M durante la partida
- **THEN** el juego queda en silencio y Opciones muestra el sonido como
  silenciado, también tras cerrar y volver a abrir el juego

#### Scenario: Tocar el volumen al máximo
- **WHEN** en Opciones el volumen de la música está en 10 y el jugador lo toca
- **THEN** el volumen pasa a 0, se aplica al momento y se guarda

#### Scenario: Flecha derecha al máximo
- **WHEN** el volumen de los efectos está en 10 y el jugador pulsa la derecha
- **THEN** el volumen sigue en 10
