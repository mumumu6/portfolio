# Deployment

## Target layout

| Host               | Repository          | Runtime                          |
| ------------------ | ------------------- | -------------------------------- |
| `mumumu6.net`      | `mumumu6/portfolio` | Cloudflare Workers Static Assets |
| `2024.mumumu6.net` | `mumumu6/homepage`  | Vercel                           |

The old Next.js site stays on Vercel as the 2024 archive. The current Astro site is generated completely at build time and deployed from `dist/`.

## Current state (2026-08-29)

- `mumumu6.net` serves the current Astro site through Cloudflare Workers Static Assets.
- `2024.mumumu6.net` serves the archived Next.js site from Vercel through Cloudflare.
- `wrangler.jsonc` contains the production route for `mumumu6.net/*`.
- Updates to `main` are built and deployed by Cloudflare Workers Builds.

## Migration record

The following sequence was used for the completed migration and is retained for rollback context.

1. In the existing Vercel `homepage` project, add `2024.mumumu6.net` as a domain.
2. In ConoHa DNS, add the exact CNAME value shown by Vercel for the `2024` host.
3. Confirm that `https://2024.mumumu6.net` serves the old site with a valid certificate.
4. Add `mumumu6.net` to Cloudflare and copy **all** existing DNS records from ConoHa, including mail and Ghost-related records. Keep the apex record pointing to Vercel during this step.
5. Change the domain nameservers to the pair assigned by Cloudflare and wait until the zone becomes Active.
6. Create or connect the `mumumu6-portfolio` Worker to `mumumu6/portfolio` with Workers Builds:
   - Production branch: `main`
   - Build command: `pnpm build:ci`
   - Deploy command: `pnpm deploy`
   - Root directory: `/`
7. Verify the Worker first on its `workers.dev` URL.
8. Attach `mumumu6.net` as a Worker Custom Domain. Cloudflare will replace the apex DNS record and provision the certificate.
9. Check `/`, `/works/`, `/blog/`, and one nested SSG route before removing `mumumu6.net` from the old Vercel project.

During the migration, `mumumu6.net` remained on Vercel until step 8 succeeded. The former rollback path was restoring the apex A record to `76.76.21.21`.

## Wrangler domain route

The active production route is managed in `wrangler.jsonc`:

```jsonc
"routes": [
  {
      "pattern": "mumumu6.net/*",
      "zone_name": "mumumu6.net"
  }
]
```

The Worker name in Cloudflare must match `name` in `wrangler.jsonc`: `mumumu6-portfolio`. The migration steps above are retained as an operational record; they are no longer pending setup work.

## Automatic deployment

Workers Builds watches the public repository. Every update to `main`, including the reviewed AI-content publish job, runs the same `pnpm build:ci` gate before deployment. Pull requests are also checked by `.github/workflows/verify.yml`.
