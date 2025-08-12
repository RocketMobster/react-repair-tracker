import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '../store';
import CardPreviewModal from './CardPreviewModal';

export default function KanbanTicket({ ticket, colId, position }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { colId },
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const updateKanbanTicket = useAppStore((s) => s.updateKanbanTicket);
  const removeKanbanTicket = useAppStore((s) => s.removeKanbanTicket);
  const customers = useAppStore((s) => s.customers) || [];
  const navigate = useNavigate();

  // Lookup company name from customerId
  let companyName = '—';
  if (ticket.customerId) {
    const customer = customers.find(c => c.id === ticket.customerId);
    companyName = customer?.companyName || customer?.businessName || '—';
  }

  // Quick action handlers
  const handleEdit = (e) => {
    e.stopPropagation();
    // Navigate to edit page or open modal (stub)
    navigate(`/tickets/${ticket.id}/edit`);
  };
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this ticket?')) {
      removeKanbanTicket(ticket.id);
    }
  };
  const handleView = (e) => {
    e.stopPropagation();
    navigate(`/tickets/${ticket.id}`);
  };
  const togglePriority = (e) => {
    e.stopPropagation();
    updateKanbanTicket({ ...ticket, highPriority: !ticket.highPriority });
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
          transition,
          opacity: isDragging ? 0.5 : 1,
          zIndex: isDragging ? 50 : 1,
        }}
        className={
          'bg-white rounded shadow p-3 mb-1 cursor-pointer select-none transition-all ' +
          (isDragging ? 'ring-2 ring-blue-400' : '')
        }
        {...attributes}
        {...listeners}
        onClick={() => setPreviewOpen(true)}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400">#{position + 1}</span>
          <button
            className={
              'ml-2 px-2 py-0.5 rounded text-xs font-bold flex items-center ' +
              (ticket.highPriority
                ? 'bg-red-200 text-red-700 border border-red-400'
                : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-yellow-100 hover:text-yellow-600')
            }
            title={ticket.highPriority ? 'Remove high priority' : 'Mark as high priority'}
            onClick={togglePriority}
            tabIndex={0}
            type="button"
            style={{ outline: 'none' }}
            onMouseDown={e => e.stopPropagation()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill={ticket.highPriority ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={ticket.highPriority ? 0 : 2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
            {ticket.highPriority && 'HIGH'}
          </button>
        </div>
  <div className="font-bold text-base text-gray-800 truncate">RMA: {ticket.rmaNumber || ticket.rma || '—'}</div>
  <div className="text-xs text-gray-700 font-semibold truncate">{ticket.item || '—'}</div>
  <div className="text-xs text-gray-500 truncate">{companyName}</div>
  {ticket.assignedTo && <div className="text-xs text-gray-400">Assigned: {ticket.assignedTo}</div>}
      </div>
      <CardPreviewModal key={ticket.id} ticket={ticket} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </>
  );
}
