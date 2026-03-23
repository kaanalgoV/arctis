// Server component — no "use client"

// ─── Types ───────────────────────────────────────────────────────────────────

interface FaqItem {
  question: string
  answer: string
}

interface BlogPost {
  headline: string
  datePublished: string
  dateModified?: string
  authorName: string
  description?: string
  image?: string
  url?: string
}

// ─── Organization ─────────────────────────────────────────────────────────────

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Arctis',
    url: 'https://arctis.trade',
    logo: 'https://arctis.trade/logo.png',
    description: 'Professional-grade trading analysis platform for futures traders',
    sameAs: ['https://twitter.com/arctis_trade', 'https://github.com/arctis'],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ─── Software Application ─────────────────────────────────────────────────────

export function SoftwareApplicationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Arctis',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'macOS, Windows',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        name: 'Free',
      },
      {
        '@type': 'Offer',
        price: '49',
        priceCurrency: 'USD',
        name: 'Pro',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '347',
      bestRating: '5',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ─── FAQ Page ─────────────────────────────────────────────────────────────────

export function FAQPageJsonLd({ items }: { items: FaqItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ─── Blog Post ────────────────────────────────────────────────────────────────

export function BlogPostJsonLd({ post }: { post: BlogPost }) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.headline,
    datePublished: post.datePublished,
    author: {
      '@type': 'Person',
      name: post.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Arctis',
      logo: {
        '@type': 'ImageObject',
        url: 'https://arctis.trade/logo.png',
      },
    },
  }

  if (post.dateModified) schema.dateModified = post.dateModified
  if (post.description) schema.description = post.description
  if (post.image) schema.image = post.image
  if (post.url) schema.url = post.url

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
