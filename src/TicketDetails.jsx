import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { SketchPicker } from 'react-color';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from './store';
import { ticketFieldGroups, ticketFormSchema, getTicketFormSchema } from './formSchemas';
import ActivityFeed from './components/ActivityFeed';
import DynamicForm from './DynamicForm';
import { toast } from 'react-toastify';
import { filterDuplicateRelationships, cleanupRelationships } from './utils/relationshipUtils';

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

function TicketDetails({ editModeFromRoute: editModeFromProps }) {
  // --- Get URL params and navigation ---
  const { id, ticketId, customerId } = useParams();
  const navigate = useNavigate();
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  
  console.log('TicketDetails component mounted with props:', { editModeFromProps });
  
  // Get edit mode from route param or props
  const editModeFromRoute = editModeFromProps || searchParams.get('edit') === '1';
  console.log('Edit mode from props:', editModeFromProps, 'Edit mode from route:', editModeFromRoute);

  // Get the actual ticket ID from either id or ticketId parameter
  const actualTicketId = ticketId || id;
  
  // Special case: if actualTicketId is "new", we're creating a new ticket
  const isCreatingNewTicket = actualTicketId === 'new' || window.location.href.includes('/tickets/new/');
  
  console.log('URL Parameters:', { id, ticketId, customerId });
  console.log('Actual ticket ID we will use:', actualTicketId);
  console.log('Is creating new ticket?', isCreatingNewTicket);
  console.log('Current URL:', window.location.href);
  console.log('Edit mode from props or route:', editModeFromRoute);

  // --- Global state ---
  const tickets = useAppStore(s => s.tickets);
  const setTickets = useAppStore(s => s.setTickets);
  const customers = useAppStore(s => s.customers);
  
  // --- Find ticket and customer for current ID ---
  console.log('Current tickets in store:', tickets?.length || 0);
  console.log('Looking for ticket with ID:', actualTicketId);
  
  // Debug actual ticket IDs in store
  if (Array.isArray(tickets)) {
    console.log('All ticket IDs in store:', tickets.map(t => t.id));
  } else {
    console.log('Tickets is not an array:', tickets);
  }
  
  // If we're creating a new ticket, don't try to find an existing one
  const ticket = isCreatingNewTicket ? null : (Array.isArray(tickets) ? tickets.find(t => t.id === actualTicketId) : null);
  console.log('Found ticket:', ticket ? 'Yes' : (isCreatingNewTicket ? 'Creating new ticket' : 'No (ticket not found)'));
  
  if (!ticket && !isCreatingNewTicket) {
    console.log('Ticket not found. ID comparison issue?');
    // Try a more lenient comparison to see if it's a string vs number issue
    if (Array.isArray(tickets)) {
      const lenientMatch = tickets.find(t => String(t.id) === String(actualTicketId));
      console.log('Found with lenient comparison?', lenientMatch ? 'Yes' : 'No');
      if (lenientMatch) {
        console.log('Types - Ticket ID:', typeof lenientMatch.id, 'URL ID:', typeof actualTicketId);
      }
    }
  }
  // Get customer info for the ticket or from the URL parameter if creating a new ticket
  let customer = null;
  if (ticket) {
    // For existing tickets, get customer from the ticket's customerId
    customer = Array.isArray(customers) ? customers.find(c => c.id === ticket.customerId) : null;
  } else if (isCreatingNewTicket && customerId) {
    // For new tickets, get customer from the URL parameter
    customer = Array.isArray(customers) ? customers.find(c => c.id === customerId) : null;
    console.log('Using customer from URL parameter:', customerId, customer);
  }
  
  // Get customerId from context if we're creating a new ticket
  const fallbackCustomer = Array.isArray(customers) && customers.length > 0 ? customers[0] : null; // default to first customer for simplicity
  const customerIdFromQuery = searchParams.get('customerId') || customerId || fallbackCustomer?.id;

  // --- Local state ---
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showRelatedSearch, setShowRelatedSearch] = useState(false);
  const [relatedSearch, setRelatedSearch] = useState("");
  
  // Force edit mode if we're creating a new ticket or if editModeFromRoute is true
  const [editMode, setEditMode] = useState(!!editModeFromRoute || isCreatingNewTicket);
  
  const [relatedTickets, setRelatedTickets] = useState(
    cleanupRelationships(ticket?.relatedTickets || [])
  );
  
  // Sync relatedTickets state when ticket changes, but only if not in edit mode
  useEffect(() => {
    if (!editMode) {
      const cleanedRelationships = cleanupRelationships(ticket?.relatedTickets || []);
      console.log('Loading ticket relationships with deduplication:', cleanedRelationships);
      setRelatedTickets(cleanedRelationships);
    }
  }, [ticket, editMode]);
  
  const [externalLinks, setExternalLinks] = useState(ticket?.externalLinks || []);
  const [relatedSearchResults, setRelatedSearchResults] = useState([]);
  
  // Initialize form data, include customerId if creating a new ticket
  const initialFormData = ticket 
    ? { ...ticket } 
    : isCreatingNewTicket 
      ? { customerId: customerIdFromQuery, status: 'received' } 
      : {};
  
  const [form, setForm] = useState(initialFormData);
  const lastTicketIdRef = useRef(ticket?.id);
  
  // Log edit mode status
  console.log('Initial editMode state:', editMode);
  
  // Also log when editMode changes
  useEffect(() => {
    console.log('editMode updated to:', editMode);
  }, [editMode]);

  // Guard: If creating a new ticket, ticket will be undefined. Prevent access to ticket.id and related fields.
  const isNewTicket = isCreatingNewTicket || (!ticket && editMode);
  
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

  // Color picker modal state and handlers
  const setGroupColorForTickets = useAppStore(s => s.setGroupColorForTickets);
  const clearGroupColorsForTickets = useAppStore(s => s.clearGroupColorsForTickets);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingGroupColor, setPendingGroupColor] = useState('#6B7280'); // Default color (Tailwind gray-500)
  const [pendingGroupId, setPendingGroupId] = useState(null);
  
  // --- Relationship handlers ---
  function handleAddRelatedTicket() {
    setShowRelatedSearch(true);
    setRelatedSearch("");
    // Reset pending group color to avoid applying colors before saving
    setPendingGroupColor(null);
    setPendingGroupId(null);
    // Immediately update search results
    const results = getRelatedSearchResults();
    setRelatedSearchResults(results);
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

  // Handler for setting color for all related tickets at once
  function handleSetAllGroupColors() {
    if (!relatedTickets.length) {
      // No related tickets to color
      return;
    }
    
    // If editing an existing ticket, include the current ticket ID
    const relatedIds = relatedTickets.map(rel => rel.id).filter(Boolean);
    const groupIds = isNewTicket ? relatedIds : [ticket.id, ...relatedIds];
    
    if (groupIds.length < 2) {
      // Need at least 2 tickets to form a group
      return;
    }
    
    // Set pending group ID
    const groupId = generateGroupId(groupIds);
    setPendingGroupId(groupId);
    
    // Use existing color as starting point if available
    // If the ticket already has a group color, use that
    const currentColor = ticket?.groupColor || '#6B7280';
    setPendingGroupColor(currentColor);
    
    // Show color picker modal
    setShowColorPicker(true);
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

  // Function to generate a consistent group ID for a set of ticket IDs
  function generateGroupId(ticketIds) {
    // Sort to ensure consistency
    const sortedIds = [...ticketIds].sort();
    // Generate a stable ID based on the sorted ticket IDs
    return `group-${sortedIds.join('-')}`;
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
    
    // Handle group color relationships
    if (pendingGroupColor && !isNewTicket && relatedTickets.length > 0) {
      const relatedIds = relatedTickets.map(rel => rel.id).filter(Boolean);
      
      // Only apply colors to valid relationships
      if (relatedIds.length > 0) {
        const groupIds = [ticket?.id, ...relatedIds];
        // Use the generateGroupId function to ensure consistent group ID
        const groupId = generateGroupId(groupIds);
        setGroupColorForTickets(groupIds, pendingGroupColor, groupId);
      }
    } else if (pendingGroupColor && isNewTicket) {
      // For new tickets, we'll add the color when the ticket is created
      formValues.groupColor = pendingGroupColor;
    }
    
    // Update existing or create new ticket
    if (ticket) {
      // Create a list of current related ticket IDs
      const currentRelatedIds = relatedTickets.map(rel => rel.id);
      
      // Find related tickets that were removed
      const previousRelatedIds = (ticket.relatedTickets || []).map(rel => rel.id || rel);
      const removedRelatedIds = previousRelatedIds.filter(id => !currentRelatedIds.includes(id));
      
      // If there are removed relationships, we need to clean up any group colors
      if (removedRelatedIds.length > 0) {
        // For each removed ticket, remove group colors that include both tickets
        for (const removedId of removedRelatedIds) {
          // Check if this ticket has group colors that include the removed ticket
          if (ticket.groupColors && Array.isArray(ticket.groupColors)) {
            // Find group colors that include both tickets
            const groupsToRemove = ticket.groupColors.filter(group => {
              return group.ticketIds && Array.isArray(group.ticketIds) && 
                     group.ticketIds.includes(removedId);
            });
            
            // For each group to remove, clear the group colors
            for (const group of groupsToRemove) {
              if (group.ticketIds && Array.isArray(group.ticketIds)) {
                // Remove group colors from all tickets in the group
                clearGroupColorsForTickets(group.ticketIds);
              }
            }
          }
        }
      }
      
      const updatedTicket = {
        ...ticket,
        ...formValues,
        customFields: mergedCustomFields,
        relatedTickets: cleanupRelationships(relatedTickets),
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
      let ticketCustomerId = formValues.customerId;
      if (!ticketCustomerId) {
        ticketCustomerId = customerIdFromQuery || fallbackCustomer?.id;
      }
      const newTicket = {
        id: nanoid(),
        rmaNumber: formValues.rmaNumber || nanoid(8),
        ...formValues,
        customerId: ticketCustomerId,
        customFields: mergedCustomFields,
        relatedTickets,
        externalLinks,
        createdAt: new Date().toISOString(),
        status: 'New',
        activity: [],
        // Include the group color for backward compatibility
        groupColor: pendingGroupColor || formValues.groupColor,
        // Include the group colors array if available
        groupColors: formValues.groupColors || [],
      };
      setTickets([...tickets, newTicket]);
      // Sync to kanban board state
      const addKanbanTicket = useAppStore.getState().addKanbanTicket;
      if (typeof addKanbanTicket === 'function') {
        addKanbanTicket(newTicket);
      }
      setMsg('Ticket created.');
      // Navigate to the new ticket's details view
      navigate(`/tickets/${newTicket.id}`);
    }
    setEditMode(false);
  }

  // Create color picker modal (shared between edit and view modes)
  const colorPickerModal = showColorPicker ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
        <div className="font-bold mb-2 text-lg">Choose Group Color</div>
        <p className="text-gray-600 mb-4 text-center">
          This color will be applied to all related tickets in this group. 
          It will be visible in the Kanban board and ticket details.
        </p>
        <SketchPicker
          color={pendingGroupColor === 'transparent' ? '#FFFFFF' : pendingGroupColor}
          onChangeComplete={color => setPendingGroupColor(color.hex)}
          presetColors={["#EF4444", "#F59E42", "#FACC15", "#22C55E", "#3B82F6", "#6366F1", "#6B7280", "#D946EF"]}
        />
        {pendingGroupColor === 'transparent' && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 rounded border border-red-300 text-center">
            Clear color selected. Click "Set Color" to confirm removal.
          </div>
        )}
        <div className="flex gap-4 mt-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => {
              // If we're creating a new ticket, we can only set color for related tickets
              // If we're editing an existing ticket, include the current ticket ID
              const groupIds = isNewTicket 
                ? [...relatedTickets.map(rel => rel.id)]
                : [ticket.id, ...relatedTickets.map(rel => rel.id)];
              
              // Only proceed if we have tickets to color
              if (groupIds.length > 0) {
                // Check if the user has selected to clear colors (transparent)
                if (pendingGroupColor === 'transparent') {
                  // Apply the clear color logic
                  clearGroupColorsForTickets(groupIds);
                } else {
                  // Create a unique group ID for this relationship if needed
                  // For now, use a random ID; in a real app you might want a more meaningful identifier
                  const groupId = `color-group-${Date.now().toString(36)}`;
                  setGroupColorForTickets(groupIds, pendingGroupColor, groupId);
                }
              } else {
                // Store the color in form state for new tickets with no relationships
                setForm(prev => {
                  // Check if the user has selected to clear colors (transparent)
                  if (pendingGroupColor === 'transparent') {
                    return {
                      ...prev,
                      groupColor: undefined,
                      groupColors: []
                    };
                  } else {
                    const groupColors = Array.isArray(prev.groupColors) 
                      ? [...prev.groupColors] 
                      : [];
                    
                    // Add a new group color
                    const groupId = `color-group-${Date.now().toString(36)}`;
                    groupColors.push({ id: groupId, color: pendingGroupColor });
                    
                    return { 
                      ...prev, 
                      groupColor: pendingGroupColor,
                      groupColors
                    };
                  }
                });
              }
              setShowColorPicker(false);
            }}
          >{pendingGroupColor === 'transparent' ? 'Confirm Clear' : 'Apply Color'}</button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={() => {
              // Instead of applying the change immediately, just set the pending color to null/transparent
              // This will be applied only when the user clicks "Set Color"
              setPendingGroupColor('transparent');
            }}
          >Clear Color</button>
          <button
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
            onClick={() => setShowColorPicker(false)}
          >Cancel</button>
        </div>
      </div>
    </div>
  ) : null;

  // Debug info before rendering decision
  console.log('Rendering decision check - editMode:', editMode, 'isNewTicket:', isNewTicket, 
    'isCreatingNewTicket:', isCreatingNewTicket, 'ticket exists:', !!ticket);

  if (editMode) {
    console.log('→ Rendering EDIT mode');
    return (
      <>
        {colorPickerModal}
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
        <div className="max-w-3xl mx-auto p-4">
          <div className="bg-white p-4 rounded shadow">
            <h1 className="text-2xl font-bold mb-4">
              {isNewTicket ? 'Create New Ticket' : `Edit RMA #${ticket.rmaNumber || ticket.id}`}
            </h1>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
            
            <DynamicForm
              schema={getTicketFormSchema(customer ? { customFields: customer.customFields || [] } : {})}
              initialValues={form}
              onSubmit={handleDynamicFormSubmit}
              className="space-y-4"
              hideSubmitButton={true}
            />
            
            {/* --- Related Tickets Edit (with incoming indicator) --- */}
            <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200">
              <div className="flex justify-between items-center">
                <div className="font-bold mb-2 text-sm uppercase tracking-wide text-blue-700">Related Tickets</div>
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                  onClick={handleSetAllGroupColors}
                  title="Set a common color for all related tickets to visually group them together in the Kanban board."
                  disabled={relatedTickets.length === 0}
                >
                  Group Color
                </button>
              </div>
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
                      value={rel.note || ''}
                      onChange={e => handleUpdateRelatedTicket(idx, 'note', e.target.value)}
                    />
                    <div 
                      className="w-6 h-6 rounded cursor-pointer border hover:border-black flex-shrink-0"
                      style={{ 
                        backgroundColor: (() => {
                          // First, check if this specific relationship has a color
                          if (ticket && ticket.groupColors && Array.isArray(ticket.groupColors)) {
                            // Try to find any color group that includes this relationship
                            for (let i = 0; i < ticket.groupColors.length; i++) {
                              const group = ticket.groupColors[i];
                              // In a real app, you'd need a way to associate groups with specific relationships
                              // For now, we'll just use the first color
                              return group.color;
                            }
                          }
                          // Fallback to the main group color or default
                          return ticket?.groupColor || '#6B7280';
                        })() 
                      }}
                      onClick={() => {
                        // Use existing color as starting point if available
                        const currentColor = ticket?.groupColor || '#6B7280';
                        setPendingGroupColor(currentColor);
                        setShowColorPicker(true);
                      }}
                      title="Set group color"
                    ></div>
                    <button className="text-red-600" onClick={() => handleRemoveRelatedTicket(idx)} title="Remove">✕</button>
                  </div>
                );
              })}
              {/* Show incoming relationships at top but grayed out */}
              {(() => {
                // Find incoming relationships (other tickets that reference this one, but not already in outgoing list)
                const incoming = [];
                if (!Array.isArray(tickets)) {
                  console.log('Tickets is not an array when checking for incoming relationships');
                  return null;
                }
                
                console.log('Checking for incoming relationships in', tickets.length, 'tickets');
                for (const t of tickets) {
                  if (!t.relatedTickets || !Array.isArray(t.relatedTickets)) {
                    console.log('Ticket', t.id, 'has no relatedTickets array');
                    continue;
                  }
                  for (const rel of t.relatedTickets) {
                    const relId = rel?.id || rel;
                    const relType = rel?.type || 'related';
                    const relNote = rel?.note || '';
                    console.log('Checking relation:', t.id, '->', relId, '(comparing with', ticket?.id, ')');
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
                        {rel.note && <span className="text-gray-600 ml-2"><strong>NOTES:</strong> {rel.note}</span>}
                        <span className="text-xs text-gray-400 ml-2">To edit or remove, go to the ticket where this relationship was created.</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <button className="text-blue-600 underline text-sm mt-2" onClick={handleAddRelatedTicket}>+ Add Related Ticket</button>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                onClick={() => {
                  if (isNewTicket) {
                    // If we're creating a new ticket, go back to the customer page
                    if (customerIdFromQuery) {
                      navigate(`/customers/${customerIdFromQuery}`);
                    } else {
                      navigate('/customers');
                    }
                  } else {
                    // If we're editing an existing ticket, go back to view mode
                    setEditMode(false);
                  }
                }}
              >Cancel</button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  document.querySelector('form')?.dispatchEvent(
                    new Event('submit', { cancelable: true, bubbles: true })
                  );
                }}
              >Save Ticket</button>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // View mode
  console.log('→ Rendering VIEW mode');
  return (
    <>
      {colorPickerModal}
      <div className="max-w-3xl mx-auto p-4">
        {/* Only show ticket not found if we're not creating a new ticket */}
        {!ticket && !isCreatingNewTicket && !editMode ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <h2 className="text-xl font-bold text-red-600">Ticket not found</h2>
            <p className="my-4">The requested ticket does not exist or has been deleted.</p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => navigate('/customers')}
            >
              Return to Customers
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">
                {ticket.groupColor && (
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: ticket.groupColor }}
                    title="This ticket is part of a color-coded group"
                  ></span>
                )}
                RMA #{ticket.rmaNumber || ticket.id}
              </h1>
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </button>
              </div>
            </div>
            
            {msg && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">{msg}</div>}
            
            {/* Customer info */}
            <div className="mb-4">
              <div className="font-semibold text-gray-700 mb-2">Customer:</div>
              <div className="pl-2 border-l-4 border-blue-500">
                <div className="font-bold">{customer ? (customer.companyName || customer.businessName || customer.contactName) : ticket.customerId}</div>
                {customer && customer.contactName && (customer.companyName || customer.businessName) && (
                  <div className="text-gray-600">{customer.contactName}</div>
                )}
                {customer && customer.email && (
                  <div className="text-gray-600">{customer.email}</div>
                )}
                {customer && customer.phone && (
                  <div className="text-gray-600">{customer.phone}</div>
                )}
              </div>
            </div>
            
            {/* Ticket details */}
            <div className="mb-4">
              <div className="font-semibold text-gray-700 mb-2">Item Details:</div>
              <div className="pl-2 border-l-4 border-green-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-2">
                    <div className="text-sm text-gray-600">Item:</div>
                    <div>{ticket.item}</div>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm text-gray-600">Type:</div>
                    <div>{ticket.type}</div>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm text-gray-600">Status:</div>
                    <div>{ticket.status}</div>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm text-gray-600">Reason:</div>
                    <div>{ticket.reason}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Custom fields */}
            {ticket.customFields && Object.keys(ticket.customFields).length > 0 && (
              <div className="mb-4">
                <div className="font-semibold text-gray-700 mb-2">Additional Information:</div>
                <div className="pl-2 border-l-4 border-purple-500">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(ticket.customFields).map(([key, value]) => (
                      <div key={key} className="mb-2">
                        <div className="text-sm text-gray-600">{key}:</div>
                        <div>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Related Tickets Section */}
            {(relatedTickets.length > 0 || (() => {
              // Check if there are any incoming relationships
              if (!Array.isArray(tickets)) return false;
              
              for (const t of tickets) {
                if (!t.relatedTickets || !Array.isArray(t.relatedTickets)) continue;
                for (const rel of t.relatedTickets) {
                  const relId = rel?.id || rel;
                  if (ticket && String(relId) === String(ticket.id)) {
                    return true;
                  }
                }
              }
              return false;
            })()) && (
              <div className="mb-4">
                <div className="font-semibold text-gray-700 mb-2">Related Tickets:</div>
                <div className="pl-2 border-l-4 border-yellow-500">
                  {/* Outgoing relationships */}
                  {relatedTickets.map((rel, idx) => {
                    const relTicket = Array.isArray(tickets) ? tickets.find(t => t.id === rel.id) : null;
                    if (!relTicket) return null;
                    return (
                      <div key={idx} className="flex gap-2 mb-2 items-center">
                        <span className="text-blue-600 cursor-pointer" onClick={() => navigate(`/tickets/${rel.id}`)}>
                          RMA #{relTicket.rmaNumber || relTicket.rma || relTicket.id}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{rel.type}</span>
                        {rel.note && <span className="text-gray-600 ml-2"><strong>NOTES:</strong> {rel.note}</span>}
                      </div>
                    );
                  })}
                  
                  {/* Incoming relationships */}
                  {(() => {
                    // Find incoming relationships (other tickets that reference this one)
                    const incoming = [];
                    
                    if (!Array.isArray(tickets) || !ticket) {
                      console.log('Cannot process incoming relationships - tickets is not an array or ticket is null');
                      return null;
                    }
                    
                    for (const t of tickets) {
                      if (!t.relatedTickets || !Array.isArray(t.relatedTickets)) continue;
                      for (const rel of t.relatedTickets) {
                        const relId = rel?.id || rel;
                        const relType = rel?.type || 'related';
                        const relNote = rel?.note || '';
                        if (String(relId) === String(ticket.id)) {
                          // Skip this incoming relationship if we already have an outgoing relationship to this ticket
                          // This is what prevents the duplicate display of relationships
                          if (relatedTickets.some(outRel => String(outRel.id) === String(t.id))) {
                            console.log(`Skipping incoming relationship from ${t.id} as we already have an outgoing relationship to it`);
                            continue;
                          }
                          
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
                    if (incoming.length === 0) return null;
                    return (
                      <div className="mt-2">
                        {incoming.map((rel, idx) => (
                          <div key={rel.id + '-' + idx} className="flex gap-2 mb-2 items-center">
                            <span className="text-blue-600 cursor-pointer" onClick={() => navigate(`/tickets/${rel.id}`)}>
                              RMA #{rel.rma}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-200 rounded">Incoming</span>
                            <span className="text-xs text-gray-500">({rel.type})</span>
                            {rel.note && <span className="text-gray-600 ml-2"><strong>NOTES:</strong> {rel.note}</span>}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {/* Attachments */}
            {renderAttachments(ticket.attachments)}
            
            {/* Activity feed */}
            <div className="mt-6">
              <ActivityFeed activities={ticket.activity || []} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default TicketDetails;
