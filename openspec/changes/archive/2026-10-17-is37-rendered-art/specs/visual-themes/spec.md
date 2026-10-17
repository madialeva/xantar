## REMOVED Requirements

### Requirement: Definición de tema
**Reason**: El juego tiene un único aspecto estándar; el autor prefiere no
mantener aspectos intercambiables, y el arte renderizado no se recolorea con una
paleta.
**Migration**: El aspecto lo dan el arte renderizado y la paleta única de las
fuentes SVG (capacidades `rendered-assets` y `vector-assets`). El resplandor del
tema `midnight` desaparece.

### Requirement: Herencia del tema por defecto
**Reason**: Sin temas no hay nada que heredar.
**Migration**: Cada gráfico tiene una única fuente y la paleta es una sola.

### Requirement: Comprobación de temas
**Reason**: Sin temas no hay temas que comprobar.
**Migration**: La comprobación automática del arte verifica que cada gráfico
del catálogo tenga exactamente una fuente y que los SVG sigan la guía de estilo.

### Requirement: Selección del tema
**Reason**: Sin temas no hay nada que elegir.
**Migration**: Se retiran la opción del menú, el parámetro de URL `theme` y el
campo `theme` del nivel; los valores antiguos se ignoran.

### Requirement: Temas entregados
**Reason**: Se retira el tema `midnight` y el registro de temas.
**Migration**: Ninguna; el aspecto estándar sustituye a `classic`.
