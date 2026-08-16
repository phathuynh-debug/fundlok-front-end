---
name: fundlok-frontend
description: >-
  FundLok frontend conventions and data flow for this Next.js 16 repo: the
  endpoints → services → React Query hooks → components data pipeline, the
  /api proxy + httpOnly-cookie auth model, when to use Context vs React Query,
  i18n with en.json/vi.json, shadcn/ui + Tailwind theme tokens (dark-mode
  safe), framer-motion patterns, and the auth/middleware role flow. Use this
  skill BEFORE writing or editing any frontend code in this repo — adding a
  feature, calling an API, creating a component, wiring state, adding strings,
  styling, or touching auth/routing — even when the user doesn't name a
  pattern. Follow it so new code matches existing structure instead of
  reinventing conventions.
---

# FundLok Frontend Conventions

This is a **Next.js 16 (App Router)** frontend for FundLok — an SME funding /
private-credit platform. It talks to a separate FastAPI backend.

> ⚠️ **This is not the Next.js in your training data.** Next 16 has breaking
> changes. Before using a Next-specific API you're unsure about, read the
> relevant guide under `node_modules/next/dist/docs/` and heed deprecation
> notices. Example: the `middleware` file convention is deprecated in favor of
> `proxy` (see [Auth & routing](#auth--routing)).

## The data flow (memorize this)

Every server interaction flows through the same four layers. Add new calls by
extending each layer in order — never skip one.

```
lib/endpoints.ts        →  URL path constants (grouped: AUTH_ENDPOINTS, …)
services/*.service.ts   →  apiClient calls + request/response TYPES (pure data layer)
hooks/use-*.ts          →  React Query useQuery/useMutation wrappers + query keys
app/**/_components/*     →  UI consumes the hooks (never calls services directly)
```

**Rule:** components import hooks, hooks import services, services import
endpoints + `apiClient`. Don't call `apiClient` or `fetch` from a component.

### 1. Endpoints — `lib/endpoints.ts`

Path constants grouped by domain. Functions for path params.

```ts
export const PROJECT_ENDPOINTS = {
  list: "/projects",
  create: "/projects",
} as const;
export const FILES_ENDPOINTS = {
  commit: (id: string) => `/files/${id}/commit`,
} as const;
```

### 2. Services — `services/<domain>.service.ts`

A pure data-access object plus the TypeScript interfaces for that domain. No
React, no hooks. This is also where shared types live (`User`, `UserRole`, …).

```ts
export interface RegisterPayload {
  full_name: string;
  email: string; /* … */
}

export const authenticationService = {
  login(payload: LoginPayload) {
    return apiClient.post<User>(AUTH_ENDPOINTS.login, payload);
  },
  register(payload: RegisterPayload) {
    return apiClient.post<User>(AUTH_ENDPOINTS.register, payload);
  },
};
```

### 3. Hooks — `hooks/use-<domain>.ts`

React Query wrappers. **Every domain exports a query-key factory** named
`<domain>Keys` so caches invalidate consistently:

```ts
export const projectKeys = {
  all: ["projects"] as const,
  mine: () => [...projectKeys.all, "mine"] as const,
};

export function useMyProjects(enabled = true) {
  return useQuery<Project[], ApiError>({
    queryKey: projectKeys.mine(),
    queryFn: () => projectsService.getMyProjects(),
    staleTime: 2 * 60 * 1000,
    retry: false,
    enabled,
  });
}

export function useSelectRole() {
  const queryClient = useQueryClient();
  return useMutation<User, ApiError, SelectableRole>({
    mutationFn: (role) => usersService.selectRole(role),
    onSuccess: (user) => queryClient.setQueryData(authKeys.currentUser(), user),
  });
}
```

- Mutations seed/invalidate the cache in `onSuccess` (e.g. `setQueryData`).
- Error type is always `ApiError` from `@/lib/types`.
- The global client config lives in `lib/query-client.ts` (staleTime 60s,
  retry 1, no refetch-on-focus); the provider is `providers/query-provider.tsx`.

## API client, proxy & auth model

- `lib/api-client.ts` is an axios wrapper with `withCredentials: true`. Base
  URL is `/api` (see `lib/endpoints.ts`).
- `next.config` rewrites `/api/:path*` → the FastAPI origin
  (`API_URL`, default `http://127.0.0.1:8000`). The browser only
  ever talks to same-origin `localhost:3000`, so **httpOnly auth cookies are
  sent automatically** — there is no token handling in the frontend.
- Login/OAuth/refresh/logout all rely on the backend setting/clearing cookies.
  The canonical user comes from `GET /users/me` (`useCurrentUser`).

## State management: server vs local

**This is the most important architectural rule.**

- **Server state → React Query.** Anything fetched from or written to the
  backend (user, projects, uploads, admin data) lives in React Query, keyed by
  a `*Keys` factory. Never copy server data into `useState`.
- **Local/ephemeral UI state → `useState` + React Context.** Wizard step,
  staged `File` objects not yet uploaded, dialog open/closed, form drafts.
  This never round-trips to the server, so React Query is the **wrong** tool
  (no query key, no fetch). Don't reach for Zustand/Redux either unless a
  feature truly outgrows Context.

### Sharing local state without prop-drilling → Context provider

When a feature splits into many sub-components that all need the same local
state, create a Context provider instead of threading props. Reference
implementation: `app/dashboard/_components/loan-application/`.

```tsx
// LoanApplicationContext.tsx — runs the state hook ONCE, exposes everything
const Ctx = createContext<Value | null>(null);
export function useLoanApplicationContext() {
  const v = useContext(Ctx);
  if (!v) throw new Error("must be used within LoanApplicationProvider");
  return v;
}
export function LoanApplicationProvider({ /* inputs */ children }) {
  const state = useLoanApplication(/* … */); // the hook with all logic
  const value = {
    ...state /* presentation: locale, theme, t, derived flags */,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
```

- The orchestrator component renders `<Provider><Wizard/></Provider>`; a
  component **cannot** consume a context it provides in the same render, so the
  consumer must be a child.
- Children call `useXContext()` and receive **no** state props — only
  per-instance identifiers (e.g. a `docKey`, a `label`).
- Keep the heavy logic in a plain hook (`useLoanApplication.ts`); the provider
  just distributes it. This keeps the hook independently testable.

## Component organization

- Route-scoped components live in `app/<route>/_components/` (the `_` keeps
  them out of routing).
- A `page.tsx` server wrapper (metadata) renders a `*-client.tsx` client
  component when interactivity is needed (see `app/select-role/`).
- **Split large components.** A monolith becomes an **orchestrator** + a
  subfolder of logical sub-components. Pattern:
  `app/dashboard/_components/loan-application/` = `LoanApplicationUpload` (thin
  orchestrator) + `StepIndicator`, `UploadField`, `ReviewStep`, `ReviewRow`,
  `DocumentInfoPanel`, the context, the hook, and the preview dialog. Per-step
  layout composition stays in the orchestrator; reusable pieces are their own
  files.
- Shared config (themes, etc.) stays at the `_components/` level and is
  imported via `../` from the subfolder.

## i18n — `lib/i18n/`

- Two dictionaries: `en.json` and `vi.json`. **They must have identical
  structure** — add a key to both, or the typed `t()` and the other locale
  break.
- Get the translator from the hook: `const { t, locale } = useTranslations();`
- Keys are dot-paths: `t("dashboard.sme.reviewTitle")`.
- Placeholders use `{name}` and are filled with `.replace()` at the call site:
  ```tsx
  t("dashboard.sme.sendProgress")
    .replace("{done}", String(done))
    .replace("{total}", String(total));
  ```
- Reuse existing keys where one fits; group new keys under the relevant
  namespace (`auth`, `dashboard.sme`, `common`, …). `locale === "vi"` inline
  ternaries are acceptable for one-off labels but prefer real keys.

## Styling — shadcn/ui + Tailwind theme tokens

- UI primitives come from `components/ui/*` (shadcn). Compose classNames with
  `cn()` from `@/lib/utils`.
- **Always use semantic theme tokens, never hardcoded colors**, so dark mode
  works automatically:
  - Surfaces: `bg-card text-card-foreground`, `bg-background`, `bg-muted/30`
  - Text: `text-foreground`, `text-muted-foreground`
  - Accent/brand: `bg-primary text-primary-foreground`, `border-border`
  - Destructive: `text-destructive`
- **Never `bg-white` / `text-black` for a surface** — it stays white in dark
  mode and its foreground text vanishes. (This was a real bug on the role
  picker.) Emerald/amber accent tints (`bg-emerald-500/10`, `text-amber-600`)
  are fine for status semantics since they read on both themes.

## Animation — framer-motion

- `framer-motion` is the standard. Common patterns: container/item variants
  with `staggerChildren` for entrances; `AnimatePresence mode="wait"` keyed by
  step/mode for transitions; `whileHover`/`whileTap` springs on cards;
  decorative `animate` loops with `repeat: Infinity` for ambient motion.
- Keep decorative layers `aria-hidden`, `pointer-events-none`, and clipped with
  `overflow-hidden`; put real content above on `z-10`.

## Auth & routing

- **Next 16 renamed `middleware` → `proxy`.** The repo still has
  `middleware.ts` (works, but logs a deprecation warning). When editing it,
  preserve behavior; consider migrating to `proxy.ts` per the Next 16 docs.
- The proxy reads the session by calling `/users/me` with the forwarded
  cookie, then gates routes. Order matters: **email-verification gate →
  role-selection gate → role-based landing.** Keep new gates ordered so they
  don't ping-pong (an unverified, roleless user must land on `/verify-email`,
  not bounce between it and `/select-role`).
- **Role flow:** users register **without** a role. After login, a user with
  no `role` is sent to `/select-role` (SME vs Investor) which calls
  `PATCH /users/me/role`. `User.role` is therefore optional (`role?: UserRole | null`).
  `SelectableRole = 'SME' | 'INVESTOR'` (admins are backend-assigned). SMEs land
  on `/project-application`, investors on `/dashboard`, admins on `/admin`.

## Forms & submission gotcha

For multi-step wizards, don't rely on the `<form onSubmit>` for the final
action — a stray Enter key or button can fire it from an earlier step. Make the
form `onSubmit` a no-op (`e.preventDefault()`) and trigger the real action from
an explicit `type="button"` `onClick`. The Send/Submit button is the only thing
that should perform the irreversible action, and it should live only on the
final step.

## Dev gotcha

After large hook/return-shape edits, Fast Refresh can serve stale modules and
the running app behaves like old code. If behavior contradicts the source,
restart cleanly: stop `next dev`, `rm -rf .next/dev .next/cache`, `npm run dev`,
hard-refresh.

## Red flags — stop and reconsider if you catch yourself…

- Calling `apiClient`, `axios`, or `fetch` from inside a component → move it to
  a `service`, wrap it in a `hooks/use-*` hook.
- Putting server data (user, projects, …) into `useState` → it belongs in
  React Query, keyed by a `*Keys` factory.
- Reaching for React Query (or Zustand/Redux) to hold a wizard step, a staged
  `File`, or a dialog's open state → that's local UI state; use `useState` +
  Context.
- Threading the same prop through 3+ component layers → add a Context provider.
- Writing `bg-white`, `text-black`, or a hex color for a surface → use a theme
  token so dark mode works.
- Adding an i18n key to only one of `en.json` / `vi.json` → add it to both.
- Formatting a numeric date with `toLocaleDateString` → use `formatDate` /
  `formatDateTime` from `@/lib/format-date` (locale-aware: vi → DD/MM/YYYY,
  en → MM/DD/YYYY), passing the `locale` from `useTranslations()`.
- A multi-step form where the final action is wired to `<form onSubmit>` →
  make submit a no-op and trigger the action from an explicit button.
- Inventing a folder/naming scheme for a new feature → mirror an existing one
  (`app/<route>/_components/`, orchestrator + subfolder of sub-components).

## Before you finish

Run `npx tsc --noEmit` and `npx eslint <changed files>` — both must be clean.
ESLint here forbids `setState` synchronously inside `useEffect`
(`react-hooks/set-state-in-effect`); derive with `useMemo` and use the effect
only for cleanup (see `DocumentPreviewDialog.tsx` for the object-URL pattern).
