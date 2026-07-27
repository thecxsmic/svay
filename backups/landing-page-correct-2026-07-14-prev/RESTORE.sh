#!/usr/bin/env bash
# Restore the backed-up landing page into the live app.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
WEB_SRC="/home/ubuntu/svay/web/src/app"

echo "Restoring landing page backup from:"
echo "  $ROOT"
echo "into:"
echo "  $WEB_SRC"
echo

cp -a "$ROOT/app/page.js" "$WEB_SRC/page.js"
cp -a "$ROOT/components/LandingPage.js" "$WEB_SRC/components/LandingPage.js"
cp -a "$ROOT/components/landing/." "$WEB_SRC/components/landing/"
cp -a "$ROOT/components/data/landingContent.js" "$WEB_SRC/components/data/"
cp -a "$ROOT/components/data/landingFaq.js" "$WEB_SRC/components/data/"
cp -a "$ROOT/components/data/landingFeatures.js" "$WEB_SRC/components/data/"
cp -a "$ROOT/components/data/landingPricing.js" "$WEB_SRC/components/data/"
cp -a "$ROOT/components/data/landingTestimonials.js" "$WEB_SRC/components/data/"

for f in SilkAurora.js DemoDashboard.js DemoLoginButton.js; do
  if [ -f "$ROOT/components/$f" ]; then
    cp -a "$ROOT/components/$f" "$WEB_SRC/components/$f"
  fi
done

echo "Done. Landing page restored."
echo "Restart or refresh your Next.js dev server if it's running."
