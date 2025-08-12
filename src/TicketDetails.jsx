// ...existing code...
  // ...existing code...
  // ...existing code...
  // --- Relationship handlers ---
  // (removed duplicate handleAddRelatedTicket, see below for correct definition)
import React, { useState, useRef } from 'react';
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
      </div>
    </div>
  );
}

export default function TicketDetails({ editModeFromRoute }) {
  // --- Relationship handlers ---
  function handleAddRelatedTicket() {
    setShowRelatedSearch(true);
    setRelatedSearch("");
    setRelatedSearchResults([]);
  }

  // Handler for selecting a related ticket from the search modal
  function handleSelectRelatedTicket(t) {
    if (relatedTickets.some(rel => rel.id === t.id || rel === t.id)) return;
    setRelatedTickets([...relatedTickets, { id: t.id, type: 'related', note: '' }]);
    setShowRelatedSearch(false);
    setRelatedSearch("");
    setRelatedSearchResults([]);
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
    const updatedTicket = {
      ...ticket,
      ...formValues,
      customFields: mergedCustomFields,
      relatedTickets,
      externalLinks,
    };
    setTickets(tickets.map(t => t.id === ticket.id ? updatedTicket : t));
    setMsg('Ticket updated.');
    setEditMode(false);
  }
  function handleAddExternalLink() {
    setExternalLinks([...externalLinks, { url: '', label: '' }]);
  }

  // --- Always call hooks at the top, unconditionally ---
  const params = useParams();
  const customFieldsSchema = [
    { name: 'serialNumber', label: 'Serial Number', type: 'text', required: false, order: 3.5 },
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
  const [externalLinks, setExternalLinks] = useState(ticket?.externalLinks || []);
  const [relatedSearchResults, setRelatedSearchResults] = useState([]);
  const [editMode, setEditMode] = useState(!!editModeFromRoute);
  const [form, setForm] = useState(ticket ? { ...ticket } : {});
  const lastTicketIdRef = useRef(ticket?.id);
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
                  if (String(relId) === String(ticket.id)) {
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
          </div>


  if (editMode) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white p-4 rounded shadow">
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
          {/* --- Related Tickets Edit --- */}
          <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200">
            <div className="font-bold mb-2 text-sm uppercase tracking-wide text-blue-700">Related Tickets</div>
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
                          <div className="w-1/3 text-left pl-1">Company</div>
                          <div className="w-1/3 text-left pl-4">RMA#</div>
                          <div className="w-1/3 text-right pr-1">Ticket ID</div>
                        </div>
                        {getRelatedSearchResults().map(t => {
                          const cust = customers.find(c => c.id === t.customerId);
                          return (
                            <div
                              key={t.id}
                              className="flex items-center py-2 hover:bg-blue-50 cursor-pointer rounded transition"
                              onClick={() => handleSelectRelatedTicket(t)}
                            >
                              <div className="w-1/3 text-left pl-1 truncate">
                                <span className="font-medium text-gray-900">{cust ? (cust.companyName || cust.businessName || cust.contactName) : <span className='text-gray-400'>—</span>}</span>
                              </div>
                              <div className="w-1/3 text-left pl-4" style={{overflow: 'visible', whiteSpace: 'normal'}}>
                                <span className="text-gray-700 font-semibold">{t.rmaNumber || t.rma || <span className='text-gray-400'>—</span>}</span>
                              </div>
                              <div className="w-1/3 text-right pr-1 truncate">
                                <span className="text-xs text-gray-400">{t.id}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end mt-3">
                    <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => setShowRelatedSearch(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* --- External Links Edit --- */}
          <div className="mb-4 p-3 rounded bg-green-50 border border-green-200">
            <div className="font-bold mb-2 text-sm uppercase tracking-wide text-green-700">External Links</div>
            {externalLinks.map((link, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input
                  className="border px-2 py-1 rounded w-48"
                  placeholder="URL"
                  value={link.url}
                  onChange={e => handleUpdateExternalLink(idx, 'url', e.target.value)}
                />
                <input
                  className="border px-2 py-1 rounded w-32"
                  placeholder="Label"
                  value={link.label}
                  onChange={e => handleUpdateExternalLink(idx, 'label', e.target.value)}
                />
                <button className="text-red-600" onClick={() => handleRemoveExternalLink(idx)} title="Remove">✕</button>
              </div>
            ))}
            <button className="text-green-700 underline text-sm" onClick={handleAddExternalLink}>+ Add External Link</button>
          </div>
          <DynamicForm
            schema={getTicketFormSchema(customFieldsSchema)}
            initialValues={form}
            customFieldsSchema={customFieldsSchema}
            initialCustomFields={ticket?.customFields || {}}
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
        {/* Ungrouped fields and custom fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          {ticketFormSchema
            .filter(f => f.type !== 'hidden' && !ticketFieldGroups.some(g => g.fields.includes(f.name)))
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(f => {
              let value = ticket[f.name] || '';
              if (f.type === 'tel') {
                value = formatPhoneNumber(value, ticket[`${f.name}_country`] || 'US');
                const extField = f.name + 'Ext';
                if (ticket[extField]) {
                  value = value + ` x${ticket[extField]}`;
                }
              }
              if (f.type === 'date' && value) {
                value = new Date(value).toLocaleDateString();
              }
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
          {/* Render custom fields (if any) */}
          {customFieldsSchema.map(f => {
            const value = ticket.customFields?.[f.name] || '';
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
        {/* Activity/comments feed */}
        <div className="my-6">
          <ActivityFeed ticketId={ticket.id} />
        </div>
        {/* --- Related Tickets Display (deduplicated, most specific only) --- */}
        {(() => {
          // Relationship specificity order: parent/child > sibling > related
          const REL_TYPE_ORDER = { parent: 3, child: 3, sibling: 2, related: 1 };
          // For each related ticket, collect all relationship types (from both directions), flatten, and deduplicate
          const relTypeMap = new Map();
          // Outgoing
          if (Array.isArray(ticket.relatedTickets)) {
            for (const rel of ticket.relatedTickets) {
              const relId = rel?.id || rel;
              const relType = rel?.type || 'related';
              const relNote = rel?.note;
              if (!relTypeMap.has(relId)) relTypeMap.set(relId, new Set());
              relTypeMap.get(relId).add(JSON.stringify({
                type: relType,
                note: relNote,
                direction: 'outgoing',
              }));
            }
          }
          // Incoming
          for (const t of tickets) {
            if (!Array.isArray(t.relatedTickets)) continue;
            for (const rel of t.relatedTickets) {
              const relId = rel?.id || rel;
              const relType = rel?.type || 'related';
              const relNote = rel?.note;
              if (String(relId) === String(ticket.id)) {
                // Infer the inverse relationship type
                let inferredType = relType;
                if (relType === 'parent') inferredType = 'child';
                else if (relType === 'child') inferredType = 'parent';
                else inferredType = relType;
                if (!relTypeMap.has(t.id)) relTypeMap.set(t.id, new Set());
                relTypeMap.get(t.id).add(JSON.stringify({
                  type: inferredType,
                  note: relNote,
                  direction: 'incoming',
                }));
              }
            }
          }
          // For each related ticket, pick the most specific relationship type (parent/child > sibling > related)
          const relatedList = Array.from(relTypeMap.entries()).map(([id, relsSet]) => {
            // Flatten and parse
            const rels = Array.from(relsSet).map(r => JSON.parse(r));
            // Find the relationship with the highest specificity
            let best = rels[0];
            for (const rel of rels) {
              if (REL_TYPE_ORDER[rel.type] > REL_TYPE_ORDER[best.type]) best = rel;
            }
            return {
              id,
              type: best.type,
              note: best.note,
              direction: best.direction,
            };
          });
          // Remove any duplicate tickets (by id) that may have slipped through and skip if ticket not found
          const seen = new Set();
          const dedupedList = relatedList.filter(rel => {
            if (seen.has(rel.id)) return false;
            seen.add(rel.id);
            // Only include if ticket exists
            return tickets.some(t => t.id === rel.id);
          });
          if (dedupedList.length === 0) return null;
          return (
            <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200">
              <div className="font-bold mb-2 text-sm uppercase tracking-wide text-blue-700">Related Tickets</div>
              <ul className="space-y-1">
                {dedupedList.map((rel, idx) => {
                  const relTicket = tickets.find(t => t.id === rel.id);
                  // Defensive: skip if not found (should not happen)
                  if (!relTicket) return null;
                  return (
                    <li key={rel.id + '-' + idx} className="flex items-center gap-2">
                      <span className="font-semibold">{String(rel.type).charAt(0).toUpperCase() + String(rel.type).slice(1)}:</span>
                      <button
                        className="text-blue-700 hover:underline bg-transparent border-none p-0 m-0 cursor-pointer focus:outline-none"
                        style={{ display: 'inline', background: 'none' }}
                        title={`Go to ticket ${relTicket.rmaNumber || relTicket.rma || relTicket.id}`}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          const targetId = relTicket.id;
                          if (!targetId || typeof targetId !== 'string' || !targetId.trim()) {
                            // eslint-disable-next-line no-console
                            console.warn('Related ticket navigation: invalid or missing ticket ID', targetId);
                            return;
                          }
                          // eslint-disable-next-line no-console
                          console.log('Navigating to related ticket:', targetId);
                          if (String(targetId) === String(ticket.id)) {
                            navigate(`/tickets/${targetId}`, { replace: true, state: { force: Date.now() } });
                          } else {
                            navigate(`/tickets/${targetId}`);
                          }
                        }}
                      >
                        <span>{relTicket.rmaNumber || relTicket.rma || relTicket.id}</span>
                        <span className="ml-1 text-xs text-gray-400 align-baseline">({relTicket.id})</span>
                      </button>
                      {rel.note && <span className="text-gray-600 italic ml-2">({rel.note})</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })()}
        {/* --- External Links Display --- */}
        {Array.isArray(ticket.externalLinks) && ticket.externalLinks.length > 0 && (
          <div className="mb-4 p-3 rounded bg-green-50 border border-green-200">
            <div className="font-bold mb-2 text-sm uppercase tracking-wide text-green-700">External Links</div>
            <ul className="space-y-1">
              {ticket.externalLinks.map((link, idx) => {
                const url = link?.url || link;
                const label = link?.label || link?.url || link;
                return (
                  <li key={url + '-' + idx}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-700 underline">{label}</a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
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

