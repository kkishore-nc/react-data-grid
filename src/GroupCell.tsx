import { memo } from 'react';

import { getCellStyle, getCellClassname } from './utils';
import type { CalculatedColumn, GroupRow, Maybe } from './types';
import type { GroupRowRendererProps } from './GroupRow';
import { useRovingCellRef } from './hooks';

type SharedGroupRowRendererProps<R, SR> = Pick<
  GroupRowRendererProps<R, SR>,
  'id' | 'groupKey' | 'childRows' | 'isExpanded' | 'toggleGroup'
>;

interface GroupCellProps<R, SR> extends SharedGroupRowRendererProps<R, SR> {
  column: CalculatedColumn<R, SR>;
  row: GroupRow<R>;
  isCellSelected: boolean;
  groupColumnIndex: number;
  moreProps?: object | undefined;
  'data-testid'?: Maybe<string>;
}

function GroupCell<R, SR>({
  id,
  groupKey,
  childRows,
  isExpanded,
  isCellSelected,
  column,
  row,
  groupColumnIndex,
  toggleGroup: toggleGroupWrapper,
  moreProps,
  'data-testid': testId
}: GroupCellProps<R, SR>) {
  const { ref, tabIndex, onFocus } = useRovingCellRef(isCellSelected);

  function toggleGroup() {
    toggleGroupWrapper(id);
  }

  // Only make the cell clickable if the group level matches
  const isLevelMatching = column.rowGroup && groupColumnIndex === column.idx;

  return (
    <div
      role="gridcell"
      aria-colindex={column.idx + 1}
      aria-selected={isCellSelected}
      ref={ref}
      tabIndex={tabIndex}
      key={column.key}
      className={getCellClassname(column)}
      style={{
        ...getCellStyle(column),
        cursor: isLevelMatching ? 'pointer' : 'default'
      }}
      onClick={isLevelMatching ? toggleGroup : undefined}
      onFocus={onFocus}
      data-testid={`${testId}-column-${column.idx + 1}`}
    >
      {(!column.rowGroup || groupColumnIndex === column.idx) && column.groupFormatter && (
        <column.groupFormatter
          groupKey={groupKey}
          childRows={childRows}
          column={column}
          row={row}
          isExpanded={isExpanded}
          isCellSelected={isCellSelected}
          toggleGroup={toggleGroup}
          moreProps={moreProps}
          data-testid={`${testId}-column-${column.idx + 1}`}
        />
      )}
    </div>
  );
}

export default memo(GroupCell) as <R, SR>(props: GroupCellProps<R, SR>) => JSX.Element;
