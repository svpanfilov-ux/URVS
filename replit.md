# Overview

This project is a comprehensive workforce management system (УРВС - Управление Рабочим Временем Сотрудников) designed for enterprise-level payroll and time tracking, featuring a multi-role architecture. It supports four distinct user roles with role-based access control and data segregation, aiming to streamline workforce management, improve payroll accuracy, and provide robust analytics for financial oversight. The system's vision is to offer an integrated solution for managing employees, staffing, timesheets, and reports efficiently across various organizational levels.

## Data Import Status ✅
- **Objects**: Imported and stored (multiple organizational units including ПортЭнерго)
- **Staffing Schedule**: Complete import with positions, rates, and work schedules
- **Employees**: Full employee records with object assignments
- **Timesheet Data**: Time entries with hours and quality ratings populated
- **Test Object**: ПортЭнерго configured as primary test object for manager role testing

## Recent Fixes (November 2, 2024)
- **Employee Filtering in Reports**: Fixed issue where fired employees appeared in reports - now only active employees with valid data are included
- **Report Status Synchronization (Critical Fix)**: Fixed economist reports control component not fetching period data due to incorrect auth token retrieval
  - **Root Cause**: Component was looking for token under wrong localStorage key (`"auth_token"` instead of `"auth-storage"`)
  - **Solution**: Updated to use correct Zustand auth storage: `const authStorage = localStorage.getItem('auth-storage'); const token = authStorage ? JSON.parse(authStorage).state?.token : null;`
  - **Additional Fix**: Removed `enabled: objects.length > 0` condition that blocked query execution, replaced with early return in queryFn
  - **Result**: Economist now sees updated report statuses immediately after manager submission with proper cache invalidation

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
  - **Period Management**: Managers can close/reopen timesheet periods. Closed periods lock all cells (read-only with gray background). Only current/past months can be closed. Approved reports prevent period reopening.
  - **Visual Indicators**: Status badges show period state ("Период закрыт", "Отчёт утверждён"). Lock icons on buttons indicate period closure.
- **Employee Management Module**: Unified table view for all employees with integrated vacancy tracking, status filtering, search, status badges, and CSV import/export. Assignment form with object selection, position picker from staffing schedule, automatic data population (work schedule, payment type, rates), and role-based access control.
- **Staffing Schedule Module**: Tabular display of positions per shift, enhanced statistics, and position management.
- **Analytics Dashboard**: 
  - **For Economists**: Comprehensive ФОТ analytics with graphical visualization (planned vs actual payroll, employee status distribution, hours comparison charts)
  - **For Managers**: Object-specific statistics, staff positions, and vacancy tracking
  - **Financial Metrics**: Budget vs. actual comparisons, employee efficiency tracking, dynamic statistics (monthly norm hours, actual hours, deviation)
  - **Visual Components**: Recharts integration for bar charts, pie charts, and progress indicators
- **UI/UX Decisions**: Responsive design, dark theme support, color-coded interfaces (e.g., timesheet cell quality, employee status badges), and consistent styling using shadcn/ui.
- **Reports Module for Managers**: Month-based report generation with period status validation:
  - **Month Selector**: Choose reporting period from last 12 months
  - **Status-Based Workflow**: 
    - Period NOT closed → Shows warning "Период не закрыт. Закройте табель, чтобы сформировать отчёт" and disables report generation
    - Period closed, no report → Shows "Готов к формированию" with enabled report button
    - Report submitted → Shows "Отчёт отправлен" with approval pending status
    - Report approved → Shows "Отчёт утверждён" with read-only mode, prevents editing
  - **Report Generation**: Creates timesheet report with per-employee payroll calculations, payment method splitting (card/ledger), and period splitting (advance/salary)
  - **Employee Filtering**: Only active employees (status="active") with valid objectId, name, and ID are included in reports
  - **Approval Workflow**: Draft → Requested → Submitted → Approved/Rejected states with status badges
- **Reports Control Module for Economists**: Comprehensive report management across all objects:
  - **Control Table**: Summary view of all objects with timesheet and report statuses
  - **Report Statuses**: Not formed, Formed (not sent), Requested, Submitted (awaiting review), Rejected, Approved
  - **Economist Actions**:
    - "Request Report" button: Available for not formed or draft reports, updates status to "requested"
    - "Reject" button: Available for submitted reports, opens modal for mandatory rejection comment
    - "Approve" button: Available for submitted reports, locks timesheet permanently
  - **Timesheet Lock/Unlock Logic**:
    - Rejection → Reopens timesheet for editing (status = "open"), stores rejection comment and metadata
    - Approval → Locks timesheet permanently (status = "closed"), prevents further edits
  - **Deadline Validation**: Highlights overdue reports (past last day of month) with yellow background and warning icon
  - **Visual Indicators**: Color-coded status badges (gray/orange/blue/red/green), icons for timesheet/report states, deadline warnings
  - **Workflow Synchronization**: Manager submission automatically updates timesheetPeriods.reportStatus to "submitted", enabling economist review with proper cache invalidation
- **Data Models**: Users (authentication, roles), Employees (records, status, termination dates, payment info from positions), Time Entries (daily hours, quality ratings, day types), Reports (payroll reports), TimesheetPeriods (period status tracking: open/closed, report status: draft/submitted/approved/rejected), Settings (application configuration), Positions (staffing schedule with payment details).
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