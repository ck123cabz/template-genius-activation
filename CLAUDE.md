# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package Manager**: Use `pnpm` exclusively for all operations:

```bash
pnpm dev          # Start development server (Next.js 15.2.4)
pnpm build        # Build production application
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm install      # Install dependencies
```

**Docker Development**: This project is fully containerized with Docker support for development:

```bash
# Using Docker Compose (recommended)
docker-compose up              # Build and start dev server
docker-compose up --build      # Rebuild and start dev server
docker-compose down            # Stop and remove containers

# Using Docker directly
docker build -t template-genius .     # Build image
docker run -p 3000:3000 -v $(pwd):/app template-genius  # Run with volume mount
```

**Docker Features**:

- **Containerized Development**: Full development environment in Docker
- **Hot Reload**: Enabled with volume mounting for live code changes
- **Node.js 22 Alpine**: Optimized base image for performance
- **Port Mapping**: Development server runs on port 3000 (mapped to host)
- **Dependency Management**: Automatic pnpm dependency installation
- **Volume Mounting**: Source code changes reflect immediately in container
- **Multi-stage Build**: Optimized for both development and production

**Docker Configuration**:

- `Dockerfile`: Multi-stage build with development and production targets
- `docker-compose.yml`: Development environment with volume mounting
- `.dockerignore`: Excludes unnecessary files from build context

**Why Docker?**: Docker ensures consistent development environments across all machines, eliminates "works on my machine" issues, and provides production-like environment for testing.

**Important**: This project has linting and TypeScript errors disabled during builds (`ignoreDuringBuilds: true` and `ignoreBuildErrors: true` in next.config.mjs). However, you should still fix any errors when modifying code.

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript with React 19
- **Styling**: Tailwind CSS 4.1.9 with PostCSS
- **UI Components**: Comprehensive Radix UI primitives + Shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Fonts**: Geist Sans & Geist Mono from Google Fonts
- **Icons**: Lucide React

### Project Structure

**App Router Structure** (`/app/`):

- Root page (`page.tsx`) redirects to `/dashboard`
- Main dashboard at `/dashboard/page.tsx` - the core application interface
- Client activation flow at `/activate/[token]/page.tsx`
- Additional pages: `/agreement`, `/confirmation`, `/processing`
- Multi-position sample at `/activate/multi-position-sample`

**Component Architecture** (`/components/`):

- `ui/` - Complete Shadcn component library (40+ components)
- `theme-provider.tsx` - Next-themes integration
- All UI components use class-variance-authority (CVA) for variant management
- Components follow Radix UI + Tailwind CSS pattern

**Key Architecture Decisions**:

1. **Client-side state management**: Uses React state with no external state library
2. **Styling approach**: Utility-first with Tailwind + semantic color system
3. **Component composition**: Radix primitives + custom styling via CVA
4. **Form handling**: React Hook Form with Zod schema validation

### Application Logic

**Core Application**: Priority Access Dashboard for client activation management

- **Dashboard** (`/app/dashboard/page.tsx`):
  - **Client Management**: Create, edit, filter, and search client records
  - **Content Management System**: Full-featured CMS for activation page customization
  - **Preview Functionality**: Live preview of activation pages with current content
  - **Supabase Integration**: Data persistence for both clients and content
  - **Statistics Dashboard**: Real-time metrics and conversion tracking
  - **Tabbed Interface**: Organized UI for clients vs content management

**Content Management Features**:

- **Dynamic Content Editing**: Title, subtitle, benefits, payment options, investment details
- **Tabbed Content Editor**: Organized into Main Content, Benefits, Payment, and Details tabs
- **Live Preview**: Real-time preview panel and full-page preview at `/activate/preview`
- **Form Validation**: Proper validation states and error handling
- **Toast Notifications**: User feedback for save operations
- **Supabase Persistence**: Content changes saved to database

**Data Flow**:

- Mock client data structure with company info, contact details, status
- Local state management for client list and content editing
- Activation link generation based on client ID
- Content editing system for customizing activation page text

**Key Features**:

- Client creation and status tracking
- Dynamic content editing for activation pages
- Statistics dashboard (total, activated, pending, conversion rates)
- Activation link copying functionality

### Utilities & Helpers

**`/lib/utils.ts`**: Contains the essential `cn()` utility for className merging using clsx + tailwind-merge.

**Path Aliases**: Uses `@/*` alias pointing to project root for imports.

## Development Guidelines

### Styling Conventions

- Use the `cn()` utility for conditional className merging
- Follow Shadcn component patterns for new UI elements
- Leverage Tailwind's design tokens and color system
- All components should support dark/light mode theming

### Component Development

- New UI components should extend existing Radix/Shadcn patterns
- Use CVA for component variants and sizing
- Follow the established component composition pattern
- Maintain accessibility standards (Radix provides this foundation)

### State Management

- This is a client-side only application ("use client" components)
- Use React's built-in state management (useState, useEffect)
- No external state management library is needed for current scope
- Form state handled by React Hook Form

### Image Handling

Images are currently unoptimized (`unoptimized: true` in next.config.mjs) and use external URLs or placeholder SVGs.

### Mock Data Pattern

The application uses in-component mock data with realistic business logic. When adding features, follow the established pattern of:

1. Define TypeScript interfaces for data structures
2. Create mock data that represents realistic business scenarios
3. Implement local state management for data manipulation
