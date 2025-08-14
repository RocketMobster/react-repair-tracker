// Backup of TicketDetails.jsx before cleanup
// If you need to restore, rename this file to TicketDetails.jsx

import React, { useState, useRef } from 'react';
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

// ...rest of TicketDetails.jsx code...
