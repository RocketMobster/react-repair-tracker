
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from './store';
import { useParams, useNavigate } from 'react-router-dom';
import { generateRmaNumber } from './rmaUtils';
import DynamicForm from './DynamicForm';
import { ticketFormSchema, ticketFieldGroups } from './formSchemas';
import { formatPhoneNumber } from './phoneFormat';

export default function TicketDetails({ editModeFromRoute }) {
  // ...existing code...
  // Helper to render attachments safely
  function renderAttachments(attachments) {
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) return null;
    return (
      <div className="mt-4">
        <div className="font-semibold text-gray-700 mb-2">Attachments:</div>
        <div className="flex flex-col gap-2">
          {attachments.map((file, i) => {
            if (!file || typeof file !== 'object' || Array.isArray(file)) return null;
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
          })}
        </div>
      </div>
    );
  }
  const params = useParams();
  const ticketId = params.ticketId;
  const customerSlug = params.customerId;
  const navigate = useNavigate();
  const tickets = useAppStore(s => s.tickets);
  const customers = useAppStore(s => s.customers);
  const setTickets = useAppStore(s => s.setTickets);
  const removeKanbanTicket = useAppStore(s => s.removeKanbanTicket);
  // TODO: Replace with real role check when user roles are implemented
  const userIsAdmin = true; // Placeholder for role-based access
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  // Debug: log ticketId and all ticket IDs in store
  console.log('TicketDetails: ticketId param =', ticketId);
  console.log('TicketDetails: tickets in store =', tickets.map(t => t.id));

  // Wait for tickets to load
  if (!tickets || tickets.length === 0) {
    return <div className="p-4 text-gray-600">Loading tickets...</div>;
  }
  let ticket = null;
  let fallbackCustomer = null;
  if (customerSlug) {
    const customer = customers.find(c => c.slug === customerSlug);
    ticket = tickets.find(t => String(t.id) === String(ticketId) && customer && t.customerId === customer.id);
    fallbackCustomer = customer;
    if (!ticket && tickets.length > 0) {
      ticket = tickets.find(t => String(t.id) === String(ticketId));
      if (ticket) {
        fallbackCustomer = customers.find(c => c.id === ticket.customerId);
      }
    }
  } else {
    // No customerSlug in route, just find ticket by ID and its customer
    ticket = tickets.find(t => String(t.id) === String(ticketId));
    if (ticket) {
      fallbackCustomer = customers.find(c => c.id === ticket.customerId);
    }
  }
  // If editModeFromRoute is true, start in edit mode
  const [editMode, setEditMode] = useState(!!editModeFromRoute);
  const [form, setForm] = useState({
    status: ticket?.status || '',
    item: ticket?.item || '',
    reason: ticket?.reason || '',
    technicianNotes: ticket?.technicianNotes || '',
  });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const itemInputRef = useRef(null);
  // Track if form is dirty (has unsaved changes)
  const isDirty = editMode && ticket && (
    form.status !== (ticket.status || '') ||
    form.item !== (ticket.item || '') ||
    form.notes !== (ticket.notes || '')
  );

  // Auto-focus first field in edit mode
  useEffect(() => {
    if (editMode && itemInputRef.current) {
      itemInputRef.current.focus();
    }
  }, [editMode]);

  if (!ticket) {
    return <div className="p-4 text-red-600">Ticket not found.</div>;
  }
  // Allow ticket to be shown/edited even if customer is missing, but show a warning
  const customerWarning = !fallbackCustomer ? (
    <div className="p-2 mb-2 bg-yellow-100 text-yellow-800 rounded">Warning: Customer not found for this ticket.</div>
  ) : null;

  function handleDynamicFormSubmit(values) {
    setError('');
    setMsg('');
    setLoading(true);
    setTimeout(() => {
      const updated = { ...ticket, ...values };
      // If status is set to Completed, set completedAt if not already set
      if (values.status === 'Completed' && !ticket.completedAt) {
        updated.completedAt = new Date().toISOString();
      }
      // If status is not Completed, clear completedAt
      if (values.status !== 'Completed') {
        updated.completedAt = undefined;
      }
      // Attachments: merge new with existing if any
      if (values.attachments && values.attachments.length > 0) {
        updated.attachments = values.attachments;
      }
      setTickets(tickets.map(t => t.id === ticket.id ? updated : t));
      // Also update Kanban ticket so board reflects changes
      if (typeof useAppStore.getState().updateKanbanTicket === 'function') {
        useAppStore.getState().updateKanbanTicket(updated);
      }
      setMsg('Ticket updated!');
      setLoading(false);
      setEditMode(false);
    }, 600); // Simulate async save
  }

  // Always use the stored RMA number
  const rmaNumber = ticket.rmaNumber;

  function handleDeleteTicket() {
    removeKanbanTicket(ticket.id);
    setTickets(tickets.filter(t => t.id !== ticket.id));
    setDeleteMsg("Ticket deleted.");
    setShowDeleteConfirm(false);
    // Optionally, navigate back to customer or tickets list
    setTimeout(() => {
      if (fallbackCustomer) {
        navigate(`/customers/${fallbackCustomer.slug}`);
      } else {
        navigate('/customers');
      }
    }, 600);
  }

  if (editMode) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white p-4 rounded shadow">
          {customerWarning}
          <button
            className="text-blue-600 underline mb-2"
            onClick={() => fallbackCustomer ? navigate(`/customers/${fallbackCustomer.slug}`) : navigate('/customers')}
            tabIndex={0}
          >&larr; Back to Customer</button>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">Edit RMA #{rmaNumber}</div>
            <div className="text-xs text-gray-400 ml-2">Ticket ID: {ticket.id}</div>
          </div>
          <div className="mb-2">
            <span className="font-semibold">Customer:</span> {
              fallbackCustomer?.companyName
              || fallbackCustomer?.businessName
              || fallbackCustomer?.contactName
              || fallbackCustomer?.id
              || <span className="text-yellow-800">Unknown</span>
            }
          </div>
          <DynamicForm
            schema={ticketFormSchema}
            initialValues={form}
            onSubmit={handleDynamicFormSubmit}
          />
          {msg && <div className="text-green-700 mt-2" role="status">{msg}</div>}
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white p-4 rounded shadow">
        {customerWarning}
        <button
          className="text-blue-600 underline mb-2"
          onClick={() => fallbackCustomer ? navigate(`/customers/${fallbackCustomer.slug}`) : navigate('/customers')}
          tabIndex={0}
        >&larr; Back to Customer</button>
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl font-bold">RMA #{rmaNumber}</div>
          <div className="text-xs text-gray-400 ml-2">Ticket ID: {ticket.id}</div>
        </div>
        <div className="mb-2 text-gray-700">Customer: <span className="font-semibold">{
          fallbackCustomer?.companyName
          || fallbackCustomer?.businessName
          || fallbackCustomer?.contactName
          || fallbackCustomer?.id
          || 'Unknown'
        }</span></div>
        {/* Grouped fields */}
        {ticketFieldGroups.map(group => (
          <div key={group.label} className={`mb-4 p-3 rounded ${group.color}`}>
            <div className="font-bold mb-2 text-sm uppercase tracking-wide text-gray-700">{group.label}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {group.fields.map(fieldName => {
                const f = ticketFormSchema.find(f => f.name === fieldName);
                if (!f) return null;
                let value = ticket[f.name] || '';
                if (f.type === 'tel') {
                  value = formatPhoneNumber(value, ticket[`${f.name}_country`] || 'US');
                  // If extension field exists, append it
                  const extField = f.name + 'Ext';
                  if (ticket[extField]) {
                    value = value + ` x${ticket[extField]}`;
                  }
                }
                if (f.type === 'date' && value) {
                  value = new Date(value).toLocaleDateString();
                }
                return (
                  <div key={f.name}>
                    <span className="font-semibold">{f.label}:</span> {value || <span className="text-gray-400">—</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {/* Ungrouped fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          {ticketFormSchema
            .filter(f => f.type !== 'hidden' && !ticketFieldGroups.some(g => g.fields.includes(f.name)))
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(f => {
              let value = ticket[f.name] || '';
              if (f.type === 'tel') {
                value = formatPhoneNumber(value, ticket[`${f.name}_country`] || 'US');
                // If extension field exists, append it
                const extField = f.name + 'Ext';
                if (ticket[extField]) {
                  value = value + ` x${ticket[extField]}`;
                }
              }
              if (f.type === 'date' && value) {
                value = new Date(value).toLocaleDateString();
              }
              // Fix: Render file fields as a list of filenames, not as objects
              if (f.type === 'file') {
                const files = Array.isArray(ticket[f.name]) ? ticket[f.name] : [];
                return (
                  <div key={f.name}>
                    <span className="font-semibold">{f.label}:</span>{' '}
                    {files.length === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <ul className="list-disc ml-4">
                        {files.map((file, idx) =>
                          file && typeof file === 'object' && file.filename ? (
                            <li key={file.url || file.filename}>
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">{file.filename}</a>
                            </li>
                          ) : null
                        )}
                      </ul>
                    )}
                  </div>
                );
              }
              return (
                <div key={f.name}>
                  <span className="font-semibold">{f.label}:</span> {value || <span className="text-gray-400">—</span>}
                </div>
              );
            })}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditMode(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Edit / Update</button>
          {userIsAdmin && (
            <button
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete ticket"
            >Delete</button>
          )}
        </div>
  {msg && <div className="text-green-700 mt-2" role="status">{msg}</div>}
  {deleteMsg && <div className="text-green-700 mt-2" role="status">{deleteMsg}</div>}
  {/* Render attachments safely */}
  {renderAttachments(ticket.attachments)}
  {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
              <div className="text-lg font-bold mb-2 text-red-700">Delete Ticket?</div>
              <div className="mb-4 text-gray-800">
                Are you sure you want to delete ticket <span className="font-semibold">RMA #{ticket.rmaNumber}</span> ({ticket.item})?
                <br />This action cannot be undone.
              </div>
              <div className="flex gap-2 justify-end">
                <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={handleDeleteTicket}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
