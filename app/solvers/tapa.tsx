import { Tapa } from '../types';
import { negate } from '../helpers';
import TapaGrid from '../components/TapaGrid';

import '../../index.less';

type Cell = Tapa.Cell
type EmptyCell = Tapa.EmptyCell
type InstructionCell = Tapa.InstructionCell

const CellType = Tapa.CellType;
const Variation = Tapa.Variation;

const VALUES = [true, false];

interface State {
  field: Cell[][] | null;
}

interface CheckFieldOptions {
  allRelevantInstructionCells: InstructionCell[];
  allFilledCells: Cell[];
  allDotCells: Cell[];
  areThereEmptyCells: boolean;
  checkSquares: boolean;
  checkLines: boolean;
  checkSequence: boolean;
}

export default class TapaSolver extends React.Component<{}, State> {
  state: State = {
    field: null
  };
  sizeSelect: HTMLSelectElement | null = null;
  variationSelect: HTMLSelectElement | null = null;
  variation: Tapa.Variation = Variation.CLASSIC;
  emptyPercent = 0;
  width = 0;
  height = 0;

  solve = () => {
    console.log('start');
    console.time('solution took');

    this.emptyPercent = this.width * this.height * 0.25;
    this.setNeighbors();

    const field = this.state.field!;
    const allInstructionCells = field
      .reduce<InstructionCell[]>((cells, row) => [
        ...cells,
        ...row.filter(this.isInstructionCell)
      ], [])
      .filter((cell) => !cell.done);
    const instructionEmptyCellsMap = new Map(
      allInstructionCells.map((cell) => [cell, [cell, ...cell.instructionNeighbors]] as [InstructionCell, Cell[]])
    );
    const fillGroup = (group: Cell[], value: boolean) => {
      group.forEach((cell) => {
        if (this.isEmptyCell(cell)) {
          changed = true;
          changedCells.push(cell);

          Object.assign(cell, {
            type: CellType.VALUE,
            value
          });
        }
      });
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
    const changedCells: Cell[] = [];

    while (changed) {
      changed = false;

      const valid = allInstructionCells.every((cell) => {
        const oldInstructionEmptyCells = instructionEmptyCellsMap.get(cell)!;

        if (!oldInstructionEmptyCells.length) {
          return true;
        }

        const newInstructionEmptyCells = cell.instructionNeighbors.filter(this.isEmptyCell);

        if (!newInstructionEmptyCells.length) {
          cell.done = true;

          instructionEmptyCellsMap.set(cell, newInstructionEmptyCells);

          return true;
        }

        if (oldInstructionEmptyCells.length === newInstructionEmptyCells.length) {
          return true;
        }

        const value = cell.value[0];

        if (
          newInstructionEmptyCells.length === 8
          && (
            cell.value.length !== 1
            || (value > 0 && value < 8)
          )
        ) {
          return true;
        }

        const variations: boolean[][] = [];
        const values: boolean[] = [];
        const count = newInstructionEmptyCells.length;

        const traverse = (ix: number): void => {
          VALUES.forEach((value) => {
            values[ix] = value;

            Object.assign(newInstructionEmptyCells[ix], {
              type: CellType.VALUE,
              value
            });

            if (ix === count - 1) {
              if (
                this.checkInstructionNeighborCells(cell)
                && this.checkSequence(
                  field.reduce((cells, row) => [
                    ...cells,
                    ...row.filter(this.isFilledCell)
                  ], []),
                  this.canBeFilled
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
              fillGroup([cell], firstValue);
            }
          });
        } else {
          resetChangedCells();

          return false;
        }

        return true;
      });

      if (!valid) {
        console.log('solution not found');
        console.timeEnd('solution took');

        return;
      }

      this.setNeighbors();

      field.forEach((row) => {
        row.forEach((cell) => {
          if (
            cell.canFormSquare
            && cell.squareCells.filter(this.isFilledCell).length === 3
          ) {
            const emptyCell = cell.squareCells.find(this.isEmptyCell);

            if (emptyCell) {
              fillGroup([emptyCell], false);
            }
          }

          if (this.variation === Variation.FOUR_ME) {
            if (
              cell.canFormHorizontalLine
              && cell.horizontalLineCells.filter(this.isFilledCell).length === 3
            ) {
              const emptyCell = cell.horizontalLineCells.find(this.isEmptyCell);

              if (emptyCell) {
                fillGroup([emptyCell], false);
              }
            }

            if (
              cell.canFormVerticalLine
              && cell.verticalLineCells.filter(this.isFilledCell).length === 3
            ) {
              const emptyCell = cell.verticalLineCells.find(this.isEmptyCell);

              if (emptyCell) {
                fillGroup([emptyCell], false);
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
              fillGroup([cell], true);
            }
          }
        });
      });
    }

    console.log('changed count', changedCells.length);

    this.setNeighbors();
    /*
    this.setState({
      field: [...field]
    });
    return;
    */

    const getImportanceCoeff = (cell: Tapa.Cell): number => {
      return allRelevantInstructionCells.filter(({ instructionNeighbors }) => (
        instructionNeighbors.includes(cell)
      )).length;
    };
    const allRelevantInstructionCells = field
      .reduce<InstructionCell[]>((cells, row) => [
        ...cells,
        ...row.filter(this.isInstructionCell)
      ], [])
      .filter((cell) => !cell.done);
    const allEmptyCells = field
      .reduce((cells, row) => [
        ...cells,
        ...row.filter(this.isEmptyCell)
      ], [])
      .sort((cell1, cell2) => {
        const coeff1 = getImportanceCoeff(cell1);
        const coeff2 = getImportanceCoeff(cell2);

        return coeff2 - coeff1;
      });
    const allFilledCells = field.reduce((cells, row) => [
      ...cells,
      ...row.filter(this.isFilledCell)
    ], []);
    const allDotCells = field.reduce((cells, row) => [
      ...cells,
      ...row.filter(this.isDotCell)
    ], []);
    let iterations = 0;

    const checkThisField = <K extends keyof CheckFieldOptions>(options: Pick<CheckFieldOptions, K>) => (
      this.checkField({
        allRelevantInstructionCells,
        allFilledCells,
        allDotCells,
        areThereEmptyCells: true,
        checkSquares: true,
        checkLines: true,
        checkSequence: true,
        // @ts-ignore
        ...options
      })
    );

    const traverse = (ix: number): boolean => {
      const cell = allEmptyCells[ix];
      const isLastEmptyCell = ix === allEmptyCells.length - 1;

      for (const value of VALUES) {
        iterations++;

        Object.assign(cell, {
          type: CellType.VALUE,
          value
        });

        (value ? allFilledCells : allDotCells).push(cell);

        if (isLastEmptyCell) {
          if (checkThisField({
            areThereEmptyCells: !isLastEmptyCell,
            checkSquares: value,
            checkLines: value,
            checkSequence: !value
          })) {
            return true;
          }
        } else {
          if (!checkThisField({
            areThereEmptyCells: !isLastEmptyCell,
            checkSquares: value,
            checkLines: value,
            checkSequence: !value
          })) {
            (value ? allFilledCells : allDotCells).pop();

            continue;
          }

          if (traverse(ix + 1)) {
            return true;
          }
        }

        (value ? allFilledCells : allDotCells).pop();
      }

      cell.type = CellType.EMPTY;

      delete cell.value;

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
          horizontalLineCells: [cell],
          verticalLineCells: [cell],
          instructionNeighbors: []
        });

        if (x !== this.width - 1) {
          cell.squareCells.push(row[x + 1]);
          cell.neighbors.push(row[x + 1]);
        }

        if (y !== this.height - 1) {
          cell.squareCells.push(field[y + 1][x]);
          cell.neighbors.push(field[y + 1][x]);

          if (x !== this.width - 1) {
            cell.squareCells.push(field[y + 1][x + 1]);
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

        cell.canFormHorizontalLine = (
          cell.horizontalLineCells.length === 4
          && cell.horizontalLineCells.every(this.canBeFilled)
        );

        cell.canFormVerticalLine = (
          cell.verticalLineCells.length === 4
          && cell.verticalLineCells.every(this.canBeFilled)
        );

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
      areThereEmptyCells,
      checkSquares,
      checkLines,
      checkSequence
    } = options;

    // no 2x2 filled square
    if (
      checkSquares
      && !allFilledCells.every(({ canFormSquare, squareCells }) => {
        if (!canFormSquare) {
          return true;
        }

        return squareCells.some((cell) => !allFilledCells.includes(cell));
      })
    ) {
      return false;
    }

    // no four-me line
    if (
      this.variation === Variation.FOUR_ME
      && checkLines
      && (
        !allFilledCells.every(({ canFormHorizontalLine, horizontalLineCells }) => {
          if (!canFormHorizontalLine) {
            return true;
          }

          return horizontalLineCells.some((cell) => !allFilledCells.includes(cell));
        })
        || !allFilledCells.every(({ canFormVerticalLine, verticalLineCells }) => {
          if (!canFormVerticalLine) {
            return true;
          }

          return verticalLineCells.some((cell) => !allFilledCells.includes(cell));
        })
      )
    ) {
      return false;
    }

    if (areThereEmptyCells) {
      if (
        !allRelevantInstructionCells.every((cell) => {
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
        })
      ) {
        return false;
      }

      if (
        allRelevantInstructionCells.length + allDotCells.length > this.emptyPercent
        && !this.checkSequence(allFilledCells, this.canBeFilled)
      ) {
        return false;
      }

      return true;
    }

    if (checkSequence && !this.checkSequence(allFilledCells, this.isFilledCell)) {
      return false;
    }

    return allRelevantInstructionCells.every(this.checkInstructionNeighborCells);
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

  changeInstructionNeighborsOrder(cell: InstructionCell, checker: (cell: Cell) => boolean): void {
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
  }

  checkInstructionNeighborCells = (cell: InstructionCell): boolean => {
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
            {[4, 5, 6, 7, 8, 9, 10].map((size) => (
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
