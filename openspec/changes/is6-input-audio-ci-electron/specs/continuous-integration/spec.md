# Spec Delta

## Purpose

Comprobar de forma automática en GitHub cada cambio propuesto y cada rama de
desarrollo o versión, y generar los instaladores de escritorio de los tres
sistemas operativos sin depender del equipo del autor.

## ADDED Requirements

### Requirement: Comprobaciones en cada pull request
Cada pull request hacia una rama `develop/**` o `release/**`, y cada push a esas
ramas, SHALL ejecutar en GitHub Actions el lint, la comprobación de formato, la
comprobación de tipos (renderer y Electron), las pruebas y el build web, con la
versión de Node del proyecto. Si cualquiera falla, la comprobación SHALL
fallar.

#### Scenario: Formato roto
- **WHEN** un pull request incluye un fichero sin formatear con Prettier
- **THEN** la comprobación del pull request falla e indica el paso de formato

### Requirement: Versión coherente con la rama
Un push a `develop/vX.Y.Z` o `release/vX.Y.Z`, o una etiqueta `vX.Y.Z`, SHALL
fallar si la versión de `package.json` no es `X.Y.Z`. Un pull request hacia
`develop/vX.Y.Z` o `release/vX.Y.Z` SHALL fallar si la versión de
`package.json` de la rama del pull request no es `X.Y.Z`. Las demás ramas SHALL
NOT comprobarse.

#### Scenario: Versión desalineada
- **WHEN** se hace push a `develop/v1.1.0` con la versión `1.0.0` en
  `package.json`
- **THEN** la comprobación falla indicando ambas versiones

#### Scenario: Rama de cambio
- **WHEN** se hace push a `change/is6-input-audio-ci-electron`
- **THEN** no se comprueba la versión

### Requirement: Prueba de humo automática
Cada pull request SHALL ejecutar en Linux la prueba de humo de la aplicación de
escritorio (arranque, título, menú y partida) y SHALL fallar si aparece un error
en la consola, incluidas las violaciones de la política de seguridad de
contenidos. Las capturas SHALL quedar disponibles como artefacto del flujo.

#### Scenario: Error al arrancar
- **WHEN** un cambio provoca un error de JavaScript al abrir la partida
- **THEN** la prueba de humo del pull request falla y sus capturas se pueden
  descargar

### Requirement: Instaladores para tres sistemas
Un push a `release/**`, una etiqueta `v*` o una ejecución manual SHALL generar
los instaladores de Linux (AppImage), Windows (NSIS) y macOS (DMG), cada uno en
su sistema, y SHALL publicarlos como artefactos del flujo. Los instaladores
SHALL NOT publicarse automáticamente como versión de GitHub.

#### Scenario: Preparar una versión
- **WHEN** se hace push a `release/v1.0.0`
- **THEN** el flujo produce un AppImage, un instalador `.exe` y un `.dmg`
  descargables
