import { Tapa } from '../types';
import { negate } from '../helpers';
import TapaGrid from '../components/TapaGrid';

import '../../index.less';

interface State {
  field: Tapa.Cell[][] | null;
}

export default class TapaSolver extends React.Component<{}, State> {
  state: State = {
    field: null
  };
  select: HTMLSelectElement | null = null;
  emptyPercent = 0;
  width = 0;
  height = 0;

  solve = () => {
    console.log('start');
    console.time('solution took');

    this.emptyPercent = this.width * this.height * 0.25;
    this.setNeighbors();

    const field = this.state.field!;
    const allRelevantInstructionCells = field
      .reduce<Tapa.InstructionCell[]>((cells, row) => [
        ...cells,
        ...row.filter(this.isInstructionCell)
      ], [])
      .filter((cell) => !cell.done);
    const fillGroup = (group: Tapa.Cell[], value: boolean) => {
      group.forEach((cell) => {
        if (this.isEmptyCell(cell)) {
          changed = true;
          changedCount++;

          Object.assign(cell, {
            type: Tapa.CellType.VALUE,
            value
          });
        }
      });
    };
    let changed = true;
    let changedCount = 0;

    while (changed) {
      changed = false;

      allRelevantInstructionCells.forEach((cell) => {
        const value = cell.value[0];

        if (cell.instructionNeighbors.every(negate(this.isEmptyCell))) {
          cell.done = true;

          return;
        }

        if (cell.value.length > 1) {
          return;
        }

        const potentialFilledGroups = this.getPotentialFilledGroups(cell);

        // full circle or no empty cells, nothing we can do
        if (
          !potentialFilledGroups.length
          || (
            potentialFilledGroups.length === 1
            && potentialFilledGroups[0].length === 8
            && value
          )
        ) {
          return;
        }

        potentialFilledGroups.forEach((group) => {
          if (group.length < value) {
            fillGroup(group, false);
          }
        });

        const groupWithFilled = potentialFilledGroups.find((group) => (
          group.some(this.isFilledCell)
        ));

        if (groupWithFilled) {
          potentialFilledGroups.forEach((group) => {
            if (group !== groupWithFilled) {
              fillGroup(group, false);
            }
          });

          if (value === '?' || groupWithFilled.length < value) {
            return;
          }

          let firstFilledIndex = -1;
          let lastFilledIndex = -1;

          groupWithFilled.forEach((cell, ix) => {
            if (this.isFilledCell(cell)) {
              if (firstFilledIndex === -1) {
                firstFilledIndex = ix;
              }

              lastFilledIndex = ix;
            }
          });

          fillGroup([
            ...groupWithFilled.slice(firstFilledIndex + 1, value),
            ...groupWithFilled.slice(groupWithFilled.length - value, firstFilledIndex)
          ], true);

          fillGroup([
            ...groupWithFilled.slice(firstFilledIndex + value),
            ...groupWithFilled.slice(0, Math.max(0, lastFilledIndex - value + 1))
          ], false);
        } else {
          if (value === '?') {
            return;
          }

          const group = potentialFilledGroups[0];

          if ((potentialFilledGroups.length !== 1 && value) || group.length < value) {
            return;
          }

          if (value) {
            fillGroup(group.slice(group.length - value, value), true);
          } else {
            potentialFilledGroups.forEach((group) => {
              fillGroup(group, false);
            });
          }
        }
      });

      this.setNeighbors();

      field.forEach((row) => {
        row.forEach((cell) => {
          if (
            this.isFilledCell(cell)
            && cell.canFormSquare
            && cell.squareNeighbors.filter(this.isFilledCell).length === 2
          ) {
            const emptyCell = cell.squareNeighbors.find(this.isEmptyCell);

            if (emptyCell) {
              fillGroup([emptyCell], false);
            }
          }

          if (this.isEmptyCell(cell)) {
            Object.assign(cell, {
              type: Tapa.CellType.VALUE,
              value: false
            });

            const isSequencePossible = this.checkSequence(
              field.reduce((cells, row) => [
                ...cells,
                ...row.filter(this.isFilledCell)
              ], []),
              this.canBeFilled,
              cell.x === 1 && cell.y === 3
            );

            Object.assign(cell, {
              type: Tapa.CellType.EMPTY,
              value: undefined
            });

            if (!isSequencePossible) {
              fillGroup([cell], true);
            }
          }
        });
      });
    }

    console.log('changed count', changedCount);

    this.setNeighbors();

    const allEmptyCells = field.reduce((cells, row) => [
      ...cells,
      ...row.filter(this.isEmptyCell)
    ], []);
    const allFilledCells = field.reduce((cells, row) => [
      ...cells,
      ...row.filter(this.isFilledCell)
    ], []);
    const allDotCells = field.reduce((cells, row) => [
      ...cells,
      ...row.filter(this.isDotCell)
    ], []);
    let iterations = 0;

    const checkThisField = (areThereEmptyCells: boolean): boolean => (
      this.checkField(allRelevantInstructionCells, allFilledCells, allDotCells, areThereEmptyCells)
    );

    const traverse = (ix: number): boolean => {
      const cell = allEmptyCells[ix];
      const isLastEmptyCell = ix === allEmptyCells.length - 1;

      for (const value of [true, false]) {
        iterations++;

        Object.assign(cell, {
          type: Tapa.CellType.VALUE,
          value
        });

        (value ? allFilledCells : allDotCells).push(cell);

        if (isLastEmptyCell) {
          if (checkThisField(!isLastEmptyCell)) {
            return true;
          }
        } else {
          if (!checkThisField(!isLastEmptyCell)) {
            (value ? allFilledCells : allDotCells).pop();

            continue;
          }

          if (traverse(ix + 1)) {
            return true;
          }
        }

        (value ? allFilledCells : allDotCells).pop();
      }

      cell.type = Tapa.CellType.EMPTY;

      delete cell.value;

      return false;
    };

    if (!allEmptyCells.length || traverse(0)) {
      console.log('solution found!');
    } else {
      console.log('solution not found');
    }

    console.log(iterations);
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
            return cell;
          }

          return {
            ...cell,
            x,
            y,
            type: Tapa.CellType.EMPTY,
            value: undefined
          } as Tapa.EmptyCell;
        })
      ))
    }));
  };

  exportField = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(this.state.field!.map((row) => (
        row.map((cell) => ({
          type: cell.type,
          value: cell.value
        }))
      )))
    );

    alert('Copied to clipboard!');
  };

  importField = async () => {
    const text = await navigator.clipboard.readText();
    const field = this.setCoordinates(JSON.parse(text));

    this.width = field[0].length;
    this.height = field.length;

    this.setState({ field });
  };

  setStartField(size: number) {
    this.width = size;
    this.height = size;

    this.setState({
      field: new Array<number>(size).fill(0).map((y) => (
        new Array<number>(size).fill(0).map((x) => ({
          x,
          y,
          type: Tapa.CellType.EMPTY
        } as Tapa.EmptyCell))
      ))
    });
  }

  setCoordinates(field: Tapa.Cell[][]): Tapa.Cell[][] {
    return field.map((row, y) => (
      row.map((cell, x) => ({
        ...cell,
        x,
        y
      }))
    ));
  }

  onFieldChange = (field: Tapa.Cell[][]) => {
    this.setState({ field });
  };

  setNeighbors() {
    const field = this.state.field!;

    field.forEach((row, y) => {
      row.forEach((cell, x) => {
        Object.assign(cell, {
          neighbors: [],
          squareNeighbors: [],
          instructionNeighbors: []
        });

        if (x !== this.width - 1) {
          cell.squareNeighbors.push(row[x + 1]);
          cell.neighbors.push(row[x + 1]);
        }

        if (y !== this.height - 1) {
          cell.squareNeighbors.push(field[y + 1][x]);
          cell.neighbors.push(field[y + 1][x]);

          if (x !== this.width - 1) {
            cell.squareNeighbors.push(field[y + 1][x + 1]);
          }
        }

        cell.canFormSquare = (
          !this.isInstructionCell(cell)
          && cell.squareNeighbors.length === 3
          && cell.squareNeighbors.every(this.canBeFilled)
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

  checkField(
    allRelevantInstructionCells: Tapa.InstructionCell[],
    allFilledCells: Tapa.Cell[],
    allDotCells: Tapa.Cell[],
    areThereEmptyCells: boolean
  ): boolean {
    // no 2x2 filled square
    if (
      !allFilledCells.every(({ x, y, canFormSquare, squareNeighbors }) => {
        if (!canFormSquare) {
          return true;
        }

        return squareNeighbors.some((cell) => !allFilledCells.includes(cell));
      })
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

    if (!this.checkSequence(allFilledCells, this.isFilledCell)) {
      return false;
    }

    return allRelevantInstructionCells.every(this.checkInstructionNeighborCells);
  }

  checkSequence(allFilledCells: Tapa.Cell[], checker: (cell: Tapa.Cell) => boolean, log: boolean = false): boolean {
    if (!allFilledCells.length) {
      return true;
    }

    const allFilledCellsCopy = [...allFilledCells];

    // all filled or potentially filled cells are connected
    const sequence = [allFilledCellsCopy.pop() as Tapa.Cell];
    const fullSequence = [...sequence];

    while (sequence.length) {
      const {
        neighbors
      } = sequence.pop() as Tapa.Cell;

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

  changeInstructionNeighborsOrder(cell: Tapa.InstructionCell, checker: (cell: Tapa.Cell) => boolean): void {
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

  checkInstructionNeighborCells = (cell: Tapa.InstructionCell): boolean => {
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

  getPotentialFilledGroups(cell: Tapa.InstructionCell): Tapa.Cell[][] {
    this.changeInstructionNeighborsOrder(cell, negate(this.canBeFilled));

    return cell.instructionNeighbors
      .reduce<Tapa.Cell[][]>((groups, cell) => {
        const lastValue = groups[groups.length - 1];

        if (this.canBeFilled(cell)) {
          groups[groups.length - 1].push(cell);
        } else if (lastValue.length) {
          groups.push([]);
        }

        return groups;
      }, [[]])
      .filter((group) => group.length);
  }

  isFilledCell = (cell: Tapa.Cell): boolean => {
    return (
      cell.type === Tapa.CellType.VALUE
      && cell.value
    );
  };

  isDotCell = (cell: Tapa.Cell): boolean => {
    return (
      cell.type === Tapa.CellType.VALUE
      && !cell.value
    );
  };

  isEmptyCell = (cell: Tapa.Cell): cell is Tapa.EmptyCell => {
    return cell.type === Tapa.CellType.EMPTY;
  };

  isInstructionCell = (cell: Tapa.Cell): cell is Tapa.InstructionCell => {
    return cell.type === Tapa.CellType.INSTRUCTION;
  };

  canBeFilled = (cell: Tapa.Cell): boolean => {
    return (
      this.isFilledCell(cell)
      || this.isEmptyCell(cell)
    );
  };

  render() {
    if (!this.state.field) {
      return (
        <div>
          <select defaultValue="4" ref={(select) => this.select = select}>
            {[4, 5, 6, 7, 8, 9, 10].map((size) => (
              <option key={size} value={size}>
                {size}x{size}
              </option>
            ))}
          </select>
          <button onClick={() => this.setStartField(+this.select!.value)}>
            Set size
          </button>
          <button onClick={this.importField}>
            Import from clipboard
          </button>
        </div>
      );
    }

    return (
      <div>
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
