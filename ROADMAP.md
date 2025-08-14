## Admin Panel TODOs (Planned & In Progress)

- [x] Kanban column label customization (allow admin to rename columns)
- [x] Kanban column actions: add/remove/reorder columns, WIP limits, admin-only
- [x] Safety net for column delete: tickets moved to Holding column, cannot delete Holding with tickets
- [x] Drag-and-drop: robust, smooth, cross-column, drop indicators, stable hooks
- [ ] Plugin system for extensibility (widgets, dashboard, integrations)
- [ ] Role/permission management UI
- [ ] User management (add/edit users, assign roles)
- [ ] Custom statuses and workflow configuration
- [ ] Admin UI for managing form fields and templates
- [ ] Dashboard customization (widgets, plugin support, layout)
- [ ] Audit logs for admin actions
- [ ] Advanced builder features (conditional logic, grouping, undo/redo, etc.)
- [ ] Accessibility and help system improvements
- [ ] Documentation and admin guide links
- [ ] Field grouping and section management
- [ ] Ticket form and workflow customization
- [ ] UI/UX polish for admin tools

# RepairTracker Pro – Project Roadmap

## Overview
RepairTracker Pro is a React + Vite + Tailwind CSS Progressive Web App (PWA) for streamlined repair tracking and returns management. It features robust customer and ticket management, a role-based system, and plugin-friendly architecture.

---

## Roadmap

### 1. Foundation & Setup
- [x] Scaffold React + Vite + Tailwind CSS project
- [x] Configure Tailwind CSS (v3 for stability)
- [x] Set up Zustand for global state management
- [x] Integrate React Router for navigation
- [x] Add vite-plugin-pwa for PWA support

### 2. Core Features: Customer & Ticket Management
### 3. Core Lists & Boards
- [ ] Searchable, alphabetized customer list page
    - Dedicated page listing all customers in alphabetical order with search and filter options.
- [ ] Global ticket list/search page
    - Page listing all tickets (active and closed), searchable by RMA number, company name, or ticket number.
- [ ] Kanban board for ticket prioritization
    - Drag-and-drop Kanban board for ticket workflow, status management, and prioritization. Enterprise-level feature for real-time ticket management.
    - [x] Card details preview (quick view/hover) with robust attachment and ticket info rendering (v0.6.0)
    - [x] Ticket relationship management (parent/child/sibling/related, deduplication, error guards, add/search/remove UI) (v0.6.0)
    - [x] External links for tickets (v0.6.0)
    - [x] Group color system for related tickets (v0.7.0)
      - [x] Deduplicate group color pills display
      - [x] Group Color button for bulk color assignment
      - [x] Clear Groups button for removing group colors
      - [x] Fix color assignment on edit cancel
      - [x] Consistent group ID generation
    - [x] Restore-to-board tool for RMAs (dev/admin tool) (v0.6.0)
    - [x] Custom field saving and display fixes (v0.6.0)



### 3. Advanced Features

- [ ] Admin-editable field groups for ticket/customer forms and details views
    - Allow clients to define custom groupings of fields (with label, color, and order) from the admin backend for both forms and details views. This enables highly flexible, industry-specific UI layouts.

- [ ] Usage logs for admin backend
    - Secure log files are generated whenever a customer is entered (with a repair ticket/RMA number), when additional tickets/RMA numbers are added for existing customers, when customers or tickets are deleted, and when tickets or customers are edited.
    - Each log entry records the date, time, user, and operation performed.


### 4. UI/UX & PWA Polish
- [x] Major Kanban/ticket/attachment UI/UX improvements (v0.5.0)
- [ ] Responsive, modern UI with Tailwind
- [ ] PWA manifest and icons
- [ ] Offline support and caching
- [ ] Accessibility improvements

### 5. Testing & Deployment
- [ ] Unit and integration tests
- [ ] CI/CD setup
- [ ] GitHub repository and version control
- [ ] Deployment (Netlify, Vercel, etc.)

---



## Completed in v0.3.0
- Schema-driven customizable forms (dynamic form rendering from config/schema)
- Customer record management (delete, admin controls, ticket cascade delete)
- Ticket details view and update workflow (details view, update, grouping, colored boxes)
- Phone number input masking and extension support in all forms
- Date pickers for all date fields
- UI polish: consistent grouping, colored backgrounds, improved layout
- Roadmap, PRD, and changelog updated

## Notes
- Version bumped to 0.3.0 for schema-driven forms, extensibility, and UI/UX improvements
- Version control and GitHub integration to begin next session.
- All major setup and initial workflows are complete; focus now shifts to ticket workflow and advanced features.
