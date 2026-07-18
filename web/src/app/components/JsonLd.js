/** Server-safe JSON-LD for Organization + SoftwareApplication (landing SEO). */
export default function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://svay.space/#organization",
        name: "Svay",
        url: "https://svay.space",
        logo: {
          "@type": "ImageObject",
          url: "https://svay.space/web-app-manifest-512x512.png",
        },
        sameAs: [],
        contactPoint: {
          "@type": "ContactPoint",
          email: "help@svay.space",
          contactType: "customer support",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://svay.space/#website",
        url: "https://svay.space",
        name: "Svay",
        description:
          "YouTube creator intelligence — viral trend radar, competitor tracking, and growth analytics for serious creators.",
        publisher: { "@id": "https://svay.space/#organization" },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://svay.space/#app",
        name: "Svay Intelligence",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://svay.space",
        description:
          "Track viral YouTube trends, map competitors, and grow faster with creator analytics built for content strategy.",
        offers: {
          "@type": "Offer",
          price: "9.99",
          priceCurrency: "USD",
          priceValidUntil: "2027-12-31",
          availability: "https://schema.org/InStock",
          url: "https://svay.space/#pricing",
        },
        aggregateRating: undefined,
      },
    ],
  };

  // Strip undefined keys for clean JSON
  const clean = JSON.parse(JSON.stringify(data));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(clean) }}
    />
  );
}
