## MODIFIED Requirements

### Requirement: Resolución del lienzo según el nivel de escala
El lienzo SHALL dibujarse a una resolución igual al tamaño lógico del área de
juego multiplicado por el nivel de escala de dibujo, que en esta versión es 4,
y la vista SHALL seguir trabajando en unidades lógicas. Los textos del HUD
SHALL generarse a esa misma resolución. El juego SHALL tomar como objetivo
pantallas Full HD (1920×1080) o mayores; SHALL NOT comprobar la resolución y en
pantallas menores SHALL mostrarse reducido sin dejar de funcionar.

#### Scenario: Texto nítido
- **WHEN** el juego se muestra a pantalla completa en 1920×1080 con nivel de
  escala 4
- **THEN** los textos del HUD y el arte se ven nítidos

#### Scenario: Pantalla pequeña
- **WHEN** el juego se abre en una ventana de 1280×720
- **THEN** se juega con normalidad, reducido para caber en la ventana
