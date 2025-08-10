import React, { useEffect, useRef } from 'react';
import { FIELD_TYPES } from '../form-builder/fieldTypes';

export default function FieldConfigPanel({ isOpen, field, onSave, onCancel, onChange }) {
  const panelRef = useRef(null);

  // Focus trap for accessibility
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !field) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={onCancel} aria-hidden="true" />
      {/* Side Panel */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-50 flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0"
      >
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Field</h2>
          <button onClick={onCancel} aria-label="Close" className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </header>
        <form
          className="flex-1 px-6 py-4 flex flex-col gap-4 overflow-y-auto"
          onSubmit={e => { e.preventDefault(); onSave(field); }}
        >
          {/* Label */}
          <label className="flex flex-col gap-1">
            <span className="font-medium">Label</span>
            <input
              type="text"
              className="border rounded px-3 py-2"
              value={field.label || ''}
              onChange={e => onChange({ ...field, label: e.target.value })}
              required
            />
          </label>
          {/* Type */}
          <label className="flex flex-col gap-1">
            <span className="font-medium">Type</span>
            <select
              className="border rounded px-3 py-2"
              value={field.type || ''}
              onChange={e => {
                const selectedType = e.target.value;
                const typeDef = FIELD_TYPES.find(ft => ft.type === selectedType);
                // When type changes, reset config to defaults for that type
                onChange({ ...field, type: selectedType, config: { ...typeDef?.config } });
              }}
              required
            >
              {FIELD_TYPES.map(ft => (
                <option key={ft.type} value={ft.type}>{ft.label}</option>
              ))}
            </select>
          </label>
          {/* Render config fields dynamically based on type */}
          {(() => {
            switch (field.type) {
              case 'text':
              case 'textarea':
                return <>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!field.config?.required}
                      onChange={e => onChange({ ...field, config: { ...field.config, required: e.target.checked } })}
                    />
                    <span className="font-medium">Required</span>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Placeholder</span>
                    <input
                      type="text"
                      className="border rounded px-3 py-2"
                      value={field.config?.placeholder || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, placeholder: e.target.value } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Min Length</span>
                    <input
                      type="number"
                      className="border rounded px-3 py-2"
                      value={field.config?.minLength || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, minLength: Number(e.target.value) } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Max Length</span>
                    <input
                      type="number"
                      className="border rounded px-3 py-2"
                      value={field.config?.maxLength || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, maxLength: Number(e.target.value) } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Pattern (regex)</span>
                    <input
                      type="text"
                      className="border rounded px-3 py-2"
                      value={field.config?.pattern || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, pattern: e.target.value } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Error Message</span>
                    <input
                      type="text"
                      className="border rounded px-3 py-2"
                      value={field.config?.errorMessage || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, errorMessage: e.target.value } })}
                    />
                  </label>
                </>;
              case 'number':
                return <>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!field.config?.required}
                      onChange={e => onChange({ ...field, config: { ...field.config, required: e.target.checked } })}
                    />
                    <span className="font-medium">Required</span>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Placeholder</span>
                    <input
                      type="text"
                      className="border rounded px-3 py-2"
                      value={field.config?.placeholder || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, placeholder: e.target.value } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Min</span>
                    <input
                      type="number"
                      className="border rounded px-3 py-2"
                      value={field.config?.min || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, min: Number(e.target.value) } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Max</span>
                    <input
                      type="number"
                      className="border rounded px-3 py-2"
                      value={field.config?.max || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, max: Number(e.target.value) } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Error Message</span>
                    <input
                      type="text"
                      className="border rounded px-3 py-2"
                      value={field.config?.errorMessage || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, errorMessage: e.target.value } })}
                    />
                  </label>
                </>;
              case 'date':
                return <>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!field.config?.required}
                      onChange={e => onChange({ ...field, config: { ...field.config, required: e.target.checked } })}
                    />
                    <span className="font-medium">Required</span>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Min Date</span>
                    <input
                      type="date"
                      className="border rounded px-3 py-2"
                      value={field.config?.min || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, min: e.target.value } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Max Date</span>
                    <input
                      type="date"
                      className="border rounded px-3 py-2"
                      value={field.config?.max || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, max: e.target.value } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Error Message</span>
                    <input
                      type="text"
                      className="border rounded px-3 py-2"
                      value={field.config?.errorMessage || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, errorMessage: e.target.value } })}
                    />
                  </label>
                </>;
              case 'dropdown':
              case 'radio':
                return <>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!field.config?.required}
                      onChange={e => onChange({ ...field, config: { ...field.config, required: e.target.checked } })}
                    />
                    <span className="font-medium">Required</span>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Options (comma separated)</span>
                    <input
                      type="text"
                      className="border rounded px-3 py-2"
                      value={field.config?.options || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, options: e.target.value } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Error Message</span>
                    <input
                      type="text"
                      className="border rounded px-3 py-2"
                      value={field.config?.errorMessage || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, errorMessage: e.target.value } })}
                    />
                  </label>
                </>;
              case 'checkbox':
                return <>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!field.config?.required}
                      onChange={e => onChange({ ...field, config: { ...field.config, required: e.target.checked } })}
                    />
                    <span className="font-medium">Required</span>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Error Message</span>
                    <input
                      type="text"
                      className="border rounded px-3 py-2"
                      value={field.config?.errorMessage || ''}
                      onChange={e => onChange({ ...field, config: { ...field.config, errorMessage: e.target.value } })}
                    />
                  </label>
                </>;
              default:
                return null;
            }
          })()}
        </form>
        <footer className="px-6 py-4 border-t flex gap-2 justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={() => onSave(field)}
          >
            Save
          </button>
        </footer>
      </aside>
    </>
  );
}
