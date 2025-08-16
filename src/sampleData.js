// Sample data for testing the application
// This will provide demo data for tickets and customers

import { nanoid } from 'nanoid';
import { cleanupRelationships } from './utils/relationshipUtils';

// Generate random dates within the last 30 days
function randomDate(daysAgo = 30) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

// Sample customers
export const sampleCustomers = [
  {
    id: 'cust1',
    slug: 'cust1',
    companyName: 'Acme Corporation',
    contactName: 'John Smith',
    contactEmail: 'john@acme.com',
    contactPhone: '5551234567',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    notes: 'VIP customer, always expedite repairs'
  },
  {
    id: 'cust2',
    slug: 'cust2',
    companyName: 'TechSolutions Inc',
    contactName: 'Sarah Johnson',
    contactEmail: 'sarah@techsolutions.com',
    contactPhone: '5559876543',
    address: '456 Oak Ave',
    city: 'Riverside',
    state: 'CA',
    zip: '92501',
    notes: 'Has service contract #SC-2023-0456'
  },
  {
    id: 'cust3',
    slug: 'cust3',
    businessName: 'Green Valley Farm',
    contactName: 'Mike Peterson',
    contactEmail: 'mike@greenvalley.com',
    contactPhone: '5552223333',
    address: '789 Rural Route',
    city: 'Farmville',
    state: 'IA',
    zip: '50265',
    notes: 'Seasonal customer, busy during harvest'
  }
];

// Sample tickets
export const sampleTickets = [
  {
    id: 'ticket1',
    customerId: 'cust1',
    rmaNumber: 'RMA-2023-001',
    item: 'Dell Precision Workstation',
    type: 'Computer',
    reason: 'Display issues, possible graphics card failure',
    status: 'In Progress',
    priority: 'High',
    createdAt: randomDate(15),
    updatedAt: randomDate(5),
    assignedTo: 'tech1',
    notes: 'Customer reported intermittent display glitches',
    customFields: {
      'Serial Number': 'DP-X9723-4582',
      'Warranty': 'Extended warranty until 2024',
      'Accessories': 'Power cable, docking station'
    },
    relatedTickets: [
      { id: 'ticket2', type: 'related', note: 'Same customer, related equipment' }
    ],
    activity: [
      {
        id: nanoid(),
        timestamp: randomDate(15),
        type: 'status',
        user: 'front',
        message: 'Ticket created and assigned to technician',
        details: { status: 'New', assignedTo: 'tech1' }
      },
      {
        id: nanoid(),
        timestamp: randomDate(10),
        type: 'note',
        user: 'tech',
        message: 'Initial diagnosis: GPU overheating, will need to replace thermal paste and possibly the graphics card'
      },
      {
        id: nanoid(),
        timestamp: randomDate(5),
        type: 'status',
        user: 'tech',
        message: 'Status updated to In Progress',
        details: { status: 'In Progress' }
      }
    ]
  },
  {
    id: 'ticket2',
    customerId: 'cust1',
    rmaNumber: 'RMA-2023-002',
    item: 'HP LaserJet Printer',
    type: 'Printer',
    reason: 'Paper jam issues, error code E4-01',
    status: 'New',
    priority: 'Medium',
    createdAt: randomDate(7),
    updatedAt: randomDate(2),
    notes: 'Printer is under warranty',
    customFields: {
      'Serial Number': 'HP-LJ-98765',
      'Warranty': 'Manufacturer warranty until 2024',
      'Last Service': '2023-01-15'
    },
    relatedTickets: [
      { id: 'ticket1', type: 'related', note: 'From same customer' }
    ],
    activity: [
      {
        id: nanoid(),
        timestamp: randomDate(7),
        type: 'status',
        user: 'front',
        message: 'Ticket created',
        details: { status: 'New' }
      }
    ]
  },
  {
    id: 'ticket3',
    customerId: 'cust2',
    rmaNumber: 'RMA-2023-003',
    item: 'Cisco Switch 2960X',
    type: 'Network Equipment',
    reason: 'Multiple ports not working, possible hardware failure',
    status: 'Review',
    priority: 'High',
    createdAt: randomDate(21),
    updatedAt: randomDate(1),
    assignedTo: 'tech1',
    notes: 'This is a critical infrastructure component for the customer',
    customFields: {
      'Serial Number': 'CS-2960X-ABCD',
      'Firmware': '15.2(2)E5',
      'Location': 'Server room - Rack B'
    },
    relatedTickets: [],
    activity: [
      {
        id: nanoid(),
        timestamp: randomDate(21),
        type: 'status',
        user: 'front',
        message: 'Ticket created and marked as high priority',
        details: { status: 'New', priority: 'High' }
      },
      {
        id: nanoid(),
        timestamp: randomDate(18),
        type: 'note',
        user: 'tech',
        message: 'Initial diagnosis complete - multiple port failures, likely hardware issue'
      },
      {
        id: nanoid(),
        timestamp: randomDate(15),
        type: 'status',
        user: 'tech',
        message: 'Status updated to In Progress',
        details: { status: 'In Progress' }
      },
      {
        id: nanoid(),
        timestamp: randomDate(7),
        type: 'note',
        user: 'tech',
        message: 'Replacement parts ordered, ETA 3-5 business days'
      },
      {
        id: nanoid(),
        timestamp: randomDate(1),
        type: 'status',
        user: 'tech',
        message: 'Parts arrived, installation complete, ready for review',
        details: { status: 'Review' }
      }
    ]
  },
  {
    id: 'ticket4',
    customerId: 'cust3',
    rmaNumber: 'RMA-2023-004',
    item: 'John Deere Tractor Display',
    type: 'Agricultural Equipment',
    reason: 'Touch screen not responding, system boots but UI unresponsive',
    status: 'Done',
    priority: 'Medium',
    createdAt: randomDate(30),
    updatedAt: randomDate(5),
    assignedTo: 'tech1',
    notes: 'Customer needs this fixed before spring planting',
    customFields: {
      'Serial Number': 'JD-DSP-5566778',
      'Model': 'CommandCenter 4600',
      'Software Version': '10.13.1234-76'
    },
    relatedTickets: [],
    activity: [
      {
        id: nanoid(),
        timestamp: randomDate(30),
        type: 'status',
        user: 'front',
        message: 'Ticket created',
        details: { status: 'New' }
      },
      {
        id: nanoid(),
        timestamp: randomDate(27),
        type: 'status',
        user: 'tech',
        message: 'Started diagnosis, status updated to In Progress',
        details: { status: 'In Progress' }
      },
      {
        id: nanoid(),
        timestamp: randomDate(25),
        type: 'note',
        user: 'tech',
        message: 'Touchscreen controller failed, replacement needed'
      },
      {
        id: nanoid(),
        timestamp: randomDate(20),
        type: 'note',
        user: 'admin',
        message: 'Ordered replacement part #JD-55987'
      },
      {
        id: nanoid(),
        timestamp: randomDate(12),
        type: 'note',
        user: 'tech',
        message: 'Part arrived, installing and testing'
      },
      {
        id: nanoid(),
        timestamp: randomDate(10),
        type: 'status',
        user: 'tech',
        message: 'Repair complete, ready for customer pickup',
        details: { status: 'Review' }
      },
      {
        id: nanoid(),
        timestamp: randomDate(5),
        type: 'status',
        user: 'front',
        message: 'Customer picked up equipment, confirmed working properly',
        details: { status: 'Done' }
      }
    ]
  }
];

// Function to initialize store with sample data if it's empty
export function initializeSampleData(store) {
  const { tickets, customers, setTickets, setCustomers } = store;
  
  // Check if data needs initialization
  const needsInitialization = (!tickets || tickets.length === 0) && (!customers || customers.length === 0);
  
  // Force initialization for testing - useful for development to always load sample data
  const forceInitialization = true;
  
  if (needsInitialization || forceInitialization) {
    console.log('Initializing store with sample data...');
    console.log('Before: Tickets:', tickets?.length || 0, 'Customers:', customers?.length || 0);
    
    // We need to create the sample data dynamically each time to get unique IDs
    const newCustomers = [...sampleCustomers];
    
    // Clean up relationships in each ticket's relatedTickets array
    const newTickets = sampleTickets.map(ticket => ({
      ...ticket,
      relatedTickets: Array.isArray(ticket.relatedTickets) 
        ? cleanupRelationships(ticket.relatedTickets)
        : []
    }));
    
    // Log the IDs of sample tickets for debugging
    console.log('Sample ticket IDs:', newTickets.map(t => t.id));
    
    // Update the store
    setCustomers(newCustomers);
    setTickets(newTickets);
    
    console.log('After: Sample customers:', newCustomers.length, 'Sample tickets:', newTickets.length);
    return true;
  }
  return false;
}
