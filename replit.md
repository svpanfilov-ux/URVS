# Overview

This project is a comprehensive workforce management system (УРВС - Управление Рабочим Временем Сотрудников) designed for enterprise-level payroll and time tracking, featuring a multi-role architecture. It supports four distinct user roles with role-based access control and data segregation, aiming to streamline workforce management, improve payroll accuracy, and provide robust analytics for financial oversight. The system's vision is to offer an integrated solution for managing employees, staffing, timesheets, and reports efficiently across various organizational levels.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for authentication state with persistence, TanStack Query for server state
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Data Storage**: In-memory storage with an interface for future database integration

## Database Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Connection pooling via @neondatabase/serverless

## Key Design Patterns
- **Shared Schema**: Common TypeScript types and validation schemas between client and server
- **Repository Pattern**: Storage interface abstraction
- **Component Composition**: Reusable UI components
- **Form Validation**: Zod schemas for client and server-side validation
- **Error Boundaries**: Comprehensive error handling with toast notifications

## Core Features and System Design
- **Multi-Role Architecture**: Supports HR Economist, Director, Object Manager, and Group Manager roles with distinct access levels and views.
- **Role-Based Access Control**: Dynamic navigation filtering and data segregation based on user permissions (e.g., Object Manager limited to assigned object, HR Economist with full system access).
- **Authentication System**: Interactive login interface with visual role cards, real-time validation, and Zustand for state management with localStorage persistence.
- **Timesheet Module**: Full CRUD operations for time entries, smart cell management (future date locking, terminated employee status), data entry validation (hours or status letters), bulk operations, and context menus. Includes section-based layout (Active Employees, Contract Work) with subtotals, planned hours calculation, and management of fired employees with visual indicators.
- **Employee Management Module**: Unified table view for all employees, status filtering, search, status badges, and CSV import/export.
- **Staffing Schedule Module**: Tabular display of positions per shift, enhanced statistics, and position management.
- **Analytics Dashboard**: Financial metrics for executives (Director, HR Economist) including object performance, budget vs. actual comparisons, employee efficiency tracking, real-time deadline calculations, and dynamic statistics (monthly norm hours, actual hours, deviation). Features detailed employee statistics (Active, Fired, Contract Workers, Newly Hired) with percentages.
- **UI/UX Decisions**: Responsive design, dark theme support, color-coded interfaces (e.g., timesheet cell quality, employee status badges), and consistent styling using shadcn/ui.
- **Data Models**: Users (authentication, roles), Employees (records, status, termination dates), Time Entries (daily hours, quality ratings, day types), Reports (payroll reports), Settings (application configuration).
- **Business Logic Highlights**:
    - Timesheet rules: current reporting period editable, future dates locked, automatic "У" status post-termination, quality scoring (1-4), status codes (О, Б, НН, У).
    - Bulk fill operations based on source cell values and employee work schedules (e.g., 5/2, 2/2).

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database queries and migrations

## UI Libraries
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Server-side bundling

## Utility Libraries
- **TanStack Query**: Server state synchronization
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **date-fns**: Date manipulation utilities
- **Zustand**: Lightweight state management

## Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling integration