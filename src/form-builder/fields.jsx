import { defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
// Simple icon mapping for field types
const FIELD_TYPE_ICONS = {
  text: '📝',
  textarea: '📄',
  number: '🔢',
  date: '📅',
  dropdown: '⬇️',
  checkbox: '☑️',
  radio: '🔘',
};
export function SortableField({ id, field, idx, activeId, onRemove, onUpdate, setActiveId, isDropTarget, nodeRef = { current: null }, highlight, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transition,
  } = useSortable({
    id,
    animateLayoutChanges: defaultAnimateLayoutChanges,
    handle: true,
  });
  // Use safeNodeRef everywhere, defaulting to a no-op ref if nodeRef is undefined
  const safeNodeRef = nodeRef ?? { current: null };
  const combinedRef = el => {
    setNodeRef(el);
    safeNodeRef.current = el;
  };
  return (
    <div
      ref={combinedRef}
      {...attributes}
      className={`mb-2 p-2 border rounded flex flex-col bg-white transition-all duration-300 ease-in-out opacity-100 translate-y-0 relative ${isDragging ? 'ring-2 ring-blue-400' : ''} ${isDropTarget ? 'ring-4 ring-blue-300 bg-blue-50' : ''} touch-manipulation${highlight ? ' field-highlight' : ''}`}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: `${transition}, opacity 0.3s, transform 0.3s`,
        touchAction: 'manipulation',
        minHeight: '3.5rem',
      }}
    >
      <div className="flex items-center gap-2 pr-32 min-h-[2.5rem]">
        {/* Drag handle with tooltip - now first/top-left */}
        <span
          {...listeners}
          data-dnd-kit-handle
          className="cursor-grab text-gray-400 hover:text-blue-500 mr-1 select-none relative"
          tabIndex={0}
          style={{
            minWidth: '2.5rem',
            minHeight: '2.5rem',
            fontSize: '1.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
            background: '#fffde7',
            border: '2px solid #fbbf24',
            zIndex: 10,
          }}
          onMouseEnter={e => {
            const tip = document.createElement('div');
            tip.textContent = 'Drag to reorder';
            tip.className = 'absolute left-8 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-800 text-white rounded shadow z-10 whitespace-nowrap';
            tip.style.pointerEvents = 'none';
            tip.id = 'drag-tooltip';
            e.currentTarget.appendChild(tip);
          }}
          onMouseLeave={e => {
            const tip = e.currentTarget.querySelector('#drag-tooltip');
            if (tip) tip.remove();
          }}
        >
          &#x2630;
        </span>
        {/* Field type icon - now after drag handle */}
        <span className="text-xl mr-1" title={field.type} aria-label={field.type}>
          {FIELD_TYPE_ICONS[field.type] || '❓'}
        </span>
        <span className="font-medium text-gray-700 mr-2">
          {(() => {
            const typeLabel = field.type === 'text' ? 'Text Field' :
              field.type === 'textarea' ? 'Text Area' :
              field.type === 'number' ? 'Number Field' :
              field.type === 'date' ? 'Date Field' :
              field.type === 'dropdown' ? 'Dropdown' :
              field.type === 'checkbox' ? 'Checkbox' :
              field.type === 'radio' ? 'Radio' :
              'Field';
            return `${typeLabel} ${idx + 1}`;
          })()}
        </span>
      </div>
      <div className="absolute right-4 bottom-2 flex gap-2">
        <button onClick={() => onRemove(field.id)} className="px-2 py-1 bg-red-500 text-white rounded">Remove</button>
        <button onClick={() => onEdit && onEdit(field)} className="px-2 py-1 bg-green-500 text-white rounded" title="Edit field config">Edit</button>
      </div>
      {/* All field config is now handled in the side panel */}
    </div>
  );
}
import React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './fields-animations.css';
import { FIELD_TYPES } from './fieldTypes';
import './fields-animations.css';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DragOverlay } from '@dnd-kit/core';
import { useFormBuilderStore } from './store';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

export function FieldList({ fields, onRemove, onUpdate, onEdit }) {
  // Add sensors for both pointer and touch
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 400, tolerance: 8 } })
  );
  const { reorderFields } = useFormBuilderStore();
  const [activeId, setActiveId] = React.useState(null);
  const [overId, setOverId] = React.useState(null);
  const [lastAddedId, setLastAddedId] = React.useState(null);
  const [notification, setNotification] = React.useState(null);
  const notificationTimeout = React.useRef();
  const activeField = fields.find(f => f.id === activeId);
  const activeFieldIdx = activeField ? fields.findIndex(f => f.id === activeField.id) : null;

  // Detect new field added
  const prevFieldsRef = React.useRef(fields);
  React.useEffect(() => {
    if (fields.length > prevFieldsRef.current.length) {
      // Added
      setNotification('Field added');
      if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
      notificationTimeout.current = setTimeout(() => setNotification(null), 1200);
    }
    prevFieldsRef.current = fields;
  }, [fields]);

  // Notification for remove
  const handleRemove = id => {
    onRemove(id);
    setNotification('Field removed');
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    notificationTimeout.current = setTimeout(() => setNotification(null), 1200);
  };

  function handleDragEnd(event) {
    const { active, over } = event;
    console.log('DragEnd:', { activeId: active?.id, overId: over?.id });
    if (active && over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      console.log('Reorder indices:', { oldIndex, newIndex });
      reorderFields(oldIndex, newIndex);
    }
    setActiveId(null);
    setOverId(null);
  }

  // Helper to call onEdit when edit button is clicked
  function handleEdit(field) {
    if (onEdit) onEdit(field);
  }
  return (
    <div
      style={{ touchAction: activeId ? 'none' : 'auto' }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={e => setActiveId(e.active.id)}
        onDragCancel={() => { setActiveId(null); setOverId(null); }}
        onDragOver={e => setOverId(e.over?.id || null)}
      >
        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {fields.length === 0 ? (
            <div className="text-gray-400 italic p-8 text-center border rounded bg-gray-50">
              No fields yet. Click <span className="font-semibold text-blue-500">Add Field</span> to get started!
            </div>
          ) : (
            <TransitionGroup>
              {fields.map((field, idx) => {
                const nodeRef = React.createRef();
                const highlight = field.id === lastAddedId;
                return (
                  <CSSTransition
                    key={field.id}
                    timeout={300}
                    classNames="fade-slide"
                    nodeRef={nodeRef}
                  >
                    <SortableField
                      id={field.id}
                      field={field}
                      idx={idx}
                      activeId={activeId}
                      onRemove={handleRemove}
                      onUpdate={onUpdate}
                      setActiveId={setActiveId}
                      isDropTarget={overId === field.id && activeId !== field.id}
                      nodeRef={nodeRef}
                      highlight={highlight}
                      onEdit={onEdit}
                    />
                  </CSSTransition>
                );
              })}
            </TransitionGroup>
          )}
        </SortableContext>
        <DragOverlay>
          {activeField ? (
            <div className="mb-2 p-2 border rounded flex flex-col gap-2 drag-overlay-animate" style={{ background: '#fffbe6' }}>
              <div className="flex items-center gap-2">
                <span className="cursor-grab text-yellow-500 mr-2 select-none">&#x2630;</span>
                <span className="font-semibold">
                  {activeField.label && activeField.label.trim() ? activeField.label : `${activeField.type.charAt(0).toUpperCase() + activeField.type.slice(1)}${activeFieldIdx !== null ? ` ${activeFieldIdx + 1}` : ''}`}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
        {notification && (
          <div className="notification">{notification}</div>
        )}
      </DndContext>
    </div>
  );
}

