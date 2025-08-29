# Template Genius Revenue Intelligence Engine - Quick Reference

## 🎯 Project Purpose
Revenue Intelligence Engine that captures conversion intelligence from every client journey. Each client teaches us what drives revenue through hypothesis tracking, outcome recording, and pattern recognition. Target: Transform 4.5% → 30%+ conversion rate.

## 🚀 Essential Commands
```bash
pnpm dev                    # Start development (port 3000)
pnpm build && pnpm start   # Test production build
docker-compose up          # Docker development
```

## 🏗️ Revenue Intelligence Architecture
- **Connected Journey**: 4-page client experience with learning capture
- **Next.js 15.2.4** + React 19 + TypeScript + BMAD Orchestration
- **Component Enhancement**: Existing Shadcn/ui components + learning fields
- **Pattern Recognition**: Serena memory for persistent insights
- **Routes**: `/dashboard` (intelligence), `/activate/[token]` (journey), `/activate/preview`

## 📁 Key Directories
```
app/dashboard/       # Main admin interface  
app/activate/        # Client activation flow
components/ui/       # Shadcn components (40+)
lib/                 # Utils (cn() function)
docs/                # Documentation
.serena/memories/    # Project knowledge base
```

## 🎨 Development Patterns
- **Styling**: Use `cn()` utility + Tailwind classes
- **Components**: Radix primitives + CVA variants
- **Forms**: React Hook Form + Zod validation
- **State**: React built-in hooks (no external state lib)
- **Icons**: Lucide React

## 🔧 Key Files
- `lib/utils.ts` - cn() utility function
- `app/dashboard/page.tsx` - Main dashboard
- `components/ui/*` - Pre-built components
- `app/globals.css` - Global styles

## ⚡ Quick Context Recovery
All detailed information stored in `.serena/memories/` - accessible via memory tools.