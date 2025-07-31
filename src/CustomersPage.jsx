import { formatPhoneNumber } from './phoneFormat';

import React, { useState, useEffect } from 'react';
// ...existing code...
import { nanoid } from 'nanoid';
import { generateRmaNumber } from './rmaUtils';
import { useAppStore } from './store';
import { useNavigate, useParams } from 'react-router-dom';
import DynamicForm from './DynamicForm';
import { customerFormSchema } from './formSchemas';


function CustomerForm({ onSave, initial = {}, isEdit }) {
  // Use DynamicForm for schema-driven rendering
  return (
    <div className="bg-white p-4 rounded shadow">
      <DynamicForm
        schema={customerFormSchema}
        initialValues={initial}
        onSubmit={onSave}
      />
    </div>
  );
}

function CustomerSearch({ onSelect }) {
  const customersRaw = useAppStore(s => s.customers);
  const customers = Array.isArray(customersRaw) ? customersRaw : [];
  const [query, setQuery] = useState('');
  const results = customers.filter(c => {
    const company = (c.companyName ?? c.businessName ?? '') + '';
    const contact = (c.contactName ?? '') + '';
    const phone = (c.contactPhone ?? '') + '';
    const email = (c.contactEmail ?? '') + '';
    const q = (query ?? '') + '';
    return (
      company.toLowerCase().includes(q.toLowerCase()) ||
      contact.toLowerCase().includes(q.toLowerCase()) ||
      phone.includes(q) ||
      email.toLowerCase().includes(q.toLowerCase())
    );
  });
  return (
    <div className="mb-4">
      <input
        className="w-full border p-2 rounded mb-2"
        placeholder="Search by business, contact, phone, or email..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {query && (
        <div className="bg-white rounded shadow max-h-48 overflow-y-auto">
          {results.length === 0 && <div className="p-2 text-gray-500">No results</div>}
          {results.map(c => (
            <div key={c.id} className="p-2 border-b flex justify-between items-center hover:bg-blue-50 cursor-pointer" onClick={() => onSelect(c)}>
              <div>
                <div className="font-semibold">{c.companyName || c.businessName || '(No Company Name)'}</div>
                <div className="text-sm text-gray-600">{c.contactName} | {formatPhoneNumber(c.contactPhone, c.contactPhone_country || 'US')}{c.contactPhoneExt ? ` x${c.contactPhoneExt}` : ''}</div>
              </div>
              <button className="bg-blue-500 text-white px-2 py-1 rounded">Select</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerDetails({ customer, onEdit, onNewTicket, onDeleted }) {
  // Guard: if customer is missing (e.g., after deletion), do not render
  if (!customer) return null;
  // Always ensure tickets is an array to prevent errors after deletion
  const tickets = useAppStore(s => Array.isArray(s.tickets) ? s.tickets : []);
  const setCustomers = useAppStore(s => s.setCustomers);
  const setTickets = useAppStore(s => s.setTickets);
  const customerTickets = tickets.filter(t => t.customerId === customer.id);
  const activeTickets = customerTickets.filter(t => t.status !== 'Completed');
  const completedTickets = customerTickets.filter(t => t.status === 'Completed');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const navigate = useNavigate();

  // TODO: Replace with real role check when user roles are implemented
  const userIsAdmin = true; // Placeholder for role-based access

  function handleDeleteCustomer() {
    // Step 1: Navigate out to customer list
    navigate('/customers');
    // Step 2: After a short delay, remove customer and tickets from state
    setTimeout(() => {
      setCustomers(prev => Array.isArray(prev) ? prev.filter(c => c.id !== customer.id) : []);
      setTickets(prev => Array.isArray(prev) ? prev.filter(t => t.customerId !== customer.id) : []);
      setDeleteMsg("Customer and all associated tickets deleted.");
      if (typeof onDeleted === 'function') onDeleted();
    }, 300);
  }

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <div className="mb-2">
        <div className="text-2xl font-bold text-blue-900">
          {customer.companyName || customer.businessName || '(No Company Name)'}
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <div></div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-blue-600 underline">Edit</button>
          {userIsAdmin && (
            <>
              <button
                className="text-red-600 underline ml-2"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete customer and all tickets"
              >Delete</button>
            </>
          )}
        </div>
      </div>
      <div className="mb-2 p-4 rounded bg-blue-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {customerFormSchema
            .filter(f => f.type !== 'hidden')
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(f => {
              let value = customer[f.name] || '';
              if (f.type === 'tel') {
                value = formatPhoneNumber(value, customer[`${f.name}_country`] || 'US');
                // If extension field exists, append it
                const extField = f.name + 'Ext';
                if (customer[extField]) {
                  value = value + ` x${customer[extField]}`;
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
      <button onClick={onNewTicket} className="bg-green-600 text-white px-4 py-2 rounded mb-2">New Repair Ticket</button>
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <div className="text-lg font-bold mb-2 text-red-700">Delete Customer?</div>
            <div className="mb-4 text-gray-800">
              Are you sure you want to delete <span className="font-semibold">{customer.businessName}</span>?<br />
              They have <span className="font-semibold">{completedTickets.length}</span> completed and <span className="font-semibold">{activeTickets.length}</span> active tickets.<br />
              <span className="text-red-600 font-semibold">Deleting the customer will remove all of these.</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={handleDeleteCustomer}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {deleteMsg && <div className="text-green-700 mt-2" role="status">{deleteMsg}</div>}
      <div className="mb-2">
        <div className="font-semibold mb-1">Active Tickets</div>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">RMA#</th>
                <th className="px-2 py-1 text-left">Ticket ID</th>
                <th className="px-2 py-1 text-left">Item</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {activeTickets.map(t => {
                // Always show RMA number, generate if missing
                const rma = t.rmaNumber || generateRmaNumber();
                return (
                  <tr key={t.id} className="border-b">
                    <td className="px-2 py-1 font-bold">{rma}</td>
                    <td className="px-2 py-1 text-gray-400 text-xs">{t.id}</td>
                    <td className="px-2 py-1">{t.item || 'Item'}</td>
                    <td className="px-2 py-1">{t.status}</td>
                    <td className="px-2 py-1">
                      <button className="text-blue-600 underline" onClick={() => navigate(`/customers/${customer.slug}/tickets/${t.id}`)}>View</button>
                    </td>
                  </tr>
                );
              })}
              {showCompleted && completedTickets.map(t => {
                const rma = t.rmaNumber || generateRmaNumber();
                return (
                  <tr key={t.id} className="border-b bg-gray-50">
                    <td className="px-2 py-1 font-bold">{rma}</td>
                    <td className="px-2 py-1 text-gray-400 text-xs">{t.id}</td>
                    <td className="px-2 py-1">{t.item || 'Item'}</td>
                    <td className="px-2 py-1">Completed{t.completedAt ? ` (${new Date(t.completedAt).toLocaleDateString()})` : ''}</td>
                    <td className="px-2 py-1">
                      <button className="text-blue-600 underline" onClick={() => navigate(`/customers/${customer.slug}/tickets/${t.id}`)}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span><span className="font-bold">RMA#</span>: Return Merchandise Authorization Number</span>
          <span><span className="text-gray-400">Ticket ID</span>: Internal unique ID</span>
          <span><span className="font-bold">Item</span>: Item being repaired</span>
          <span><span className="font-bold">Status</span>: Ticket status</span>
        </div>
        <button className="text-gray-700 underline mt-2" onClick={() => setShowCompleted(v => !v)}>
          {completedTickets.length > 0 ? (showCompleted ? 'Hide Completed Tickets' : 'Show Completed Tickets') : 'No Completed Tickets'}
        </button>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { customerId: customerSlug } = useParams();
  const [mode, setMode] = useState('search'); // 'search', 'add', 'edit', 'details'
  const [selected, setSelected] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const customersRaw = useAppStore(s => s.customers);
  const customers = Array.isArray(customersRaw) ? customersRaw : [];
  const setCustomers = useAppStore(s => s.setCustomers);
  const tickets = useAppStore(s => s.tickets);
  const setTickets = useAppStore(s => s.setTickets);
  const [ticketMsg, setTicketMsg] = useState("");
  const [addError, setAddError] = useState("");
  const navigate = useNavigate();

  // Ensure details view is shown when route is /customers/:slug
  useEffect(() => {
    // Only run if customerSlug is present
    if (customerSlug) {
      // If customers not loaded yet, wait for them
      if (!customers || customers.length === 0) return;
      const found = customers.find(c => c.slug === customerSlug);
      if (found) {
        setSelected(found);
        setMode('details');
      } else {
        // If not found, fallback to search mode
        setSelected(null);
        setMode('search');
      }
    }
  }, [customerSlug, customers && customers.length]);

  function handleCustomerDeleted() {
    setSelected(null);
    setMode('search');
  }

function handleAddCustomer(data) {
  // Use companyName from schema-driven form
  const name = (data.companyName || '').trim();
  if (!name) {
    setAddError('Company Name is required.');
    return;
  }
  // Prevent duplicate by companyName (case-insensitive, trimmed)
  const exists = customers.some(c => ((c.companyName || '').trim().toLowerCase() === name.toLowerCase()));
  if (exists) {
    setAddError('A customer with this company name already exists.');
    return;
  }
  setAddError("");
  const slug = slugify(name);
  const newCustomer = { ...data, id: nanoid(), slug };
  const newTicket = {
    id: nanoid(),
    customerId: newCustomer.id,
    status: 'New',
    createdAt: new Date().toISOString(),
    item: '',
  };
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  setCustomers([...customers, newCustomer]);
  setTickets([...safeTickets, newTicket]);
  setSelected(newCustomer);
  setTicketMsg('New repair ticket created for this customer!');
  setMode('details');
  setTimeout(() => {
    navigate(`/customers/${newCustomer.slug}/tickets/${newTicket.id}`);
  }, 0);
}
  function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  }
  function handleEditCustomer(data) {
    setCustomers(customers.map(c => c.id === editCustomer.id ? { ...editCustomer, ...data } : c));
    setSelected({ ...editCustomer, ...data });
    setEditCustomer(null);
    setMode('details');
  }
  function handleSelectCustomer(c) {
    setSelected(c);
    setMode('details');
  }
  function handleEditClick() {
    setEditCustomer(selected);
    setMode('edit');
  }
  // Import at top
  // ...existing code...
  function handleNewTicket() {
    if (!selected) return;
    const newTicket = {
      id: nanoid(),
      customerId: selected.id,
      status: 'New',
      createdAt: new Date().toISOString(),
      item: '',
      rmaNumber: generateRmaNumber(),
    };
    setTickets([...tickets, newTicket]);
    setTicketMsg('New repair ticket created for this customer!');
    navigate(`/customers/${selected.slug}/tickets/${newTicket.id}`);
  }
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex gap-4 mb-4">
        <button onClick={() => { setMode('search'); setSelected(null); setEditCustomer(null); }} className={`px-4 py-2 rounded ${mode === 'search' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Find Existing</button>
        <button onClick={() => { setMode('add'); setSelected(null); setEditCustomer(null); }} className={`px-4 py-2 rounded ${mode === 'add' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Add New</button>
      </div>
      {mode === 'search' && <CustomerSearch onSelect={handleSelectCustomer} />}
      {mode === 'add' && (
        <>
          {addError && <div className="mb-2 text-red-600 bg-red-100 border border-red-300 rounded px-2 py-1 text-sm">{addError}</div>}
          <CustomerForm onSave={handleAddCustomer} />
        </>
      )}
      {mode === 'edit' && <CustomerForm onSave={handleEditCustomer} initial={editCustomer} isEdit />}
      {mode === 'details' && selected && (
        <>
          {ticketMsg && <div className="bg-green-100 text-green-800 p-2 mb-2 rounded">{ticketMsg}</div>}
          <CustomerDetails customer={selected} onEdit={handleEditClick} onNewTicket={handleNewTicket} onDeleted={handleCustomerDeleted} />
        </>
      )}
    </div>
  );
}
