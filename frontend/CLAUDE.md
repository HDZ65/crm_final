# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **CRM (Customer Relationship Management)** application built with Next.js 15.5.4, React 19, TypeScript, and Tailwind CSS 4. The application manages clients, partners, contracts, and includes an integrated OAuth2 email system for sending emails directly from Gmail/Outlook accounts. The project is heavily integrated with Shadcn UI components (50+ components) using the "new-york" style variant.

## Development Commands

**Start development server:**
```bash
npm run dev
```
Development server runs on http://localhost:3000 with Turbopack enabled.

**Build for production:**
```bash
npm run build
```
Uses Turbopack for faster builds.

**Start production server:**
```bash
npm start
```

**Linting:**
```bash
npm run lint
```
Uses ESLint with Next.js core-web-vitals and TypeScript configurations.

## Application Architecture

### CRM Structure

The application is organized around four main entities:

1. **Dashboard** (`/`) - Home page with overview panels, charts, and quick stats
2. **Clients** (`/clients`) - Client management with detailed pages (`/clients/[id]`)
3. **Commerciaux** (`/partenaires`) - Sales representatives management
4. **Contrats** (`/contrats`) - Contract management

### Key Features

**Email Integration (OAuth2):**
- Users can connect Gmail and Microsoft Outlook accounts via OAuth2
- Email composer integrated into client detail pages
- Account management accessible from user menu in sidebar
- Email sending preserves conversation history in user's mailbox
- See [OAUTH_SETUP.md](OAUTH_SETUP.md) for OAuth configuration guide

**Client Detail Page** (`/clients/[id]/page.tsx`):
- Client information with tabs (Overview, Payments, Documents)
- Contract listing with history tracking
- Email composer with account selector
- Notes/history tracking via `ClientNotesSheet`
- Alert system for missing KYC/documents

**Navigation:**
- Sidebar layout (`AppSidebar`) with collapsible navigation
- User menu (`NavUser`) in sidebar footer with account settings
- Header (`SiteHeader`) with breadcrumbs and actions

### Tech Stack

- **Framework:** Next.js 15.5.4 (App Router with React Server Components)
- **React:** Version 19.1.0 with RSC support
- **Styling:** Tailwind CSS 4 with custom CSS variables and OKLCH color space
- **UI Components:** Shadcn UI (new-york style) with Radix UI primitives
- **Forms:** React Hook Form 7 with Zod 4 validation and @hookform/resolvers
- **Icons:** Lucide React + React Icons (for brand logos)
- **Charts:** Recharts for data visualization
- **Tables:** TanStack Table v8 for data tables
- **Drag & Drop:** @dnd-kit for sortable/draggable elements
- **Animations:** Framer Motion + tw-animate-css
- **Notifications:** Sonner for toast notifications
- **Theming:** next-themes with dark mode support

### Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth route group (login, signup, forgot-password, reset-password)
│   ├── clients/             # Client pages
│   │   ├── page.tsx        # Client list
│   │   └── [id]/page.tsx   # Client detail with contracts & email
│   ├── partenaires/         # Sales representatives pages
│   ├── contrats/            # Contracts pages
│   ├── dashboard/           # Dashboard page
│   ├── api/auth/           # OAuth callback pages
│   │   ├── google/callback/
│   │   └── microsoft/callback/
│   ├── layout.tsx          # Root layout with Geist fonts
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles with Tailwind and theme variables
├── components/
│   ├── ui/                 # Shadcn UI components (50+ components)
│   ├── app-sidebar.tsx     # Main navigation sidebar
│   ├── nav-user.tsx        # User menu with email settings
│   ├── site-header.tsx     # Page header
│   ├── email-composer-dialog.tsx        # Email composition modal
│   ├── email-account-selector-dialog.tsx # Account selection for emails
│   ├── email-account-settings-dialog.tsx # OAuth account management
│   ├── oauth-email-connect.tsx          # OAuth connection UI
│   ├── client-notes-sheet.tsx           # Client history sidebar
│   ├── data-table.tsx      # TanStack Table wrapper
│   ├── chart-*.tsx         # Recharts components
│   └── *-form.tsx          # Form components (login, signup, etc.)
├── hooks/
│   ├── use-mobile.ts       # Mobile detection hook (breakpoint: 768px)
│   └── use-oauth-email.ts  # OAuth email management hook
└── lib/
    └── utils.ts            # Utility functions (cn helper for class merging)
```

### Email System Architecture

The email system uses OAuth2 for direct Gmail/Outlook integration:

**Frontend Components:**
1. **EmailAccountSettingsDialog** - Manages OAuth connections (accessible from user menu)
2. **OAuthEmailConnect** - OAuth provider selection UI (Google, Microsoft, iCloud)
3. **EmailAccountSelectorDialog** - Choose which account to send from
4. **EmailComposerDialog** - Compose and send emails

**OAuth Flow:**
1. User clicks "Email Accounts" in sidebar user menu
2. Selects provider (Google/Microsoft) to connect
3. OAuth popup opens for authentication
4. Callback page (`/api/auth/{provider}/callback`) receives code
5. Code exchanged for tokens via backend API
6. Account stored and available for sending emails

**Hook:** `useOAuthEmail()` - Manages OAuth state, connections, and email sending

**Required Backend APIs** (to be implemented):
- `POST /api/auth/google/token` - Exchange OAuth code for tokens
- `POST /api/auth/microsoft/token` - Exchange OAuth code for tokens
- `POST /api/email/send` - Send email via connected account
- `POST /api/auth/{provider}/revoke` - Disconnect account

### Styling System

**Design Tokens:**
- Uses OKLCH color space for better perceptual uniformity
- CSS variables defined in [globals.css](src/app/globals.css) for theming
- Custom theme tokens include: background, foreground, primary, secondary, muted, accent, destructive, border, input, ring, card, popover, sidebar, and chart colors
- Border radius system: sm (--radius - 4px), md (--radius - 2px), lg (--radius), xl (--radius + 4px)
- Default radius: 0.625rem (10px)

**Dark Mode:**
- Implemented via custom `dark` variant: `@custom-variant dark (&:is(.dark *))`
- All color tokens have dark mode equivalents defined in `.dark` class
- Use `next-themes` for theme switching

**Tailwind Configuration:**
- Uses Tailwind CSS 4 with `@import "tailwindcss"`
- Includes `tw-animate-css` for animations
- PostCSS configured with `@tailwindcss/postcss` plugin
- No prefix on utility classes

### Component Patterns

**Shadcn UI Components:**
- Located in [src/components/ui/](src/components/ui/)
- Use `cn()` utility from [lib/utils.ts](src/lib/utils.ts) for conditional class merging (combines clsx + tailwind-merge)
- Components use `class-variance-authority` (CVA) for variant-based styling
- All components use `data-slot` attributes for styling hooks
- Form components integrate with React Hook Form via context providers
- Icon components expect Lucide React icons

**Path Aliases:**
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/ui` → `src/components/ui`

**Component Configuration ([components.json](components.json)):**
- Style: "new-york"
- RSC: enabled
- TSX: enabled
- Icon library: lucide
- CSS variables: enabled
- Base color: neutral

### Available UI Components

50+ Shadcn components are installed including:
- **Forms:** button, input, textarea, select, checkbox, radio-group, switch, label, form, field, input-group, input-otp
- **Layout:** card, separator, tabs, accordion, collapsible, resizable, sidebar, aspect-ratio, scroll-area
- **Navigation:** navigation-menu, menubar, breadcrumb, pagination
- **Overlay:** dialog, alert-dialog, popover, tooltip, hover-card, context-menu, sheet
- **Feedback:** alert, badge, skeleton, spinner, progress, sonner (toasts)
- **Data Display:** table, avatar, calendar, carousel, empty, kbd
- **Controls:** button-group, toggle, toggle-group, slider, command

### Forms

Form handling follows react-hook-form patterns:
- Use `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` from [ui/form.tsx](src/components/ui/form.tsx)
- Validation via Zod schemas with `@hookform/resolvers/zod`
- Form fields automatically handle error states via `aria-invalid` and show validation messages
- Error styling handled automatically via data attributes (`data-error`)

**Example Pattern:**
```tsx
const schema = z.object({
  email: z.string().email("Email invalide"),
  subject: z.string().min(1, "Requis"),
})

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { email: "", subject: "" }
})
```

### Data Tables

Uses TanStack Table v8 with Shadcn wrapper components:
- `DataTable` - Main table component with sorting, filtering, pagination
- `DataTablePagination` - Pagination controls
- `DataTableViewOptions` - Column visibility toggle
- Define columns with `ColumnDef` from `@tanstack/react-table`

### Charts

Uses Recharts for data visualization:
- `ChartAreaInteractive` - Interactive area charts
- `ChartPieContracts` - Pie charts for contract data
- All charts support theming via CSS variables

### State Management

Currently uses React state and props (no global state library):
- Component-level state with `useState`
- Server data fetched via React Server Components
- Future: Consider adding backend API integration

### Important Patterns

**Module-level constants** - Static data should be defined outside components to prevent re-creation:
```tsx
const staticData = [...] as const

function Component() {
  // Use staticData here
}
```

**OAuth Integration** - Email accounts managed via:
1. User menu → "Email Accounts"
2. Connect provider via OAuth popup
3. Use `useOAuthEmail()` hook for state management
4. Backend APIs handle token exchange and email sending

**Client Detail Pattern:**
- Tabs for different data sections (Overview, Payments, Documents)
- Contract listing with clickable rows
- Email button opens account selector → composer
- Notes/history in slide-over sheet

## Environment Variables

Required for OAuth functionality (create `.env.local`):

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Microsoft OAuth
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_microsoft_client_id
NEXT_PUBLIC_MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback

# Backend secrets (not in frontend)
GOOGLE_CLIENT_SECRET=your_google_secret
MICROSOFT_CLIENT_SECRET=your_microsoft_secret
```

See [OAUTH_SETUP.md](OAUTH_SETUP.md) for complete OAuth configuration guide.

## MCP Integration

Shadcn MCP server is configured in [.mcp.json](.mcp.json) for AI-assisted component browsing and installation via `npx shadcn@latest mcp`.

## TypeScript Configuration

- Target: ES2017
- Strict mode enabled
- Module resolution: bundler
- JSX: preserve (Next.js transforms it)
- Path alias `@/*` maps to `./src/*`

## ESLint Configuration

Extends Next.js recommended configs:
- `next/core-web-vitals`
- `next/typescript`

Ignores: node_modules, .next, out, build, next-env.d.ts

## Key Dependencies

- **UI Primitives:** All Radix UI components installed (@radix-ui/react-*)
- **Forms:** react-hook-form + zod + @hookform/resolvers
- **Styling:** class-variance-authority, clsx, tailwind-merge
- **Icons:** lucide-react + react-icons (for brand logos)
- **Dates:** date-fns, react-day-picker
- **Tables:** @tanstack/react-table
- **Charts:** recharts
- **Drag & Drop:** @dnd-kit/*
- **Carousel:** embla-carousel-react
- **Command Palette:** cmdk
- **Toasts:** sonner
- **Animations:** framer-motion + tw-animate-css
