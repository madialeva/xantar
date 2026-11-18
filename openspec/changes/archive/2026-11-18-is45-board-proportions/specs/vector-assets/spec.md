## MODIFIED Requirements

### Requirement: Guía de estilo
El proyecto SHALL incluir una guía de estilo (en español en esta versión) que
fije el aspecto del arte renderizado (vista, iluminación, materiales y tamaños
de ingredientes y personajes) y, para el arte que sigue siendo vectorial, la
paleta como tokens con nombre, el grosor de trazo, los radios de esquina, el
tratamiento de sombras y brillos, la tipografía del HUD y las reglas de encaje
en la rejilla de 16 unidades lógicas. Todas las fuentes SVG del juego SHALL
colorearse solo con tokens de esa paleta.

#### Scenario: Revisar un SVG nuevo
- **WHEN** se añade una fuente SVG con un color que no corresponde a ningún
  token de la paleta
- **THEN** la comprobación automática de fuentes SVG falla e indica el fichero
  y el color

### Requirement: Rasterizado a la escala de dibujo
Antes de mostrar el juego, el sistema SHALL convertir cada gráfico del catálogo
en una textura con un tamaño en píxeles igual a su tamaño lógico multiplicado
por el nivel de escala de dibujo (1, 2 o 4), a partir de su fuente SVG o de su
imagen renderizada. En esta versión el nivel de escala SHALL ser 4. El tamaño
con que cada elemento aparece en la rejilla lógica SHALL ser el mismo con
cualquier nivel de escala.

#### Scenario: Nivel de escala 2
- **WHEN** se rasteriza un segmento de plataforma de una casilla con nivel de
  escala 2
- **THEN** la textura resultante mide 32 píxeles de ancho y ocupa 16 unidades
  lógicas en el tablero, igual que con la escala 4 de esta versión, que da 64
  píxeles

#### Scenario: Pantalla de alta densidad
- **WHEN** el juego se muestra a pantalla completa en una pantalla de 1920×1080
- **THEN** los bordes de piezas, ingredientes y personajes se ven nítidos
