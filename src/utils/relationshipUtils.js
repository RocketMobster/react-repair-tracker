// relationshipUtils.js - Functions for managing ticket relationships

// Helper function that returns a Map with ticketId -> strongest relationship type
export function filterDuplicateRelationships(relationships) {
  console.log('Filtering duplicate relationships:', relationships);
  // Store the strongest relationship per ticket ID (parent/child > related)
  const ticketRelationships = new Map();
  
  if (!relationships || !Array.isArray(relationships)) return ticketRelationships;
  
  // First pass - normalize all relationships to ensure they have an id property
  const normalizedRelationships = relationships.map(rel => {
    // Handle case where rel is just a string ID
    if (typeof rel === 'string') return { id: rel, type: 'related', note: '' };
    // Handle case where rel is a number ID
    if (typeof rel === 'number') return { id: String(rel), type: 'related', note: '' };
    // Handle case where rel is an object but might not have all properties
    if (rel && typeof rel === 'object') {
      return {
        id: String(rel.id || ''),
        type: rel.type || 'related',
        note: rel.note || ''
      };
    }
    return null;
  }).filter(Boolean); // Remove any null entries
  
  // Second pass - find strongest relationship for each ticket ID
  for (const rel of normalizedRelationships) {
    if (!rel.id) continue;
    
    const existingRel = ticketRelationships.get(rel.id);
    console.log(`Checking relationship for ticket ${rel.id}, type: ${rel.type}`);
    
    // If no existing relationship or current one is stronger, update the map
    if (!existingRel || 
        (existingRel.type === 'related' && 
         (rel.type === 'parent' || rel.type === 'child'))) {
      console.log(`Setting strongest relationship for ${rel.id} to ${rel.type}`);
      ticketRelationships.set(rel.id, rel);
    }
  }
  
  console.log('Filtered relationships:', Array.from(ticketRelationships.values()));
  return ticketRelationships;
}

// New function to clean up relationships before saving
export function cleanupRelationships(relationships) {
  console.log('Cleaning up relationships:', relationships);
  const ticketRelationships = filterDuplicateRelationships(relationships);
  const result = Array.from(ticketRelationships.values());
  console.log('Cleanup complete, returning:', result);
  return result;
}
