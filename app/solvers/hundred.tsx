import '../helpers';

import { Hundred } from '../types';
import HundredGrid from '../components/HundredGrid';

import '../../index.less';

type Cell = Hundred.Cell

interface State {
  field: Cell[][] | null;
}

const SUM = 100;
const DIGITS = [...10];
const ALL_POSSIBLE_VALUES = DIGITS.map((value) => {
  const leftValues = DIGITS.map((d) => d * 10 + value);
  const rightValues = DIGITS.map((d) => value * 10 + d);

  return new Set([
    ...leftValues,
    ...rightValues
  ]);
});

export default class HundredSolver extends React.Component<{}, State> {
  state: State = {
    field: null
  };
  sizeSelect: HTMLSelectElement | null = null;
  width = 0;
  height = 0;

  solve = () => {
    console.log('start');
    console.time('solution took');

    const field = this.state.field!;
    const allCells = field.reduce((cells, row) => [
      ...cells,
      ...row
    ], []);
    const allCellsCount = allCells.length;
    const rowSums = [...this.height].map((y) => (
      field[y].reduce((sum, { value }) => sum + value, 0)
    ));
    const colSums = [...this.width].map((x) => (
      field.reduce((sum, { [x]: { value } }) => sum + value, 0)
    ));
    let iterations = 0;

    const traverse = (ix: number): boolean => {
      const cell = allCells[ix];
      const {
        x,
        y,
        value,
        initialValue,
        isLastRow,
        isLastCol,
      } = cell;
      const oldRowSum = rowSums[y];
      const oldColSum = colSums[x];
      const rowSumWithoutCell = oldRowSum - value;
      const colSumWithoutCell = oldColSum - value;
      const leftRowSum = SUM - rowSumWithoutCell;
      const leftColSum = SUM - colSumWithoutCell;
      const minLeftSum = Math.min(leftRowSum, leftColSum);
      const allPossibleCellValues = ALL_POSSIBLE_VALUES[initialValue];
      let possibleValues: number[] = [];

      if (isLastRow) {
        if (isLastCol) {
          if (leftRowSum === leftColSum && allPossibleCellValues.has(leftRowSum)) {
            possibleValues = [leftRowSum];
          }
        } else {
          if (allPossibleCellValues.has(leftColSum)) {
            possibleValues = [leftColSum];
          }
        }
      } else {
        if (isLastCol) {
          if (allPossibleCellValues.has(leftRowSum)) {
            possibleValues = [leftRowSum];
          }
        } else {
          possibleValues = [...allPossibleCellValues.entries()].map(([value]) => value);
        }
      }

      possibleValues = possibleValues.filter((value) => value <= minLeftSum);

      for (const possibleValue of possibleValues) {
        iterations++;

        cell.value = possibleValue;
        rowSums[y] = rowSumWithoutCell + possibleValue;
        colSums[x] = colSumWithoutCell + possibleValue;

        const isValid = ix === allCellsCount - 1 || traverse(ix + 1);

        if (isValid) {
          return true;
        }

        cell.value = value;
        rowSums[y] = oldRowSum;
        colSums[x] = oldColSum;
      }

      return false;
    };

    if (traverse(0)) {
      console.log('solution found!');
    } else {
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

  exportField = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(
        this.state.field!.map((row) => (
          row.map(({ initialValue }) => initialValue)
        ))
      )
    );

    alert('Copied to clipboard!');
  };

  importField = async () => {
    const text = await navigator.clipboard.readText();
    const pureValues = JSON.parse(text) as number[][];

    this.width = pureValues[0].length;
    this.height = pureValues.length;

    this.setState({
      field: pureValues.map((row, y) => (
      row.map((value, x) => ({
        x,
        y,
        value,
        initialValue: value,
        isLastRow: y === this.height - 1,
        isLastCol: x === this.width - 1
      }))
    ))
    });
  };

  setStartField() {
    const size = +this.sizeSelect!.value;

    this.width = size;
    this.height = size;

    this.setState({
      field: [...size].map((y) => (
        [...size].map((x) => ({
          x,
          y,
          value: 1,
          initialValue: 1,
          isLastRow: y === this.height - 1,
          isLastCol: x === this.width - 1
        }))
      ))
    });
  }

  onFieldChange = (field: Cell[][]) => {
    this.setState({ field });
  };

  render() {
    if (!this.state.field) {
      return (
        <div>
          <select defaultValue="3" ref={(select) => this.sizeSelect = select}>
            {[3, 4].map((size) => (
              <option key={size} value={size}>
              {size}x{size}
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
        <HundredGrid
          field={this.state.field}
          onFieldChange={this.onFieldChange}
        />
        <button onClick={this.solve}>
          Solve!
        </button>
        <button onClick={this.resetField}>
          Reset
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
