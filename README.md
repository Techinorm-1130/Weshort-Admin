# WeShort Admin (CMS)

Admin / CMS for the WeShort platform — built with Next.js 16 (App Router), React 19 and
Tailwind v4, using the same navy + red theme as the public [Weshort](../Weshort) site.

The information architecture mirrors the OKAST back office: projects, catalogue (medias,
FAST channels, external contributions, casting, encodings, encoding profiles) and
organisation (users, settings, plan & billing).

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Everything is data-driven

No screen hardcodes its content. Each one calls a typed function in
[`src/lib/api/resources.ts`](src/lib/api/resources.ts), which goes through the single
transport in [`src/lib/api/http.ts`](src/lib/api/http.ts).

```
component → resources.ts → http.ts ─┬─ real backend  (NEXT_PUBLIC_API_BASE_URL set)
                                    └─ mock-db.ts    (default, in-memory)
```

### Connecting the real backend

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://api.weshort.com/admin
```

That is the only change required — no component edits. The mock router answers the exact
REST paths the backend is expected to expose:

| Method | Path | Used by |
| --- | --- | --- |
| POST | `/auth/login` | Login |
| GET | `/dashboard` | Dashboard |
| GET | `/taxonomies` | Every select (categories, genres, languages, roles, …) |
| GET/POST/PATCH/DELETE | `/medias`, `/medias/{id}` | Medias list + editor |
| POST | `/medias/{id}/encode` | Start encoding |
| GET/POST/PATCH/DELETE | `/projects`, `/projects/{id}` | Projects |
| GET/POST/PATCH/DELETE | `/fast-channels`, `/fast-channels/{id}` | FAST broadcasts |
| GET/POST/PATCH/DELETE | `/contributions`, `/contributions/{id}` | External contributions |
| GET/POST/PATCH/DELETE | `/people`, `/people/{id}` | Casting |
| GET/DELETE | `/encoding-jobs`, `/encoding-jobs/{id}` | Encodings |
| GET/POST/PATCH/DELETE | `/encoding-profiles`, `/encoding-profiles/{id}` | Encoding profiles |
| GET/PATCH | `/organisation` | Organisation settings |
| GET/POST/PATCH/DELETE | `/organisation/users`, `/organisation/users/{id}` | Users |

List endpoints accept `search`, `status`, `type`, `sort` (`-field` for descending),
`page`, `perPage` and return `{ items, total, page, perPage }`.
The shapes of every entity live in [`src/types/index.ts`](src/types/index.ts).

Once the API is live, `src/lib/api/mock-db.ts` and `src/lib/api/seed.ts` can be deleted
along with the `USING_MOCK` branch in `http.ts`.

## Structure

```
src/
  app/
    (admin)/            sidebar + topbar shell and every CMS screen
    login/              sign-in
  components/
    ui/                 design system: Button, Fields, DataTable, Tabs, Overlays, Toast…
    layout/             Sidebar, Topbar, Logo
    charts/             dependency-free SVG bar chart, donut, sparkline
    media/tabs/         the 7 tabs of the media editor
    project|fast|contribution|casting|encoding/  entity editors
  lib/
    api/                transport, typed resources, mock backend, seed data
    hooks.ts            useQuery / useList / useMutation / useDebounced
    format.ts           bytes, durations, dates, slugs
    nav.ts              sidebar structure
  types/                domain models
```

## Theme

Tokens are defined in `src/app/globals.css` and mirror the public site:
navy canvas `#04122c`, panels `#071c3f`, WeShort red `#e50914`, Manrope body type with
Netflix Sans for headings (drop the licensed `.woff2` files into `public/fonts/`).
