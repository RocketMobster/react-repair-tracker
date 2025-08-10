import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid';

// Example roles: Admin, Technician, Viewer, FrontDesk, Guest
export const useAppStore = create(
  persist(
    (set) => ({
      currentUser: null, // { id, username, role }
      tickets: [],
      customers: [],
      users: [],
      statuses: [],
      plugins: [],
      rolePermissions: {},
      // Add more state as needed
           // Placeholder for future barcode plugin
           barcode: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      setTickets: (tickets) => set({ tickets }),
      setCustomers: (customers) => set({ customers }),
      setUsers: (users) => set({ users }),
      setStatuses: (statuses) => set({ statuses }),
      setPlugins: (plugins) => set({ plugins }),
      setRolePermissions: (rolePermissions) => set({ rolePermissions }),

      // --- Kanban Board State ---
      kanban: {
        columns: [
          { id: 'backlog', name: 'Backlog', wipLimit: null, maxTime: null, ticketIds: [], defaultForNewTickets: false },
          { id: 'inProgress', name: 'In Progress', wipLimit: null, maxTime: null, ticketIds: [], defaultForNewTickets: false },
          { id: 'review', name: 'Review', wipLimit: null, maxTime: null, ticketIds: [], defaultForNewTickets: false },
          { id: 'done', name: 'Done', wipLimit: null, maxTime: null, ticketIds: [], defaultForNewTickets: false }
        ],
        columnOrder: ['backlog', 'inProgress', 'review', 'done'],
        tickets: {},
      },
      // Set a column as the default for new tickets (admin only)
      setDefaultKanbanColumn: (colId) => set(state => {
        const columns = state.kanban.columns.map(col => ({ ...col, defaultForNewTickets: col.id === colId }));
        return { kanban: { ...state.kanban, columns } };
      }),

      // Add or remove the Uncategorized column as needed
      ensureUncategorizedColumn: () => set(state => {
        let columns = [...state.kanban.columns];
        let columnOrder = [...state.kanban.columnOrder];
        let uncategorized = columns.find(col => col.id === 'uncategorized');
        // Add if missing
        if (!uncategorized) {
          columns.push({ id: 'incoming', name: 'Incoming', wipLimit: null, maxTime: null, ticketIds: [], defaultForNewTickets: false, isIncoming: true });
          columnOrder.unshift('incoming');
        }
        // Remove if empty
        const incoming = columns.find(col => col.id === 'incoming');
        if (incoming && incoming.ticketIds.length === 0) {
          columns = columns.filter(col => col.id !== 'incoming');
          columnOrder = columnOrder.filter(id => id !== 'incoming');
        }
        return { kanban: { ...state.kanban, columns, columnOrder } };
      }),

      // Assign tickets to persistent columns by statusHistory
      assignTicketsToKanbanColumns: () => set((state) => {
        const tickets = state.tickets || [];
        // Clone columns and clear ticketIds
        const columns = state.kanban.columns.map(col => ({ ...col, ticketIds: [] }));
        const kanbanTickets = {};
        tickets.forEach(ticket => {
          const latestCol = (ticket.statusHistory && ticket.statusHistory.length > 0)
            ? ticket.statusHistory[ticket.statusHistory.length - 1].columnId
            : 'backlog';
          const col = columns.find(c => c.id === latestCol) || columns[0];
          col.ticketIds.push(ticket.id);
          kanbanTickets[ticket.id] = ticket;
        });
        return {
          kanban: {
            ...state.kanban,
            columns,
            tickets: kanbanTickets,
          }
        };
      }),

      // Kanban Actions
      updateKanbanColumnTitle: (colId, newTitle) => set((state) => {
        const kanban = { ...state.kanban };
        if (kanban.columns[colId]) {
          kanban.columns[colId] = { ...kanban.columns[colId], title: newTitle };
        }
        return { kanban };
      }),
      setKanban: (kanban) => set({ kanban }),
      moveTicket: (ticketId, toColId, toIdx) => set(state => {
        const fromCol = state.kanban.columns.find(col => col.ticketIds.includes(ticketId));
        const toCol = state.kanban.columns.find(col => col.id === toColId);
        if (!fromCol || !toCol) return {};
        // Enforce WIP limit
        if (toCol.wipLimit && toCol.ticketIds.length >= toCol.wipLimit) {
          return {}; // Block move
        }
        // Remove from old column
        fromCol.ticketIds = fromCol.ticketIds.filter(id => id !== ticketId);
        // Insert into new column
        toCol.ticketIds = [
          ...toCol.ticketIds.slice(0, toIdx),
          ticketId,
          ...toCol.ticketIds.slice(toIdx)
        ];
        // Update ticket statusHistory
        const ticket = state.kanban.tickets[ticketId];
        if (ticket && (!ticket.statusHistory || ticket.statusHistory[ticket.statusHistory.length - 1]?.columnId !== toColId)) {
          const now = new Date().toISOString();
          ticket.statusHistory = [
            ...(ticket.statusHistory || []),
            { columnId: toColId, enteredAt: now }
          ];
        }
        return { kanban: { ...state.kanban, columns: [...state.kanban.columns], tickets: { ...state.kanban.tickets, [ticketId]: { ...ticket } } } };
      }),
      reorderTicket: (colId, startIndex, endIndex) => set((state) => {
        const kanban = { ...state.kanban };
        const ticketIds = Array.from(kanban.columns[colId].ticketIds);
        const [removed] = ticketIds.splice(startIndex, 1);
        ticketIds.splice(endIndex, 0, removed);
        kanban.columns[colId].ticketIds = ticketIds;
        return { kanban };
      }),
      addKanbanTicket: (ticket) => set((state) => {
        const kanban = { ...state.kanban };
        kanban.tickets[ticket.id] = ticket;
        // Also add to main tickets array if not present
        let ticketsArr = Array.isArray(state.tickets) ? [...state.tickets] : [];
        if (!ticketsArr.find(t => t.id === ticket.id)) {
          ticketsArr.push(ticket);
        }
        // Find default column
        let defaultCol = kanban.columns.find(col => col.defaultForNewTickets);
        if (!defaultCol) {
          // Use Uncategorized if no default set
          defaultCol = kanban.columns.find(col => col.id === 'incoming');
          if (!defaultCol) {
            defaultCol = { id: 'incoming', name: 'Incoming', wipLimit: null, maxTime: null, ticketIds: [], defaultForNewTickets: false, isIncoming: true };
            kanban.columns.push(defaultCol);
            kanban.columnOrder.unshift('incoming');
          }
        }
        defaultCol.ticketIds.push(ticket.id);
        return { kanban, tickets: ticketsArr };
      }),
      updateKanbanTicket: (ticket) => set((state) => {
        const kanban = { ...state.kanban };
        kanban.tickets[ticket.id] = { ...kanban.tickets[ticket.id], ...ticket };
        return { kanban };
      }),
      removeKanbanTicket: (ticketId) => set((state) => {
        const kanban = { ...state.kanban };
        delete kanban.tickets[ticketId];
        Object.values(kanban.columns).forEach(col => {
          col.ticketIds = col.ticketIds.filter(id => id !== ticketId);
        });
        // Also remove from main tickets array if it exists
        let newTickets = state.tickets;
        if (Array.isArray(newTickets)) {
          newTickets = newTickets.filter(t => t.id !== ticketId);
        }
        return { kanban, tickets: newTickets };
      }),
      addKanbanColumn: (name) => set(state => {
        const id = nanoid();
        return {
          kanban: {
            ...state.kanban,
            columns: [...state.kanban.columns, { id, name, wipLimit: null, ticketIds: [] }],
            columnOrder: [...state.kanban.columnOrder, id],
          },
        };
      }),
      removeKanbanColumn: (colId) => set(state => {
        // Prevent removing holding column if it has tickets
        if (colId === 'holding') {
          const holdingCol = state.kanban.columns.find(col => col.id === 'holding');
          if (holdingCol && holdingCol.ticketIds.length > 0) {
            // Set a flag in state to trigger notification in UI
            return { kanban: { ...state.kanban }, holdingDeleteBlocked: true };
          }
        }
        const idx = state.kanban.columnOrder.indexOf(colId);
        if (idx === -1) return {};
        const colToRemove = state.kanban.columns.find(col => col.id === colId);
        if (!colToRemove) return {};
        // Find or create holding column
        let holdingCol = state.kanban.columns.find(col => col.id === 'holding');
        let newColumns = state.kanban.columns.filter(col => col.id !== colId);
        let newColumnOrder = state.kanban.columnOrder.filter(id => id !== colId);
        if (!holdingCol) {
          holdingCol = { id: 'holding', name: 'Holding', wipLimit: null, maxTime: null, ticketIds: [] };
          newColumns.push(holdingCol);
          newColumnOrder.push('holding');
        }
        // Move tickets to holding column
        holdingCol.ticketIds = [...holdingCol.ticketIds, ...colToRemove.ticketIds];
        newColumns = newColumns.map(col => col.id === 'holding' ? holdingCol : col);
        return {
          kanban: {
            ...state.kanban,
            columns: newColumns,
            columnOrder: newColumnOrder,
          },
          holdingDeleteBlocked: false,
        };
      }),
      renameKanbanColumn: (colId, newName) => set(state => {
        return {
          kanban: {
            ...state.kanban,
            columns: state.kanban.columns.map(col => col.id === colId ? { ...col, name: newName } : col),
          },
        };
      }),
      moveKanbanColumn: (colId, dir) => set(state => {
        const idx = state.kanban.columnOrder.indexOf(colId);
        if (idx === -1) return {};
        const newOrder = [...state.kanban.columnOrder];
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= newOrder.length) return {};
        newOrder.splice(idx, 1);
        newOrder.splice(newIdx, 0, colId);
        return {
          kanban: {
            ...state.kanban,
            columnOrder: newOrder,
          },
        };
      }),
      setKanbanColumnWipLimit: (colId, wipLimit) => set(state => {
        return {
          kanban: {
            ...state.kanban,
            columns: state.kanban.columns.map(col => col.id === colId ? { ...col, wipLimit } : col),
          },
        };
      }),
    }),
    {
      name: 'repair-tracker-store',
      partialize: (state) => ({
        tickets: state.tickets,
        customers: state.customers,
      }),
    }
  )
)
