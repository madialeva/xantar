# Spec Delta

## Purpose

Mostrar todos los textos de la interfaz en el idioma del jugador (español o
inglés) desde una tabla de textos tipada, con parámetros y plurales, y permitir
cambiarlo sin reiniciar.

## ADDED Requirements

### Requirement: Textos desde una tabla por idioma
Todo texto visible de la interfaz (título, menús, opciones, HUD, mensajes de
fase, fin de partida, pausa y pantalla de carga) SHALL obtenerse de una tabla de
textos por idioma identificada por claves, y SHALL NOT escribirse directamente
en el código de las escenas. Los idiomas disponibles SHALL ser español e inglés.

#### Scenario: Interfaz en inglés
- **WHEN** el idioma activo es inglés
- **THEN** ningún texto de la interfaz aparece en español

### Requirement: Catálogos completos y tipados
Cada idioma SHALL definir todas las claves de la tabla con la misma forma
(texto fijo o texto con parámetros). Una clave ausente, sobrante o con
parámetros distintos en algún idioma SHALL detectarse al comprobar los tipos del
proyecto, antes de ejecutar el juego.

#### Scenario: Clave olvidada
- **WHEN** se añade una clave al catálogo español y no al inglés
- **THEN** la comprobación de tipos falla indicando la clave

### Requirement: Parámetros y plurales
Los textos SHALL admitir parámetros (por ejemplo, la puntuación o el nivel) y
SHALL elegir la forma singular o plural según la regla del idioma. Los números
SHALL formatearse según el idioma.

#### Scenario: Plural de vidas
- **WHEN** se muestra el texto de vidas restantes con 1 y con 3 vidas en español
- **THEN** se lee "1 vida" y "3 vidas"

#### Scenario: Número con separador de miles
- **WHEN** se muestra la puntuación 12500 en inglés y en español
- **THEN** aparece con el separador de miles de cada idioma

### Requirement: Idioma inicial y cambio de idioma
Sin preferencia guardada, el idioma inicial SHALL ser español si la primera
preferencia de idioma del navegador es español y, en otro caso, inglés. El
idioma elegido por el jugador SHALL guardarse y usarse en las siguientes
sesiones. Cambiar de idioma SHALL actualizar los textos visibles sin recargar la
página, y el atributo de idioma del documento SHALL corresponder al idioma
activo.

#### Scenario: Navegador en catalán
- **WHEN** se abre el juego por primera vez con el navegador en catalán
- **THEN** la interfaz aparece en inglés

#### Scenario: Navegador en español de México
- **WHEN** se abre el juego por primera vez con el navegador en `es-MX`
- **THEN** la interfaz aparece en español
