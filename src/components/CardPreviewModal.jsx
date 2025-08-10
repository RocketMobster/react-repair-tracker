import React, { useEffect } from 'react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';

// TODO: Replace with real permission check
const isAdmin = true;

export default function CardPreviewModal({ ticket, open, onClose }) {
  const customers = useAppStore((s) => s.customers) || [];
  // Lookup company name from customerId
  let companyName = '—';
  if (ticket && ticket.customerId) {
    const customer = customers.find(c => c.id === ticket.customerId);
    companyName = customer?.companyName || customer?.businessName || '—';
  }
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open || !ticket) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}
      style={{ zIndex: 99999, position: 'fixed' }}>
      <div
        className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 relative"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        style={{
          zIndex: 100000,
          position: 'relative',
          pointerEvents: 'auto',
        }}
      >
        <button
          className="absolute top-1 right-1 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-400 hover:text-red-500 text-3xl font-bold select-none"
          style={{
            width: 44,
            height: 44,
            minWidth: 44,
            minHeight: 44,
            background: 'rgba(255,255,255,0.01)',
            cursor: 'pointer',
            transition: 'color 0.15s',
            zIndex: 2000,
            boxShadow: '0 0 0 2px rgba(0,0,0,0.01)',
            pointerEvents: 'auto',
          }}
          onClick={onClose}
          aria-label="Close preview"
          type="button"
        >
          <span style={{ fontSize: '2rem', lineHeight: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </span>
        </button>
        <div className="flex items-center justify-between mb-2 relative">
          {isAdmin && (
            <button
              className="absolute left-0 top-0 px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 z-20"
              onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
              type="button"
              title="Edit this ticket"
              style={{ marginTop: 4, marginLeft: 4 }}
            >
              Edit
            </button>
          )}
          <h2 className="text-xl font-bold flex items-center gap-2 mx-auto">
            Ticket Preview
            {ticket.highPriority && <span className="ml-2 px-2 py-0.5 bg-red-200 text-red-700 rounded text-xs font-bold">HIGH</span>}
          </h2>
        </div>
  <div className="mb-2 text-gray-700 font-bold text-lg">{ticket.item || '—'}</div>
  <div className="mb-1 text-sm text-gray-500">RMA: {ticket.rmaNumber || ticket.rma || '—'}</div>
  <div className="mb-1 text-sm text-gray-500">Company: {companyName}</div>
  {ticket.assignedTo && <div className="mb-1 text-sm text-gray-500">Assigned: {ticket.assignedTo}</div>}
  <div className="mb-1 text-sm text-gray-500">Status: {ticket.statusHistory?.[ticket.statusHistory.length-1]?.columnId || ticket.status || '—'}</div>
  <div className="mb-1 text-sm text-gray-500">Created: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}</div>
        {/* Description/notes placeholder */}
        {ticket.description && (
          <div className="mb-2 text-gray-600"><span className="font-semibold">Description:</span> {ticket.description}</div>
        )}
        {/* Status history */}
        {ticket.statusHistory && ticket.statusHistory.length > 1 && (
          <div className="mt-4">
            <div className="font-semibold text-gray-700 mb-1">Status History:</div>
            <ul className="text-xs text-gray-500 space-y-1">
              {ticket.statusHistory.map((h, i) => (
                <li key={i}>
                  {h.columnId} &mdash; {h.enteredAt}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Barcode</label>
          <div className="text-gray-400 italic text-xs">
            {/* Placeholder for future barcode plugin */}
            Barcode field will appear here when barcode plugin is enabled.
          </div>
        </div>
        {/* Attachments section */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="mt-6">
            <div className="font-semibold text-gray-700 mb-2">Attachments:</div>
            <div className="flex flex-col gap-2">
              {ticket.attachments.map((file, i) => {
                if (!file || typeof file !== 'object' || Array.isArray(file)) return null;
                // Defensive: Only return a single React element, never the file object or an array containing it
                try {
                  return (
                    <div key={i} className="flex items-center gap-3">
                      {file.type && file.type.startsWith('image') ? (
                        <img
                          src={file.url}
                          alt={file.filename}
                          className="max-h-32 max-w-xs rounded border"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="inline-block w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </span>
                      )}
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm" download>
                        {file.filename}
                      </a>
                    </div>
                  );
                } catch (err) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('Invalid attachment object in CardPreviewModal:', file, err);
                  }
                  return null;
                }
              })}
            </div>
          </div>
        )}
        {/* Placeholder for custom fields */}
        {/* Future: Render any custom fields here */}
      </div>
    </div>
  );
}
