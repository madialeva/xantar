## MODIFIED Requirements

### Requirement: Bailes de los enemigos
Al andar, cada enemigo SHALL bailar a su manera, al ritmo de sus piernas: la
salchicha alterna su cuerpo de cóncavo a convexo, la cebolla gira como una
moneda, de frente a de canto y otra vez de frente, y el huevo ondula la clara
mientras rebota. La cebolla SHALL girar también mientras sube o baja una
escalera, como el pepinillo del original. Los ojos SHALL acompañar el
movimiento del cuerpo. Al dejar de andar, el cuerpo SHALL volver a su
fotograma base.

#### Scenario: La salchicha baila
- **WHEN** la salchicha anda por una plataforma
- **THEN** su cuerpo pasa de doblado hacia un lado a doblado hacia el otro en
  cada paso y sus ojos se desplazan con la doblez

#### Scenario: La cebolla gira al andar
- **WHEN** la cebolla anda por una plataforma
- **THEN** su rodaja pasa una y otra vez de verse de frente a verse de canto y
  de nuevo de frente, y sus ojos bajan y suben con el borde de arriba de la
  rodaja

#### Scenario: La cebolla gira en la escalera
- **WHEN** la cebolla sube por una escalera
- **THEN** su rodaja sigue girando mientras sube

#### Scenario: Cebolla aturdida
- **WHEN** la cebolla queda aturdida por la pimienta
- **THEN** deja de girar y se ve de frente mientras dura el aturdimiento

#### Scenario: Deja de andar
- **WHEN** un enemigo pasa de andar a trepar
- **THEN** su cuerpo vuelve a su fotograma base antes de empezar a trepar
