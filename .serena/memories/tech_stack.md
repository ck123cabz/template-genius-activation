# Technology Stack

## Core Framework
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5.7** - Type-safe development with strict mode enabled
- **Node.js 22+** - Runtime requirement (Alpine-based Docker)

## Styling & UI
- **Tailwind CSS 4.1.9** - Utility-first CSS framework with PostCSS
- **Shadcn/ui** - Comprehensive component library (40+ components)
- **Radix UI** - Accessibility-first primitives (20+ components)
- **Class Variance Authority (CVA)** - Component variant management
- **Geist Sans & Geist Mono** - Google Fonts integration
- **Lucide React** - Icon system
- **Next Themes** - Dark/light mode support

## Forms & Validation
- **React Hook Form** - Performance-optimized form handling
- **Zod** - Runtime validation and type safety
- **@hookform/resolvers** - Schema integration

## Data Layer
- **Supabase** - PostgreSQL database with real-time features
- **Mock Data System** - Local development fallback
- **localStorage** - Client-side caching

## Testing Tools
- **Playwright MCP** - Browser automation and testing via MCP server
  - Browser control and navigation
  - Screenshot capture and visual testing
  - Form interaction and validation testing
  - Accessibility tree snapshots
  - Console and network monitoring
  - Cross-browser testing capabilities

## Development Tools
- **Docker** - Containerized development environment
- **pnpm** - Fast, efficient package manager
- **ESLint & TypeScript** - Code quality (currently disabled in build)
- **PostCSS** - CSS processing
- **MCP Servers** - Multiple Model Context Protocol servers
  - Playwright MCP for browser automation
  - IDE MCP for code diagnostics
  - Serena MCP for project memory and navigation

## Additional Libraries
- **date-fns** - Date manipulation
- **sonner** - Toast notifications
- **cmdk** - Command palette
- **vaul** - Mobile drawer component
- **react-day-picker** - Date selection
- **react-resizable-panels** - Layout panels
- **recharts** - Data visualization
- **embla-carousel-react** - Touch-friendly carousels