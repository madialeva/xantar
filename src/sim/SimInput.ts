export interface SimInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly up: boolean;
  readonly down: boolean;
  readonly pepper: boolean;
  readonly confirm: boolean;
}

export const NO_INPUT: SimInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  pepper: false,
  confirm: false
};
