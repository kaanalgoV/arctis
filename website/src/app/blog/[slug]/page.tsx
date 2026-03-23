import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticleLayout } from '@/components/blog/ArticleLayout'
import { getAllPosts, getPostBySlug, getPostSlugs } from '@/lib/blog'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>
}

// ─── Static Params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }))
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Article Not Found | Arctis',
    }
  }

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://arctis.trade/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

// ─── Article Page ──────────────────────────────────────────────────────────────

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const allPosts = getAllPosts()
  const currentIndex = allPosts.findIndex((p) => p.slug === slug)

  const prevPost =
    currentIndex > 0
      ? {
          slug: allPosts[currentIndex - 1].slug,
          title: allPosts[currentIndex - 1].title,
          category: allPosts[currentIndex - 1].category,
        }
      : null

  const nextPost =
    currentIndex < allPosts.length - 1
      ? {
          slug: allPosts[currentIndex + 1].slug,
          title: allPosts[currentIndex + 1].title,
          category: allPosts[currentIndex + 1].category,
        }
      : null

  return (
    <div className="bg-arctic-base min-h-screen">
      <Navbar />
      <ArticleLayout post={post} prevPost={prevPost} nextPost={nextPost} />
      <Footer />
    </div>
  )
}
