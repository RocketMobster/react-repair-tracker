import React, { useState } from "react";
import { useAppStore } from "../store";

export default function ActivityFeed({ ticketId, className = "" }) {
  // Select the ticket object directly and read its activity array
  const ticket = useAppStore(s => s.kanban.tickets[ticketId]);
  const activity = ticket && Array.isArray(ticket.activity) ? ticket.activity : [];
  const addTicketActivity = useAppStore(s => s.addTicketActivity);
  const currentUser = useAppStore(s => s.currentUser);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    addTicketActivity(ticketId, {
      type: "comment",
      text: text.trim(),
      author: currentUser?.username || "Anonymous",
      timestamp: new Date().toISOString(),
    });
    setText("");
    setSubmitting(false);
  };

  return (
    <div className={`rounded border bg-white p-3 ${className}`}>
      <div className="font-semibold mb-2">Activity & Comments</div>
      <div className="space-y-3 max-h-64 overflow-y-auto mb-2">
        {activity.length === 0 && (
          <div className="text-gray-400 italic">No activity yet.</div>
        )}
        {activity.map((a) => (
          <div key={a.id} className="flex items-start gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
              {a.author?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">{a.author || "Unknown"}</span>
                <span className="ml-2 text-xs text-gray-400">{new Date(a.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-gray-800 text-base whitespace-pre-line">{a.text}</div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 mt-2">
        <input
          className="border rounded px-2 py-1 w-full"
          type="text"
          placeholder="Add a comment..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={submitting}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          disabled={submitting || !text.trim()}
        >Post</button>
      </form>
    </div>
  );
}
