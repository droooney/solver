import { Tapa } from '../../types';
import {
  ClassName
} from '../../helpers';

import './index.less';

const CLASSES_MAP = {
  1: 'single',
  2: 'double',
  3: 'triple',
  4: 'quadruple'
};
const CELL_SIZE = 30;

interface Props {
  variation: Tapa.Variation;
  separatorX: number;
  field: Tapa.Cell[][];
  onFieldChange(field: Tapa.Cell[][]): void;
}

export default class TapaGrid extends React.Component<Props> {
  onCellClick(Cell: Tapa.Cell) {
    const {
      field,
      onFieldChange
    } = this.props;

    if (Cell.type === Tapa.CellType.VALUE && Cell.value) {
      const value = prompt('Enter instruction value');

      if (!value) {
        return;
      }

      const values: Tapa.InstructionCellValue = value.split(/\s+/).map((value) => (
        value === '?'
          ? '?'
          : +value
      )) as any;

      if (!values.length || values.length > 4 || values.some((value) => value !== '?' && Number.isNaN(value))) {
        return;
      }

      onFieldChange(field.map((row) => (
        row.map((cell) => {
          if (cell !== Cell) {
            return cell;
          }

          return {
            ...cell,
            type: Tapa.CellType.INSTRUCTION,
            value: values
          } as Tapa.InstructionCell;
        }))
      ));
    } else {
      onFieldChange(field.map((row) => (
        row.map((cell) => {
          if (cell !== Cell) {
            return cell;
          }

          if (Cell.type === Tapa.CellType.INSTRUCTION) {
            return {
              ...cell,
              type: Tapa.CellType.EMPTY,
              value: undefined
            } as Tapa.EmptyCell;
          }

          return {
            ...Cell,
            type: Tapa.CellType.VALUE,
            value: Cell.type === Tapa.CellType.EMPTY
              ? false
              : !cell.value
          } as Tapa.FilledCell;
        })
      )));
    }
  }

  render(): JSX.Element {
    const {
      variation,
      separatorX,
      field
    } = this.props;

    return (
      <div
        className="tapa-grid"
        style={{
          '--cell-size': CELL_SIZE
        } as React.CSSProperties}
      >
        {variation === Tapa.Variation.BALANCED && (
          <div
            className="separatorX"
            style={{
              left: separatorX * CELL_SIZE
            }}
          />
        )}
        {field.map((row, y) => (
          <div key={y} className="tapa-row">
            {row.map((cell, x) => {
              let content = null;
              let className = [];

              if (cell.type === Tapa.CellType.VALUE) {
                className.push(
                  cell.value
                    ? 'value-yes'
                    : 'value-no'
                );
              } else if (cell.type === Tapa.CellType.INSTRUCTION) {
                className.push('instruction', CLASSES_MAP[cell.value.length]);

                if (cell.value.length === 1) {
                  content = cell.value[0];
                  className.push(CLASSES_MAP[1]);
                } else {
                  content = cell.value.map((value) => (
                    <span>{value}</span>
                  ));
                }
              }

              return (
                <div
                  key={x}
                  className={ClassName('tapa-cell', className)}
                  onClick={() => this.onCellClick(cell)}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
}
