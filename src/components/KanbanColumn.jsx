import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import KanbanTicket from './KanbanTicket';
import { useAppStore } from '../store';
import { DropIndicator } from './KanbanBoard';

export default function KanbanColumn({
  column,
  colIdx,
  isAdmin,
  ui,
  setColUi,
  moveColumn,
  startRenameColumn,
  saveRenameColumn,
  removeColumn,
  updateWipLimit,
  kanban,
  ticketIds,
  removing = false,
  ...rest
}) {
  // dnd-kit hook is called here, not in the parent map
  const { setNodeRef: setColDroppableRef, isOver: isColOver } = useDroppable({
    id: column.id,
  });

  const colId = column.id;
  const isHolding = colId === 'holding';
  const isIncoming = column.isIncoming;
  // Get tickets from kanban.tickets object
  const kanbanTickets = useAppStore(s => s.kanban.tickets);
  const tickets = ticketIds.map(id => kanbanTickets[id]).filter(Boolean);

  return (
    <div
      key={colId}
      ref={setColDroppableRef}
      className={
        'flex-1 min-w-[260px] rounded-lg shadow p-2 flex flex-col transition-all ' +
        (isColOver ? ' ring-2 ring-blue-400' : '') +
        (isHolding ? ' bg-yellow-100 border-2 border-yellow-400' : isIncoming ? ' bg-yellow-50 border-2 border-yellow-300' : ' bg-gray-100') +
        (removing ? ' fade-out' : '')
      }
    >
      <div className="flex items-center justify-between mb-2">
        {/* Prevent renaming for Incoming column */}
        {ui.renaming && !isIncoming ? (
          <>
            <input
              className="border rounded px-2 py-1 text-lg font-bold"
              value={ui.newColName || ''}
              onChange={e => setColUi((u) => ({ ...u, [colId]: { ...u[colId], newColName: e.target.value } }))}
              onKeyDown={e => e.key === 'Enter' && saveRenameColumn(colId)}
              autoFocus
            />
            <button className="ml-2 text-green-700 font-bold" onClick={() => saveRenameColumn(colId)}>✔</button>
            <button className="ml-1 text-red-600 font-bold" onClick={() => setColUi((u) => ({ ...u, [colId]: { ...u[colId], renaming: false, newColName: '' } }))}>✖</button>
          </>
        ) : (
          <>
            <h2 className={
              'font-bold text-lg flex-1 truncate ' +
              (isIncoming ? 'text-yellow-800' : 'text-gray-700')
            }>{column.name}</h2>
            {/* No controls for Incoming column */}
            {isAdmin && !isIncoming && (
              <div className="flex items-center gap-1 ml-2">
                <button title="Move Left" className="text-blue-600 hover:bg-blue-100 rounded p-1 text-xs" disabled={colIdx === 0} onClick={() => moveColumn(colId, -1)}>←</button>
                <button title="Move Right" className="text-blue-600 hover:bg-blue-100 rounded p-1 text-xs" disabled={colIdx === kanban.columnOrder.length - 1} onClick={() => moveColumn(colId, 1)}>→</button>
                <button title="Remove Column" className="text-red-600 hover:bg-red-100 rounded p-1 text-xs" onClick={() => removeColumn(colId)}>🗑️</button>
              </div>
            )}
          </>
        )}
      </div>
      {/* WIP limit display and edit - not for Incoming column */}
      {!isIncoming && (
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-700 font-semibold" style={{ fontSize: '115%' }}>WIP: {column.wipLimit ? `${column.ticketIds.length}/${column.wipLimit}` : column.ticketIds.length}</span>
          {isAdmin && (
            <>
              <input
                type="number"
                min="1"
                className="border rounded px-2 py-1 w-20 text-sm"
                style={{ fontSize: '115%' }}
                placeholder="Set WIP"
                value={ui.newWipLimit || ''}
                onChange={e => setColUi((u) => ({ ...u, [colId]: { ...u[colId], newWipLimit: e.target.value } }))}
                onKeyDown={e => e.key === 'Enter' && updateWipLimit(colId)}
              />
              <button className="text-blue-600 text-sm font-bold px-2 py-1" style={{ fontSize: '115%' }} onClick={() => updateWipLimit(colId)}>Set</button>
            </>
          )}
        </div>
      )}
      {/* Render tickets for this column with DropIndicators */}
  <SortableContext items={ticketIds} id={colId} key={ticketIds.join(',')}>
        <div className="flex flex-col gap-2 flex-1">
          {/* DropIndicator before first ticket */}
          <DropIndicator colId={colId} index={0} />
          {tickets.length === 0 ? (
            <div className="text-gray-400 italic text-center">No tickets</div>
          ) : (
            tickets.map((ticket, idx) => [
              <KanbanTicket key={ticket.id} ticket={ticket} position={idx} colId={colId} />,
              <DropIndicator key={`drop-${ticket.id}`} colId={colId} index={idx + 1} />
            ])
          )}
        </div>
      </SortableContext>
      {isHolding && (
        <div className="text-yellow-700 font-bold text-center mb-2 animate-pulse">Tickets moved here from deleted columns. Please reassign!</div>
      )}
    </div>
  );
}
