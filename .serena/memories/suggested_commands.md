# Essential Development Commands

## Package Management
- **Package Manager**: Use `pnpm` exclusively (never npm or yarn)
- **Install Dependencies**: `pnpm install`
- **Add Packages**: `pnpm add <package-name>`
- **Add Dev Dependencies**: `pnpm add -D <package-name>`

## Development Server
- **Start Development**: `pnpm dev` (runs on port 3000)
- **Build Production**: `pnpm build`
- **Start Production**: `pnpm start`
- **Lint Code**: `pnpm lint` (currently disabled in build)

## Docker Development
- **Start with Docker Compose**: `docker-compose up`
- **Rebuild and Start**: `docker-compose up --build`
- **Stop Containers**: `docker-compose down`
- **Build Image Manually**: `docker build -t template-genius .`
- **Run with Volume Mount**: `docker run -p 3000:3000 -v $(pwd):/app template-genius`

## Testing with Playwright MCP
- **Install Browser**: Use `mcp__playwright__browser_install` if browser not installed
- **Navigate to Page**: `mcp__playwright__browser_navigate` with URL
- **Take Screenshots**: `mcp__playwright__browser_take_screenshot` for visual verification
- **Capture Page State**: `mcp__playwright__browser_snapshot` for accessibility tree
- **Interact with Elements**: `mcp__playwright__browser_click`, `mcp__playwright__browser_type`
- **Fill Forms**: `mcp__playwright__browser_fill_form` for multi-field forms
- **Wait for Elements**: `mcp__playwright__browser_wait_for` for dynamic content
- **Console Monitoring**: `mcp__playwright__browser_console_messages` to check for errors
- **Network Monitoring**: `mcp__playwright__browser_network_requests` for API calls

## System Commands (macOS/Darwin)
- **List Files**: `ls -la`
- **Change Directory**: `cd <path>`
- **Find Files**: `find . -name "*.tsx" -type f`
- **Search Content**: `grep -r "searchterm" .`
- **Git Commands**: Standard git workflow
- **Copy to Clipboard**: `pbcopy < file.txt` (macOS specific)

## Project-Specific Commands
- **Access Dashboard**: Navigate to `http://localhost:3000/dashboard`
- **Preview Activation Page**: Navigate to `http://localhost:3000/activate/preview`
- **View Application**: Main app redirects to `/dashboard`

## Database Commands (Supabase)
- **Supabase CLI**: Install globally if needed `npm install -g supabase`
- **Link Project**: `supabase link --project-ref <project-id>`
- **Generate Types**: `supabase gen types typescript --local > types/supabase.ts`
- **Run Migrations**: `supabase db reset` or `supabase migration up`

## Development Workflow
1. **Start Development**: `pnpm dev`
2. **Make Changes**: Edit files in `app/`, `components/`, or `lib/`
3. **Test Changes**: Navigate to relevant pages in browser
4. **Automated Testing**: Use Playwright MCP for browser automation
5. **Check Console**: Use browser dev tools or Playwright console messages
6. **Build Test**: `pnpm build` (before committing)

## Environment Setup
- **Environment File**: Copy `.env.example` to `.env.local`
- **Supabase Config**: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Mock Data**: Application works without database (fallback to mock data)
- **Playwright MCP**: Available for automated browser testing