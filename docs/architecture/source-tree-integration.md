# Source Tree Integration

## Existing Project Structure
```
template-genius-activation/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx                 # Enhanced with version analytics tab
│   │   └── components/
│   │       ├── ClientList.tsx       # Enhanced with version history display
│   │       └── ContentEditor.tsx    # Enhanced with learning capture
│   ├── actions/
│   │   ├── client-actions.ts        # Enhanced with createClientWithFirstVersion
│   │   ├── content-actions.ts       # Enhanced with version management
│   │   └── learning-actions.ts      # New - Learning workflow actions
│   └── api/webhooks/stripe/
│       └── route.ts                 # New - Stripe webhook handler
├── components/ui/                   # Existing 40+ Shadcn components (unchanged)
├── lib/
│   ├── supabase.ts                 # Enhanced with version-based data layer
│   └── stripe.ts                   # New - Stripe client configuration
└── supabase/
    └── migrations/                  # New - Database migration files
```

## New File Organization
```
template-genius-activation/
├── app/
│   ├── actions/
│   │   └── learning-actions.ts      # Learning workflow server actions
│   └── api/webhooks/stripe/
│       └── route.ts                 # Stripe webhook handler
├── lib/
│   ├── data-layers/                 # New - Version-based data layer implementations
│   │   ├── version-data-layer.ts   # Client version management
│   │   ├── learning-capture.ts     # Learning workflow logic
│   │   └── analytics-engine.ts     # Success pattern analysis
│   ├── stripe.ts                   # New - Stripe SDK configuration
│   └── validation/                  # New - Zod schemas for validation
│       ├── client-schemas.ts       # Client creation and update validation
│       ├── version-schemas.ts      # Content version validation
│       └── learning-schemas.ts     # Learning data validation
└── supabase/
    └── migrations/
        ├── 001-add-client-fields.sql    # Add activation_token, current_version_id, status
        ├── 002-create-content-versions.sql # Create content versioning system
        └── 003-create-payments.sql      # Create payments with version tracking
```

## Integration Guidelines
- **File Naming:** Follows existing kebab-case convention for TypeScript files
- **Folder Organization:** Groups related functionality (data-layers, validation) in dedicated folders
- **Import/Export Patterns:** Uses existing barrel exports and path aliases (@/lib, @/components)

---
