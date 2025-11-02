# Overview

This project is a comprehensive workforce management system (УРВС - Управление Рабочим Временем Сотрудников) designed for enterprise-level payroll and time tracking. It features a multi-role architecture supporting four distinct user roles with role-based access control and data segregation. The system aims to streamline workforce management, improve payroll accuracy, and provide robust analytics for financial oversight, offering an integrated solution for managing employees, staffing, timesheets, and reports efficiently across various organizational levels.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for authentication, TanStack Query for server state
- **UI Components**: shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API Design**: RESTful API with JSON
- **Data Storage**: PostgreSQL via Drizzle ORM (with MemStorage fallback)

## Database Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Connection pooling via @neondatabase/serverless

## Key Design Patterns
- **Shared Schema**: Common TypeScript types and validation schemas
- **Repository Pattern**: Storage interface abstraction
- **Component Composition**: Reusable UI components
- **Form Validation**: Zod schemas for client and server-side validation
- **Error Boundaries**: Comprehensive error handling with toast notifications

## Core Features and System Design
- **Multi-Role Architecture**: Supports HR Economist, Director, Object Manager, and Group Manager roles with distinct access levels and views.
- **Role-Based Access Control**: Dynamic navigation filtering and data segregation.
    - **Object Manager**: Limited to assigned object data.
    - **HR Economist**: Full system access, comprehensive analytics.
    - **Director**: Executive-level analytics and reporting.
    - **Group Manager**: Team-specific access.
- **Authentication System**: Interactive login with role cards, real-time validation, and Zustand for state management with localStorage persistence.
- **Employee Assignment System**: Supports Active (штатный) and Part-time (подработчик) employees, with auto-population of work schedules, payment types, and rates from selected positions.
- **Timesheet Module**: Full CRUD for time entries, smart cell management (future date locking, terminated employee status), data entry validation, bulk operations, and context menus. Includes period management (close/reopen), visual indicators for status, and section-based layout.
- **Employee Management Module**: Unified table view with vacancy tracking, filtering, search, status badges, CSV import/export, and a role-based assignment form.
- **Staffing Schedule Module**: Tabular display of positions per shift, enhanced statistics, and position management.
- **Analytics Dashboard**: Comprehensive ФОТ analytics for Economists (planned vs actual payroll, charts) and object-specific statistics for Managers.
- **UI/UX Decisions**: Responsive design, dark theme support, color-coded interfaces, and consistent styling using shadcn/ui.
- **Reports Module for Managers**: Month-based report generation with period status validation and approval workflow (Draft → Requested → Submitted → Approved/Rejected). Includes payroll calculations, payment method splitting, and employee filtering.
- **Reports Control Module for Economists**: Comprehensive report management across all objects, with a control table, status-based actions (Request, Reject, Approve), timesheet lock/unlock logic, and deadline validation.
- **Data Models**: Users, Employees, Time Entries, Reports, TimesheetPeriods, Settings, Positions.
- **Business Logic Highlights**: Timesheet rules include editable current reporting period, locked future dates, automatic "У" status post-termination, quality scoring, status codes, and bulk fill operations based on work schedules.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting

## UI Libraries
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Static type checking

## Utility Libraries
- **TanStack Query**: Server state synchronization
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **date-fns**: Date manipulation utilities
- **Zustand**: Lightweight state management