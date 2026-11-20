## MODIFIED Requirements

### Requirement: Tablero central intacto
El tablero SHALL ocupar siempre 624×630 unidades lógicas (39 columnas de 16 y 30
filas de 21) centradas horizontalmente en el área de juego, con la misma altura
que esta.
Ningún elemento del HUD SHALL dibujarse sobre el tablero salvo las pantallas de
fin de nivel y fin de partida.

#### Scenario: Fila superior despejada
- **WHEN** el chef o un enemigo está en la fila superior del tablero
- **THEN** se ve completo, sin texto ni botones del HUD encima

#### Scenario: Primera pantalla completa
- **WHEN** se dibuja el nivel clásico
- **THEN** sus 39 columnas caben en el tablero, de la escalera del borde
  izquierdo a la del borde derecho y los márgenes libres, sin recortes

### Requirement: Área de juego adaptable
La altura lógica del área de juego SHALL ser 630 unidades, la del tablero. Su
ancho lógico SHALL adaptarse a la proporción de la ventana entre un mínimo de
816 unidades (dos paneles de 96) y un máximo de 1512 unidades (proporción
2,4:1). Dentro de ese intervalo el área de juego SHALL llenar la ventana sin
bandas; fuera de él, el área SHALL ajustarse a la ventana conservando su
proporción, con bandas en el lado sobrante.

#### Scenario: Pantalla 16:9
- **WHEN** la ventana mide 1920×1080
- **THEN** el área de juego mide 1120×630 unidades lógicas, llena la ventana y
  cada panel lateral mide 248 unidades de ancho

#### Scenario: Móvil en horizontal
- **WHEN** la ventana tiene proporción 19,5:9
- **THEN** el área de juego llena la ventana sin bandas y los paneles son más
  anchos que en 16:9

#### Scenario: Pantalla 4:3
- **WHEN** la ventana mide 1024×768
- **THEN** el área de juego mide 840×630 unidades lógicas y llena la ventana
  sin bandas

#### Scenario: Pantalla 5:4
- **WHEN** la ventana mide 1280×1024
- **THEN** el área de juego de 816×630 se ajusta al ancho de la ventana y
  quedan bandas arriba y abajo

#### Scenario: Cambio de tamaño de la ventana
- **WHEN** se cambia el tamaño de la ventana o la orientación del dispositivo
  durante la partida
- **THEN** el tablero sigue centrado, los paneles se recolocan y la partida
  continúa sin reiniciarse
