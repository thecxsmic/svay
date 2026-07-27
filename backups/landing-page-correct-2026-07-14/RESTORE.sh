#!/usr/bin/env bash
# Restore the backed-up landing page into the live app.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
WEB="/home/ubuntu/svay/web"
APP="$WEB/src/app"

echo "Restoring landing page backup from:"
echo "  $ROOT"
echo

cp -a "$ROOT/app/page.js" "$APP/page.js" 2>/dev/null || true
cp -a "$ROOT/components/LandingPage.js" "$APP/components/LandingPage.js"
cp -a "$ROOT/components/landing/." "$APP/components/landing/"

if [ -d "$ROOT/components/data" ]; then
  mkdir -p "$APP/components/data"
  cp -a "$ROOT/components/data/." "$APP/components/data/" 2>/dev/null || true
fi

for f in SilkAurora.js DemoDashboard.js DemoLoginButton.js; do
  if [ -f "$ROOT/components/$f" ]; then
    cp -a "$ROOT/components/$f" "$APP/components/$f"
  fi
done

if [ -f "$ROOT/components/ui/hero-dithering-card.js" ]; then
  mkdir -p "$APP/components/ui"
  cp -a "$ROOT/components/ui/hero-dithering-card.js" "$APP/components/ui/"
fi

if [ -f "$ROOT/src-components/ui/features-10.jsx" ]; then
  mkdir -p "$WEB/src/components/ui"
  cp -a "$ROOT/src-components/ui/features-10.jsx" "$WEB/src/components/ui/"
fi

if [ -f "$ROOT/src-components/ui/features-10-demo.jsx" ]; then
  cp -a "$ROOT/src-components/ui/features-10-demo.jsx" "$WEB/src/components/ui/"
fi

if [ -f "$ROOT/src-components/blocks/features-10.jsx" ]; then
  mkdir -p "$WEB/src/components/blocks"
  cp -a "$ROOT/src-components/blocks/features-10.jsx" "$WEB/src/components/blocks/"
fi

echo "Done. Landing page restored to current known-good state."
echo "Refresh / restart Next.js if needed."
