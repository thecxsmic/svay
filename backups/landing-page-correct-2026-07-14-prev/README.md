# Landing page backup (known-good)

**Created:** 2026-07-14  
**Source:** `svay/web` landing page (correct / working version)

## What's included

| Path in backup | Live path |
|---|---|
| `app/page.js` | `web/src/app/page.js` |
| `components/LandingPage.js` | `web/src/app/components/LandingPage.js` |
| `components/landing/*` | `web/src/app/components/landing/*` |
| `components/data/landing*.js` | `web/src/app/components/data/landing*.js` |
| related: SilkAurora, DemoDashboard, DemoLoginButton (if present) | same under `components/` |

## Restore (if edits go wrong)

```bash
bash /home/ubuntu/svay/backups/landing-page-correct-2026-07-14/RESTORE.sh
```

Or ask: "restore the landing page backup"
