# Code Style & Conventions

## TypeScript Configuration
- **Strict Mode Enabled** - Full TypeScript strict checking
- **Path Aliases**: `@/*` points to project root
- **Target**: ES6 with modern JavaScript features
- **Module Resolution**: Bundler-based (Next.js optimized)

## Component Architecture
- **Pattern**: Radix UI primitives + Tailwind CSS styling
- **Variant Management**: Class Variance Authority (CVA) for component variants
- **Composition**: Slot-based component composition with `@radix-ui/react-slot`
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Exports**: Named exports preferred for components

## Styling Conventions
- **Utility Function**: `cn()` utility for className merging (clsx + tailwind-merge)
- **Component Pattern**: 
  ```typescript
  const Component = ({ className, variant, size, ...props }) => {
    return <Primitive className={cn(variants({ variant, size, className }))} {...props} />
  }
  ```
- **Theme Support**: All components support dark/light mode via Tailwind variants
- **Responsive**: Mobile-first approach with Tailwind breakpoints

## File Organization
```
components/
├── ui/                 # Shadcn component library
├── theme-provider.tsx  # Theme context
app/
├── dashboard/          # Admin interface
├── activate/           # Client activation flow
├── actions/           # Server actions
├── layout.tsx         # Root layout
lib/
├── utils.ts           # cn() utility and helpers
├── supabase.ts        # Database client
```

## Code Patterns
- **Client Components**: Uses "use client" directive for interactivity
- **State Management**: React built-in hooks (useState, useEffect)
- **Form Handling**: React Hook Form + Zod validation
- **Error Handling**: Basic error boundaries and loading states
- **Data Flow**: Local state management with mock data fallback

## Import Conventions
- **Absolute Imports**: Use `@/` prefix for internal modules
- **Component Imports**: Import UI components from `@/components/ui/`
- **Utility Imports**: Import `cn` from `@/lib/utils`
- **External Libraries**: Standard npm imports

## Development Notes
- **Build Configuration**: ESLint and TypeScript errors ignored during build
- **Image Handling**: Unoptimized images (development mode)
- **Client-Side Only**: No server-side rendering for dynamic content