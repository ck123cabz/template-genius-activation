# Coding Standards and Conventions

## Existing Standards Compliance
**Code Style:** TypeScript strict mode with existing ESLint configuration, Prettier formatting  
**Linting Rules:** Next.js recommended rules with TypeScript strict configuration  
**Testing Patterns:** Playwright MCP integration for browser automation testing  
**Documentation Style:** JSDoc comments for complex business logic, inline comments for architectural decisions

## Enhancement-Specific Standards
- **Server Actions:** Use FormData for form submissions, return typed results with error handling
- **Data Layer Separation:** Implement factory pattern for client type-based data access
- **Template Management:** Use consistent naming convention for template types and content structure
- **Payment Processing:** Implement comprehensive error handling with fallback mechanisms

## Critical Integration Rules
- **Existing API Compatibility:** All existing mock-first patterns preserved through data layer abstraction
- **Database Integration:** Use transactions for multi-step operations, implement proper error handling and rollback
- **Error Handling:** Use React Error Boundaries for component-level errors, server actions for server-side validation
- **Logging Consistency:** Structured logging for payment events, client operations, and template management

---
