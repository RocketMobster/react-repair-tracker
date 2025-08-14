import React, { useState, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { SketchPicker } from 'react-color';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from './store';
import { ticketFieldGroups, ticketFormSchema, getTicketFormSchema } from './formSchemas';
import ActivityFeed from './components/ActivityFeed';
import DynamicForm from './DynamicForm';

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
      {/* ...existing code... */}
    </div>
  }
}

export default function TicketDetails({ editModeFromRoute }) {
  // ...existing code...

  // Render color picker modal at top level so it is not wiped out by form state changes
  const colorPickerModal = showColorPicker ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
        <div className="font-bold mb-2 text-lg">Choose Group Color</div>
        <SketchPicker
          color={pendingGroupColor}
          onChangeComplete={color => setPendingGroupColor(color.hex)}
          presetColors={["#EF4444", "#F59E42", "#FACC15", "#22C55E", "#3B82F6", "#6366F1", "#6B7280", "#D946EF"]}
        />
        <div className="flex gap-4 mt-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => {
              const groupIds = [ticket?.id, ...relatedTickets.map(rel => rel.id)].filter(Boolean);
              setGroupColorForTickets(groupIds, pendingGroupColor);
              setShowColorPicker(false);
            }}
          >Set Color</button>
          <button
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
            onClick={() => setShowColorPicker(false)}
          >Cancel</button>
        </div>
      </div>
    </div>
  ) : null;
  const setGroupColorForTickets = useAppStore(s => s.setGroupColorForTickets);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingGroupColor, setPendingGroupColor] = useState('#6B7280'); // Default color (Tailwind gray-500)
  // --- Relationship handlers ---
  function handleAddRelatedTicket() {
    setShowRelatedSearch(true);
    setRelatedSearch("");
    setRelatedSearchResults([]);
  }

  // Handler for selecting a related ticket from the search modal
  function handleSelectRelatedTicket(t) {
    if (relatedTickets.some(rel => rel.id === t.id || rel === t.id)) return;
    // Add the new related ticket
    const newRelated = [...relatedTickets, { id: t.id, type: 'related', note: '' }];
    setRelatedTickets(newRelated);
    setShowRelatedSearch(false);
    setRelatedSearch("");
    setRelatedSearchResults([]);
    // Check if this forms a new group (no groupColor set for any involved ticket)
    // Always include current ticket if possible, fallback to just related
    const currentId = ticket && ticket.id ? ticket.id : null;
    const groupIds = currentId ? [currentId, t.id, ...newRelated.map(rel => rel.id)] : [t.id, ...newRelated.map(rel => rel.id)];
    const groupTickets = tickets.filter(tk => groupIds.includes(tk.id));
    const hasColor = groupTickets.some(tk => tk.groupColor);
    if (!hasColor) {
      console.log('Color picker should open for group:', groupIds);
      setPendingGroupColor('#6B7280'); // Reset to default color each time
      setShowColorPicker(true);
    }
  }

  // Handler for updating a related ticket's type or note
  function handleUpdateRelatedTicket(idx, field, value) {
    setRelatedTickets(relatedTickets => {
      const updated = [...relatedTickets];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }

  // Handler for removing a related ticket
  function handleRemoveRelatedTicket(idx) {
    setRelatedTickets(relatedTickets => relatedTickets.filter((_, i) => i !== idx));
  }

  // --- Submit handler for edit form ---
  function handleDynamicFormSubmit(formValues, customFields) {
    // Merge all fields, including relationships and custom fields
    const mergedCustomFields = {
      ...(ticket?.customFields || {}),
      ...(formValues.customFields || {}),
      ...(customFields || {})
    };
    // Validation: Prevent blank tickets
    const requiredFields = ['item', 'reason'];
    const missingFields = requiredFields.filter(f => {
      const v = formValues[f];
      return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    });
    // Debug log for field values
    if (!ticket) {
      console.log('Form values received:', formValues);
      if (missingFields.length > 0) {
        setError('Please fill out all required fields before submitting.');
        return;
      }
    }
    // Assign group color if picked and there are related tickets
    if (pendingGroupColor && relatedTickets.length > 0) {
      const groupIds = [ticket?.id, ...relatedTickets.map(rel => rel.id)].filter(Boolean);
      setGroupColorForTickets(groupIds, pendingGroupColor);
    }
    if (ticket) {
      // Editing existing ticket
      const updatedTicket = {
        ...ticket,
        ...formValues,
        customFields: mergedCustomFields,
        relatedTickets,
        externalLinks,
      };
      setTickets(tickets.map(t => t.id === ticket.id ? updatedTicket : t));
      // Sync to kanban board state
      const updateKanbanTicket = useAppStore.getState().updateKanbanTicket;
      if (typeof updateKanbanTicket === 'function') {
        updateKanbanTicket(updatedTicket);
      }
      setMsg('Ticket updated.');
    } else {
      // Creating new ticket: assign RMA number and ID here
      // Ensure customerId is set from context if not present in formValues
      let customerId = formValues.customerId;
      if (!customerId) {
        customerId = fallbackCustomer?.id;
      }
      const newTicket = {
        id: nanoid(),
        rmaNumber: formValues.rmaNumber || nanoid(8),
        ...formValues,
        customerId,
        customFields: mergedCustomFields,
        relatedTickets,
        externalLinks,
        createdAt: new Date().toISOString(),
        status: 'New',
        activity: [],
      };
      setTickets([...tickets, newTicket]);
      // Sync to kanban board state
      const addKanbanTicket = useAppStore.getState().addKanbanTicket;
      if (typeof addKanbanTicket === 'function') {
        addKanbanTicket(newTicket);
      }
      setMsg('Ticket created.');
      // Navigate to the new ticket's details view
      if (customerId) {
        navigate(`/customers/${fallbackCustomer?.slug || customerId}/tickets/${newTicket.id}`);
      } else {
        navigate(`/tickets/${newTicket.id}`);
      }
    }
    setEditMode(false);
  }
  function handleAddExternalLink() {
    setExternalLinks([...externalLinks, { url: '', label: '' }]);
  }

  // --- Always call hooks at the top, unconditionally ---
  const params = useParams();
  const customFieldsSchema = [
  { name: 'serialNumber', label: 'Serial Number', type: 'text', required: false, order: 3.5 },
  { name: 'test', label: 'Test', type: 'text', required: false, order: 4 },
  ];
  const ticketId = params.ticketId;
  const customerSlug = params.customerId;
  const navigate = useNavigate();
  const tickets = useAppStore(s => s.tickets);
  const customers = useAppStore(s => s.customers);
  const setTickets = useAppStore(s => s.setTickets);

  // Find ticket after hooks
  const ticket = tickets.find(t => String(t.id) === String(ticketId));
  // Always use the stored RMA number (guarded)
  const rmaNumber = ticket?.rmaNumber;
  const removeKanbanTicket = useAppStore(s => s.removeKanbanTicket);
  const userIsAdmin = true; // Placeholder for role-based access
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showRelatedSearch, setShowRelatedSearch] = useState(false);
  const [relatedSearch, setRelatedSearch] = useState("");
  // ticket is found after hooks
  // (already declared above)
  let fallbackCustomer = null;
  if (ticket) {
    fallbackCustomer = customers.find(c => c.id === ticket.customerId);
  } else if (customerSlug) {
    fallbackCustomer = customers.find(c => c.slug === customerSlug);
  }
  // Related tickets state must always be defined, even if ticket is missing
  const [relatedTickets, setRelatedTickets] = useState(ticket?.relatedTickets || []);
  // Sync relatedTickets state when ticket changes
  React.useEffect(() => {
    setRelatedTickets(ticket?.relatedTickets || []);
  }, [ticket]);
  const [externalLinks, setExternalLinks] = useState(ticket?.externalLinks || []);
  const [relatedSearchResults, setRelatedSearchResults] = useState([]);
  const [editMode, setEditMode] = useState(!!editModeFromRoute);
  const [form, setForm] = useState(ticket ? { ...ticket } : {});
  const lastTicketIdRef = useRef(ticket?.id);

  // Guard: If creating a new ticket, ticket will be undefined. Prevent access to ticket.id and related fields.
  const isNewTicket = !ticket && editMode;
  // Helper: filter tickets for search (exclude current, already related, and empty search)
  function getRelatedSearchResults() {
    if (!relatedSearch.trim()) return [];
    const s = relatedSearch.trim().toLowerCase();
    return tickets.filter(t =>
      t.id !== ticket?.id &&
      !relatedTickets.some(rel => rel.id === t.id || rel === t.id) &&
      (
        (t.id && String(t.id).toLowerCase().includes(s)) ||
        (t.rmaNumber && String(t.rmaNumber).toLowerCase().includes(s)) ||
        (t.rma && String(t.rma).toLowerCase().includes(s)) ||
        (t.item && String(t.item).toLowerCase().includes(s)) ||
        (t.customerId && customers.find(c => c.id === t.customerId && ((c.companyName||c.businessName||c.contactName||"").toLowerCase().includes(s))))
      )
    );
  }

          {/* --- Related Tickets Edit (with incoming indicator) --- */}
          <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200">
            <div className="font-bold mb-2 text-sm uppercase tracking-wide text-blue-700">Related Tickets</div>
            {/* Outgoing (editable) relationships */}
            {relatedTickets.map((rel, idx) => {
              const relTicket = tickets.find(t => t.id === rel.id);
              return (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <span className="text-gray-700">{relTicket ? `RMA #${relTicket.rmaNumber || relTicket.rma || relTicket.id}` : rel.id}</span>
                  <select
                    className="border px-2 py-1 rounded"
                    value={rel.type}
                    onChange={e => handleUpdateRelatedTicket(idx, 'type', e.target.value)}
                  >
                    <option value="related">Related</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                  </select>
                  <input
                    className="border px-2 py-1 rounded w-32"
                    placeholder="Note"
                    value={rel.note}
                    onChange={e => handleUpdateRelatedTicket(idx, 'note', e.target.value)}
                  />
                  <button className="text-red-600" onClick={() => handleRemoveRelatedTicket(idx)} title="Remove">✕</button>
                </div>
              );
            })}
            {/* Incoming (non-editable) relationships - now shown at top, grayed out */}
            {(() => {
              // Find incoming relationships (other tickets that reference this one, but not already in outgoing list)
              const incoming = [];
              for (const t of tickets) {
                if (!Array.isArray(t.relatedTickets)) continue;
                for (const rel of t.relatedTickets) {
                  const relId = rel?.id || rel;
                  const relType = rel?.type || 'related';
                  const relNote = rel?.note;
                  if (ticket && String(relId) === String(ticket.id)) {
                    if (!relatedTickets.some(r => String(r.id) === String(t.id))) {
                      let inferredType = relType;
                      if (relType === 'parent') inferredType = 'child';
                      else if (relType === 'child') inferredType = 'parent';
                      else inferredType = relType;
                      incoming.push({
                        id: t.id,
                        type: inferredType,
                        note: relNote,
                        rma: t.rmaNumber || t.rma || t.id,
                      });
                    }
                  }
                }
              }
              if (incoming.length === 0) return null;
              return (
                <div className="mt-2">
                  {incoming.map((rel, idx) => (
                    <div key={rel.id + '-' + idx} className="flex gap-2 mb-2 items-center opacity-50 pointer-events-none">
                      <span className="text-gray-700">{`RMA #${rel.rma}`}</span>
                      <span className="text-xs px-2 py-1 bg-gray-200 rounded">Incoming</span>
                      <span className="text-xs text-gray-500">({rel.type})</span>
                      {rel.note && <span className="text-gray-600 italic ml-2">({rel.note})</span>}
                      <span className="text-xs text-gray-400 ml-2">To edit or remove, go to the ticket where this relationship was created.</span>
                    </div>
                  ))}
                </div>
              );
            })()}
            {/* Incoming (non-editable) relationships */}
            {(() => {
              // Find incoming relationships (other tickets that reference this one, but not already in outgoing list)
              const incoming = [];
              for (const t of tickets) {
                if (!Array.isArray(t.relatedTickets)) continue;
                for (const rel of t.relatedTickets) {
                    const relId = rel?.id || rel;
                    const relType = rel?.type || 'related';
                    const relNote = rel?.note;
                    // Guard: Only check incoming relationships if ticket exists
                    if (ticket && String(relId) === String(ticket.id)) {
                      // Only show if not already in outgoing list
                      if (!relatedTickets.some(r => String(r.id) === String(t.id))) {
                        // Infer the inverse relationship type
                        let inferredType = relType;
                        if (relType === 'parent') inferredType = 'child';
                        else if (relType === 'child') inferredType = 'parent';
                        else inferredType = relType;
                        incoming.push({
                          id: t.id,
                          type: inferredType,
                          note: relNote,
                          rma: t.rmaNumber || t.rma || t.id,
                        });
                      }
                    }
                  }
                }
              if (incoming.length === 0) return null;
              return (
                <div className="mt-2">
                  {incoming.map((rel, idx) => (
                    <div key={rel.id + '-' + idx} className="flex gap-2 mb-2 items-center opacity-60">
                      <span className="text-gray-700">{`RMA #${rel.rma}`}</span>
                      <span className="text-xs px-2 py-1 bg-gray-200 rounded">Incoming</span>
                      <span className="text-xs text-gray-500">({rel.type})</span>
                      {rel.note && <span className="text-gray-600 italic ml-2">({rel.note})</span>}
                      <a
                        className="text-blue-600 underline text-xs ml-2"
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/tickets/${rel.id}?edit=1`);
                        }}
                        title="Edit this relationship on the other ticket"
                      >Edit on {rel.rma}</a>
                    </div>
                  ))}
                </div>
              );
            })()}
            <button className="text-blue-600 underline text-sm" onClick={handleAddRelatedTicket}>+ Add Related Ticket</button>
            {/* Modal for searching tickets to relate */}
            {showRelatedSearch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
                  <div className="font-bold mb-2 text-blue-700">Search Tickets to Relate</div>
                  <input
                    className="border px-2 py-1 rounded w-full mb-2"
                    placeholder="Search by RMA, company, or ticket ID..."
                    autoFocus
                    value={relatedSearch}
                    onChange={e => {
                      setRelatedSearch(e.target.value);
                      setRelatedSearchResults(getRelatedSearchResults());
                    }}
                  />
                  <div className="max-h-60 overflow-y-auto">
                    {getRelatedSearchResults().length === 0 ? (
                      <div className="text-gray-500">No tickets found.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {/* Header row for alignment */}
                        <div className="flex items-center py-1 text-xs font-semibold text-gray-500 select-none">
                          <span className="w-32">RMA</span>
                          <span className="w-32">Type</span>
                          <span className="w-32">Customer</span>
                          <span className="w-32">Item</span>
                        </div>
                        {getRelatedSearchResults().map(t => {
                          const customer = customers.find(c => c.id === t.customerId);
                          return (
                            <div key={t.id} className="flex items-center py-1 cursor-pointer hover:bg-blue-100" onClick={() => handleSelectRelatedTicket(t)}>
                              <span className="w-32">{t.rmaNumber || t.rma || t.id}</span>
                              <span className="w-32">{t.type || ''}</span>
                              <span className="w-32">{customer ? (customer.companyName || customer.businessName || customer.contactName || customer.id) : t.customerId}</span>
                              <span className="w-32">{t.item || ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setShowRelatedSearch(false)}>Cancel</button>
                </div>
              </div>
            )}
            {/* Color Picker Modal for new group */}
            {showColorPicker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
                  <div className="font-bold mb-2 text-lg">Choose Group Color</div>
                  <SketchPicker
                    color={pendingGroupColor}
                    onChangeComplete={color => setPendingGroupColor(color.hex)}
                    presetColors={["#EF4444", "#F59E42", "#FACC15", "#22C55E", "#3B82F6", "#6366F1", "#6B7280", "#D946EF"]}
                  />
                  <div className="flex gap-4 mt-4">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                      onClick={() => {
                        // Assign color to all tickets in the group
                        const groupIds = [ticket.id, ...relatedTickets.map(rel => rel.id)];
                        setGroupColorForTickets(groupIds, pendingGroupColor);
                        setShowColorPicker(false);
                      }}
                    >Set Color</button>
                    <button
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                      onClick={() => setShowColorPicker(false)}
                    >Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>


  if (editMode) {
    return (
      <>
        {colorPickerModal}
        <div className="max-w-3xl mx-auto p-4">
          <div className="bg-white p-4 rounded shadow">
            {/* ...existing code... */}
          </div>
        </div>
      </>
    );
}
// --- END FULL FILE BACKUP ---
