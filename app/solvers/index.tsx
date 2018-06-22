import TapaSolver from './tapa';
import HundredSolver from './hundred';

interface State {
  puzzle: keyof typeof puzzles;
}

const puzzles = {
  Tapa: TapaSolver,
  'Square 100': HundredSolver,
};

export default class Solver extends React.Component<{}, State> {
  puzzleSelect: HTMLSelectElement | null = null;
  state: State = {
    puzzle: 'Tapa'
  };

  selectPuzzle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({
      puzzle: e.target.value as keyof typeof puzzles
    });
  };

  render(): JSX.Element {
    const {
      puzzle
    } = this.state;
    const Solver: React.ComponentClass | null = puzzle && puzzles[puzzle];

    return (
      <div>
        <select
          defaultValue="Tapa"
          ref={(select) => this.puzzleSelect = select}
          onChange={this.selectPuzzle}
        >
          {Object.keys(puzzles).map((puzzle) => (
            <option key={puzzle} value={puzzle}>
              {puzzle}
            </option>
          ))}
        </select>
        {Solver && <Solver />}
      </div>
    );
  }
}
