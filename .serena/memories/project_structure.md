# Project Structure Guide

## Root Directory Structure
```
template-genius-activation/
├── app/                    # Next.js 15 App Router
├── components/             # React components
├── lib/                   # Utilities and services
├── supabase/             # Database schemas and migrations
├── docs/                 # Project documentation
├── public/               # Static assets
├── styles/               # Global styles (likely globals.css)
├── .bmad-core/           # BMAD agent system files
├── package.json          # Dependencies and scripts
├── next.config.mjs       # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── Dockerfile            # Container configuration
├── docker-compose.yml    # Development environment
└── CLAUDE.md            # Development instructions
```

## App Router Structure (`/app/`)
```
app/
├── page.tsx              # Root page (redirects to dashboard)
├── layout.tsx            # Root layout with theme providers
├── globals.css           # Global styles
├── dashboard/            # Admin interface
│   ├── page.tsx         # Main dashboard component
│   ├── loading.tsx      # Loading UI
│   └── components/      # Dashboard-specific components
│       ├── ClientList.tsx
│       └── ContentEditor.tsx
├── activate/            # Client activation flow
│   ├── [token]/         # Dynamic activation pages
│   │   └── page.tsx
│   ├── preview/         # Content preview
│   │   └── page.tsx
│   └── multi-position-sample/
│       └── page.tsx
├── actions/             # Server actions
│   ├── client-actions.ts
│   └── content-actions.ts
├── agreement/           # Terms and conditions
│   └── page.tsx
├── confirmation/        # Post-payment confirmation
│   └── page.tsx
└── processing/          # Payment processing
    └── page.tsx
```

## Components Structure (`/components/`)
```
components/
├── theme-provider.tsx    # Next-themes integration
└── ui/                  # Shadcn/ui component library (40+ components)
    ├── button.tsx       # Button with variants
    ├── card.tsx         # Card layouts
    ├── dialog.tsx       # Modal dialogs
    ├── form.tsx         # Form components
    ├── input.tsx        # Input fields
    ├── tabs.tsx         # Tabbed interfaces
    ├── toast.tsx        # Notifications
    └── ...              # 30+ more UI primitives
```

## Library Structure (`/lib/`)
```
lib/
├── utils.ts             # cn() utility and helpers
├── supabase.ts          # Client-side Supabase client
└── supabase-server.ts   # Server-side Supabase client
```

## Data Layer (`/supabase/`)
```
supabase/
├── schema.sql           # Database schema
├── supabase-schema.sql  # Extended schema
├── supabase-migration.sql
├── supabase-add-fields.sql
└── complete-supabase-migration.sql
```

## Key Application Flow
1. **Entry Point**: `/` redirects to `/dashboard`
2. **Dashboard**: Admin interface for client and content management
3. **Activation Flow**: `/activate/[token]` for client activation
4. **Preview System**: `/activate/preview` for content preview
5. **Supporting Pages**: Agreement, confirmation, processing

## Component Architecture Patterns
- **UI Components**: Radix primitives + Tailwind styling
- **Layout Components**: Next.js App Router layouts
- **Feature Components**: Dashboard-specific functionality
- **Utility Components**: Theme provider, error boundaries

## Configuration Files
- **next.config.mjs**: Disables linting/TypeScript errors in build
- **tsconfig.json**: Strict TypeScript with path aliases (@/*)
- **package.json**: pnpm-based dependency management
- **Dockerfile**: Node.js 22 Alpine with pnpm
- **docker-compose.yml**: Development environment setup