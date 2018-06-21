import { Hundred } from '../../types';

import './index.less';

interface Props {
  field: Hundred.Cell[][];
  onFieldChange(field: Hundred.Cell[][]): void;
}

export default class HundredGrid extends React.Component<Props> {
  onCellClick(cell: Hundred.Cell) {
    const {
      field,
      onFieldChange
    } = this.props;
    const value = prompt('Enter value', cell.value ? `${cell.value}` : '');

    if (
      value === null
      || !Number.isInteger(+value)
      || +value < 0
      || +value > 9
    ) {
      return;
    }

    cell.value = +value;
    cell.initialValue = +value;

    onFieldChange([...field]);
  }

  render(): JSX.Element {
    const {
      field
    } = this.props;

    return (
      <div className="hundred-grid">
        {field.map((row, y) => (
          <div key={y} className="hundred-row">
            {row.map((cell, x) => (
              <div
                key={x}
                className="hundred-cell"
                onClick={() => this.onCellClick(cell)}
              >
                {cell.value}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
}
