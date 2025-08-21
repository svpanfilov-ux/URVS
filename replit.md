# Overview

This is a work time management system for tracking employee hours, generating reports, and managing payroll. The application is built as a full-stack web application with a React frontend and Express.js backend, designed for managers to track employee attendance, work hours, and quality ratings across different time periods.

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
- **Users**: Authentication and role-based access
- **Employees**: Staff records with status tracking (active, not_registered, fired)
- **Time Entries**: Daily work hours with quality ratings and special day types
- **Reports**: Generated payroll reports with advance/salary distinction
- **Settings**: Application configuration storage

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