import { css } from '@linaria/core';

import type { CalculatedColumn, Maybe, SortColumn } from './types';
import type { HeaderRowProps } from './HeaderRow';
import DefaultHeaderRenderer from './HeaderRenderer';
import { getCellStyle, getCellClassname, clampColumnWidth } from './utils';
import { useRovingCellRef } from './hooks';

const cellResizable = css`
  touch-action: none;

  &::after {
    content: '';
    cursor: col-resize;
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    inset-block-end: 0;
    inline-size: 10px;
  }
`;

const cellResizableClassname = `rdg-cell-resizable ${cellResizable}`;

type SharedHeaderRowProps<R, SR> = Pick<
  HeaderRowProps<R, SR, React.Key>,
  | 'sortColumns'
  | 'onSortColumnsChange'
  | 'allRowsSelected'
  | 'onAllRowsSelectionChange'
  | 'selectCell'
  | 'onColumnResize'
  | 'shouldFocusGrid'
  | 'direction'
>;

export interface HeaderCellProps<R, SR> extends SharedHeaderRowProps<R, SR> {
  column: CalculatedColumn<R, SR>;
  colSpan: number | undefined;
  isCellSelected: boolean;
  moreProps?: object | undefined;
  'data-testid'?: Maybe<string>;
}

export default function HeaderCell<R, SR>({
  column,
  colSpan,
  isCellSelected,
  onColumnResize,
  allRowsSelected,
  onAllRowsSelectionChange,
  sortColumns,
  onSortColumnsChange,
  selectCell,
  shouldFocusGrid,
  direction,
  moreProps,
  'data-testid': testId
}: HeaderCellProps<R, SR>) {
  const isRtl = direction === 'rtl';
  const { ref, tabIndex, onFocus } = useRovingCellRef(isCellSelected);
  const sortIndex = sortColumns?.findIndex((sort) => sort.columnKey === column.key);
  const sortColumn =
    sortIndex !== undefined && sortIndex > -1 ? sortColumns![sortIndex] : undefined;
  const sortDirection = sortColumn?.direction;
  const priority = sortColumn !== undefined && sortColumns!.length > 1 ? sortIndex! + 1 : undefined;
  const ariaSort =
    sortDirection && !priority ? (sortDirection === 'ASC' ? 'ascending' : 'descending') : undefined;

  const className = getCellClassname(column, column.headerCellClass, {
    [cellResizableClassname]: column.resizable
  });

  const HeaderRenderer = column.headerRenderer ?? DefaultHeaderRenderer;

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.buttons !== 1) {
      return;
    }

    const { currentTarget, pointerId } = event;
    const { right, left } = currentTarget.getBoundingClientRect();
    const offset = isRtl ? event.clientX - left : right - event.clientX;

    if (offset > 11) {
      // +1px to account for the border size
      return;
    }

    function onPointerMove(event: PointerEvent) {
      const { right, left } = currentTarget.getBoundingClientRect();
      const width = isRtl ? right + offset - event.clientX : event.clientX + offset - left;
      if (width > 0) {
        onColumnResize(column, clampColumnWidth(width, column));
      }
    }

    function onLostPointerCapture() {
      currentTarget.removeEventListener('pointermove', onPointerMove);
      currentTarget.removeEventListener('lostpointercapture', onLostPointerCapture);
    }

    currentTarget.setPointerCapture(pointerId);
    currentTarget.addEventListener('pointermove', onPointerMove);
    currentTarget.addEventListener('lostpointercapture', onLostPointerCapture);
  }

  function onSort(ctrlClick: boolean) {
    if (onSortColumnsChange == null) return;
    const { sortDescendingFirst } = column;
    if (sortColumn === undefined) {
      // not currently sorted
      const nextSort: SortColumn = {
        columnKey: column.key,
        direction: sortDescendingFirst ? 'DESC' : 'ASC'
      };
      onSortColumnsChange(sortColumns && ctrlClick ? [...sortColumns, nextSort] : [nextSort]);
    } else {
      let nextSortColumn: SortColumn | undefined;
      if (
        (sortDescendingFirst && sortDirection === 'DESC') ||
        (!sortDescendingFirst && sortDirection === 'ASC')
      ) {
        nextSortColumn = {
          columnKey: column.key,
          direction: sortDirection === 'ASC' ? 'DESC' : 'ASC'
        };
      }
      if (ctrlClick) {
        const nextSortColumns = [...sortColumns!];
        if (nextSortColumn) {
          // swap direction
          nextSortColumns[sortIndex!] = nextSortColumn;
        } else {
          // remove sort
          nextSortColumns.splice(sortIndex!, 1);
        }
        onSortColumnsChange(nextSortColumns);
      } else {
        onSortColumnsChange(nextSortColumn ? [nextSortColumn] : []);
      }
    }
  }

  function onClick() {
    selectCell(column.idx);
  }

  function onDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    const { right, left } = event.currentTarget.getBoundingClientRect();
    const offset = isRtl ? event.clientX - left : right - event.clientX;

    if (offset > 11) {
      // +1px to account for the border size
      return;
    }

    onColumnResize(column, 'auto');
  }

  function handleFocus(event: React.FocusEvent<HTMLDivElement>) {
    onFocus?.(event);
    if (shouldFocusGrid) {
      // Select the first header cell if there is no selected cell
      selectCell(0);
    }
  }

  return (
    <div
      role="columnheader"
      aria-colindex={column.idx + 1}
      aria-selected={isCellSelected}
      aria-sort={ariaSort}
      aria-colspan={colSpan}
      ref={ref}
      // set the tabIndex to 0 when there is no selected cell so grid can receive focus
      tabIndex={shouldFocusGrid ? 0 : tabIndex}
      className={className}
      style={{
        ...getCellStyle(column, colSpan),
        minWidth: column.minWidth,
        maxWidth: column.maxWidth ?? undefined
      }}
      onFocus={handleFocus}
      onClick={onClick}
      onDoubleClick={column.resizable ? onDoubleClick : undefined}
      onPointerDown={column.resizable ? onPointerDown : undefined}
      data-testid={`${testId}-column-${column.idx + 1}`}
    >
      <HeaderRenderer
        column={column}
        sortDirection={sortDirection}
        priority={priority}
        onSort={onSort}
        allRowsSelected={allRowsSelected}
        onAllRowsSelectionChange={onAllRowsSelectionChange}
        isCellSelected={isCellSelected}
        moreProps={moreProps}
        data-testid={`${testId}-column-${column.idx + 1}`}
      />
    </div>
  );
}
