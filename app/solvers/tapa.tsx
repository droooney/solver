import { Tapa } from '../types';
import { negate, timeout } from '../helpers';
import TapaGrid from '../components/TapaGrid';

import '../../index.less';

type Cell = Tapa.Cell
type EmptyCell = Tapa.EmptyCell
type InstructionCell = Tapa.InstructionCell

const CellType = Tapa.CellType;
const Variation = Tapa.Variation;

const ALL_VALUES = [true, false];
const TRUE_VALUES = [true];
const FALSE_VALUES = [false];

interface State {
  field: Cell[][] | null;
}

interface CheckFieldOptions {
  allRelevantInstructionCells: InstructionCell[];
  allFilledCells: Cell[];
  allDotCells: Cell[];
  allCanFormSquareCells: Cell[];
  allCanFormWhiteSquareCells: Cell[];
  allCanFormHorizontalLineCells: Cell[];
  allCanFormVerticalLineCells: Cell[];
  areThereEmptyCells: boolean;
  checkSquares: boolean;
  checkWhiteSquares: boolean;
  checkLines: boolean;
  checkSequence: boolean;
  isFourMeTapa: boolean;
  isNoSquareTapa: boolean;
  allSquareFilled(cells: Cell): boolean;
  allSquareWhite(cells: Cell): boolean;
  allHorizontalFilled(cells: Cell): boolean;
  allVerticalFilled(cells: Cell): boolean;
  formsSquare(cells: Cell): boolean;
  formsWhiteSquare(cells: Cell): boolean;
  formsHorizontalLine(cells: Cell): boolean;
  formsVerticalLine(cells: Cell): boolean;
}

interface TraverseOptions {
  values: boolean[];
}

export default class TapaSolver extends React.Component<{}, State> {
  state: State = {
    field: null
  };
  sizeSelect: HTMLSelectElement | null = null;
  variationSelect: HTMLSelectElement | null = null;
  variation: Tapa.Variation = Variation.CLASSIC;
  width = 0;
  height = 0;

  solve = async () => {
    console.log('start');
    console.time('solution took');

    this.setNeighbors();

    const getAllFilledCells = (): Cell[] => {
      return field.reduce((cells, row) => [
        ...cells,
        ...row.filter(this.isFilledCell)
      ], []);
    };
    const getAllCanFormSquareCells = (): Cell[] => {
      return field.reduce((cells, row) => [
        ...cells,
        ...row.filter(({ canFormSquare }) => canFormSquare)
      ], []);
    };
    const getAllCanFormWhiteSquareCells = (): Cell[] => {
      return field.reduce((cells, row) => [
        ...cells,
        ...row.filter(({ canFormWhiteSquare }) => canFormWhiteSquare)
      ], []);
    };
    const getAllCanFormHorizontalLineCells = (): Cell[] => {
      return field.reduce((cells, row) => [
        ...cells,
        ...row.filter(({ canFormHorizontalLine }) => canFormHorizontalLine)
      ], []);
    };
    const getAllCanFormVerticalLineCells = (): Cell[] => {
      return field.reduce((cells, row) => [
        ...cells,
        ...row.filter(({ canFormVerticalLine }) => canFormVerticalLine)
      ], []);
    };
    const allSquareFilled = ({ squareCells }: Cell): boolean => {
      return squareCells.every(this.isFilledCell);
    };
    const allSquareWhite = ({ whiteSquareCells }: Cell): boolean => {
      return whiteSquareCells.every(this.isDotCell);
    };
    const allHorizontalFilled = ({ horizontalLineCells }: Cell): boolean => {
      return horizontalLineCells.every(this.isFilledCell);
    };
    const allVerticalFilled = ({ verticalLineCells }: Cell): boolean => {
      return verticalLineCells.every(this.isFilledCell);
    };

    const isEqualTapa = this.variation === Variation.EQUAL;
    const isFourMeTapa = this.variation === Variation.FOUR_ME;
    const isNoSquareTapa = this.variation === Variation.NO_SQUARE;
    const isTapAlike = this.variation === Variation.ALIKE;
    const field = this.state.field!;
    const allInstructionCells = field
      .reduce<InstructionCell[]>((cells, row) => [
        ...cells,
        ...row.filter(this.isInstructionCell)
      ], [])
      .filter((cell) => !cell.done);
    const instructionEmptyCellsMap = new Map(
      allInstructionCells.map((cell) => [cell, []] as [InstructionCell, Cell[]])
    );
    const fillCell = (cell: Cell, value: boolean) => {
      if (this.isEmptyCell(cell)) {
        changed = true;
        changedCells.push(cell);

        Object.assign(cell, {
          type: CellType.VALUE,
          value
        });
      }
    };
    const resetChangedCells = () => {
      changedCells.forEach((cell) => {
        Object.assign(cell, {
          type: CellType.EMPTY,
          value: undefined
        });
      });

      allInstructionCells.forEach((cell) => {
        cell.done = false;
      });
    };
    let changed = true;
    let firstIteration = true;
    const changedCells: Cell[] = [];

    while (changed) {
      changed = false;

      const valid = allInstructionCells.every((cell) => {
        const oldInstructionEmptyCells = instructionEmptyCellsMap.get(cell)!;

        if (!oldInstructionEmptyCells.length && !firstIteration) {
          return true;
        }

        const newInstructionEmptyCells = cell.instructionNeighbors.filter(this.isEmptyCell);

        instructionEmptyCellsMap.set(cell, newInstructionEmptyCells);

        if (!newInstructionEmptyCells.length) {
          cell.done = true;

          return true;
        }

        /*
        if (oldInstructionEmptyCells.length === newInstructionEmptyCells.length) {
          return true;
        }
        */

        const value = cell.value[0];

        if (
          newInstructionEmptyCells.length === 8
          && (
            cell.value.length !== 1
            || value === '?'
            || (value > 0 && value < 8)
          )
        ) {
          return true;
        }

        const variations: boolean[][] = [];
        const values: boolean[] = [];
        const count = newInstructionEmptyCells.length;

        const traverse = (ix: number): void => {
          ALL_VALUES.forEach((value) => {
            values[ix] = value;

            Object.assign(newInstructionEmptyCells[ix], {
              type: CellType.VALUE,
              value
            });

            if (ix === count - 1) {
              if (
                this.checkInstructionFinalNeighborCells(cell)
                && this.checkSequence(getAllFilledCells(), this.canBeFilled)
                && getAllCanFormSquareCells().every(negate(allSquareFilled))
                && (
                  !isNoSquareTapa
                  || getAllCanFormWhiteSquareCells().every(negate(allSquareWhite))
                )
                && (
                  !isFourMeTapa
                  || (
                    getAllCanFormHorizontalLineCells().every(negate(allHorizontalFilled))
                    && getAllCanFormVerticalLineCells().every(negate(allVerticalFilled))
                  )
                )
              ) {
                variations.push([...values]);
              }
            } else {
              traverse(ix + 1);
            }
          });
        };

        traverse(0);

        if (variations.length) {
          newInstructionEmptyCells.forEach((cell, ix) => {
            Object.assign(cell, {
              type: CellType.EMPTY,
              value: undefined
            });

            const firstValue = variations[0][ix];

            if (variations.every((value) => value[ix] === firstValue)) {
              fillCell(cell, firstValue);
            }
          });
        } else {
          return false;
        }

        return true;
      });

      if (!valid) {
        resetChangedCells();

        console.log('changed count', changedCells.length);
        console.log('solution not found');
        console.timeEnd('solution took');

        return;
      }

      this.setNeighbors();

      field.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (isTapAlike) {
            if (!this.isEmptyCell(cell)) {
              fillCell(
                field[this.height - y - 1][this.width - x - 1],
                this.isWhiteCell(cell)
              );
            }
          }

          if (
            cell.canFormSquare
            && cell.squareCells.filter(this.isFilledCell).length === cell.squareCells.length - 1
          ) {
            const emptyCell = cell.squareCells.find(this.isEmptyCell);

            if (emptyCell) {
              fillCell(emptyCell, false);
            }
          }

          if (isNoSquareTapa) {
            if (
              cell.canFormWhiteSquare
              && cell.whiteSquareCells.filter(this.isDotCell).length === cell.whiteSquareCells.length - 1
            ) {
              const emptyCell = cell.whiteSquareCells.find(this.isEmptyCell);

              if (emptyCell) {
                fillCell(emptyCell, true);
              }
            }
          }

          if (isFourMeTapa) {
            if (
              cell.canFormHorizontalLine
              && cell.horizontalLineCells.filter(this.isFilledCell).length === 3
            ) {
              const emptyCell = cell.horizontalLineCells.find(this.isEmptyCell);

              if (emptyCell) {
                fillCell(emptyCell, false);
              }
            }

            if (
              cell.canFormVerticalLine
              && cell.verticalLineCells.filter(this.isFilledCell).length === 3
            ) {
              const emptyCell = cell.verticalLineCells.find(this.isEmptyCell);

              if (emptyCell) {
                fillCell(emptyCell, false);
              }
            }
          }

          if (this.isEmptyCell(cell)) {
            Object.assign(cell, {
              type: CellType.VALUE,
              value: false
            });

            const isSequencePossible = this.checkSequence(
              field.reduce((cells, row) => [
                ...cells,
                ...row.filter(this.isFilledCell)
              ], []),
              this.canBeFilled
            );

            Object.assign(cell, {
              type: CellType.EMPTY,
              value: undefined
            });

            if (!isSequencePossible) {
              fillCell(cell, true);
            }
          }
        });
      });

      firstIteration = false;
    }

    console.log('changed count', changedCells.length);

    this.setNeighbors();
    this.setState({
      field: [...field]
    });

    await timeout(1);

    // return;

    const getImportanceCoeff = (cell: Cell): number => {
      return allRelevantInstructionCells.filter(({ instructionNeighbors }) => (
        instructionNeighbors.includes(cell)
      )).length;
    };
    const formsSquare = ({ canFormSquare, squareCells }: Cell): boolean => {
      if (!canFormSquare) {
        return false;
      }

      return squareCells.every(this.isFilledCell);
    };
    const formsWhiteSquare = ({ canFormWhiteSquare, whiteSquareCells }: Cell): boolean => {
      if (!canFormWhiteSquare) {
        return false;
      }

      return whiteSquareCells.every(this.isDotCell);
    };
    const formsHorizontalLine = ({ canFormHorizontalLine, horizontalLineCells }: Cell): boolean => {
      if (!canFormHorizontalLine) {
        return false;
      }

      return horizontalLineCells.every(this.isFilledCell);
    };
    const formsVerticalLine = ({ canFormVerticalLine, verticalLineCells }: Cell): boolean => {
      if (!canFormVerticalLine) {
        return false;
      }

      return verticalLineCells.every(this.isFilledCell);
    };
    const allRelevantInstructionCells = field
      .reduce<InstructionCell[]>((cells, row) => [
        ...cells,
        ...row.filter(this.isInstructionCell)
      ], [])
      .filter((cell) => !cell.done);
    const allEmptyCells = field
      .reduce((cells, row, y) => [
        ...cells,
        ...(!isTapAlike || y * 2 < this.height ? row.filter(this.isEmptyCell) : [])
      ], [])
      .sort((cell1, cell2) => {
        const coeff1 = getImportanceCoeff(cell1);
        const coeff2 = getImportanceCoeff(cell2);

        return coeff2 - coeff1;
      });
    const allFilledCells = getAllFilledCells();
    const allDotCells = field.reduce((cells, row) => [
      ...cells,
      ...row.filter(this.isDotCell)
    ], []);
    const allCanFormSquareCells = getAllCanFormSquareCells();
    const allCanFormWhiteSquareCells = getAllCanFormWhiteSquareCells();
    const allCanFormHorizontalLineCells = getAllCanFormHorizontalLineCells();
    const allCanFormVerticalLineCells = getAllCanFormVerticalLineCells();
    const equalTapaCount = Math.round((this.width * this.height - allInstructionCells.length) / 2);
    let iterations = 0;

    const checkThisField = <K extends keyof CheckFieldOptions>(options: Pick<CheckFieldOptions, K>) => (
      this.checkField({
        allRelevantInstructionCells,
        allFilledCells,
        allDotCells,
        allCanFormSquareCells,
        allCanFormWhiteSquareCells,
        allCanFormHorizontalLineCells,
        allCanFormVerticalLineCells,
        areThereEmptyCells: true,
        checkSquares: true,
        checkWhiteSquares: true,
        checkLines: true,
        checkSequence: true,
        isFourMeTapa,
        isNoSquareTapa,
        allSquareFilled,
        allSquareWhite,
        allHorizontalFilled,
        allVerticalFilled,
        formsSquare,
        formsWhiteSquare,
        formsHorizontalLine,
        formsVerticalLine,
        // @ts-ignore
        ...options
      })
    );

    const traverse = (ix: number, options: TraverseOptions = { values: ALL_VALUES }): boolean => {
      const cell = allEmptyCells[ix];
      const isLastEmptyCell = ix === allEmptyCells.length - 1;

      for (const value of options.values) {
        iterations++;

        Object.assign(cell, {
          type: CellType.VALUE,
          value
        });

        if (isTapAlike) {
          Object.assign(field[this.height - cell.y - 1][this.width - cell.x - 1], {
            type: CellType.VALUE,
            value: !value
          });
        }

        (value ? allFilledCells : allDotCells).push(cell);

        if (isTapAlike) {
          (value ? allDotCells : allFilledCells).push(field[this.height - cell.y - 1][this.width - cell.x - 1]);
        }

        if (isLastEmptyCell) {
          if (checkThisField({
            areThereEmptyCells: !isLastEmptyCell,
            checkSquares: isTapAlike || value,
            checkWhiteSquares: isTapAlike || !value,
            checkLines: isTapAlike || value,
            checkSequence: isTapAlike || !value
          })) {
            return true;
          }
        } else {
          if (!checkThisField({
            areThereEmptyCells: !isLastEmptyCell,
            checkSquares: isTapAlike || value,
            checkWhiteSquares: isTapAlike || !value,
            checkLines: isTapAlike || value,
            checkSequence: isTapAlike || !value
          })) {
            (value ? allFilledCells : allDotCells).pop();

            if (isTapAlike) {
              (value ? allDotCells : allFilledCells).pop();
            }

            continue;
          }

          let traverseOptions: TraverseOptions | undefined;

          if (isEqualTapa) {
            traverseOptions = {
              values: allFilledCells.length >= equalTapaCount
                ? FALSE_VALUES
                : allDotCells.length >= equalTapaCount
                  ? TRUE_VALUES
                  : ALL_VALUES
            };
          }

          if (traverse(ix + 1, traverseOptions)) {
            return true;
          }
        }

        (value ? allFilledCells : allDotCells).pop();

        if (isTapAlike) {
          (value ? allDotCells : allFilledCells).pop();
        }
      }

      cell.type = CellType.EMPTY;

      delete cell.value;

      if (isTapAlike) {
        const oppositeCell = field[this.height - cell.y - 1][this.width - cell.x - 1];

        oppositeCell.type = CellType.EMPTY;

        delete oppositeCell.value;
      }

      return false;
    };

    if (!allEmptyCells.length || traverse(0)) {
      console.log('solution found!');
    } else {
      resetChangedCells();

      console.log('solution not found');
    }

    console.log('brute force iterations:', iterations);
    console.timeEnd('solution took');

    this.setState({
      field: [...field]
    });
  };

  resetField = () => {
    this.setState({
      field: null
    });
  };

  clearField = () => {
    this.setState(({ field }) => ({
      field: field!.map((row, y) => (
        row.map((cell, x) => {
          if (this.isInstructionCell(cell)) {
            return {
              ...cell,
              done: false
            };
          }

          return {
            ...cell,
            x,
            y,
            type: CellType.EMPTY,
            value: undefined
          } as EmptyCell;
        })
      ))
    }));
  };

  exportField = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify({
        variation: this.variation,
        field: this.state.field!.map((row) => (
          row.map((cell) => ({
            type: cell.type,
            value: cell.value
          }))
        ))
      })
    );

    alert('Copied to clipboard!');
  };

  importField = async () => {
    const text = await navigator.clipboard.readText();
    const {
      variation,
      field: parsedField
    } = JSON.parse(text);
    const field = this.setCoordinates(parsedField);

    this.variation = variation;
    this.width = field[0].length;
    this.height = field.length;

    this.setState({ field });
  };

  setStartField() {
    const size = +this.sizeSelect!.value;
    const variation = this.variationSelect!.value as Tapa.Variation;

    this.variation = variation;
    this.width = size;
    this.height = size;

    this.setState({
      field: [...size].map((y) => (
        [...size].map((x) => ({
          x,
          y,
          type: CellType.EMPTY
        } as EmptyCell))
      ))
    });
  }

  setCoordinates(field: Cell[][]): Cell[][] {
    return field.map((row, y) => (
      row.map((cell, x) => ({
        ...cell,
        x,
        y
      }))
    ));
  }

  onFieldChange = (field: Cell[][]) => {
    this.setState({ field });
  };

  setNeighbors() {
    const field = this.state.field!;

    field.forEach((row, y) => {
      row.forEach((cell, x) => {
        Object.assign(cell, {
          neighbors: [],
          squareCells: [cell],
          whiteSquareCells: [cell],
          horizontalLineCells: [cell],
          verticalLineCells: [cell],
          instructionNeighbors: []
        });

        if (x !== this.width - 1) {
          cell.squareCells.push(row[x + 1]);
          cell.whiteSquareCells.push(row[x + 1]);
          cell.neighbors.push(row[x + 1]);
        }

        if (y !== this.height - 1) {
          cell.squareCells.push(field[y + 1][x]);
          cell.whiteSquareCells.push(field[y + 1][x]);
          cell.neighbors.push(field[y + 1][x]);

          if (x !== this.width - 1) {
            cell.squareCells.push(field[y + 1][x + 1]);
            cell.whiteSquareCells.push(field[y + 1][x + 1]);
          }
        }

        if (this.variation === Variation.FOUR_ME) {
          row.slice(x + 1, x + 4).forEach((Cell) => {
            cell.horizontalLineCells.push(Cell);
          });

          field.slice(y + 1, y + 4).forEach((row) => {
            cell.verticalLineCells.push(row[x]);
          });
        }

        cell.canFormSquare = (
          cell.squareCells.length === 4
          && cell.squareCells.every(this.canBeFilled)
        );

        cell.canFormWhiteSquare = (
          cell.whiteSquareCells.length === 4
          && cell.whiteSquareCells.every(negate(this.isFilledCell))
        );

        cell.canFormHorizontalLine = (
          cell.horizontalLineCells.length === 4
          && cell.horizontalLineCells.every(this.canBeFilled)
        );

        cell.canFormVerticalLine = (
          cell.verticalLineCells.length === 4
          && cell.verticalLineCells.every(this.canBeFilled)
        );

        cell.squareCells = cell.squareCells.filter(negate(this.isFilledCell));
        cell.whiteSquareCells = cell.whiteSquareCells.filter(negate(this.isWhiteCell));

        if (x !== 0) {
          cell.neighbors.push(field[y][x - 1]);
        }

        if (y !== 0) {
          cell.neighbors.push(field[y - 1][x]);
        }

        if (this.isInstructionCell(cell)) {
          if (
            (x === 0 && y === 0)
            || (x === this.width - 1 && y === 0)
            || (x === this.width - 1 && y === this.height - 1)
            || (x === 0 && y === this.height - 1)
          ) {
            const dx = x === 0 ? 1 : -1;
            const dy = y === 0 ? 1 : -1;

            cell.instructionNeighbors = [
              field[y][x + dx],
              field[y + dy][x + dx],
              field[y + dy][x]
            ];
          } else if (
            x === 0
            || x === this.width - 1
          ) {
            const dx = x === 0 ? 1 : -1;

            cell.instructionNeighbors = [
              field[y - 1][x],
              field[y - 1][x + dx],
              field[y][x + dx],
              field[y + 1][x + dx],
              field[y + 1][x]
            ];
          } else if (
            y === 0
            || y === this.height - 1
          ) {
            const dy = y === 0 ? 1 : -1;

            cell.instructionNeighbors = [
              field[y][x - 1],
              field[y + dy][x - 1],
              field[y + dy][x],
              field[y + dy][x + 1],
              field[y][x + 1]
            ];
          } else {
            cell.instructionNeighbors = [
              field[y - 1][x],
              field[y - 1][x + 1],
              field[y][x + 1],
              field[y + 1][x + 1],
              field[y + 1][x],
              field[y + 1][x - 1],
              field[y][x - 1],
              field[y - 1][x - 1]
            ];
          }
        }
      });
    });
  }

  checkField(options: CheckFieldOptions): boolean {
    const {
      allRelevantInstructionCells,
      allFilledCells,
      allDotCells,
      allCanFormSquareCells,
      allCanFormWhiteSquareCells,
      allCanFormHorizontalLineCells,
      allCanFormVerticalLineCells,
      areThereEmptyCells,
      checkSquares,
      checkWhiteSquares,
      checkLines,
      checkSequence,
      isFourMeTapa,
      isNoSquareTapa,
      allSquareFilled,
      allSquareWhite,
      allHorizontalFilled,
      allVerticalFilled,
      formsSquare,
      formsWhiteSquare,
      formsHorizontalLine,
      formsVerticalLine,
    } = options;

    // no 2x2 filled square
    if (
      checkSquares
      && (
        allFilledCells.length < allCanFormSquareCells.length
          ? allFilledCells.some(formsSquare)
          : allCanFormSquareCells.some(allSquareFilled)
      )
    ) {
      return false;
    }

    // no 2x2 white square
    if (
      isNoSquareTapa
      && checkWhiteSquares
      && (
        allDotCells.length < allCanFormWhiteSquareCells.length
          ? allDotCells.some(formsWhiteSquare)
          : allCanFormWhiteSquareCells.some(allSquareWhite)
      )
    ) {
      return false;
    }

    // no four-me line
    if (
      isFourMeTapa
      && checkLines
      && ((
        allFilledCells.length < allCanFormHorizontalLineCells.length
          ? allFilledCells.some(formsHorizontalLine)
          : allCanFormHorizontalLineCells.some(allHorizontalFilled)
      ) || (
        allFilledCells.length < allCanFormVerticalLineCells.length
          ? allFilledCells.some(formsVerticalLine)
          : allCanFormVerticalLineCells.some(allVerticalFilled)
      ))
    ) {
      return false;
    }

    if (areThereEmptyCells) {
      if (!allRelevantInstructionCells.every(this.checkInstructionNeighborCells)) {
        return false;
      }

      if (
        checkSequence
        && !this.checkSequence(allFilledCells, this.canBeFilled)
      ) {
        return false;
      }

      return true;
    }

    if (checkSequence && !this.checkSequence(allFilledCells, this.isFilledCell)) {
      return false;
    }

    return allRelevantInstructionCells.every(this.checkInstructionFinalNeighborCells);
  }

  checkSequence(allFilledCells: Cell[], checker: (cell: Cell) => boolean): boolean {
    if (!allFilledCells.length) {
      return true;
    }

    const allFilledCellsCopy = [...allFilledCells];

    // all filled or potentially filled cells are connected
    const sequence = [allFilledCellsCopy.pop() as Cell];
    const fullSequence = [...sequence];

    while (sequence.length) {
      const {
        neighbors
      } = sequence.pop() as Cell;

      neighbors.forEach((cell) => {
        if (checker(cell) && !fullSequence.includes(cell)) {
          sequence.push(cell);
          fullSequence.push(cell);

          const index = allFilledCellsCopy.findIndex((Cell) => Cell === cell);

          if (index !== -1) {
            allFilledCellsCopy.splice(index, 1);
          }
        }
      });
    }

    return !allFilledCellsCopy.length;
  }

  changeInstructionNeighborsOrder = (cell: InstructionCell, checker: (cell: Cell) => boolean): void => {
    const { instructionNeighbors } = cell;

    // make neighbor cells start with filled cell and end with an empty cell
    if (instructionNeighbors.length === 8) {
      if (checker(instructionNeighbors[0])) {
        instructionNeighbors.reverse();

        const index = instructionNeighbors.findIndex(negate(checker));

        if (index !== -1) {
          instructionNeighbors.push(
            ...instructionNeighbors.splice(0, index)
          );
        }

        instructionNeighbors.reverse();
      } else {
        const index = instructionNeighbors.findIndex(checker);

        if (index !== -1) {
          instructionNeighbors.push(
            ...instructionNeighbors.splice(0, index)
          );
        }
      }
    }
  };

  checkInstructionNeighborCells = (cell: InstructionCell): boolean => {
    if (cell.value.length > 1) {
      // temporary

      return true;
    }

    const minValue = cell.value[0] === '?'
      ? 1
      : cell.value[0];
    const maxValue = cell.value[0] === '?'
      ? cell.instructionNeighbors.length - 1
      : cell.value[0];

    if (
      cell.instructionNeighbors.filter(this.canBeFilled).length < minValue
    ) {
      return false;
    }

    return cell.instructionNeighbors.filter(this.isFilledCell).length <= maxValue;
  };

  checkInstructionFinalNeighborCells = (cell: InstructionCell): boolean => {
    const { instructionNeighbors } = cell;

    if (cell.value.length === 1 && cell.value[0] === 0) {
      return instructionNeighbors.every(negate(this.isFilledCell));
    }

    this.changeInstructionNeighborsOrder(cell, this.isFilledCell);

    // get actual values as numbers array
    const values = instructionNeighbors
      .reduce((values, cell) => {
        const lastValue = values[values.length - 1];

        if (this.isFilledCell(cell)) {
          values[values.length - 1] = lastValue + 1;
        } else if (lastValue) {
          values.push(0);
        }

        return values;
      }, [0])
      .filter(Boolean);

    if (values.length !== cell.value.length) {
      return false;
    }

    const instructionValues = [...cell.value];

    // filter out equal values
    for (let i = values.length - 1; i >= 0; i--) {
      const value = values[i];
      const index = instructionValues.indexOf(value);

      if (index !== -1) {
        values.splice(i, 1);
        instructionValues.splice(index, 1);
      }
    }

    // so we have to be left with only "?"s
    return instructionValues.every((value) => value === '?');
  };

  isFilledCell = (cell: Cell): boolean => {
    return (
      cell.type === CellType.VALUE
      && cell.value
    );
  };

  isWhiteCell = (cell: Cell): boolean => {
    return (
      this.isInstructionCell(cell)
      || this.isDotCell(cell)
    );
  };

  isDotCell = (cell: Cell): boolean => {
    return (
      cell.type === CellType.VALUE
      && !cell.value
    );
  };

  isEmptyCell = (cell: Cell): cell is EmptyCell => {
    return cell.type === CellType.EMPTY;
  };

  isInstructionCell = (cell: Cell): cell is InstructionCell => {
    return cell.type === CellType.INSTRUCTION;
  };

  canBeFilled = (cell: Cell): boolean => {
    return (
      this.isFilledCell(cell)
      || this.isEmptyCell(cell)
    );
  };

  render() {
    if (!this.state.field) {
      return (
        <div>
          <select defaultValue="4" ref={(select) => this.sizeSelect = select}>
            {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((size) => (
              <option key={size} value={size}>
                {size}x{size}
              </option>
            ))}
          </select>
          <select defaultValue={Variation.CLASSIC} ref={(select) => this.variationSelect = select}>
            {Object.values(Variation).map((variation) => (
              <option key={variation} value={variation}>
                {variation}
              </option>
            ))}
          </select>
          <button onClick={() => this.setStartField()}>
            Set initial parameters
          </button>
          <button onClick={this.importField}>
            Import from clipboard
          </button>
        </div>
      );
    }

    return (
      <div>
        <h3>{this.variation}</h3>
        <TapaGrid
          field={this.state.field}
          onFieldChange={this.onFieldChange}
        />
        <button onClick={this.solve}>
          Solve!
        </button>
        <button onClick={this.resetField}>
          Reset
        </button>
        <button onClick={this.clearField}>
          Clear
        </button>
        <button onClick={this.exportField}>
          Export
        </button>
        <button onClick={this.importField}>
          Import from clipboard
        </button>
      </div>
    );
  }
}
