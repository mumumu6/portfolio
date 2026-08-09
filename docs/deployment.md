# Deployment

## Target layout

| Host | Repository | Runtime |
| --- | --- | --- |
| `mumumu6.net` | `mumumu6/portfolio` | Cloudflare Workers Static Assets |
| `2024.mumumu6.net` | `mumumu6/homepage` | Vercel |

The old Next.js site stays on Vercel as the 2024 archive. The current Astro site is generated completely at build time and deployed from `dist/`.

## Current state (2026-08-09)

- `mumumu6.net` resolves to Vercel (`76.76.21.21`) and serves the old Next.js site.
- `2024.mumumu6.net` does not have a DNS record yet.
- Authoritative DNS is hosted by ConoHa (`a.conoha-dns.com` / `b.conoha-dns.org`), not Cloudflare.
- `wrangler deploy --dry-run` succeeds for the Astro build.

Cloudflare Worker Custom Domains require an active Cloudflare zone. Do not add the `mumumu6.net` custom-domain route to `wrangler.jsonc` until the zone has been activated.

## Safe migration order

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

Do not remove `mumumu6.net` from Vercel before step 8 succeeds. Until then, rollback is simply keeping or restoring the apex A record to `76.76.21.21`.

## Wrangler domain route

After the Cloudflare zone is Active, add this to `wrangler.jsonc` and deploy:

```jsonc
"routes": [
  {
    "pattern": "mumumu6.net",
    "custom_domain": true
  }
]
```

The Worker name in Cloudflare must match `name` in `wrangler.jsonc`: `mumumu6-portfolio`.

## Automatic deployment

Workers Builds watches the public repository. Every update to `main`, including the reviewed AI-content publish job, runs the same `pnpm build:ci` gate before deployment. Pull requests are also checked by `.github/workflows/verify.yml`.
