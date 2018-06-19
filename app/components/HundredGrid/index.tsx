import { Hundred } from '../../types';

import './index.less';

interface Props {
  field: Hundred.Cell[][];
  onFieldChange(field: Hundred.Cell[][]): void;
}

export default class TapaGrid extends React.Component<Props> {
  onCellClick(cell: Hundred.Cell) {
    const {
      field,
      onFieldChange
    } = this.props;
    const value = prompt('Enter value', cell.value ? `${cell.value}` : '');

    if (value === null) {
      return;
    }

    if (value) {
      cell.type = Hundred.CellType.FILLED;
      cell.value = +value;
    } else {
      cell.type = Hundred.CellType.EMPTY;
      cell.value = undefined;
    }

    onFieldChange([...field]);
  }

  render(): JSX.Element {
    const {
      field
    } = this.props;

    return (
      <div className="tapa-grid">
        {field.map((row, y) => (
          <div key={y} className="tapa-row">
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
