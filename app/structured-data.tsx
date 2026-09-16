export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Digital Tap",
    description: "Independent concept proposal for beacon-based contactless travel on the DLR. Not affiliated with TfL.",
    url: "https://digitaltap.antoniosmith.xyz",
    applicationCategory: "TransportationApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    creator: {
      "@type": "Organization",
      name: "Antonio Smith",
    },
    keywords: "DLR, digital tap, contactless travel, London transport, TfL, public transport",
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    audience: {
      "@type": "Audience",
      audienceType: "London commuters, DLR passengers, public transport users",
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}
