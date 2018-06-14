export enum CellType {
  EMPTY = 'EMPTY',
  VALUE = 'VALUE',
  INSTRUCTION = 'INSTRUCTION'
}

export type InstructionCellSingleValue = number | '?'

export type InstructionCellValue = (
  [InstructionCellSingleValue]
  | [InstructionCellSingleValue, InstructionCellSingleValue]
  | [InstructionCellSingleValue, InstructionCellSingleValue, InstructionCellSingleValue]
  | [InstructionCellSingleValue, InstructionCellSingleValue, InstructionCellSingleValue, InstructionCellSingleValue]
)

export interface StartBaseCell {
  type: CellType;
  value?: boolean | InstructionCellValue;
}

export interface StartEmptyCell extends StartBaseCell {
  type: CellType.EMPTY;
  value?: undefined;
}

export interface StartFilledCell extends StartBaseCell {
  type: CellType.VALUE;
  value: boolean;
}

export interface StartInstructionCell extends StartBaseCell {
  type: CellType.INSTRUCTION;
  value: InstructionCellValue;
}

export type StartCell = StartEmptyCell | StartFilledCell | StartInstructionCell

export interface BaseCell extends StartBaseCell {
  x: number;
  y: number;
}

export interface EmptyCell extends BaseCell {
  type: CellType.EMPTY;
  neighbors: Cell[];
  squareNeighbors: Cell[];
  canFormSquare: boolean;
}

export interface FilledCell extends BaseCell {
  type: CellType.VALUE;
  value: boolean;
  neighbors: Cell[];
  squareNeighbors: Cell[];
  canFormSquare: boolean;
}

export interface InstructionCell extends BaseCell {
  type: CellType.INSTRUCTION;
  value: InstructionCellValue;
  neighbors: Cell[];
  squareNeighbors: Cell[];
  canFormSquare: boolean;
  instructionNeighbors: Cell[];
  done: boolean;
}

export type Cell = EmptyCell | FilledCell | InstructionCell
