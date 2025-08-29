# User Experience Requirements

## Admin Dashboard Experience

**Connected Journey Dashboard:**
```
┌─────────────────────────────────────────────────┐
│ Revenue Intelligence Dashboard                   │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │   Clients   │ │   Journey   │ │  Patterns   ││
│ └─────────────┘ └─────────────┘ └─────────────┘│
├─────────────────────────────────────────────────┤
│ Client List with Journey Status:                │
│ ┌───────────────────────────────────────────┐   │
│ │ G1234 | TechCo | Hypothesis Set | Pending │   │
│ │ G1235 | StartUp | Testing | Page 2/4      │   │
│ │ G1236 | Enterprise | PAID ✓ | Complete    │   │
│ │ G1237 | SMB Corp | Ghosted ✗ | Failed     │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ Quick Actions:                                  │
│ [+ New Client with Hypothesis]                  │
│ [View Patterns] [Export Learnings]              │
└─────────────────────────────────────────────────┘
```

**Learning Capture Interface:**
```
┌─────────────────────────────────────────────────┐
│ Edit Journey for: TechCo (G1234)                │
├─────────────────────────────────────────────────┤
│ Overall Hypothesis:                             │
│ ┌───────────────────────────────────────────┐   │
│ │ "Direct technical approach will convert   │   │
│ │  this engineering-focused founder"        │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ Page: [Activation] [Agreement] [Confirm] [Next] │
│                                                  │
│ Page Hypothesis:                                │
│ ┌───────────────────────────────────────────┐   │
│ │ "Lead with API capabilities, not price"   │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ Content: [Editor with existing content...]      │
│                                                  │
│ [Save with Learning] [Preview] [Cancel]         │
└─────────────────────────────────────────────────┘
```

## Client Experience Flow

**Connected Journey Pages:**
1. **Activation** → Personalized value proposition
2. **Agreement** → Terms matching their needs
3. **Payment** → Stripe checkout ($500)
4. **Confirmation** → Success messaging
5. **Processing** → Next steps engagement

Each page reflects the hypothesis-driven content for that specific client.

---
