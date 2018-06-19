export enum CellType {
  EMPTY = 'EMPTY',
  FILLED = 'FILLED',
}

export interface EmptyCell {
  type: CellType.EMPTY;
  value?: undefined;
}

export interface FilledCell {
  type: CellType.FILLED;
  value: number;
}

export type Cell = EmptyCell | FilledCell
