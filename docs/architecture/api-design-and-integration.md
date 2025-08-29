# API Design and Integration

## API Integration Strategy

**API Integration Strategy:** Client-Version Server Actions with Learning Workflow Support  
**Authentication:** No authentication required (validation phase - single admin access)  
**Versioning:** No API versioning needed - server actions with direct database operations

## PRD-Aligned Server Actions

### **Client Management Server Actions**
**Function:** `createClientWithFirstVersion(formData: FormData)`  
**Purpose:** Atomic client creation with activation token and initial content version  
**Integration:** PRD-compliant workflow supporting immediate content editing capability

```typescript
export async function createClientWithFirstVersion(formData: FormData): Promise<ClientCreationResult> {
  const clientData = validateClientData(formData);
  
  // Atomic operation creating client + initial content version
  const result = await db.transaction(async (tx) => {
    // Generate unique activation token with collision detection
    const activationToken = await generateActivationToken();
    
    // Create client record
    const client = await tx.clients.create({
      company: clientData.company,
      contact: clientData.contact,
      email: clientData.email,
      activationToken,
      status: 'pending'
    });
    
    // Create initial content version for activation page
    const contentVersion = await tx.contentVersions.create({
      clientId: client.id,
      pageType: 'activation',
      content: getDefaultActivationContent(),
      isCurrent: true,
      versionNumber: 1,
      iterationNotes: 'Initial content version created',
      hypothesis: 'Default content will establish baseline conversion',
      outcome: 'pending',
      createdBy: 'admin'
    });
    
    // Link client to current version
    await tx.clients.update(client.id, { 
      currentVersionId: contentVersion.id 
    });
    
    return { client, contentVersion };
  });
  
  revalidatePath('/dashboard');
  return result;
}
```

### **Content Management Server Actions**
**Function:** `updateClientContent(clientId: string, pageType: string, content: any, learningData: LearningData)`  
**Purpose:** Create new content version with complete learning capture  
**Integration:** Core PRD workflow enabling "edit content for specific clients with rationale capture"

```typescript
interface LearningData {
  iterationNotes: string;    // "Why this change?" - PRD requirement
  hypothesis: string;        // Expected outcome - PRD requirement
}

export async function updateClientContent(
  clientId: string, 
  pageType: string, 
  content: any, 
  learningData: LearningData
): Promise<ContentVersion> {
  
  const result = await db.transaction(async (tx) => {
    // Deactivate current version
    await tx.contentVersions.updateMany({
      where: { clientId, pageType, isCurrent: true },
      data: { isCurrent: false }
    });
    
    // Create new version with learning capture
    const newVersion = await tx.contentVersions.create({
      clientId,
      pageType,
      content,
      iterationNotes: learningData.iterationNotes,
      hypothesis: learningData.hypothesis,
      outcome: 'pending',
      isCurrent: true,
      createdBy: 'admin'
    });
    
    // Update client's current version pointer (if activation page)
    if (pageType === 'activation') {
      await tx.clients.update(clientId, { 
        currentVersionId: newVersion.id 
      });
    }
    
    return newVersion;
  });
  
  revalidatePath('/dashboard');
  revalidatePath(`/activate/[token]`, 'page'); // Invalidate client page cache
  return result;
}

// Learning workflow support
export async function markContentOutcome(
  versionId: string, 
  outcome: 'success' | 'failure', 
  notes?: string
): Promise<ContentVersion> {
  
  const updatedVersion = await db.contentVersions.update(versionId, {
    outcome,
    metadata: { 
      outcomeNotes: notes,
      markedAt: new Date().toISOString()
    }
  });
  
  revalidatePath('/dashboard');
  return updatedVersion;
}
```

### **Payment Processing Server Actions**
**Function:** `createPaymentSession(clientId: string)`  
**Purpose:** Handle payment session creation with content version tracking  
**Integration:** Stripe integration with precise content-conversion analytics

```typescript
export async function createPaymentSession(clientId: string): Promise<PaymentSessionResult> {
  const client = await db.clients.findUnique({
    where: { id: clientId },
    include: { currentVersion: true }
  });
  
  if (!client) {
    throw new Error('Client not found');
  }
  
  // Get client's current content version at payment time
  const activeVersion = await db.contentVersions.findFirst({
    where: { 
      clientId: client.id, 
      pageType: 'activation', 
      isCurrent: true 
    }
  });
  
  // Real Stripe payment with content version metadata
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Priority Access Activation',
          description: 'Genius recruitment priority access'
        },
        unit_amount: 50000 // $500.00
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/confirmation?client=${clientId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/activate/${client.activationToken}`,
    metadata: {
      clientId: client.id,
      contentVersionId: activeVersion?.id || '' // CRITICAL: Link payment to exact content
    }
  });
  
  return { 
    success: true, 
    sessionUrl: session.url,
    sessionId: session.id 
  };
}

// Client activation support
export async function getClientActivationContent(activationToken: string): Promise<ClientActivationData> {
  const client = await db.clients.findUnique({
    where: { activationToken },
    include: { currentVersion: true }
  });
  
  if (!client) {
    throw new Error('Invalid activation token');
  }
  
  // Get current content version for this client
  const contentVersion = await db.contentVersions.findFirst({
    where: { 
      clientId: client.id, 
      pageType: 'activation', 
      isCurrent: true 
    }
  });
  
  return {
    client,
    content: contentVersion?.content || getDefaultActivationContent(),
    versionId: contentVersion?.id
  };
}
```

## Required External API Endpoints

### **Stripe Webhook Handler**
**Method:** POST  
**Endpoint:** `/api/webhooks/stripe`  
**Purpose:** Handle Stripe payment confirmations and update client/payment records  
**Integration:** Required external API for Stripe webhook processing

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      await db.payments.create({
        clientId: session.metadata?.clientId!,
        templateId: session.metadata?.templateId!,
        stripePaymentIntentId: session.payment_intent as string,
        amount: session.amount_total!,
        status: 'succeeded'
      });
      
      await db.clients.update(session.metadata?.clientId!, {
        status: 'activated',
        activatedAt: new Date()
      });
      
      break;
      
    case 'checkout.session.expired':
    case 'payment_intent.payment_failed':
      // Handle failed payments
      const failedSession = event.data.object as Stripe.Checkout.Session;
      
      await db.payments.create({
        clientId: failedSession.metadata?.clientId!,
        templateId: failedSession.metadata?.templateId!,
        stripePaymentIntentId: failedSession.payment_intent as string || 'failed',
        amount: failedSession.amount_total || 50000,
        status: 'failed'
      });
      
      break;
  }
  
  return NextResponse.json({ received: true });
}
```

## Server Action Integration Strategy

**Component Integration Pattern:**
```typescript
// Enhanced components use server actions directly
function ClientCreationForm() {
  const [state, formAction] = useFormState(createClientWithType, initialState);
  const { pending } = useFormStatus();
  
  return (
    <form action={formAction}>
      <Select name="type" defaultValue="test">
        <SelectItem value="test">Test Client</SelectItem>
        <SelectItem value="live">Live Client</SelectItem>
        <SelectItem value="demo">Demo Client</SelectItem>
      </Select>
      
      <Input name="company" placeholder="Company Name" required />
      <Input name="contact" placeholder="Contact Name" required />
      <Input name="email" type="email" placeholder="Email" required />
      
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Client'}
      </Button>
    </form>
  );
}

// Payment processing integration
function PaymentButton({ clientId }: { clientId: string }) {
  const [pending, startTransition] = useTransition();
  
  const handlePayment = () => {
    startTransition(async () => {
      const result = await createPaymentSession(clientId);
      if (result.sessionUrl) {
        window.location.href = result.sessionUrl;
      } else if (result.redirectUrl) {
        router.push(result.redirectUrl);
      }
    });
  };
  
  return (
    <Button onClick={handlePayment} disabled={pending}>
      {pending ? 'Processing...' : 'Pay $500 Activation Fee'}
    </Button>
  );
}
```

**Benefits of Server Actions Approach:**
- **Atomic Operations** - Single functions handle complete business logic
- **Type Safety** - End-to-end TypeScript validation without API boundaries
- **Simplified Error Handling** - Native JavaScript error handling and React error boundaries
- **Better Performance** - No HTTP serialization overhead for internal operations
- **Easier Testing** - Test server actions directly without API mocking
- **Faster Development** - No API contract design and maintenance overhead

This API design maintains Next.js 15 App Router best practices while enabling efficient business validation through simplified server-side operations and minimal external API surface area.

---
