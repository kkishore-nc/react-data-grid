import { css } from '@linaria/core';

import { useFocusRef } from './hooks';
import type { HeaderRendererProps } from './types';
import { useDefaultComponents } from './DataGridDefaultComponentsProvider';

const headerSortCell = css`
  cursor: pointer;
  display: flex;

  &:focus {
    outline: none;
  }
`;

const headerSortCellClassname = `rdg-header-sort-cell ${headerSortCell}`;

const headerSortName = css`
  flex-grow: 1;
  overflow: hidden;
  overflow: clip;
  text-overflow: ellipsis;
`;

const headerSortNameClassname = `rdg-header-sort-name ${headerSortName}`;

export default function HeaderRenderer<R, SR>({
  column,
  sortDirection,
  priority,
  onSort,
  isCellSelected,
  moreProps
}: HeaderRendererProps<R, SR>) {
  if (!column.sortable) return <>{column.name}</>;

  return (
    <SortableHeaderCell
      onSort={onSort}
      sortDirection={sortDirection}
      priority={priority}
      isCellSelected={isCellSelected}
      moreProps={moreProps}
    >
      {column.name}
    </SortableHeaderCell>
  );
}

type SharedHeaderCellProps<R, SR> = Pick<
  HeaderRendererProps<R, SR>,
  'sortDirection' | 'onSort' | 'priority' | 'isCellSelected'
>;

interface SortableHeaderCellProps<R, SR> extends SharedHeaderCellProps<R, SR> {
  children: React.ReactNode;
  moreProps: object | undefined;
}

function SortableHeaderCell<R, SR>({
  onSort,
  sortDirection,
  priority,
  children,
  isCellSelected,
  moreProps
}: SortableHeaderCellProps<R, SR>) {
  const SortIcon = useDefaultComponents<R, SR>()!.sortIcon!;
  const { ref, tabIndex } = useFocusRef<HTMLSpanElement>(isCellSelected);

  function handleKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    if (event.key === ' ' || event.key === 'Enter') {
      // stop propagation to prevent scrolling
      event.preventDefault();
      onSort(event.ctrlKey || event.metaKey);
    }
  }

  function handleClick(event: React.MouseEvent<HTMLSpanElement>) {
    onSort(event.ctrlKey || event.metaKey);
  }

  return (
    <span
      ref={ref}
      tabIndex={tabIndex}
      className={headerSortCellClassname}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className={headerSortNameClassname}>{children}</span>
      <span>
        <SortIcon moreProps={moreProps} sortDirection={sortDirection} />
        {priority}
      </span>
    </span>
  );
}
