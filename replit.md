# Overview

This is a work time management system for tracking employee hours, generating reports, and managing payroll. The application is built as a full-stack web application with a React frontend and Express.js backend, designed for managers to track employee attendance, work hours, and quality ratings across different time periods.

## Recent Changes (August 21, 2025)

### Completed Timesheet Module Features
- **Full CRUD Operations**: Create, read, update, and delete time entries with proper validation
- **Smart Cell Management**: 
  - Future dates are automatically locked (non-editable)
  - Terminated employees show "У" status after termination date
  - Cells are clickable for editing with real-time validation
- **Data Entry Validation**: 
  - Accepts 1-24 hours or status letters (О, Б, НН, У)
  - Automatic uppercase conversion for status letters
  - Default quality score of 3 for numeric entries
- **Bulk Operations**:
  - "Clear All" button removes all data from current reporting period (except future dates)
  - Right-click context menu with advanced operations
- **Context Menu Functions**:
  - Clear entire employee row
  - Fill to end of period using source cell value
  - Fill with 5/2 schedule (weekdays only) using source cell value
  - Fill with 2/2 schedule (alternating work/rest) using source cell value
  - Quality score adjustment for numeric values (1-4 scale)
- **Color-coded Interface**: Quality-based cell coloring and status-specific highlighting
- **Responsive Design**: Compact single-screen layout without scrollbars

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for build tooling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for authentication state with persistence
- **Data Fetching**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Data Storage**: In-memory storage implementation with interface for future database integration
- **Authentication**: Session-based authentication without external dependencies

## Database Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling via @neondatabase/serverless

## Key Design Patterns
- **Shared Schema**: Common TypeScript types and validation schemas between client and server
- **Repository Pattern**: Storage interface abstraction allowing for different implementations
- **Component Composition**: Reusable UI components with consistent styling
- **Form Validation**: Zod schemas for both client and server-side validation
- **Error Boundaries**: Comprehensive error handling with toast notifications

## Data Models
- **Users**: Authentication and role-based access (admin/admin login)
- **Employees**: Staff records with status tracking (active, not_registered, fired) and termination dates
- **Time Entries**: Daily work hours with quality ratings (1-4 scale) and day types (work, О, Б, НН, У)
- **Reports**: Generated payroll reports with advance/salary distinction
- **Settings**: Application configuration storage

## Key Business Logic
- **Timesheet Rules**:
  - Current reporting period: August 2025 (editable)
  - Future dates automatically locked for data entry
  - Terminated employees show automatic "У" status after termination
  - Quality scoring: 1=Poor, 2=Satisfactory, 3=Good (default), 4=Excellent
  - Status codes: О=Vacation, Б=Sick leave, НН=Non-working day, У=Terminated
- **Bulk Fill Operations**:
  - All operations use source cell value (not hardcoded values)
  - 5/2 schedule fills weekdays only
  - 2/2 schedule alternates 2 work days / 2 rest days
  - Fill to end applies from selected date to month end

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database queries and migrations

## UI Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Server-side bundling for production

## Utility Libraries
- **TanStack Query**: Server state synchronization
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **date-fns**: Date manipulation utilities
- **Zustand**: Lightweight state management

## Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling integration