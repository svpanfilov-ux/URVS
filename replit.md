# Overview

This project is a comprehensive workforce management system (УРВС - Управление Рабочим Временем Сотрудников) designed for enterprise-level payroll and time tracking, featuring a multi-role architecture. It supports four distinct user roles with role-based access control and data segregation, aiming to streamline workforce management, improve payroll accuracy, and provide robust analytics for financial oversight. The system's vision is to offer an integrated solution for managing employees, staffing, timesheets, and reports efficiently across various organizational levels.

## Data Import Status ✅
- **Objects**: Imported and stored (multiple organizational units including ПортЭнерго)
- **Staffing Schedule**: Complete import with positions, rates, and work schedules
- **Employees**: Full employee records with object assignments
- **Timesheet Data**: Time entries with hours and quality ratings populated
- **Test Object**: ПортЭнерго configured as primary test object for manager role testing

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
- **Role-Based Access Control**: Dynamic navigation filtering and data segregation based on user permissions:
  - **Object Manager**: Limited to assigned object data only across all modules (employees, staffing, timesheet)
  - **HR Economist**: Full system access to all objects and comprehensive ФОТ analytics
  - **Director**: Executive-level analytics and reporting
  - **Group Manager**: Team-specific access and management functions
- **Authentication System**: Interactive login interface with visual role cards, real-time validation, and Zustand for state management with localStorage persistence.
- **Employee Assignment System**: Two-type employee assignment with automatic data population:
  - **Active (штатный)**: Occupies vacancy from staffing schedule, reduces vacancy count, participates in planned and actual payroll
  - **Part-time (подработчик)**: Does not occupy vacancy, counted only in actual payroll
  - **Auto-fill from positions**: Work schedule, payment type, and salary/rate automatically populated from selected position
  - **Role-based access**: Managers can add only to their object, economists to any object
  - **Position validation**: Only positions from staffing schedule can be selected
- **Timesheet Module**: Full CRUD operations for time entries, smart cell management (future date locking, terminated employee status), data entry validation (hours or status letters), bulk operations, and context menus. Includes section-based layout (Active Employees, Contract Work) with subtotals, planned hours calculation, and management of fired employees with visual indicators.
- **Employee Management Module**: Unified table view for all employees with integrated vacancy tracking, status filtering, search, status badges, and CSV import/export. Assignment form with object selection, position picker from staffing schedule, automatic data population (work schedule, payment type, rates), and role-based access control.
- **Staffing Schedule Module**: Tabular display of positions per shift, enhanced statistics, and position management.
- **Analytics Dashboard**: 
  - **For Economists**: Comprehensive ФОТ analytics with graphical visualization (planned vs actual payroll, employee status distribution, hours comparison charts)
  - **For Managers**: Object-specific statistics, staff positions, and vacancy tracking
  - **Financial Metrics**: Budget vs. actual comparisons, employee efficiency tracking, dynamic statistics (monthly norm hours, actual hours, deviation)
  - **Visual Components**: Recharts integration for bar charts, pie charts, and progress indicators
- **UI/UX Decisions**: Responsive design, dark theme support, color-coded interfaces (e.g., timesheet cell quality, employee status badges), and consistent styling using shadcn/ui.
- **Data Models**: Users (authentication, roles), Employees (records, status, termination dates, payment info from positions), Time Entries (daily hours, quality ratings, day types), Reports (payroll reports), Settings (application configuration), Positions (staffing schedule with payment details).
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