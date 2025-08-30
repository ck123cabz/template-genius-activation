# Technical Constraints and Integration Requirements

## Existing Technology Stack

**Core Framework:**
- Next.js 15.2.4 (App Router) - Latest features with React 19 compatibility
- React 19 (Latest with concurrent features) - Requires Node.js 22+
- TypeScript 5.7 (Strict mode) - Latest stable version
- Node.js 22+ (Runtime requirement)

**UI/Styling:**
- Tailwind CSS 4.1.9 - Core utility framework
- 40+ Shadcn/ui components (reuse all existing)
- Radix UI primitives - Accessibility foundation
- CVA for component variants - Existing pattern

**Data & Forms:**
- React Hook Form 7.60.0 - Performance optimized forms
- Zod 3.25.67 - Runtime validation & type safety
- Supabase 2.56.0 - Database with mock fallback

**AI Infrastructure:**
- BMAD orchestration system - 1-2 day implementation capability
- Serena MCP - Memory persistence across sessions
- Playwright MCP - Automated testing integration

**New Dependencies (Minimal):**
- @stripe/stripe-js ^2.4.0 - Client-side payment integration
- stripe ^14.21.0 - Server-side payment processing

## Integration Approach

**Database Integration Strategy:**
- New journey tables designed to coexist with existing schema without conflicts
- Hybrid mode: Mock data for development, Supabase for production with graceful fallback
- All new queries use existing database connection patterns and error handling
- Reversible migrations with rollback capability for safe deployment

**API Integration Strategy:**
- Extend existing server actions pattern rather than creating new REST endpoints
- Maintain compatibility with current admin dashboard endpoints and G[4-digit] token system
- Preserve client activation flow URLs and existing payment processing flows
- Stripe integration via server actions following established payment patterns

**Frontend Integration Strategy:**
- Enhance existing dashboard components with learning fields rather than replacing
- Reuse established layout components (Header, Footer, Navigation) without modification
- Extend current form patterns with React Hook Form + Zod for consistency
- Journey editor uses existing modal/dialog patterns and Tab navigation

**Testing Integration Strategy:**
- Playwright MCP testing following established automated testing patterns
- Component tests using existing test utilities and patterns
- Integration tests covering full journey flows without breaking existing test suite
- Payment testing in Stripe test mode integrated with existing testing workflow

## Code Organization and Standards

**File Structure Approach:**
- Journey components in `/app/components/journey/` following existing component organization
- Learning components in `/app/components/learning/` as new feature directory
- Server actions in `/app/lib/actions/journey-actions.ts` following existing action patterns
- Database schemas in `/lib/db/schema-journey.ts` extending existing schema patterns

**Naming Conventions:**
- Follow existing camelCase for TypeScript variables and functions
- Use existing component naming pattern (PascalCase) for all new components
- Database fields use snake_case to match current schema conventions
- Maintain existing file naming conventions (kebab-case for component files)

**Coding Standards:**
- TypeScript strict mode (existing configuration maintained)
- Existing ESLint/Prettier configuration applied to all new code
- Server actions over API routes (existing architectural preference)
- Zod validation for all inputs (existing validation pattern)
- Error boundary patterns for all new features following existing error handling

**Documentation Standards:**
- TSDoc comments for all new functions following existing documentation patterns
- Update existing component documentation without breaking current docs
- Serena memory updates for architectural decisions and learning patterns
- README updates for new environment variables following existing format

## Deployment and Operations

**Build Process Integration:**
- Use existing Next.js build pipeline without modifications
- Environment variables via existing .env pattern with Stripe keys in production
- No changes to existing Docker/deployment configuration
- Feature flags using existing configuration approach for gradual rollout

**Deployment Strategy:**
- Incremental rollout using existing deployment pipeline
- Database migrations via existing Supabase migration system
- Stripe webhook configuration in existing infrastructure setup
- Rollback plan via database migration reversal and feature flag toggles

**Monitoring and Logging:**
- Extend existing error tracking patterns (if available) to new features
- Stripe dashboard integration for payment monitoring
- Supabase dashboard for database monitoring of new tables
- Console logging patterns consistent with existing codebase standards

**Configuration Management:**
- Environment variables following existing .env.local pattern
- Stripe configuration via existing environment setup process
- No changes to existing configuration management system
- Feature flags integrated with existing configuration approach

## Risk Assessment and Mitigation

**Technical Risks:**
- Supabase connection failures → Mock data fallback system already implemented
- Stripe integration complexity → Test mode first with staged rollout approach
- New database schema conflicts → Careful migration planning with reversible migrations
- Performance impact on existing features → Load testing and monitoring integration

**Integration Risks:**
- Breaking existing client activation flow → Comprehensive integration testing with existing flow preservation
- UI consistency violations → Strict component reuse policy and design review process
- Server action pattern deviation → Code review focused on existing pattern adherence

**Deployment Risks:**
- Database migration failures → Reversible migrations with comprehensive rollback plan
- Stripe webhook configuration errors → Test environment validation before production
- Environment variable misconfigurations → Deployment checklist and validation procedures

**Mitigation Strategies:**
- Feature flags for gradual rollout minimizing risk exposure
- Comprehensive testing suite covering both new and existing functionality
- Staging environment testing identical to production configuration
- Database backup before any schema changes
- Monitoring alerts for all critical paths including existing functionality

---
