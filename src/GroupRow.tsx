import { memo } from 'react';
import clsx from 'clsx';
import { css } from '@linaria/core';

import { cell, cellFrozenLast, rowClassname, rowSelectedClassname } from './style';
import { SELECT_COLUMN_KEY } from './Columns';
import GroupCell from './GroupCell';
import type { CalculatedColumn, GroupRow, Maybe, Omit } from './types';
import { RowSelectionProvider } from './hooks';
import { getRowStyle } from './utils';

export interface GroupRowRendererProps<R, SR>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
  id: string;
  groupKey: unknown;
  viewportColumns: readonly CalculatedColumn<R, SR>[];
  childRows: readonly R[];
  rowIdx: number;
  row: GroupRow<R>;
  gridRowStart: number;
  height: number;
  level: number;
  selectedCellIdx: number | undefined;
  isExpanded: boolean;
  isRowSelected: boolean;
  selectGroup: (rowIdx: number) => void;
  toggleGroup: (expandedGroupId: unknown) => void;
  moreProps?: object | undefined;
  'data-testid'?: Maybe<string>;
}

const groupRow = css`
  &:not([aria-selected='true']) {
    background-color: var(--rdg-header-background-color);
  }

  > .${cell}:not(:last-child):not(.${cellFrozenLast}) {
    border-inline-end: none;
  }
`;

const groupRowClassname = `rdg-group-row ${groupRow}`;

function GroupedRow<R, SR>({
  id,
  groupKey,
  viewportColumns,
  childRows,
  rowIdx,
  row,
  gridRowStart,
  height,
  level,
  isExpanded,
  selectedCellIdx,
  isRowSelected,
  selectGroup,
  toggleGroup,
  moreProps,
  ...props
}: GroupRowRendererProps<R, SR>) {
  // Select is always the first column
  const idx = viewportColumns[0].key === SELECT_COLUMN_KEY ? level + 1 : level;

  function handleSelectGroup() {
    selectGroup(rowIdx);
  }

  return (
    <RowSelectionProvider value={isRowSelected}>
      <div
        role="row"
        aria-level={level}
        aria-expanded={isExpanded}
        className={clsx(
          rowClassname,
          groupRowClassname,
          `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
          {
            [rowSelectedClassname]: selectedCellIdx === -1
          }
        )}
        onClick={handleSelectGroup}
        style={getRowStyle(gridRowStart, height)}
        {...props}
      >
        {viewportColumns.map((column) => (
          <GroupCell
            key={column.key}
            id={id}
            groupKey={groupKey}
            childRows={childRows}
            isExpanded={isExpanded}
            isCellSelected={selectedCellIdx === column.idx}
            column={column}
            row={row}
            groupColumnIndex={idx}
            toggleGroup={toggleGroup}
            moreProps={moreProps}
            data-testid={props['data-testid']}
          />
        ))}
      </div>
    </RowSelectionProvider>
  );
}

export default memo(GroupedRow) as <R, SR>(props: GroupRowRendererProps<R, SR>) => JSX.Element;
