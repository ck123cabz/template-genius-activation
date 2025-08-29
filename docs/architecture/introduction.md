# Introduction

This document outlines the architectural approach for transforming Template Genius Activation Platform into a **BMAD-Orchestrated Revenue Intelligence Engine** - a connected journey learning system that captures conversion intelligence from every client interaction across all pages in the activation flow.

**Core Philosophy:**
> "Each client teaches us something about what drives revenue across their entire journey. We capture that learning automatically using AI orchestration and apply it to make the next client more likely to pay."

**Relationship to Existing Architecture:**
This document enhances existing project architecture by integrating BMAD agent orchestration and Serena MCP knowledge persistence while preserving all proven technical patterns and infrastructure investments. Where conflicts arise between new and existing patterns, this document provides guidance on maintaining consistency while implementing enhancements.

**PRD Integration:**
All requirements defined in `docs/prd.md` remain unchanged. This architecture document defines HOW to implement those requirements using AI orchestration for accelerated delivery (1-2 days vs 3 weeks).

## Existing Project Analysis

**Current Business Reality:**
- **$73,250 in signed contracts → $0 invoiced** (clients ghost after free work)
- **4.5% conversion vs 15-25% industry standard**
- **90-day runway remaining** with urgent need for revenue validation
- **CEO Philosophy:** "Execute, execute, execute" (lean startup + Alex Hormozi methodology)

**Core Business Problem:**
> "If we don't charge a fee up front, we're basically doing free consulting, hoping for a tip. This isn't a business, more like a charity." - CEO

**Current Tech Stack (PRESERVE ALL):**
- **Next.js 15.2.4, React 19, TypeScript 5.7** - Proven foundation
- **40+ Shadcn/ui components, 20+ Radix primitives** - Complete UI library
- **Hybrid mock-first + Supabase + localStorage** - Safe development approach
- **Docker + GitHub Actions CI/CD** - Proven deployment pipeline

**Available Documentation:**
- ✅ **Complete Technical Stack** - 40+ UI components documented
- ✅ **BMAD Orchestration System** - Full AI workflow integration  
- ✅ **Memory-Based Architecture** - Serena MCP knowledge persistence
- ✅ **Testing Infrastructure** - Playwright MCP browser automation
- ✅ **Business Model Context** - Revenue targets, conversion goals
- ✅ **Development Workflows** - Standard + AI-orchestrated approaches

**Identified Constraints:**
- Free tier optimization (Supabase 500MB, Vercel serverless limits)
- AI-first development (Must integrate with BMAD agent orchestration)
- Memory system continuity (Changes must update Serena knowledge base)
- Mock-first principle (Database integration cannot break development workflow)
- Testing integration (Must work with Playwright MCP automation)
- Quality gate compliance (GitHub Actions CI/CD must pass)

## Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|---------|
| BMAD-Orchestrated Revenue Intelligence | 2025-08-29 | 2.0 | Complete rebuild as connected journey learning system | Winston (Architect) |
| Initial Brownfield Architecture | 2025-01-28 | 1.0 | Original CMS + Supabase integration design | Winston (Architect) |

---
