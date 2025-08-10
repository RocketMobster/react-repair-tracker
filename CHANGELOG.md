# Changelog
## [0.4.0] - 2025-08-08
### Added

### Fixed

### Notes


# Changelog
- Phone extension fields for all phone numbers (edit and display)
- Date fields now use proper date pickers in all forms
- UI polish: consistent field grouping, colored backgrounds, and improved layout
### Notes

# Admin Backend TODO
- User/role management: add admin, staff, and custom roles; restrict sensitive actions (delete, schema changes) to admins
- Customizable form schemas: allow admin to edit ticket/customer form fields, types, and validation rules
- RMA number schema: allow client to set RMA number length (8-15), composition (numeric or alphanumeric), and first two fixed letters (prefix); expose settings in admin UI and persist for ticket creation; allow preview of RMA format
- Ticket status and workflow customization: admin can define custom ticket statuses and allowed transitions
- Data export/import: CSV/Excel export for tickets/customers, import for bulk onboarding
- Audit log: track admin actions (deletes, edits, schema changes)
- Branding: allow admin to upload logo, set business info, and customize PWA appearance
- Backup/restore: admin can trigger backup and restore of all data
- Advanced search/filter: admin UI for searching/filtering tickets and customers by any field
- Localization/regional settings: admin can set default date format (e.g., mm-dd-yyyy, dd-mmm-yyyy, mm/dd/yy) and phone number format (US/UK/other) for all forms and displays; settings applied app-wide

# Other admin-controlled features discussed today:
- Schema-driven form editor: allow admin to add/remove/move date/signature/notes fields for ticket workflow steps (e.g., Reception, Inspection, Repaired, Shipped, etc.)
- Kanban board configuration: admin can enable/disable Kanban board, set default columns/statuses, and control drag/drop permissions


# Changelog
## [0.2.1] - 2025-07-29
### Added
- RMA number generation for tickets: user-facing RMA number (default: 'ra' + 8 random alphanumeric characters) is now shown as the main ticket number, with internal ticket ID shown in smaller font
- RMA number generator utility supports customizable prefix, length, and charset (numeric or alphanumeric) for future admin configuration

### Fixed
- Bulletproofed customer/ticket deletion and navigation to prevent infinite update loops and errors

### Notes
- Admin backend TODO: Add settings for RMA number schema (see above)


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-07-28
### Added
- Ticket details view and update workflow (ticket details route, view, and navigation)
- Customer slug in ticket URLs for improved readability
- Persistence for tickets and customers (localStorage via Zustand persist)
- Duplicate customer prevention (case-insensitive, trimmed business name)
- Roadmap and changelog updated to reflect new features and next steps

### Fixed
- Race condition on ticket/customer creation and navigation
- Ticket/customer not found after creation (lookup order and state update sequencing)
- Ticket view styling (centered card, improved details)

### Notes
- Ticket URL routing feature branch ready to merge
- Next: Customer record management (delete, admin controls) and finish schema-driven forms
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-07-27
### Added
- Initial project scaffold with React, Vite, and Tailwind CSS (v3)
- Zustand for global state management
- React Router for navigation
- vite-plugin-pwa for PWA support
- Customer management UI: add, search, edit, details
- Ticket creation logic on customer add
- Ticket history and status display per customer

### Fixed
- Tailwind v4+ integration issues by downgrading to v3
- PostCSS config for Tailwind v3
- Infinite render loop in CustomerDetails by moving filtering logic outside Zustand selector
- Removed test yellow background from index.css

### Notes
- Ready for version control and GitHub integration
- Next: Implement ticket details view and update workflow
