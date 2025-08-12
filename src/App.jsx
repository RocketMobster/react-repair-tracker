
import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import TicketDetails from './TicketDetails';
import KanbanBoard from './components/KanbanBoard';
import CustomersPage from './CustomersPage';
import { useAppStore } from './store';

function Dashboard() {
  return <div className="p-8"><h2 className="text-2xl font-bold mb-2">Dashboard</h2><p>Overview and widgets go here.</p></div>;
}
function Tickets() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Tickets</h2>
      <KanbanBoard />
    </div>
  );
}

// CustomersPage is now the main customers UI
function Admin() {
  return <div className="p-8"><h2 className="text-2xl font-bold mb-2">Admin</h2><p>Admin tools and plugin manager go here.</p></div>;
}

function Login() {
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({ username: '', password: '' });

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    // Demo users
    const users = [
      { id: 1, username: 'admin', password: 'admin', role: 'Admin' },
      { id: 2, username: 'tech', password: 'tech', role: 'Technician' },
      { id: 3, username: 'viewer', password: 'viewer', role: 'Viewer' },
      { id: 4, username: 'front', password: 'front', role: 'FrontDesk' },
      { id: 5, username: 'guest', password: 'guest', role: 'Guest' },
    ];
    const found = users.find(
      (u) => u.username === form.username && u.password === form.password
    );
    if (found) {
      setCurrentUser(found);
      setError("");
    } else {
      setError("Invalid username or password");
    }
  }
  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="w-full p-2 border rounded" />
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
      </form>
      <div className="mt-4 text-sm text-gray-500">Demo users: admin/admin, tech/tech, viewer/viewer, front/front, guest/guest</div>

    </div>
  );
}


function App() {
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  function handleLogout() {
    setCurrentUser(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <nav className="flex gap-4 p-4 bg-white shadow mb-6 items-center">
        <Link to="/" className="font-bold text-blue-700">Dashboard</Link>
        {currentUser && <Link to="/tickets" className="text-blue-700">Tickets</Link>}
        {currentUser && <Link to="/customers" className="text-blue-700">Customers</Link>}
        {currentUser?.role === 'Admin' && <Link to="/admin" className="text-blue-700">Admin</Link>}
        <div className="ml-auto flex items-center gap-2">
          {currentUser ? (
            <>
              <span className="text-blue-900 font-semibold">{currentUser.username} ({currentUser.role})</span>
              <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
            </>
          ) : (
            <Link to="/login" className="text-blue-500">Login</Link>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tickets" element={currentUser ? <Tickets /> : <Navigate to="/login" />} />
        <Route path="/customers" element={currentUser ? <CustomersPage /> : <Navigate to="/login" />} />
  <Route path="/customers/:customerId" element={currentUser ? <CustomersPage /> : <Navigate to="/login" />} />
  <Route path="/customers/:customerId/tickets/:ticketId" element={currentUser ? <TicketDetails /> : <Navigate to="/login" />} />
  <Route path="/tickets/:ticketId" element={currentUser ? <TicketDetails /> : <Navigate to="/login" />} />
  <Route path="/tickets/:ticketId/edit" element={currentUser ? <TicketDetails editModeFromRoute /> : <Navigate to="/login" />} />
        <Route path="/admin" element={currentUser?.role === 'Admin' ? <Admin /> : <Navigate to="/login" />} />
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
