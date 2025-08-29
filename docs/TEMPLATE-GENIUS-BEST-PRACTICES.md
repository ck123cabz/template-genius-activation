# Template Genius Activation Platform - Comprehensive Best Practices Guide

## 🚀 Core Business Context

### Business Model
- **Primary Goal**: Transform from $0 to $500 activation fee model  
- **Target Revenue**: $10K monthly from activation fees
- **Timeline**: 90-day proof of concept
- **Payment Options**: Traditional placement (25% fee) vs Monthly retainer ($1,200/month)

### Technology Foundation
- **Next.js**: 15.2.4 with App Router
- **React**: 19 with concurrent features  
- **TypeScript**: 5.7 strict mode
- **Database**: Supabase PostgreSQL with mock fallback
- **Styling**: Tailwind CSS 4.1.9 + Shadcn/ui (40+ components)
- **Package Manager**: pnpm exclusively
- **Containerization**: Docker with hot reload

---

## 🧠 Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible. Simple solutions are easier to understand, maintain, and debug.

```typescript
// ❌ Complex: Over-engineered state management
const useComplexState = () => {
  const [state, setState] = useState(() => ({
    clients: new Map(),
    filters: new Set(),
    sortOrder: 'asc',
    pagination: { page: 1, limit: 10 }
  }));
  // Complex reducer logic...
};

// ✅ Simple: Straightforward state
const useClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  return { clients, loading, error, setClients, setLoading, setError };
};
```

### YAGNI (You Aren't Gonna Need It)
Avoid building functionality on speculation. Implement features only when they are needed, not when you anticipate they might be useful in the future.

```typescript
// ❌ YAGNI Violation: Building for imaginary future needs
interface Client {
  id: number;
  company: string;
  // Adding fields we "might need later"
  socialMediaHandles?: string[];
  preferredTimeZones?: string[];
  customFields?: Record<string, any>;
  integrationSettings?: IntegrationConfig[];
}

// ✅ YAGNI Compliant: Only what we need now
interface Client {
  id: number;
  company: string;
  contact: string;
  email: string;
  position: string;
  salary: string;
  status: 'pending' | 'activated';
  created_at: string;
  activated_at: string | null;
}
```

### Design Principles

#### Single Responsibility Principle
Each function, component, and module should have one clear purpose.

```typescript
// ❌ Multiple responsibilities
const DashboardPage = () => {
  // Client management
  const [clients, setClients] = useState<Client[]>([]);
  // Content editing
  const [content, setContent] = useState(defaultContent);
  // Statistics calculation
  const [stats, setStats] = useState({ total: 0, activated: 0 });
  // All mixed together in one 924-line component...
};

// ✅ Single responsibility
const ClientManager = () => {
  const { clients, createClient, updateClient } = useClientOperations();
  return <ClientTable clients={clients} onCreate={createClient} />;
};

const ContentEditor = () => {
  const { content, updateContent } = useContentOperations();
  return <ContentForm content={content} onSave={updateContent} />;
};
```

#### Open/Closed Principle
Software entities should be open for extension but closed for modification.

```typescript
// ✅ Extensible payment options without modifying existing code
interface PaymentProcessor {
  process(amount: number, clientId: number): Promise<PaymentResult>;
}

class StripeProcessor implements PaymentProcessor {
  async process(amount: number, clientId: number): Promise<PaymentResult> {
    // Stripe implementation
  }
}

class PayPalProcessor implements PaymentProcessor {
  async process(amount: number, clientId: number): Promise<PaymentResult> {
    // PayPal implementation - extension without modification
  }
}
```

#### Fail Fast Principle
Check for potential errors early and raise exceptions immediately when issues occur.

```typescript
// ✅ Fail fast with early validation
const createClient = async (clientData: CreateClientInput) => {
  // Validate immediately
  const validation = ClientCreateSchema.safeParse(clientData);
  if (!validation.success) {
    throw new ValidationError('Invalid client data', validation.error);
  }

  // Check business rules early
  if (await emailExists(clientData.email)) {
    throw new BusinessError('Email already exists');
  }

  return clientService.create(validation.data);
};
```

---

## 🧱 Code Structure & Modularity

### File and Component Limits

- **Components should be under 400 lines** (current dashboard is 924 lines - needs refactoring)
- **Functions should be under 50 lines** with a single, clear responsibility
- **Custom hooks should be under 100 lines** and represent a single concept
- **Organize code into clearly separated modules**, grouped by feature or responsibility
- **Line length should be max 100 characters** (already configured in Next.js)

### Project Architecture (Vertical Slice)

Follow strict vertical slice architecture with tests living next to the code they test:

```
app/
├── (auth)/                    # Auth group routes
├── dashboard/                 # Admin dashboard
│   ├── components/
│   │   ├── ClientManager.tsx
│   │   ├── ClientManager.test.tsx
│   │   ├── ContentEditor.tsx
│   │   ├── ContentEditor.test.tsx
│   │   └── StatsPanel.tsx
│   ├── hooks/
│   │   ├── useClientOperations.ts
│   │   ├── useClientOperations.test.ts
│   │   └── useContentOperations.ts
│   └── page.tsx
├── activate/                  # Client activation flow
│   ├── [token]/
│   │   ├── components/
│   │   │   ├── PaymentOptions.tsx
│   │   │   ├── PaymentOptions.test.tsx
│   │   │   └── BenefitsSection.tsx
│   │   └── page.tsx
│   └── preview/
└── api/                       # API routes with tests
    ├── clients/
    │   ├── route.ts
    │   └── route.test.ts
    └── webhooks/

components/
├── ui/                        # Shadcn components
└── shared/                    # Shared business components
    ├── ActivationLayout.tsx
    └── ActivationLayout.test.tsx

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── types.ts
├── validators/                # Zod schemas
│   ├── client.ts
│   ├── client.test.ts
│   └── content.ts
└── utils/
    ├── payments.ts
    ├── payments.test.ts
    └── email.ts
```

---

## 🛠️ Development Environment

### pnpm Package Management (Project Standard)

This project uses pnpm for fast, disk space efficient package management.

```bash
# Install dependencies
pnpm install

# Add a package
pnpm add react-query

# Add development dependency
pnpm add -D vitest @testing-library/react

# Remove a package
pnpm remove react-query

# Run scripts
pnpm dev
pnpm build
pnpm test
pnpm lint
```

### Development Commands

```bash
# Development (Docker preferred)
docker-compose up                    # Start with hot reload
docker-compose up --build           # Rebuild and start

# Direct Node.js
pnpm dev                            # Start development server
pnpm build                          # Production build
pnpm start                          # Production server

# Testing
pnpm test                           # Run all tests
pnpm test:watch                     # Run tests in watch mode
pnpm test:coverage                  # Run with coverage report

# Code Quality
pnpm lint                           # Check linting
pnpm lint:fix                       # Fix linting issues
pnpm type-check                     # TypeScript checking

# Database
pnpm db:generate                    # Generate Supabase types
pnpm db:push                        # Push migrations to Supabase
```

---

## 📋 Style & Conventions

### TypeScript Style Guide

- **Follow strict TypeScript** with these specific choices:
  - Line length: 100 characters (configured in Next.js)
  - Use double quotes for strings
  - Use trailing commas in multi-line structures
  - Prefer `interface` over `type` for object shapes
- **Always use type annotations** for function signatures and component props
- **Format with Prettier** (configured in project)
- **Use Zod** for runtime validation and type inference

### Component Documentation Standards

Use JSDoc-style comments for all exported components and functions:

```typescript
/**
 * Payment options component for client activation flow
 * 
 * @param options - Available payment options (A and B)
 * @param onSelect - Callback when user selects a payment option
 * @param disabled - Whether the selection is disabled
 * 
 * @example
 * ```tsx
 * <PaymentOptions 
 *   options={content.paymentOptions}
 *   onSelect={(option) => handlePayment(option)}
 *   disabled={isProcessing}
 * />
 * ```
 */
interface PaymentOptionsProps {
  options: {
    optionA: PaymentOption;
    optionB: PaymentOption;
  };
  onSelect: (option: 'A' | 'B') => void;
  disabled?: boolean;
}

export function PaymentOptions({ options, onSelect, disabled = false }: PaymentOptionsProps) {
  // Implementation...
}
```

### Naming Conventions

- **Variables and functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private properties**: `_leadingUnderscore` (rare in React)
- **Type interfaces**: `PascalCase` with descriptive suffixes
- **Enum values**: `UPPER_SNAKE_CASE`

```typescript
// ✅ Good naming
interface ClientCreateRequest {
  company: string;
  contact: string;
  email: string;
}

const CLIENT_STATUSES = {
  PENDING: 'pending',
  ACTIVATED: 'activated',
} as const;

const useClientOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  // ...
};
```

---

## 🧪 Testing Strategy

### Test-Driven Development (TDD)

1. **Write the test first** - Define expected behavior before implementation
2. **Watch it fail** - Ensure the test actually tests something  
3. **Write minimal code** - Just enough to make the test pass
4. **Refactor** - Improve code while keeping tests green
5. **Repeat** - One test at a time

### Testing Best Practices

```typescript
// ✅ Good test structure with setup and descriptive names
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentOptions } from './PaymentOptions';

const mockPaymentOptions = {
  optionA: {
    title: 'Traditional Placement',
    description: '25% placement fee',
    fee: '$500',
  },
  optionB: {
    title: 'Monthly Retainer',
    description: '$1,200/month retainer',
    fee: '$500',
    popular: true,
  },
};

describe('PaymentOptions Component', () => {
  it('should render both payment options with correct details', () => {
    render(
      <PaymentOptions 
        options={mockPaymentOptions} 
        onSelect={jest.fn()} 
      />
    );

    expect(screen.getByText('Traditional Placement')).toBeInTheDocument();
    expect(screen.getByText('Monthly Retainer')).toBeInTheDocument();
    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('should call onSelect with correct option when clicked', async () => {
    const mockOnSelect = jest.fn();
    
    render(
      <PaymentOptions 
        options={mockPaymentOptions} 
        onSelect={mockOnSelect} 
      />
    );

    fireEvent.click(screen.getByText('Select Traditional'));
    
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('A');
    });
  });

  it('should disable selection when disabled prop is true', () => {
    render(
      <PaymentOptions 
        options={mockPaymentOptions} 
        onSelect={jest.fn()} 
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
```

### Test Organization

- **Unit tests**: Test individual components/functions in isolation
- **Integration tests**: Test component interactions and data flow
- **E2E tests**: Test complete user workflows (activation flow)
- **Keep test files next to the code** they test (vertical slice)
- **Use `@testing-library/react`** for component testing
- **Aim for 80%+ code coverage** on critical business logic

---

## 🚨 Error Handling

### TypeScript Error Patterns

```typescript
// Create custom error classes for business domain
class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public clientId?: number
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

class InsufficientFundsError extends PaymentError {
  constructor(required: number, available: number, clientId: number) {
    super(
      `Insufficient funds: required $${required}, available $${available}`,
      'INSUFFICIENT_FUNDS',
      clientId
    );
  }
}

// Use specific error handling in components
const handlePayment = async (option: 'A' | 'B') => {
  try {
    setIsLoading(true);
    await processPayment(client.id, option);
    router.push('/processing');
  } catch (error) {
    if (error instanceof InsufficientFundsError) {
      toast.error('Insufficient funds in account');
    } else if (error instanceof PaymentError) {
      toast.error(`Payment failed: ${error.message}`);
    } else {
      toast.error('An unexpected error occurred');
    }
  } finally {
    setIsLoading(false);
  }
};
```

### Error Boundaries for React

```typescript
// components/shared/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to monitoring service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="mt-2 text-red-600">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in layouts
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="dashboard-layout">
        {children}
      </div>
    </ErrorBoundary>
  );
}
```

---

## 🔧 Configuration Management

### Environment Variables and Settings (Next.js Pattern)

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Public variables (NEXT_PUBLIC_ prefix)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  
  // Server-only variables
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  ADMIN_KEY: z.string().min(32),
  ADMIN_PASSWORD: z.string().min(12),
  
  // Optional with defaults
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ACTIVATION_FEE_CENTS: z.string().transform(Number).default('50000'), // $500
});

export const env = envSchema.parse(process.env);

// Type-safe environment access
export const config = {
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  admin: {
    key: env.ADMIN_KEY,
    password: env.ADMIN_PASSWORD,
  },
  app: {
    baseUrl: env.NEXT_PUBLIC_BASE_URL,
    activationFeeCents: env.ACTIVATION_FEE_CENTS,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
  },
} as const;
```

---

## 📊 Project-Specific Architecture Patterns

### 1. Hybrid Data Strategy (Current Implementation)

```typescript
// Pattern: Graceful degradation with mock fallback
export const clientService = {
  async getAll(): Promise<Client[]> {
    if (!useSupabase) {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));
      return [...mockClients];
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Supabase query failed, using mock data:', error);
      return [...mockClients]; // Graceful degradation
    }
  }
}
```

### 2. Content Management with Validation

```typescript
// lib/validators/content.ts
import { z } from 'zod';

const PaymentOptionSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(200),
  fee: z.string().regex(/^\$\d+$/, 'Fee must be in format $XXX'),
  details: z.string().optional(),
  popular: z.boolean().optional(),
});

export const ActivationContentSchema = z.object({
  title: z.string().min(1).max(100),
  subtitle: z.string().min(1).max(200),
  benefits: z.array(z.object({
    title: z.string().min(1).max(50),
    description: z.string().min(1).max(150),
    icon: z.string().min(1),
  })).min(1).max(6),
  paymentOptions: z.object({
    optionA: PaymentOptionSchema,
    optionB: PaymentOptionSchema,
  }),
  investmentDetails: z.array(z.string().min(1)).min(1).max(5),
  guaranteeInfo: z.object({
    period: z.string().min(1),
    description: z.string().min(1),
  }),
  searchPeriod: z.string().min(1),
  activationFee: z.string().regex(/^\$\d+$/, 'Fee must be in format $XXX'),
});

export type ActivationContent = z.infer<typeof ActivationContentSchema>;
```

### 3. Database Patterns for Client Activation

```sql
-- Optimized for business model
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  position TEXT NOT NULL,
  salary TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'activated')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  logo TEXT,
  
  -- Indexes for business queries
  INDEX idx_clients_status (status),
  INDEX idx_clients_email (email),
  INDEX idx_clients_created_at (created_at)
);

-- Payment tracking for business compliance
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  stripe_payment_id TEXT UNIQUE,
  amount INTEGER NOT NULL, -- cents
  option_selected TEXT CHECK (option_selected IN ('A', 'B')),
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  INDEX idx_payments_client_id (client_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_created_at (created_at)
);
```

---

## 💳 Payment Integration Patterns (Stripe)

### Production-Ready Stripe Integration

```typescript
// lib/stripe.ts
import Stripe from 'stripe';
import { config } from './env';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

export const createActivationSession = async (
  clientId: number,
  option: 'A' | 'B'
): Promise<Stripe.Checkout.Session> => {
  const client = await clientService.getById(clientId);
  if (!client) {
    throw new Error('Client not found');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Priority Access - ${client.company}`,
          description: option === 'A' 
            ? 'Traditional Placement Fee (credited towards 25% placement)' 
            : 'Monthly Retainer Model (credited towards first month)',
        },
        unit_amount: config.app.activationFeeCents,
      },
      quantity: 1,
    }],
    metadata: {
      client_id: clientId.toString(),
      option_selected: option,
      client_email: client.email,
    },
    success_url: `${config.app.baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.app.baseUrl}/activate/${clientId}`,
    customer_email: client.email,
  });

  return session;
};

// Webhook handler
export const handleStripeWebhook = async (
  payload: string,
  signature: string
): Promise<void> => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    );
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await handlePaymentSuccess(session);
      break;
    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(paymentIntent);
      break;
  }
};

const handlePaymentSuccess = async (session: Stripe.Checkout.Session) => {
  const clientId = parseInt(session.metadata?.client_id || '0');
  const option = session.metadata?.option_selected as 'A' | 'B';

  // Update client status
  await clientService.updateStatus(clientId, 'activated');

  // Record payment
  await paymentService.create({
    client_id: clientId,
    stripe_payment_id: session.payment_intent as string,
    amount: session.amount_total || 0,
    option_selected: option,
    status: 'completed',
  });

  // Send confirmation email
  await emailService.sendActivationConfirmation(clientId);
};
```

---

## 🎨 Component Architecture Patterns

### Breaking Down Large Components (Per Brownfield Analysis)

```typescript
// ❌ Current: app/dashboard/page.tsx (924 lines)
// ✅ Target: Split into focused components

// components/dashboard/ClientManager.tsx
interface ClientManagerProps {
  initialClients?: Client[];
}

export function ClientManager({ initialClients = [] }: ClientManagerProps) {
  const {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient
  } = useClientOperations(initialClients);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'activated'>('all');

  const filteredClients = useMemo(() => 
    clients
      .filter(client => 
        client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(client => statusFilter === 'all' || client.status === statusFilter)
  , [clients, searchTerm, statusFilter]);

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-4">
      <ClientFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />
      
      <ClientTable
        clients={filteredClients}
        loading={loading}
        onEdit={updateClient}
        onDelete={deleteClient}
      />
      
      <ClientCreateDialog onCreate={createClient} />
    </div>
  );
}

// components/dashboard/ContentEditor.tsx
export function ContentEditor() {
  const { content, loading, updateContent, previewMode, setPreviewMode } = useContentOperations();
  const [activeTab, setActiveTab] = useState<'main' | 'benefits' | 'payment' | 'details'>('main');

  return (
    <div className="space-y-6">
      <ContentEditorTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        previewMode={previewMode}
        onPreviewToggle={setPreviewMode}
      />

      <ContentEditorForm
        content={content}
        loading={loading}
        activeTab={activeTab}
        onSave={updateContent}
      />

      {previewMode && (
        <ContentPreviewPanel content={content} />
      )}
    </div>
  );
}

// Composed dashboard
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <ErrorBoundary fallback={<ClientManagerError />}>
            <Suspense fallback={<ClientManagerSkeleton />}>
              <ClientManager />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="content">
          <ErrorBoundary fallback={<ContentEditorError />}>
            <ContentEditor />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="stats">
          <ErrorBoundary fallback={<StatsPanelError />}>
            <Suspense fallback={<StatsPanelSkeleton />}>
              <StatsPanel />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
```

### Custom Hooks for Business Logic

```typescript
// hooks/useClientOperations.ts
export function useClientOperations(initialClients: Client[] = []) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientService.getAll();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (clientData: CreateClientInput) => {
    try {
      setLoading(true);
      const newClient = await clientService.create(clientData);
      setClients(prev => [newClient, ...prev]);
      toast.success(`Client ${newClient.company} created successfully`);
      return newClient;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create client';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClient = useCallback(async (id: number, updates: UpdateClientInput) => {
    try {
      setLoading(true);
      const updatedClient = await clientService.update(id, updates);
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      toast.success('Client updated successfully');
      return updatedClient;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update client';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteClient = useCallback(async (id: number) => {
    try {
      await clientService.delete(id);
      setClients(prev => prev.filter(c => c.id !== id));
      toast.success('Client deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete client';
      toast.error(message);
      throw err;
    }
  }, []);

  // Load clients on mount
  useEffect(() => {
    if (initialClients.length === 0) {
      loadClients();
    }
  }, [loadClients, initialClients.length]);

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refresh: loadClients,
  };
}
```

---

## 🚀 Performance Optimization (Next.js 15 + React 19)

### Server Components & Client Components Strategy

```typescript
// ✅ Server Component (default) - No "use client"
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { ClientManager } from './components/ClientManager';
import { clientService } from '@/lib/supabase/server';

export default async function DashboardPage() {
  // Data fetched on server
  const initialClients = await clientService.getAll();

  return (
    <div className="dashboard-layout">
      <Suspense fallback={<DashboardSkeleton />}>
        <ClientManager initialClients={initialClients} />
      </Suspense>
    </div>
  );
}

// ✅ Client Component only when interactivity needed
// components/dashboard/ClientTable.tsx
'use client';

import { useState, useMemo } from 'react';

interface ClientTableProps {
  initialClients: Client[]; // Server-provided initial data
}

export function ClientTable({ initialClients }: ClientTableProps) {
  const [clients, setClients] = useState(initialClients);
  // Interactive state only
}
```

### Image Optimization (Fix Current Issues)

```typescript
// next.config.mjs - Enable optimization
const nextConfig = {
  images: {
    unoptimized: false, // ✅ Enable optimization
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  typescript: {
    ignoreBuildErrors: false, // ✅ Enable type checking
  },
  eslint: {
    ignoreDuringBuilds: false, // ✅ Enable linting
  },
};

// Usage with Next.js Image component
import Image from 'next/image';

export function ClientLogo({ client }: { client: Client }) {
  return (
    <Image
      src={client.logo || '/placeholder-logo.svg'}
      alt={`${client.company} logo`}
      width={48}
      height={48}
      className="rounded-md"
      loading="lazy"
    />
  );
}
```

### Data Fetching Optimization

```typescript
// lib/hooks/useClients.ts - SWR for client-side caching
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useClients() {
  const { data, error, mutate } = useSWR('/api/clients', fetcher, {
    refreshInterval: 30000, // 30s refresh for real-time updates
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    clients: data || [],
    isLoading: !error && !data,
    error,
    refresh: mutate,
  };
}

// API route with caching
// app/api/clients/route.ts
import { unstable_cache } from 'next/cache';
import { clientService } from '@/lib/supabase/server';

const getCachedClients = unstable_cache(
  async () => clientService.getAll(),
  ['clients'],
  {
    revalidate: 300, // 5 minutes
    tags: ['clients'],
  }
);

export async function GET() {
  try {
    const clients = await getCachedClients();
    return Response.json(clients);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
```

---

## 🔒 Security Implementation (Critical for Production)

### Admin Authentication Pattern

```typescript
// lib/auth/admin.ts
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { config } from '@/lib/env';

const AdminLoginSchema = z.object({
  adminKey: z.string().min(32),
  password: z.string().min(12),
});

const secret = new TextEncoder().encode(config.admin.key);

export const validateAdminCredentials = async (credentials: unknown): Promise<boolean> => {
  try {
    const result = AdminLoginSchema.safeParse(credentials);
    if (!result.success) return false;

    const { adminKey, password } = result.data;
    
    return (
      adminKey === config.admin.key &&
      await bcrypt.compare(password, config.admin.password)
    );
  } catch {
    return false;
  }
};

export const createAdminToken = async (): Promise<string> => {
  return await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(secret);
};

export const verifyAdminToken = async (token: string): Promise<boolean> => {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === 'admin';
  } catch {
    return false;
  }
};

// Middleware for admin routes
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token || !await verifyAdminToken(token)) {
      if (pathname.startsWith('/api/')) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
```

### Input Validation with Zod

```typescript
// lib/validators/api.ts
import { z } from 'zod';

export const ClientCreateApiSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(255),
  contact: z.string().min(1, 'Contact name is required').max(255),
  email: z.string().email('Valid email is required'),
  position: z.string().min(1, 'Position is required').max(255),
  salary: z.string().min(1, 'Salary range is required').max(100),
  logo: z.string().url('Logo must be a valid URL').optional(),
});

export const ClientUpdateApiSchema = ClientCreateApiSchema.partial();

// API route with validation
// app/api/clients/route.ts
import { NextRequest } from 'next/server';
import { ClientCreateApiSchema } from '@/lib/validators/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = ClientCreateApiSchema.safeParse(body);
    if (!validation.success) {
      return Response.json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const client = await clientService.create(validation.data);
    return Response.json(client, { status: 201 });
  } catch (error) {
    console.error('Client creation error:', error);
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

---

## 🔄 Git Workflow (GitHub Flow)

### Branch Strategy
```
main (protected) ←── PR ←── feature/your-feature
↓
deploy to production
```

### Daily Workflow:

```bash
# 1. Start with latest main
git checkout main && git pull origin main

# 2. Create feature branch
git checkout -b feature/stripe-integration

# 3. Make changes with tests
# ... code changes ...

# 4. Commit with descriptive messages
git add .
git commit -m "feat(payments): integrate Stripe checkout sessions

- Add createActivationSession function for payment processing
- Implement webhook handler for payment confirmation
- Update client status on successful payment
- Add comprehensive error handling

Closes #45"

# 5. Push and create PR
git push origin feature/stripe-integration
# Create PR through GitHub UI

# 6. After PR approval and merge
git checkout main && git pull origin main
git branch -d feature/stripe-integration
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, test, chore, perf

**Examples**:
```bash
feat(dashboard): break down large component into focused modules

- Split 924-line dashboard into ClientManager, ContentEditor, StatsPanel  
- Extract useClientOperations and useContentOperations hooks
- Add proper error boundaries and loading states
- Improve component testability and maintainability

Closes #78

fix(payments): handle Stripe webhook signature verification

- Add proper webhook signature verification
- Improve error handling for malformed payloads
- Log webhook events for debugging

Fixes #92

test(client-service): add comprehensive unit tests

- Test client CRUD operations
- Mock Supabase client for isolated testing
- Add edge case coverage for error scenarios
- Achieve 95% test coverage on client service
```

---

## 📚 Documentation Standards

### Component Documentation

```typescript
/**
 * Client activation page component
 * 
 * Renders the activation flow for a specific client, including:
 * - Client information display
 * - Benefits presentation
 * - Payment options (A vs B)
 * - Investment details
 * - Activation form
 * 
 * @param params - Route parameters containing client token
 * 
 * @example
 * ```tsx
 * // Accessed via /activate/[token]
 * // Token is the client ID for now (will be secure token later)
 * ```
 * 
 * @throws {NotFound} When client token is invalid
 * @throws {PaymentError} When payment processing fails
 */
export default function ActivationPage({ 
  params 
}: { 
  params: { token: string } 
}) {
  // Implementation...
}
```

### API Documentation

```typescript
/**
 * Client management API endpoints
 * 
 * Handles CRUD operations for client records in the activation system.
 * All endpoints require admin authentication.
 * 
 * @route GET /api/clients - List all clients with pagination
 * @route POST /api/clients - Create new client record  
 * @route PUT /api/clients/[id] - Update existing client
 * @route DELETE /api/clients/[id] - Delete client record
 */

/**
 * Create new client record
 * 
 * @param request - HTTP request with client data in body
 * @returns Created client record with generated ID
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/clients', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     company: 'TechCorp Solutions',
 *     contact: 'John Smith',
 *     email: 'john@techcorp.com',
 *     position: 'Senior Software Engineer',
 *     salary: '$120,000 - $150,000'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  // Implementation...
}
```

---

## 🚀 Production Deployment Checklist

### Environment Configuration

```bash
# .env.production
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...prod-service-role-key

# Stripe (Live Keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Admin Authentication (Generate secure values)
ADMIN_KEY=your-32-character-secure-admin-key-here
ADMIN_PASSWORD=$2b$12$hashed.bcrypt.password.here

# Application
NEXT_PUBLIC_BASE_URL=https://activate.joingenius.com
NODE_ENV=production
ACTIVATION_FEE_CENTS=50000
```

### Security Hardening Steps

```yaml
1. Database Security:
   - [ ] Remove development RLS policies ("allow all")
   - [ ] Add production RLS policies (admin-only writes)  
   - [ ] Enable audit logging for sensitive operations
   - [ ] Set up automated backups
   - [ ] Configure connection pooling limits

2. Application Security:
   - [ ] Enable admin authentication middleware
   - [ ] Add CSRF protection to forms
   - [ ] Implement rate limiting on APIs
   - [ ] Add security headers (HSTS, CSP, etc.)
   - [ ] Enable HTTPS redirects

3. Payment Security:
   - [ ] Configure live Stripe webhook endpoints
   - [ ] Add webhook signature verification
   - [ ] Implement payment state validation
   - [ ] Test refund and dispute handling
   - [ ] Add payment audit trails

4. Error Handling:
   - [ ] Remove debug information from production errors
   - [ ] Implement proper error boundaries
   - [ ] Add comprehensive logging
   - [ ] Set up error monitoring (Sentry)
   - [ ] Create error notification alerts
```

### Production SQL Updates

```sql
-- Remove development policies
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on activation_content" ON activation_content;

-- Production RLS policies
CREATE POLICY "Admin read/write clients" ON clients
  FOR ALL USING (
    current_setting('app.user_role', true) = 'admin'
  );

CREATE POLICY "Public read activation content" ON activation_content
  FOR SELECT USING (true);

CREATE POLICY "Admin write activation content" ON activation_content
  FOR INSERT, UPDATE, DELETE USING (
    current_setting('app.user_role', true) = 'admin'
  );

-- Audit table for compliance
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO audit_log (
    table_name,
    record_id, 
    action,
    old_values,
    new_values,
    user_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    current_setting('app.user_id', true)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER clients_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER payments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments  
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

---

## 📊 Business Metrics & Analytics

### Core KPIs Implementation

```typescript
// lib/analytics/business-metrics.ts
export interface BusinessMetrics {
  totalClients: number;
  activatedClients: number;
  conversionRate: number;
  monthlyRevenue: number;
  averageActivationTime: number; // hours
  refundRate: number;
  optionASelections: number;
  optionBSelections: number;
}

export const calculateBusinessMetrics = async (): Promise<BusinessMetrics> => {
  const [clients, payments] = await Promise.all([
    clientService.getAll(),
    paymentService.getAll(),
  ]);

  const totalClients = clients.length;
  const activatedClients = clients.filter(c => c.status === 'activated').length;
  const conversionRate = totalClients > 0 ? (activatedClients / totalClients) * 100 : 0;

  const completedPayments = payments.filter(p => p.status === 'completed');
  const monthlyRevenue = completedPayments
    .filter(p => isCurrentMonth(p.created_at))
    .reduce((sum, p) => sum + p.amount, 0) / 100; // Convert from cents

  const refundedPayments = payments.filter(p => p.status === 'refunded');
  const refundRate = completedPayments.length > 0 
    ? (refundedPayments.length / completedPayments.length) * 100 
    : 0;

  const activatedClientsWithTime = clients.filter(c => 
    c.status === 'activated' && c.activated_at
  );
  
  const averageActivationTime = activatedClientsWithTime.length > 0
    ? activatedClientsWithTime.reduce((sum, client) => {
        const created = new Date(client.created_at).getTime();
        const activated = new Date(client.activated_at!).getTime();
        return sum + (activated - created);
      }, 0) / activatedClientsWithTime.length / (1000 * 60 * 60) // Convert to hours
    : 0;

  const optionASelections = completedPayments.filter(p => p.option_selected === 'A').length;
  const optionBSelections = completedPayments.filter(p => p.option_selected === 'B').length;

  return {
    totalClients,
    activatedClients,
    conversionRate,
    monthlyRevenue,
    averageActivationTime,
    refundRate,
    optionASelections,
    optionBSelections,
  };
};

// Hook for real-time metrics
export function useBusinessMetrics() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        const data = await calculateBusinessMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading, error };
}
```

### Success Metrics (90-Day Goal)

```yaml
Technical KPIs:
  - Page load time: < 3 seconds
  - Error rate: < 0.1%
  - Uptime: > 99.9%
  - Test coverage: > 80%

Business KPIs:
  - Activation rate: > 30% (target from PRD)
  - Monthly activation revenue: $10,000+ (20 activations/month)
  - Refund rate: < 5%
  - Time to activation: < 48 hours
  - Option B selection rate: > 60% (higher value option)

Development KPIs:
  - Build time: < 2 minutes
  - Component complexity: < 400 lines per component
  - Code coverage: > 80% on business logic
  - Documentation coverage: 100% for public APIs
```

---

## 🔍 Monitoring & Observability

### Health Check Implementation

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: HealthStatus;
    stripe: HealthStatus;
    email: HealthStatus;
  };
}

interface HealthStatus {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

const checkDatabase = async (): Promise<HealthStatus> => {
  try {
    const start = Date.now();
    await supabase.from('clients').select('id').limit(1);
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Database check failed',
    };
  }
};

const checkStripe = async (): Promise<HealthStatus> => {
  try {
    const start = Date.now();
    await stripe.customers.list({ limit: 1 });
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Stripe check failed',
    };
  }
};

export async function GET() {
  const healthChecks = await Promise.all([
    checkDatabase(),
    checkStripe(),
    // Add other service checks
  ]);

  const [database, stripe] = healthChecks;
  
  const allHealthy = healthChecks.every(check => check.status === 'up');
  
  const health: HealthCheck = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database,
      stripe,
      email: { status: 'up' }, // Placeholder
    },
  };

  return NextResponse.json(health, {
    status: allHealthy ? 200 : 503,
  });
}
```

---

## ⚠️ Critical Success Factors

### 1. **Maintain Graceful Degradation**
Always provide fallbacks for critical functionality:

```typescript
// ✅ Good: Multiple fallback layers
const loadContent = async () => {
  try {
    // Try Supabase first
    return await contentService.getCurrent();
  } catch (supabaseError) {
    console.warn('Supabase failed, trying localStorage');
    try {
      // Fallback to localStorage
      const cached = localStorage.getItem('activation_content_cache');
      if (cached) return JSON.parse(cached);
    } catch (storageError) {
      console.warn('localStorage failed, using defaults');
    }
    // Final fallback to hardcoded defaults
    return defaultActivationContent;
  }
};
```

### 2. **Focus on Business Value**
Prioritize features that directly impact the $10K monthly revenue goal:

```typescript
// Priority 1: Activation flow optimization
// Priority 2: Payment processing reliability  
// Priority 3: Conversion rate optimization
// Priority 4: Admin efficiency tools
```

### 3. **Security-First Approach** 
Never compromise on security for speed:

```typescript
// ✅ Always validate inputs
const createClient = async (input: unknown) => {
  const validated = ClientCreateSchema.parse(input); // Throws on invalid
  return clientService.create(validated);
};

// ✅ Always authenticate admin actions
const adminOnlyMiddleware = async (request: NextRequest) => {
  const token = request.cookies.get('admin-token')?.value;
  if (!token || !await verifyAdminToken(token)) {
    throw new UnauthorizedError('Admin access required');
  }
};
```

### 4. **Performance Optimization**
Keep the activation flow fast and responsive:

```typescript
// ✅ Optimize critical path
const ActivationPage = async ({ params }: { params: { token: string } }) => {
  // Parallel data loading
  const [client, content] = await Promise.all([
    clientService.getById(params.token),
    contentService.getCurrent(),
  ]);

  if (!client) notFound();

  return (
    <ActivationLayout>
      <ActivationFlow client={client} content={content} />
    </ActivationLayout>
  );
};
```

### 5. **Docker-First Development**
Maintain consistency between development and production:

```bash
# ✅ Always use Docker for development
docker-compose up --build

# ✅ Test production builds locally
docker build -t template-genius .
docker run -p 3000:3000 template-genius
```

---

## 🎯 Next Steps & Roadmap

### Immediate Actions (Week 1)
1. **Enable TypeScript/ESLint checking** (remove `ignoreBuildErrors`)
2. **Implement admin authentication** (security critical)
3. **Replace Stripe placeholder URLs** with real integration
4. **Break down dashboard component** (924 lines → multiple focused components)

### Phase 1: Foundation (Month 1) 
- Complete Stripe payment integration with webhooks
- Add comprehensive input validation with Zod
- Implement proper error boundaries and loading states
- Set up basic monitoring and health checks

### Phase 2: Optimization (Month 2-3)
- Refactor remaining large components
- Add comprehensive test coverage (>80%)
- Implement email automation for activation flow
- Create business metrics dashboard

### Phase 3: Scale (Month 4+)
- Add A/B testing for payment options
- Implement advanced analytics and conversion tracking
- Consider multi-tenancy for multiple agencies
- Add AI-powered features for lead qualification

---

**🎯 Success Metrics**: Focus on 30%+ activation rate, $10K monthly revenue, and <5% refund rate within 90 days.

This comprehensive guide should be updated as the system evolves from mock implementation to full production deployment.