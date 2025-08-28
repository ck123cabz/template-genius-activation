# Template Genius Activation Platform

A modern client activation and payment processing platform built for Genius recruitment agency's $500 activation fee business model. This Next.js 15 application streamlines the client onboarding process with dynamic content management, payment processing, and conversion tracking.

![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)
![React](sponsor/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.9-blue?style=for-the-badge&logo=tailwind-css)

## 🚀 Quick Start

### Prerequisites

- Node.js 22+ (recommended) or Docker
- pnpm package manager
- Supabase account (optional, falls back to mock data)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/template-genius-activation.git
cd template-genius-activation

# Install dependencies with pnpm
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

### Docker Development

```bash
# Build and start with Docker Compose
docker-compose up

# Or build manually
docker build -t template-genius .
docker run -p 3000:3000 -v $(pwd):/app template-genius
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📋 Features

### Core Functionality

- **🎯 Client Activation Flow** - Streamlined activation process with payment integration
- **📝 Dynamic Content Management** - Real-time editing of activation page content
- **💳 Payment Processing** - Dual payment options (Traditional vs Monthly Retainer)
- **📊 Analytics Dashboard** - Track conversion rates and activation metrics
- **🎨 Modern UI/UX** - Built with Shadcn/ui and Radix primitives
- **📱 Responsive Design** - Mobile-first approach with Tailwind CSS
- **🔄 Live Preview** - Real-time content preview before publishing
- **💾 Data Persistence** - Supabase integration with mock data fallback

### Business Features

- **A/B Payment Options**:
  - Option A: Traditional 25% placement fee
  - Option B: $1,200/month retainer model
- **$500 Activation Fee** credited towards final placement
- **14-day Priority Search Period**
- **6-month Replacement Guarantee**

## 🏗️ Architecture

```
template-genius-activation/
├── app/                    # Next.js 15 App Router
│   ├── dashboard/         # Admin dashboard interface
│   ├── activate/          # Client activation flow
│   │   ├── [token]/      # Dynamic activation pages
│   │   └── preview/      # Content preview
│   ├── agreement/        # Terms and conditions
│   ├── confirmation/     # Post-payment confirmation
│   └── processing/       # Payment processing
├── components/           # React components
│   ├── ui/              # Shadcn/ui components (40+)
│   └── theme-provider.tsx
├── lib/                 # Utilities and services
│   ├── supabase.ts     # Database service layer
│   └── utils.ts        # Helper functions
├── docs/               # Documentation
│   ├── brownfield-architecture.md
│   ├── genius-system.md
│   ├── project-brief.md
│   └── sales-flow-update.md
└── public/             # Static assets
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5.7** - Type-safe development
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Shadcn/ui** - Comprehensive component library
- **Radix UI** - Accessibility-first primitives

### Backend & Data
- **Supabase** - PostgreSQL database with real-time features
- **Mock Data Fallback** - Development without database
- **localStorage** - Client-side caching

### Development
- **Docker** - Containerized development environment
- **pnpm** - Fast, disk space efficient package manager
- **ESLint & Prettier** - Code quality and formatting

## 📊 Dashboard Features

The admin dashboard provides comprehensive control over the activation system:

### Client Management
- Create new client records
- Track activation status (pending/activated)
- Generate unique activation links
- Search and filter clients
- Edit client information

### Content Management System
- Edit activation page content in real-time
- Customize benefits and features
- Update payment options and pricing
- Modify investment details
- Preview changes before publishing

### Analytics & Metrics
- Total clients count
- Activated vs pending statistics
- Conversion rate tracking
- Real-time updates

## 🔐 Security Considerations

> ⚠️ **Important**: This application is in development mode. Before production deployment:

1. **Enable authentication** - Dashboard is currently unprotected
2. **Update RLS policies** - Current policies allow all operations
3. **Add input validation** - Implement Zod schemas for all inputs
4. **Configure Stripe** - Replace placeholder payment URLs
5. **Enable build checks** - Remove `ignoreBuildErrors` from config

## 🚀 Deployment

### Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Stripe Configuration (Future)
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

### Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Create tables (see supabase-schema.sql)
-- Run supabase-migration.sql for latest schema
-- Apply supabase-add-fields.sql for additional fields
```

### Production Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Or deploy to Vercel
vercel deploy
```

## 📝 API Documentation

### Client Service API

```typescript
// Get all clients
const clients = await clientService.getAll();

// Get client by ID
const client = await clientService.getById(id);

// Create new client
const newClient = await clientService.create({
  company: "Company Name",
  contact: "John Doe",
  email: "john@company.com",
  position: "Software Engineer",
  salary: "$100k-$150k"
});

// Update client status
await clientService.updateStatus(id, "activated");
```

### Content Service API

```typescript
// Get current content
const content = await contentService.getCurrent();

// Update content
await contentService.update({
  activation: {
    title: "New Title",
    subtitle: "New Subtitle",
    benefits: [...],
    paymentOptions: {...}
  }
});
```

## 🧪 Development Commands

```bash
# Start development server
pnpm dev

# Build production bundle
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## 📚 Documentation

- [Brownfield Architecture](docs/brownfield-architecture.md) - Complete system architecture analysis
- [Genius System Overview](docs/genius-system.md) - Business model and system design
- [Project Brief](docs/project-brief.md) - Product requirements and objectives
- [Sales Flow Update](docs/sales-flow-update.md) - Updated sales process documentation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by Genius/Famelix Ltd.

## 🆘 Support

For questions or issues, contact:
- Email: info@joingenius.com
- Documentation: See `/docs` folder

## 🚧 Roadmap

### Phase 1: Foundation (Current)
- ✅ Basic activation flow
- ✅ Content management system
- ✅ Mock data implementation
- ⏳ Stripe payment integration
- ⏳ Security hardening

### Phase 2: Enhancement
- ⏳ Email automation
- ⏳ Advanced analytics
- ⏳ A/B testing framework
- ⏳ Component refactoring

### Phase 3: Scale
- ⏳ Multi-tenancy support
- ⏳ Advanced caching
- ⏳ Mobile applications
- ⏳ AI-powered features

## 🎯 Success Metrics

- **Target**: $10K monthly activation revenue
- **Goal**: 30%+ activation rate
- **Timeline**: 90-day proof of concept
- **Refund Rate**: <5%

---

**Built with ❤️ by the Genius Team**