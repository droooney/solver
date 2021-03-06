export enum Variation {
  CLASSIC = 'CLASSIC TAPA',
  FOUR_ME = 'FOUR-ME TAPA',
  EQUAL = 'EQUAL TAPA',
  NO_SQUARE = 'NO-SQUARE TAPA',
  ALIKE = 'TAP-ALIKE',
  BALANCED = 'BALANCED TAPA',
  TAP_A_ROW = 'TAP_A_ROW'
}

export enum CellType {
  EMPTY = 'EMPTY',
  VALUE = 'VALUE',
  INSTRUCTION = 'INSTRUCTION',
}

export type InstructionCellSingleValue = number | '?'

export type InstructionCellValue = (
  [InstructionCellSingleValue]
  | [InstructionCellSingleValue, InstructionCellSingleValue]
  | [InstructionCellSingleValue, InstructionCellSingleValue, InstructionCellSingleValue]
  | [InstructionCellSingleValue, InstructionCellSingleValue, InstructionCellSingleValue, InstructionCellSingleValue]
)

export interface BaseCell {
  x: number;
  y: number;
  type: CellType;
  value?: boolean | InstructionCellValue;
}

export interface EmptyCell extends BaseCell {
  type: CellType.EMPTY;
  neighbors: Cell[];
  squareCells: Cell[];
  whiteSquareCells: Cell[];
  horizontalLineCells: Cell[];
  verticalLineCells: Cell[];
  canFormSquare: boolean;
  canFormWhiteSquare: boolean;
  canFormHorizontalLine: boolean;
  canFormVerticalLine: boolean;
}

export interface FilledCell extends BaseCell {
  type: CellType.VALUE;
  value: boolean;
  neighbors: Cell[];
  squareCells: Cell[];
  whiteSquareCells: Cell[];
  horizontalLineCells: Cell[];
  verticalLineCells: Cell[];
  canFormSquare: boolean;
  canFormWhiteSquare: boolean;
  canFormHorizontalLine: boolean;
  canFormVerticalLine: boolean;
}

export interface InstructionCell extends BaseCell {
  type: CellType.INSTRUCTION;
  value: InstructionCellValue;
  neighbors: Cell[];
  squareCells: Cell[];
  whiteSquareCells: Cell[];
  horizontalLineCells: Cell[];
  verticalLineCells: Cell[];
  canFormSquare: boolean;
  canFormWhiteSquare: boolean;
  canFormHorizontalLine: boolean;
  canFormVerticalLine: boolean;
  instructionNeighbors: Cell[];
  done: boolean;
}

export type Cell = EmptyCell | FilledCell | InstructionCell
