## MODIFIED Requirements

### Requirement: Reglas de jugabilidad
La validación SHALL señalar como errores: un ingrediente inalcanzable por el
chef desde su posición inicial siguiendo el grafo de navegación; un ingrediente
cuya caída vertical no termina en un plato; una escalera con un extremo sin
plataforma (escalera colgante); un nivel sin ningún ingrediente; una pasarela
de entrada que no está pegada al extremo de una plataforma de su fila; y un
elemento de `entries` que no corresponde a ningún marcador de enemigo. SHALL
señalar como avisos: un plato al que no llega ningún ingrediente; una
plataforma inalcanzable por el chef; y un punto de aparición de enemigos
inalcanzable por el chef, entendiendo que el de una entrada es la plataforma a
la que lleva su pasarela.

#### Scenario: Ingrediente inalcanzable
- **WHEN** un ingrediente está sobre una plataforma a la que el chef no puede
  llegar
- **THEN** se informa un error de ingrediente inalcanzable en su posición

#### Scenario: Destino que no es un plato
- **WHEN** la caída vertical de un ingrediente sale del tablero sin encontrar un
  plato
- **THEN** se informa un error de destino sin plato en la posición del
  ingrediente

#### Scenario: Escalera colgante
- **WHEN** un extremo de una escalera no tiene casilla de plataforma
- **THEN** se informa un error de escalera colgante en la posición de ese
  extremo

#### Scenario: Nivel sin ingredientes
- **WHEN** el nivel no contiene ningún ingrediente
- **THEN** se informa un error de nivel sin ingredientes

#### Scenario: Plato vacío
- **WHEN** a un plato no llega ningún ingrediente
- **THEN** se informa un aviso de plato sin ingredientes

#### Scenario: Plataforma o aparición inalcanzable
- **WHEN** una plataforma o un punto de aparición de enemigos no es alcanzable
  por el chef
- **THEN** se informa un aviso en su posición

#### Scenario: Pasarela suelta
- **WHEN** una pasarela de entrada no tiene una casilla de plataforma al lado en
  ninguno de sus extremos
- **THEN** se informa un error de pasarela suelta en su posición

#### Scenario: Entrada sin marcador
- **WHEN** un elemento de `entries` señala una casilla sin marcador de enemigo
- **THEN** se informa un error de entrada sin enemigo en esa fila y columna

#### Scenario: Entrada que lleva a un piso alcanzable
- **WHEN** un marcador de enemigo está en una pasarela pegada a una plataforma
  alcanzable por el chef
- **THEN** no se informa ningún aviso de aparición inalcanzable
