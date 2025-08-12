import React, { useState, useRef } from 'react';
import '../components/kanban-animations.css';
import { useAppStore } from '../store';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import KanbanTicket from './KanbanTicket';

// KanbanBoard: renders columns and tickets
export default function KanbanBoard() {
  const kanban = useAppStore((s) => s.kanban);
  const [removingColId, setRemovingColId] = useState(null);
  const removeTimeoutRef = useRef();
  const [search, setSearch] = useState('');
  const [activeDragId, setActiveDragId] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [holdingNotice, setHoldingNotice] = useState(false);
  const [holdingDeleteBlocked, setHoldingDeleteBlocked] = useState(false);
  // Per-column UI state: { [colId]: { renaming: bool, newColName: string, newWipLimit: string } }
  const [colUi, setColUi] = useState({});
  // Notification for WIP limit violation
  const [wipNotice, setWipNotice] = useState(null);
  const isAdmin = true; // TODO: Replace with real permission check

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Helper: returns true if ticket matches search and filter
  const ticketMatches = (ticket) => {
    if (!search.trim()) return filterAssignee ? ticket.assignedTo === filterAssignee : true;
    const s = search.trim().toLowerCase();
    const matchesSearch =
      (ticket.id && ticket.id.toLowerCase().includes(s)) ||
      (ticket.title && ticket.title.toLowerCase().includes(s)) ||
      (ticket.rma && ticket.rma.toLowerCase().includes(s)) ||
      (ticket.rmaNumber && String(ticket.rmaNumber).toLowerCase().includes(s)) ||
      (ticket.company && ticket.company.toLowerCase().includes(s)) ||
      (ticket.notes && ticket.notes.toLowerCase().includes(s)) ||
      (ticket.description && ticket.description.toLowerCase().includes(s)) ||
      (ticket.customFields && Object.values(ticket.customFields).some(v => v && String(v).toLowerCase().includes(s)));
    const matchesAssignee = filterAssignee ? ticket.assignedTo === filterAssignee : true;
    return matchesSearch && matchesAssignee;
  };

  // Sort ticket IDs in a column by ticket data
  const sortTicketIds = (ids) => {
    if (sortBy === 'priority') {
      return [...ids].sort((a, b) => {
        const ta = kanban.tickets[a];
        const tb = kanban.tickets[b];
        return (tb.highPriority ? 1 : 0) - (ta.highPriority ? 1 : 0);
      });
    }
    if (sortBy === 'date') {
      return [...ids].sort((a, b) => {
        const ta = kanban.tickets[a];
        const tb = kanban.tickets[b];
        return new Date(tb.createdAt || 0) - new Date(ta.createdAt || 0);
      });
    }
    if (sortBy === 'assignee') {
      return [...ids].sort((a, b) => {
        const ta = kanban.tickets[a];
        const tb = kanban.tickets[b];
        return (ta.assignedTo || '').localeCompare(tb.assignedTo || '');
      });
    }
    return ids;
  };

  // Filtered and sorted ticketIds per column
  const getFilteredTicketIds = (colOrId) => {
    const col = typeof colOrId === 'string' ? kanban.columns.find(c => c.id === colOrId) : colOrId;
    if (!col) return [];
    const filtered = col.ticketIds.filter((id) => {
      const ticket = kanban.tickets[id];
      return ticket && ticketMatches(ticket);
    });
    return sortTicketIds(filtered);
  };

  // Check if any tickets match at all (must be after getFilteredTicketIds)
  const anyMatch = kanban.columnOrder.some((colId) => getFilteredTicketIds(colId).length > 0);

  // Zustand actions
  const moveTicket = (ticketId, toColId, toIdx) => {
    // Find if this is the last ticket in Incoming column
    const incomingCol = kanban.columns.find(col => col.id === 'incoming');
    const fromCol = kanban.columns.find(col => col.ticketIds.includes(ticketId));
    if (fromCol && fromCol.id === 'incoming' && incomingCol && incomingCol.ticketIds.length === 1) {
      setRemovingColId('incoming');
      // Delay actual move to allow animation
      clearTimeout(removeTimeoutRef.current);
      removeTimeoutRef.current = setTimeout(() => {
        useAppStore.getState().moveTicket(ticketId, toColId, toIdx);
        setRemovingColId(null);
      }, 400); // match CSS duration
      return;
    }
    useAppStore.getState().moveTicket(ticketId, toColId, toIdx);
  };

  // Robust handleDragEnd for per-column droppable and per-ticket drop indicators
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || !active) return;
    const activeId = active.id;
    const fromColId = active.data.current?.colId;
    let overId = over.id;
    let toColId = over.data.current?.colId;

    // If dropped on a column droppable (empty column or at end)
    if (overId && overId.startsWith('col-')) {
      toColId = overId.replace('col-', '');
      const destCol = kanban.columns.find(col => col.id === toColId);
      if (!destCol) return;
      if (destCol.wipLimit && destCol.ticketIds.length >= destCol.wipLimit) {
        setWipNotice(`Cannot move ticket: "${destCol.name}" column is at its WIP limit (${destCol.wipLimit}).`);
        return;
      }
      moveTicket(activeId, toColId, destCol.ticketIds.length);
      return;
    }

    // If dropped on a ticket drop indicator
    if (overId && overId.startsWith('indicator-')) {
      const [_, col, idx] = overId.split('-');
      toColId = col;
      const destCol = kanban.columns.find(col => col.id === toColId);
      const destIndex = parseInt(idx, 10);
      if (destCol && destCol.wipLimit && destCol.ticketIds.length >= destCol.wipLimit) {
        setWipNotice(`Cannot move ticket: "${destCol.name}" column is at its WIP limit (${destCol.wipLimit}).`);
        return;
      }
      moveTicket(activeId, toColId, destIndex);
      return;
    }

    // If dropped on a ticket itself
    if (toColId && kanban.columns.find(col => col.id === toColId)?.ticketIds.includes(overId)) {
      const destCol = kanban.columns.find(col => col.id === toColId);
      const destIndex = destCol.ticketIds.indexOf(overId);
      if (destCol && destCol.wipLimit && destCol.ticketIds.length >= destCol.wipLimit) {
        setWipNotice(`Cannot move ticket: "${destCol.name}" column is at its WIP limit (${destCol.wipLimit}).`);
        return;
      }
      moveTicket(activeId, toColId, destIndex);
      return;
    }
  };


  // Track drag start
  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  // Find the ticket being dragged for DragOverlay
  let activeTicket = null;
  if (activeDragId) {
    activeTicket = kanban.tickets[activeDragId];
  }


  // Collect all unique assignees for filter dropdown
  const allAssignees = Array.from(
    new Set(
      Object.values(kanban.tickets)
        .map((t) => t.assignedTo)
        .filter(Boolean)
    )
  );


  // Column actions
  const addColumn = () => {
    const name = prompt('Column name?');
    if (!name) return;
    useAppStore.getState().addKanbanColumn(name);
  };
  // Patch removeColumn to show notification if tickets are moved
  const removeColumn = (colId) => {
    const col = kanban.columns.find(c => c.id === colId);
    if (colId === 'holding' && col && col.ticketIds.length > 0) {
      setHoldingDeleteBlocked(true);
      useAppStore.getState().removeKanbanColumn(colId); // triggers store flag
      return;
    }
    if (window.confirm('Remove this column and all its tickets?')) {
      if (col && col.ticketIds.length > 0) setHoldingNotice(true);
      useAppStore.getState().removeKanbanColumn(colId);
    }
  };
  const startRenameColumn = (colId, currentName) => {
    setColUi((ui) => ({
      ...ui,
      [colId]: { ...ui[colId], renaming: true, newColName: currentName }
    }));
  };
  const saveRenameColumn = (colId) => {
    const name = colUi[colId]?.newColName || '';
    if (name.trim()) {
      useAppStore.getState().renameKanbanColumn(colId, name.trim());
    }
    setColUi((ui) => ({ ...ui, [colId]: { ...ui[colId], renaming: false, newColName: '' } }));
  };
  const moveColumn = (colId, dir) => {
    useAppStore.getState().moveKanbanColumn(colId, dir);
  };
  const updateWipLimit = (colId) => {
    const val = parseInt(colUi[colId]?.newWipLimit, 10);
    if (!isNaN(val) && val > 0) {
      useAppStore.getState().setKanbanColumnWipLimit(colId, val);
    }
    setColUi((ui) => ({ ...ui, [colId]: { ...ui[colId], newWipLimit: '' } }));
  };

  // Listen for holdingDeleteBlocked flag in store
  const holdingDeleteBlockedFlag = useAppStore(s => s.holdingDeleteBlocked);
  React.useEffect(() => {
    if (holdingDeleteBlockedFlag) setHoldingDeleteBlocked(true);
  }, [holdingDeleteBlockedFlag]);

  // Defensive: build a stable, ordered array of columns that exist in both columns and columnOrder
  const columnsById = Object.fromEntries(kanban.columns.map(col => [col.id, col]));
  const orderedColumns = kanban.columnOrder
    .map(colId => columnsById[colId])
    .filter(Boolean); // Only valid columns

  return (
    <div className="w-full">
      {wipNotice && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow z-50 flex items-center gap-2">
          <span>{wipNotice}</span>
          <button
            className="ml-2 px-2 py-0.5 rounded bg-yellow-200 text-yellow-900 text-xs font-semibold border border-yellow-400 hover:bg-yellow-300"
            onClick={() => setWipNotice(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {holdingDeleteBlocked && (
        <div className="bg-red-200 border-l-4 border-red-500 text-red-900 p-4 mb-4 flex items-center justify-between animate-pulse">
          <span className="font-bold">You must reassign or remove all tickets from the Holding column before deleting it.</span>
          <button className="ml-4 px-3 py-1 bg-red-300 rounded font-bold" onClick={() => setHoldingDeleteBlocked(false)}>Dismiss</button>
        </div>
      )}
      {holdingNotice && (
        <div className="bg-yellow-200 border-l-4 border-yellow-500 text-yellow-900 p-4 mb-4 flex items-center justify-between animate-pulse">
          <span className="font-bold">Tickets from the deleted column were moved to the Holding column for safety.</span>
          <button className="ml-4 px-3 py-1 bg-yellow-300 rounded font-bold" onClick={() => setHoldingNotice(false)}>Dismiss</button>
        </div>
      )}
      {/* Admin: Add column button */}
      {isAdmin && (
        <div className="mb-2 flex items-center justify-end">
          <button className="bg-green-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-green-700" onClick={addColumn}>+ Add Column</button>
        </div>
      )}
      {sortBy && (
        <div className="mb-2 flex items-center justify-center">
          <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-2 rounded flex items-center gap-2 text-lg font-semibold shadow">
            Board is sorted by <span className="capitalize">{sortBy}</span>

            <button
              className="ml-2 text-blue-800 hover:text-red-600 font-bold text-xl px-2"
              aria-label="Clear sort"
              onClick={() => setSortBy('')}
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          className="border rounded px-3 py-2 w-full max-w-md"
          placeholder="Search by RMA#, company, ticket ID, or title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-2 py-2"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="">Sort by…</option>
          <option value="priority">Priority</option>
          <option value="date">Date</option>
          <option value="assignee">Assignee</option>
        </select>
        <select
          className="border rounded px-2 py-2"
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
        >
          <option value="">All Assignees</option>
          {allAssignees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {search && (
          <button className="ml-2 px-3 py-2 bg-gray-200 rounded" onClick={() => setSearch('')}>Clear</button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <div className="flex w-full gap-4 overflow-x-auto p-4 min-h-[60vh]">
          {orderedColumns.length === 0 && (
            <div className="text-gray-400 italic">No columns. Add one to get started.</div>
          )}
          {orderedColumns.map((column, colIdx) => (
            <KanbanColumn
              key={column.id}
              column={column}
              colIdx={colIdx}
              isAdmin={isAdmin}
              ui={colUi[column.id] || {}}
              setColUi={setColUi}
              moveColumn={moveColumn}
              startRenameColumn={startRenameColumn}
              saveRenameColumn={saveRenameColumn}
              removeColumn={removeColumn}
              updateWipLimit={updateWipLimit}
              kanban={kanban}
              ticketIds={getFilteredTicketIds(column)}
              removing={removingColId === column.id}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTicket && (
            <div style={{ opacity: 0.6, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)' }}>
              <KanbanTicket ticket={activeTicket} colId={null} position={0} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      {search && !anyMatch && (
        <div className="text-center text-red-500 mt-4">No tickets match your search.</div>
      )}
    </div>
  );
}

// DropIndicator for per-ticket drop targeting
export function DropIndicator({ colId, index }) {
  const { isOver, setNodeRef } = useDroppable({ id: `indicator-${colId}-${index}` });
  return (
    <div
      ref={setNodeRef}
      style={{
        height: 16,
        zIndex: 50,
        pointerEvents: 'auto',
        position: 'relative',
      }}
      className={
        'w-full transition-all ' +
        (isOver ? 'bg-blue-600 rounded my-1 shadow-lg' : '')
      }
    />
  );
}
