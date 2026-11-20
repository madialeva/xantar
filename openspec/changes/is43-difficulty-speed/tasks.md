# Tasks

## 1. Issue, rama y carpeta del cambio

- [x] 1.1 Asignar la issue #43 al hito `v1.0.0` y comprobar que describe la dificultad, las velocidades medidas, las pisadas que se deshacen al perder una vida y el tablero asegurado, con enlace a `openspec/changes/is43-difficulty-speed/`; crear desde ella la rama `change/is43-difficulty-speed` a partir de `develop/v1.0.0` actualizada (`gh issue develop 43 --base develop/v1.0.0 --name change/is43-difficulty-speed --checkout`), llevando la carpeta del cambio; verificar con `git branch --show-current`, `gh issue view 43` y `openspec list`

## 2. Velocidades del original

- [x] 2.1 En `src/sim/rules.ts`, poner `CHEF_SPEED = fromPx(86)` y `CLIMB_SPEED = fromPx(43)` y sustituir `ENEMY_SPEED` por `ENEMY_WALK_SPEED = fromPx(54)` y `ENEMY_CLIMB_SPEED = fromPx(27)`; hacer que `Enemy.step(chef, rng, gait)` ande y entre por la pasarela a `gait.walk` y suba a `gait.climb`, y que `Simulation` le pase por ahora el paso base; actualizar las pruebas de `Chef`, `Enemy`, `riders`, `crush` y de reglas que suponen las velocidades antiguas para que usen las constantes; verificar con pruebas de `Chef` (86 unidades en 60 ticks andando, 43 subiendo) y de `Enemy` (anda y entra a `gait.walk`, sube a `gait.climb`) y `npm run test`
- [x] 2.2 Documentar las velocidades nuevas en `docs/MANUAL.md` (§8.5, con la tabla de medidas y la escala horizontal 4:3 de la grabación) y en `README.md` ("Enemies": suben las escaleras más despacio de lo que andan); verificar con `npm run format:check` y las comprobaciones de entrega

## 3. Dificultad y ritmo de los enemigos

- [x] 3.1 Crear `src/sim/difficulty.ts` con `Difficulty`, `DIFFICULTIES`, `isDifficulty`, la Strategy `EnemyPace` (ritmo constante y ritmo creciente de Normal) y la fábrica `paceFor`, y añadir a `rules.ts` `PACE_STEPS`, `PACE_STEP_TICKS`, `LATE_PACE_LEVEL`, `LATE_PACE_FIRST_STEP`, `EASY_PACE` y `HARD_PACE`; exportarlo desde `src/sim/index.ts`; verificar con `difficulty.test.ts` (0,85 y 1,25 constantes; escalones a 1305, 2610 y 3915 ticks; tope; nivel 4 en 1,07 y a 1,25 a los 1305 ticks) y `npm run lint`
- [x] 3.2 En `Simulation`, aceptar `difficulty` en `SimulationOptions` (Normal por defecto), llevar `#playTicks` (suma en cada tick de `playing`, vuelve a cero en `startBoard()` y al volver a jugar tras perder una vida), calcular cada tick el paso de los enemigos con `paceFor` y exponer `pace`; verificar con pruebas de reglas (Fácil 45,9 unidades en 60 ticks, Difícil 33,75 subiendo, Normal 54 y 27 al empezar, escalones, vuelta a 1 al perder una vida y en el tablero siguiente, nivel 4, reloj parado en `ready` y `dying`, sin dificultad = Normal), la prueba de determinismo y `npm run test`
- [x] 3.3 Documentar la dificultad y la curva de Normal en `docs/MANUAL.md` (§8.5: `EnemyPace`, reloj de juego del tablero) y en `docs/GAMEDEV_FUNDAMENTALS.md` (curva de dificultad y ritmo como Strategy, en §5 o §18); verificar con `npm run format:check`, `grep` de los nombres citados y las comprobaciones de entrega

## 4. Pisadas al perder una vida y tablero asegurado

- [x] 4.1 Añadir `IngredientField#liftStomps()` (deshace las pisadas de cada ingrediente quieto) y hacer que `PhaseHost.respawn()` recoloque a chef y enemigos, ponga a cero el reloj de juego y llame a `liftStomps()`; cambiar la prueba que exigía conservar las pisadas; verificar con pruebas de reglas (segmentos sin pisar y profundidad cero tras `dying` y `ready`, apilados intactos, ingrediente que caía y termina su caída al volver a `playing`, recorrido interrumpido por perder una vida) y `npm run test`
- [x] 4.2 Hacer que `IngredientField` dependa de una interfaz `FieldRewards` (`addScore`, `grantPepper`) que cumple `GameStats`; añadir `Plate#copy()`, `Ingredient#copyFor(host)` y `copy()` en cada estado del ingrediente, y la previsión de `IngredientField` sobre una copia con colaboradores mudos tras cada ingrediente soltado por el chef, con `isSecured` y un tope de ticks; verificar con pruebas de `IngredientField` (la copia no emite eventos, no da puntos y deja intacto el campo real; la caída de la copia coincide tick a tick con la real; previsión verdadera y falsa; un tablero asegurado sigue asegurado tras otra caída) y `npm run test`
- [x] 4.3 Hacer que `Simulation#checkContact` no quite vidas con el campo asegurado y exponer `boardSecured`; verificar con pruebas de reglas (último ingrediente camino del plato, ingrediente con un enemigo montado desde dos pisos por encima del más bajo, cadena en la que un ingrediente con un montado empuja al último hasta el plato, contacto en el mismo tick, caída que no basta) y una del nivel clásico (al soltar el último ingrediente queda asegurado y el nivel se completa)
- [x] 4.4 Documentar las dos reglas en `README.md` ("Lives and game over": las pisadas se deshacen al perder una vida; con el último ingrediente en camino no se pierden vidas), en `docs/MANUAL.md` (§8.5: `liftStomps`, previsión sobre una copia, `FieldRewards`) y en `docs/GAMEDEV_FUNDAMENTALS.md` (prever un resultado simulando sobre una copia, patrón Prototype); verificar con `npm run format:check` y las comprobaciones de entrega

## 5. Opción de dificultad

- [x] 5.1 Añadir `difficulty` a `PlayerSettings` (Normal por defecto, leído con `isDifficulty`, registro en la versión 1) y `Settings#setDifficulty()`; verificar con `settings.test.ts` (registro sin dificultad, dificultad desconocida, registro dañado, ida y vuelta, aviso a los suscriptores)
- [x] 5.2 Añadir `options.difficulty` y `difficulty.easy|normal|hard` a `es.ts` y `en.ts`; poner Dificultad como primera opción de `MenuScene` (← y → en círculo con `cycle`; desplazar `OPTION_ROWS` y el índice al que vuelve el cambio de idioma) y hacer que `GameScene` pase `settings.values.difficulty` a la `Simulation`; verificar con las pruebas de i18n, `npm run lint`, `npm run typecheck`, `npm run smoke` y, en `npm run dev`, que la opción recorre Fácil, Normal y Difícil, se guarda y se aplica a la partida siguiente
- [x] 5.3 Documentar la opción en `README.md` ("Starting a game": elegir la dificultad en Options y qué hace cada una) y en `docs/MANUAL.md` (§8.8: ajuste `difficulty`; §9.14 si cambia la receta); verificar con `npm run format:check` y las comprobaciones de entrega

## 6. Integración

- [x] 6.1 Ejecutar las comprobaciones de entrega completas (`npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build`, `npm run smoke`) y `openspec validate is43-difficulty-speed --strict`; verificar que todo termina sin errores
- [ ] 6.2 Jugar en `npm run dev` y en `npm run dev:desktop` comparando con la grabación: velocidades del chef y de los enemigos, acelerón de Normal hacia el minuto de juego y vuelta a la base al perder una vida, Fácil y Difícil, pisadas deshechas al perder una vida y tablero asegurado al soltar el último ingrediente (lo verifica el autor)

## 7. Muerte aparente con el tablero asegurado

- [x] 7.1 Añadir a `PhaseHost` `reprieveTick()` y `forfeitLife()`, el resultado `chefReprieved` y la fase `ReprievePhase` (nombre `dying`); en `Simulation`, emitir `chefHit` sin restar vidas y devolver `chefReprieved` si el contacto llega con el campo asegurado, y en `reprieveTick()` avanzar solo las caídas (`IngredientField#advanceFalls()`) y a los enemigos montados y comprobar el final de nivel; verificar con pruebas de fases (anfitrión doble: sigue, `levelClear`, `stalled` pierde la vida) y de reglas (vidas intactas y `chefHit` con 3 vidas, `dying` y luego `levelClear` en el tick en que se completa, enemigos quietos, montado que baja y da su bonificación, contacto en el mismo tick, caída que no basta) y `npm run test`
- [x] 7.2 Documentar la muerte aparente en `README.md` ("Lives and game over"), `docs/MANUAL.md` (§8.5 punto 9 y diagrama de fases de §8.8) y `docs/GAMEDEV_FUNDAMENTALS.md`, y actualizar la issue #43; verificar con `npm run format:check`, las comprobaciones de entrega completas, `npm run smoke` y `openspec validate is43-difficulty-speed --strict`

## Workflow follow-up

- El autor hace el push; PR hacia `develop/v1.0.0` con `Closes #43`.
- Archivar el cambio tras la confirmación del autor, sincronizar las specs y revisar los Non-Goals del diseño: más enemigos por pantalla (#49), velocidades por tipo (#17), récord por dificultad (#26) y alcance de la pimienta (#47) ya tienen issue; crear las que falten (señal del tablero asegurado, escalones más allá de 65 s o vueltas tras la sexta pantalla).
