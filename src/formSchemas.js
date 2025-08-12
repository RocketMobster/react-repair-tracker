// src/formSchemas.js

export const customerFormSchema = [
  {
    name: "companyName",
    label: "Company Name",
    type: "text",
    required: true,
    minLength: 2,
    maxLength: 64,
    order: 1,
  },
  {
    name: "addressLine1",
    label: "Address Line 1",
    type: "text",
    required: true,
    minLength: 2,
    maxLength: 128,
    order: 2,
  },
  {
    name: "addressLine2",
    label: "Address Line 2",
    type: "text",
    required: false,
    maxLength: 128,
    order: 3,
  },
  {
    name: "city",
    label: "City",
    type: "text",
    required: true,
    minLength: 2,
    maxLength: 64,
    order: 4,
  },
  {
    name: "state",
    label: "State/Province/Region",
    type: "text",
    required: true,
    minLength: 2,
    maxLength: 64,
    order: 5,
  },
  {
    name: "postalCode",
    label: "Postal Code",
    type: "text",
    required: true,
    minLength: 2,
    maxLength: 16,
    order: 6,
  },
  {
    name: "country",
    label: "Country",
    type: "text",
    required: true,
    minLength: 2,
    maxLength: 64,
    order: 7,
  },
  {
    name: "companyPhone",
    label: "Company Phone Number",
    type: "tel",
    required: true,
    order: 8,
    countrySelect: true, // Add country selector for phone
    allowedCountries: ["US", "UK"],
  },
  {
    name: "companyPhoneExt",
    label: "Company Phone Extension",
    type: "text",
    required: false,
    maxLength: 8,
    order: 8.1,
    placeholder: "Ext. (optional)",
  },
  {
    name: "contactName",
    label: "Contact Name",
    type: "text",
    required: true,
    minLength: 2,
    maxLength: 64,
    order: 9,
  },
  {
    name: "contactPhone",
    label: "Contact Phone Number",
    type: "tel",
    required: true,
    order: 10,
    countrySelect: true, // Add country selector for phone
    allowedCountries: ["US", "UK"],
  },
  {
    name: "contactPhoneExt",
    label: "Contact Phone Extension",
    type: "text",
    required: false,
    maxLength: 8,
    order: 10.1,
    placeholder: "Ext. (optional)",
  },
  {
    name: "billingAddress",
    label: "Billing Address",
    type: "textarea",
    required: false,
    maxLength: 256,
    order: 11,
  },
  {
    name: "shippingAddress",
    label: "Shipping Address",
    type: "textarea",
    required: false,
    maxLength: 256,
    order: 12,
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea",
    required: false,
    maxLength: 512,
    order: 13,
  },
];

// Helper to merge custom fields into the ticket schema at runtime
export function getTicketFormSchema(customFields = []) {
  // Merge built-in fields with custom fields (custom fields come last, can override by name)
  const builtIn = [
    {
      name: "highPriority",
      label: "High Priority",
      type: "checkbox",
      required: false,
      order: 1,
      help: "Mark this ticket as high priority. High priority tickets are highlighted in the Kanban board."
    },
    {
      name: "assignedTo",
      label: "Assigned Technician",
      type: "text", // Change to select when user/tech management is ready
      required: false,
      order: 1.5,
      help: "Technician assigned to this ticket."
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: ["New", "In Progress", "Repaired", "Shipped"],
      default: "New",
      order: 2,
    },
    {
      name: "item",
      label: "Item",
      type: "text",
      required: true,
      minLength: 2,
      maxLength: 64,
      order: 3,
    },
    {
      name: "reason",
      label: "Reason for Return",
      type: "textarea",
      required: true,
      minLength: 5,
      maxLength: 512,
      order: 4,
    },
    {
      name: "attachments",
      label: "Attachments",
      type: "file",
      required: false,
      multiple: true,
      order: 5,
      help: "Upload images or documents related to this ticket."
    },
    // Reception
    {
      name: "receptionDate",
      label: "Reception Date",
      type: "date",
      required: false,
      order: 10,
    },
  {
    name: "receptionEmployee",
    label: "Reception Employee",
    type: "text",
    required: false,
    order: 11,
  },
  {
    name: "receptionNotes",
    label: "Reception Notes",
    type: "textarea",
    required: false,
    maxLength: 512,
    order: 12,
  },
  // Inspection
  {
    name: "inspectionDate",
    label: "Inspection Date",
    type: "date",
    required: false,
    order: 20,
  },
  {
    name: "inspectionEmployee",
    label: "Inspection Employee",
    type: "text",
    required: false,
    order: 21,
  },
  {
    name: "inspectionNotes",
    label: "Inspection Notes",
    type: "textarea",
    required: false,
    maxLength: 512,
    order: 22,
  },
  // Repaired
  {
    name: "repairDate",
    label: "Repair Date",
    type: "date",
    required: false,
    order: 30,
  },
  {
    name: "repairEmployee",
    label: "Repair Employee",
    type: "text",
    required: false,
    order: 31,
  },
  {
    name: "repairNotes",
    label: "Repair Notes",
    type: "textarea",
    required: false,
    maxLength: 512,
    order: 32,
  },
  // Shipped
  {
    name: "shippedDate",
    label: "Shipped Date",
    type: "date",
    required: false,
    order: 40,
  },
  {
    name: "shippedEmployee",
    label: "Shipped Employee",
    type: "text",
    required: false,
    order: 41,
  },

    {
      name: "shippedNotes",
      label: "Shipping Notes",
      type: "textarea",
      required: false,
      maxLength: 512,
      order: 42,
    },
  ];
  // Merge custom fields (by name, custom fields override built-in if same name)
  const byName = {};
  for (const f of builtIn) byName[f.name] = f;
  for (const f of customFields) byName[f.name] = f;
  // Return as sorted array
  return Object.values(byName).sort((a, b) => (a.order || 0) - (b.order || 0));
}

// For legacy code, keep the default export as the built-in schema
export const ticketFormSchema = getTicketFormSchema();

// Field groups for ticket details UI and admin customization
export const ticketFieldGroups = [
  {
    label: 'Reception',
    color: 'bg-blue-50',
    fields: ['receptionDate', 'receptionEmployee', 'receptionNotes'],
  },
  {
    label: 'Inspection',
    color: 'bg-yellow-50',
    fields: ['inspectionDate', 'inspectionEmployee', 'inspectionNotes'],
  },
  {
    label: 'Repaired',
    color: 'bg-green-50',
    fields: ['repairDate', 'repairEmployee', 'repairNotes'],
  },
  {
    label: 'Shipped',
    color: 'bg-purple-50',
    fields: ['shippedDate', 'shippedEmployee', 'shippedNotes'],
  },
];
