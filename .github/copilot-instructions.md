**Purpose**

This file gives short, actionable guidance for AI coding agents to be immediately productive in this repository (a Vite + React frontend that expects a backend at `http://localhost:8080`). Use it to understand structure, conventions, and common patterns before changing code.

**Quick Start**

- **Dev server**: `npm run dev` — starts Vite with HMR (frontend default port from Vite)
- **Build**: `npm run build` — produces production assets
- **Preview**: `npm run preview` — serve the build locally
- **Lint**: `npm run lint` — ESLint configured, run before commits

**Big-picture architecture**

- **Frontend**: React + Vite (see `package.json` scripts). No tests or CI configs detected.
- **UI libraries**: `antd`, `bootstrap`, `recharts` are used across the app.
- **Folder responsibilities**:
  - `src/service/`: thin API wrappers per resource (e.g. `userService.js`, `LapTopService.js`)
  - `src/admin/`: admin feature area with many domain components (e.g. `adminSanPhamComponents`, `adminDonHangComponents`)
  - `src/components/`: shared UI pieces (e.g. `ConfirmationModal.jsx`, `QrScannerModal.jsx`)
  - `src/layout/` and `src/pages/`: app layout and top-level pages

**API, auth and error patterns**

- Central HTTP client: `src/service/api.js`. Key points:
  - `baseURL` is `http://localhost:8080`
  - `withCredentials: true` — backend uses cookies for refresh; requests include cookies
  - Request interceptor adds `Authorization: Bearer <accessToken>` from `sessionStorage`
  - Response interceptor attempts token refresh on `401` by POSTing to `/auth/refresh`; if refresh fails, it clears session and redirects to `/login`

- Services use `import api from './api'` and return `response.data.data` or throw `error.response?.data?.message`. See `src/service/userService.js` for examples of JSON and multipart form uploads.

**Service & upload conventions**

- For multipart uploads the pattern is:
  - Build a `FormData` object, append fields when present, append files under field names like `anh`.
  - Pass `{ headers: { 'Content-Type': 'multipart/form-data' } }` to `api.post`/`api.put`.

Example: `src/service/userService.js` `createEmployee` / `updateEmployee`.

**Component & naming conventions**

- Files use `.jsx` for React components. Component names are PascalCase (e.g. `AddLapTopComponent.jsx`).
- Admin features are grouped under `src/admin/*` by domain (e.g. `adminSanPhamComponents`, `adminDonHangComponents`).

**Routing & state**

- `react-router-dom` is used (see `package.json`). Routes and top-level mounting are in `src/main.jsx` / `src/layout` (search there for route layout changes).
- Short-lived tokens are stored in `sessionStorage` (`accessToken`, `refreshToken`, `user`) — be careful when modifying auth flows.

**Debugging tips specific to this repo**

- Start frontend with `npm run dev` and ensure backend runs on `http://localhost:8080` (API base in `src/service/api.js`).
- For auth errors, inspect network requests for `/auth/refresh` and check `sessionStorage` values.

**Linting & contribution**

- Run `npm run lint` before pushing. There is no test runner configured in `package.json`.

**When to change `api.js`**

- Only change baseURL or interceptors if backend contract changes. The interceptor handles automatic token refresh and redirect-to-login behavior relied on across services.

**Search patterns and useful entry points**

- Look at `src/service/*.js` for API examples.
- For UI patterns, inspect `src/admin/adminSanPhamComponents/*` and `src/components/*`.

**What not to assume**

- There is no explicit CI, test, or deployment config in this repo — do not add assumptions about pipelines.

**If you need more context**

- Ask about backend contract details (auth endpoints, error formats), or provide a short failing request/response pair so humans can confirm backend behavior.

---
Please review and tell me if you want the instructions expanded (examples of common code edits, or PR checklist additions).
