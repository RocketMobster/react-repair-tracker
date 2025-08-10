import React, { useState } from 'react';
import { useFormBuilderStore } from './store';
import { FieldList } from './fields';
import FieldConfigPanel from '../components/FieldConfigPanel';

export default function FormBuilder() {
  // Zustand store for builder state
  const { fields, addField, removeField, updateField } = useFormBuilderStore();
  console.log('Current fields order:', fields);

  // State for all field values and errors
  const [fieldValues, setFieldValues] = React.useState({});
  const [fieldErrors, setFieldErrors] = React.useState({});

  // State for config panel
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);

  function validate(field, value) {
    const { type, config = {} } = field;
    if (config.required && (value === '' || value === undefined || value === null)) {
      return config.errorMessage || 'This field is required.';
    }
    if (type === 'text' || type === 'textarea') {
      if (config.minLength && value.length < config.minLength) {
        return config.errorMessage || `Minimum length is ${config.minLength}.`;
      }
      if (config.maxLength && value.length > config.maxLength) {
        return config.errorMessage || `Maximum length is ${config.maxLength}.`;
      }
      if (config.pattern && value && !(new RegExp(config.pattern).test(value))) {
        return config.errorMessage || 'Invalid format.';
      }
    }
    if (type === 'number') {
      if (value !== '' && value !== undefined && value !== null) {
        const num = Number(value);
        if (isNaN(num)) {
          return config.errorMessage || 'Must be a number.';
        }
        if (config.min !== undefined && num < config.min) {
          return config.errorMessage || `Minimum value is ${config.min}.`;
        }
        if (config.max !== undefined && num > config.max) {
          return config.errorMessage || `Maximum value is ${config.max}.`;
        }
      }
    }
    return '';
  }

  function handleChange(fieldId, value) {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    const field = fields.find(f => f.id === fieldId);
    setFieldErrors(prev => ({ ...prev, [fieldId]: validate(field, value) }));
  }

  // Open config panel for a field
  function handleEditField(field) {
    setEditingField(field);
    setConfigPanelOpen(true);
  }

  // Save field config changes
  function handleSaveConfig(updatedField) {
    // Use config from updatedField directly
    const mergedField = {
      ...fields.find(f => f.id === updatedField.id),
      ...updatedField,
      config: { ...updatedField.config },
    };
    updateField(updatedField.id, mergedField);
    setConfigPanelOpen(false);
    setEditingField(null);
  }

  // Cancel editing
  function handleCancelConfig() {
    setConfigPanelOpen(false);
    setEditingField(null);
  }

  // Update field as user edits in panel
  function handleConfigChange(updatedField) {
    setEditingField(updatedField);
  }

  return (
    <div className="p-4 bg-white rounded shadow max-w-full mx-auto">
      <h2 className="text-xl font-bold mb-2">Form Builder</h2>
      <FieldList
        fields={fields}
        onRemove={removeField}
        onUpdate={updateField}
        onEdit={handleEditField}
      />
      <button onClick={() => addField()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Add Field</button>
      <hr className="my-6" />
      <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
      <div className="bg-gray-50 p-4 rounded border">
        <form>
          {fields.map((field, idx) => {
            const { type, label, config = {} } = field;
            const key = field.id;
            const value = fieldValues[key] || '';
            const error = fieldErrors[key] || '';
            if (type === 'text') {
              return (
                <div key={key} className="mb-4">
                  <label className="block font-medium mb-1">{label || `Field ${idx + 1}`}{config.required ? ' *' : ''}</label>
                  <input
                    type="text"
                    placeholder={config.placeholder}
                    required={config.required}
                    className={`w-full border rounded px-3 py-2 text-base ${error ? 'border-red-500' : ''}`}
                    value={value}
                    onChange={e => handleChange(key, e.target.value)}
                  />
                  {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
                </div>
              );
            }
            if (type === 'textarea') {
              return (
                <div key={key} className="mb-4">
                  <label className="block font-medium mb-1">{label || `Field ${idx + 1}`}{config.required ? ' *' : ''}</label>
                  <textarea
                    placeholder={config.placeholder}
                    required={config.required}
                    minLength={config.minLength}
                    maxLength={config.maxLength}
                    className={`w-full border rounded px-3 py-2 text-base ${error ? 'border-red-500' : ''}`}
                    value={value}
                    onChange={e => handleChange(key, e.target.value)}
                  />
                  {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
                </div>
              );
            }
            if (type === 'number') {
              return (
                <div key={key} className="mb-4">
                  <label className="block font-medium mb-1">{label || `Number ${idx + 1}`}{config.required ? ' *' : ''}</label>
                  <input
                    type="number"
                    placeholder={config.placeholder}
                    required={config.required}
                    min={config.min}
                    max={config.max}
                    className={`w-full border rounded px-3 py-2 text-base ${error ? 'border-red-500' : ''}`}
                    value={value}
                    onChange={e => handleChange(key, e.target.value)}
                  />
                  {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
                </div>
              );
            }
            if (type === 'date') {
              return (
                <div key={key} className="mb-4">
                  <label className="block font-medium mb-1">{label || `Field ${idx + 1}`}{config.required ? ' *' : ''}</label>
                  <input type="date" required={config.required} className="w-full border rounded px-3 py-2 text-base" />
                </div>
              );
            }
            if (type === 'dropdown') {
              const options = (config.options || '').split(',').map(opt => opt.trim()).filter(Boolean);
              return (
                <div key={key} className="mb-4">
                  <label className="block font-medium mb-1">{label || `Field ${idx + 1}`}{config.required ? ' *' : ''}</label>
                  <select required={config.required} className="w-full border rounded px-3 py-2 text-base">
                    <option value="">Select...</option>
                    {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>
              );
            }
            if (type === 'checkbox') {
              return (
                <div key={key} className="mb-4 flex items-center gap-2">
                  <input type="checkbox" id={key} required={config.required} />
                  <label htmlFor={key} className="font-medium">{label || `Field ${idx + 1}`}{config.required ? ' *' : ''}</label>
                </div>
              );
            }
            if (type === 'radio') {
              const options = (config.options || '').split(',').map(opt => opt.trim()).filter(Boolean);
              return (
                <div key={key} className="mb-4">
                  <label className="block font-medium mb-1">{label || `Field ${idx + 1}`}{config.required ? ' *' : ''}</label>
                  <div className="flex gap-4">
                    {options.map((opt, i) => (
                      <label key={i} className="flex items-center gap-1">
                        <input type="radio" name={key} value={opt} required={config.required} /> {opt}
                      </label>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </form>
      </div>
      {/* Field Config Side Panel */}
      <FieldConfigPanel
        isOpen={configPanelOpen}
        field={editingField}
        onSave={handleSaveConfig}
        onCancel={handleCancelConfig}
        onChange={handleConfigChange}
      />
    </div>
  );
}
