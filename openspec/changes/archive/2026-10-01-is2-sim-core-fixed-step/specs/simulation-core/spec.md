# Spec Delta

## Purpose

Define el contrato del núcleo de simulación de Xantar: un motor de reglas
independiente de Phaser y del navegador, determinista, con paso fijo, que la
capa de vista consume mediante estado y eventos. Es la base para testear las
reglas, reproducir partidas y evolucionar el juego sin acoplarlo al render.

## ADDED Requirements

### Requirement: Independencia del framework y del entorno
El núcleo de simulación SHALL ser código TypeScript puro: no MUST importar
Phaser, no MUST usar globales de navegador (`window`, `document`, `navigator`,
`localStorage`, temporizadores del entorno) ni APIs de Node. Esta frontera SHALL
estar protegida por el linter del proyecto.

#### Scenario: Importar Phaser desde el núcleo
- **WHEN** un archivo del núcleo importa `phaser`
- **THEN** `npm run lint` falla con un error de importación restringida

#### Scenario: Ejecutar el núcleo sin entorno gráfico
- **WHEN** se ejecuta el núcleo en un entorno Node sin DOM ni canvas
- **THEN** la simulación avanza y produce estado y eventos sin error

### Requirement: Paso fijo de simulación
La simulación SHALL avanzar en ticks enteros de duración fija igual a 1/60 s.
Una llamada de avance SHALL ejecutar exactamente un tick y el resultado SHALL
depender únicamente del estado previo, de la entrada de ese tick y del estado
del generador aleatorio, nunca del tiempo real transcurrido.

#### Scenario: Mismo número de ticks, mismo resultado
- **WHEN** se ejecutan 600 ticks con la misma semilla y la misma secuencia de
  entradas en dos ejecuciones distintas
- **THEN** el estado final y la lista de eventos son idénticos

#### Scenario: Duraciones expresadas en ticks
- **WHEN** una regla define una duración (aturdimiento, reaparición, caída)
- **THEN** la duración se mide en ticks de simulación y no en milisegundos de
  reloj

### Requirement: Acumulador de pasos con límite
El proyecto SHALL proporcionar un acumulador de tiempo que convierta el tiempo
real transcurrido entre fotogramas en un número entero de ticks a ejecutar y
conserve el resto fraccionario para el siguiente fotograma. El acumulador SHALL
limitar el número máximo de ticks por fotograma para evitar la espiral de
recuperación tras una pausa larga.

#### Scenario: Fotograma más lento que un tick
- **WHEN** transcurren 55 ms en un fotograma
- **THEN** se ejecutan 3 ticks y los 5 ms restantes se conservan para el
  siguiente fotograma

#### Scenario: Fotograma más rápido que un tick
- **WHEN** transcurren 8 ms en un fotograma y el resto acumulado previo es 0
- **THEN** se ejecutan 0 ticks y los 8 ms se conservan para el siguiente
  fotograma

#### Scenario: Pausa larga
- **WHEN** transcurren 5 s entre dos fotogramas
- **THEN** el número de ticks ejecutados no supera el límite configurado y el
  tiempo sobrante se descarta

### Requirement: Unidades lógicas
El estado de la simulación SHALL expresar posiciones en unidades lógicas en las
que 1 unidad equivale a 1 tile, y velocidades en tiles por segundo de
simulación. El núcleo SHALL ser independiente de cualquier resolución de
pantalla en píxeles.

#### Scenario: Cambiar la resolución de render
- **WHEN** cambia el tamaño en píxeles con el que la vista dibuja un tile
- **THEN** el estado y el comportamiento de la simulación no cambian

### Requirement: Entrada abstracta
La simulación SHALL recibir en cada tick una entrada abstracta formada por las
acciones izquierda, derecha, arriba, abajo y lanzar pimienta, sin referencia a
teclas ni dispositivos. La acción de lanzar pimienta SHALL tratarse como
pulsación puntual (un lanzamiento por pulsación) y no como estado sostenido.

#### Scenario: Pimienta mantenida
- **WHEN** la entrada de pimienta se presenta en un único tick y luego se
  retira
- **THEN** se consume como máximo una pimienta

### Requirement: Eventos de simulación
Cada tick SHALL poder producir eventos tipados que describen lo ocurrido
(caída de ingrediente, ingrediente apilado, enemigo aplastado, enemigo
aturdido, hamburguesa completada, pimienta lanzada, chef golpeado, cambio de
puntuación, nivel completado, fin de partida). Los eventos SHALL contener los
datos necesarios para que la vista reaccione sin consultar reglas internas.

#### Scenario: Aplastar un enemigo
- **WHEN** un ingrediente en caída aplasta a un enemigo
- **THEN** se emite un evento de enemigo aplastado que identifica al enemigo,
  su posición y los puntos concedidos

#### Scenario: Tick sin sucesos
- **WHEN** un tick no provoca ningún suceso relevante
- **THEN** no se emite ningún evento

### Requirement: Aleatoriedad con semilla
Toda decisión aleatoria de la simulación SHALL obtenerse de un generador con
semilla proporcionado a la simulación. El núcleo MUST NOT usar `Math.random` ni
otra fuente no determinista.

#### Scenario: Reproducir una partida
- **WHEN** se crean dos simulaciones con la misma semilla y se les aplica la
  misma secuencia de entradas
- **THEN** las posiciones de chef y enemigos coinciden tick a tick

#### Scenario: Uso de Math.random en el núcleo
- **WHEN** un archivo del núcleo llama a `Math.random`
- **THEN** `npm run lint` falla

### Requirement: Estado de partida
La simulación SHALL mantener un estado de partida con al menos los valores
`playing`, `levelClear` y `gameOver`. Mientras el estado no sea `playing`, los
ticks SHALL NOT modificar chef, enemigos ni ingredientes. La vista SHALL poder
solicitar reiniciar el tablero, pasar al siguiente nivel o empezar una partida
nueva mediante órdenes explícitas.

#### Scenario: Tick con la partida terminada
- **WHEN** el estado es `gameOver` y se ejecuta un tick
- **THEN** ninguna entidad cambia de posición ni de estado

#### Scenario: Empezar una partida nueva tras el fin de partida
- **WHEN** la vista solicita empezar una partida nueva
- **THEN** puntuación, vidas, pimientas y nivel vuelven a sus valores iniciales
  y el estado pasa a `playing`

### Requirement: Verificación automatizada del núcleo
El proyecto SHALL incluir una batería de pruebas automatizadas del núcleo
ejecutable con `npm run test` en un entorno sin DOM, y el comando de
verificación previa a la entrega SHALL incluirla.

#### Scenario: Ejecutar las pruebas
- **WHEN** se ejecuta `npm run test`
- **THEN** se ejecutan las pruebas del núcleo y el comando termina con código 0
  si todas pasan
