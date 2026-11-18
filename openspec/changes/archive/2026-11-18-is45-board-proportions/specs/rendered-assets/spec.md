## MODIFIED Requirements

### Requirement: Tamaño y encuadre de las imágenes
Cada imagen renderizada SHALL medir su tamaño lógico del catálogo multiplicado
por 4 y SHALL encuadrar el gráfico exactamente como lo coloca el juego: los
ingredientes apoyados en la base de su imagen y las partes de los personajes en
la posición y con el punto de giro de su rig. Todas las imágenes SHALL
compartir la misma iluminación, con la luz principal desde arriba a la
izquierda, para que el conjunto sea coherente.

#### Scenario: Segmento de pan
- **WHEN** se genera un segmento del pan de arriba, de tamaño lógico 16×18
- **THEN** la imagen mide 64×72 píxeles y el pan se apoya en su borde
  inferior

#### Scenario: Pierna de un enemigo
- **WHEN** el rig gira la pierna de un enemigo alrededor de la cadera
- **THEN** la cadera de la imagen coincide con el punto de giro y el zapato
  queda a la altura del suelo en la postura base
