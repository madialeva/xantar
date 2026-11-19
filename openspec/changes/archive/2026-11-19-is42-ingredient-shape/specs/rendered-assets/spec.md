## MODIFIED Requirements

### Requirement: Aspecto de los ingredientes
Los ingredientes SHALL parecer comida de verdad vista ligeramente desde arriba:
el pan de arriba dorado y brillante con semillas de sésamo, la carne a la brasa
con tonos claros y oscuros y marcas de parrilla, la lechuga como hojas rizadas
con volumen, y el pan de abajo con su corteza y la miga del corte. El pan de
arriba SHALL tener forma de cúpula también a lo largo: su altura SHALL bajar
hacia las puntas dentro del primer y el último segmento, hasta menos de la
mitad de su altura central, mientras que los segmentos centrales SHALL
conservar la altura completa. La carne SHALL ser un marrón de carne a la brasa
lo bastante claro para distinguirse a simple vista del fondo del tablero, y la
lechuga, la carne y el pan de abajo SHALL verse con un grosor cercano al del
original.

#### Scenario: Hamburguesa en el plato
- **WHEN** los cuatro ingredientes de una hamburguesa están apilados en su plato
- **THEN** la carne se ve sobre la miga del pan de abajo y la lechuga asoma
  entre la carne y el pan de arriba

#### Scenario: Pan de arriba visto de frente
- **WHEN** se dibuja un pan de arriba de cuatro segmentos sin pisar
- **THEN** su perfil sube desde unas puntas bajas hasta la altura completa a lo
  largo de los segmentos de los extremos, sin extremos verticales, y es plano a
  lo largo de los dos segmentos centrales

#### Scenario: Carne sobre el fondo del tablero
- **WHEN** se dibuja una carne quieta en un piso
- **THEN** su color medio es claramente más claro que el fondo del tablero,
  sin llegar al de los panes, y las marcas de parrilla siguen viéndose oscuras

#### Scenario: Lechuga y carne con volumen
- **WHEN** se dibujan una lechuga y una carne quietas junto al pan de arriba
- **THEN** la carne se ve casi tan gruesa como el pan de arriba y la lechuga
  algo más fina que la carne

#### Scenario: Pan de abajo con volumen
- **WHEN** se dibuja un pan de abajo quieto junto a una carne
- **THEN** se ve casi tan grueso como la carne, con la corteza y la miga del
  corte a la vista
