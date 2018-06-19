import { Hundred } from '../types';
import HundredGrid from '../components/HundredGrid';

import '../../index.less';

type Cell = Hundred.Cell
type EmptyCell = Hundred.EmptyCell

const CellType = Hundred.CellType;

interface State {
  field: Cell[][] | null;
}

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
    let iterations = 0;

    const traverse = (ix: number): boolean => {

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
          row.map((cell) => ({
            type: cell.type,
            value: cell.value
          }))
        ))
      )
    );

    alert('Copied to clipboard!');
  };

  importField = async () => {
    const text = await navigator.clipboard.readText();
    const field = JSON.parse(text);

    this.width = field[0].length;
    this.height = field.length;

    this.setState({ field });
  };

  setStartField() {
    const size = +this.sizeSelect!.value;

    this.width = size;
    this.height = size;

    this.setState({
      field: [...size].map(() => (
        [...size].map(() => ({
          type: CellType.EMPTY
        } as EmptyCell))
      ))
    });
  }

  onFieldChange = (field: Cell[][]) => {
    this.setState({ field });
  };

  checkField(): boolean {

  }

  render() {
    if (!this.state.field) {
      return (
        <div>
          <select defaultValue="4" ref={(select) => this.sizeSelect = select}>
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
