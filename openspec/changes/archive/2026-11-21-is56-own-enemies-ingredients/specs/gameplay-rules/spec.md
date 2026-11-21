## MODIFIED Requirements

### Requirement: Grosor de los ingredientes
Cada tipo de ingrediente SHALL tener un grosor fijo, el que se ve en su arte al
apilarlo: pan de abajo 11 unidades, carne 12, lechuga 8, pan de arriba 13,
queso 2 y tomate 6. La parte de arriba de un ingrediente quieto SHALL quedar a
su grosor por encima de su base, en un piso o en el plato, y cada ingrediente
apilado SHALL quedar sobre el plato a la suma de los grosores de los que tiene
debajo.

#### Scenario: Golpear a una lechuga
- **WHEN** la base de un ingrediente que cae llega a 8 unidades por encima del
  piso en el que está quieta una lechuga, dentro de sus casillas
- **THEN** la lechuga es golpeada

#### Scenario: Altura en el plato
- **WHEN** en un plato están apilados el pan de abajo y la carne
- **THEN** el siguiente ingrediente de ese plato queda a 23 unidades por
  encima del plato

#### Scenario: Queso fino
- **WHEN** la base de un ingrediente que cae llega a 2 unidades por encima del
  piso en el que está quieto un queso, dentro de sus casillas
- **THEN** el queso es golpeado

#### Scenario: Hamburguesa con tomate en el plato
- **WHEN** en un plato están apilados el pan de abajo, la carne y el tomate
- **THEN** el siguiente ingrediente de ese plato queda a 29 unidades por
  encima del plato
