'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useSpring } from 'framer-motion'
import { ArrowLeft, ArrowRight, Calendar, Clock, Link2, Tag, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type BlogPost, getAllPosts, formatDate } from '@/lib/blog'
import { BlogCard } from '@/components/blog/BlogCard'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ArticleLayoutProps {
  post: BlogPost
  prevPost?: { slug: string; title: string; category: string } | null
  nextPost?: { slug: string; title: string; category: string } | null
}

interface TocItem {
  id: string
  text: string
}

// ─── Share Buttons ─────────────────────────────────────────────────────────────

function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const getUrl = () =>
    typeof window !== 'undefined' ? window.location.href : ''

  const handleTwitter = () => {
    const url = encodeURIComponent(getUrl())
    const text = encodeURIComponent(title)
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const handleLinkedIn = () => {
    const url = encodeURIComponent(getUrl())
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: do nothing silently
    }
  }

  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-xs text-frost-muted uppercase mr-1">Share</span>

      {/* Twitter/X */}
      <button
        onClick={handleTwitter}
        aria-label="Share on X (Twitter)"
        className="glass-card rounded-lg p-2 text-frost-muted hover:text-ice transition-colors duration-200"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      {/* LinkedIn */}
      <button
        onClick={handleLinkedIn}
        aria-label="Share on LinkedIn"
        className="glass-card rounded-lg p-2 text-frost-muted hover:text-ice transition-colors duration-200"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        aria-label="Copy link"
        className="glass-card rounded-lg p-2 text-frost-muted hover:text-ice transition-colors duration-200"
      >
        {copied ? (
          <span className="text-xs text-ice font-medium px-0.5">Copied</span>
        ) : (
          <Link2 className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function extractHeadings(html: string): TocItem[] {
  const matches = Array.from(html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi))
  return matches.map((match) => {
    // Strip any inner HTML tags from the heading text
    const text = match[1].replace(/<[^>]+>/g, '').trim()
    return { id: slugify(text), text }
  })
}

function injectHeadingIds(html: string): string {
  return html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_match, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim()
    const id = slugify(text)
    // Avoid double-injecting if id is already present
    if (/id=/.test(attrs)) return `<h2${attrs}>${inner}</h2>`
    return `<h2${attrs} id="${id}">${inner}</h2>`
  })
}

// ─── Table of Contents ─────────────────────────────────────────────────────────

function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    if (items.length === 0) return

    const headingEls = items
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost intersecting heading
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          // Pick the one closest to the top of the viewport
          const topmost = visible.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          )
          setActiveId(topmost.target.id)
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    )

    headingEls.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav aria-label="Table of contents" className="hidden lg:block">
      <div className="sticky top-28 glass-card p-4 rounded-xl">
        <p className="text-frost-muted text-xs uppercase tracking-wider mb-3 font-medium">
          Contents
        </p>
        <ul className="space-y-1.5">
          {items.map(({ id, text }) => (
            <li key={id}>
              <button
                onClick={() => {
                  const el = document.getElementById(id)
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className={cn(
                  'text-sm text-left w-full transition-colors duration-150 cursor-pointer leading-snug',
                  activeId === id
                    ? 'text-ice font-medium'
                    : 'text-frost-muted hover:text-ice'
                )}
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

// ─── Author Bio Card ────────────────────────────────────────────────────────────

function AuthorBioCard() {
  return (
    <div className="glass-card p-6 rounded-xl max-w-3xl mx-auto mt-12">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-ice-dark to-ice-muted flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-xs font-bold text-frost-white select-none">AR</span>
        </div>

        {/* Text */}
        <div>
          <p className="font-display font-semibold text-frost-white mb-1">
            Arctis Research
          </p>
          <p className="text-frost-secondary text-sm leading-relaxed">
            The Arctis Research team publishes analysis methodologies, platform
            documentation, and trading education. Content is reviewed by professional
            futures traders with a combined 40+ years of market experience.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Article Layout ────────────────────────────────────────────────────────────

export function ArticleLayout({ post, prevPost, nextPost }: ArticleLayoutProps) {
  const articleRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ['start start', 'end end'],
  })
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Extract ToC items and inject IDs into content once
  const tocItems = extractHeadings(post.content)
  const contentWithIds = injectHeadingIds(post.content)

  // Related posts: all posts except the current one, max 2
  const relatedPosts = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2)

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 origin-left z-50 rounded-r-full"
        style={{
          scaleX,
          background: 'linear-gradient(to right, var(--color-ice-dark), var(--color-ice))',
        }}
        aria-hidden="true"
      />

      <main ref={articleRef} className="bg-arctic-base min-h-screen">
        {/* Article header */}
        <header className="bg-arctic-primary border-b border-frost-border-subtle">
          <div className="section-container py-12 md:py-16">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-frost-muted hover:text-ice transition-colors duration-200 text-sm mb-8 group"
            >
              <ArrowLeft
                className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200"
                aria-hidden="true"
              />
              Back to Blog
            </Link>

            {/* Category badge */}
            <div className="mb-4">
              <span className="inline-block bg-ice-muted text-ice text-xs font-medium px-3 py-1 rounded-full">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-frost-white leading-tight mb-6 max-w-4xl">
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-frost-muted text-sm">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {post.readingTime}
              </span>
            </div>

            {/* Share buttons */}
            <ShareButtons title={post.title} />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Tag className="w-3.5 h-3.5 text-frost-muted flex-shrink-0" aria-hidden="true" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-frost-muted bg-arctic-raised px-2.5 py-0.5 rounded-md border border-frost-border-subtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Article body */}
        <div className="section-container py-12 md:py-16">
          {/* ToC + content grid */}
          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
            {/* Table of contents sidebar (desktop only) */}
            <TableOfContents items={tocItems} />

            {/* Main content column */}
            <div className="min-w-0">
              <div className="max-w-3xl">
                {/* Excerpt / lead */}
                <p className="text-frost-secondary text-lg leading-relaxed mb-10 pb-10 border-b border-frost-border-subtle font-medium">
                  {post.excerpt}
                </p>

                {/* HTML content */}
                <div
                  className="article-prose"
                  dangerouslySetInnerHTML={{ __html: contentWithIds }}
                />
              </div>

              {/* Author bio card */}
              <AuthorBioCard />

              {/* Prev/Next navigation */}
              {(prevPost || nextPost) && (
                <nav
                  aria-label="Article navigation"
                  className="mt-12 pt-10 border-t border-frost-border-subtle flex justify-between gap-4"
                >
                  {/* Previous */}
                  <div className="flex-1">
                    {prevPost ? (
                      <Link
                        href={`/blog/${prevPost.slug}`}
                        className="group flex flex-col gap-1 glass-card rounded-xl p-4 hover:border-frost-border transition-colors duration-200 h-full"
                      >
                        <span className="flex items-center gap-1.5 text-frost-muted text-xs uppercase tracking-wide">
                          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                          Previous
                        </span>
                        <span className="text-frost-white text-sm font-medium group-hover:text-ice transition-colors duration-200 line-clamp-2">
                          {prevPost.title}
                        </span>
                        <span className="text-frost-muted text-xs">{prevPost.category}</span>
                      </Link>
                    ) : (
                      <div />
                    )}
                  </div>

                  {/* Next */}
                  <div className="flex-1">
                    {nextPost ? (
                      <Link
                        href={`/blog/${nextPost.slug}`}
                        className="group flex flex-col gap-1 glass-card rounded-xl p-4 text-right hover:border-frost-border transition-colors duration-200 h-full"
                      >
                        <span className="flex items-center justify-end gap-1.5 text-frost-muted text-xs uppercase tracking-wide">
                          Next
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                        <span className="text-frost-white text-sm font-medium group-hover:text-ice transition-colors duration-200 line-clamp-2">
                          {nextPost.title}
                        </span>
                        <span className="text-frost-muted text-xs">{nextPost.category}</span>
                      </Link>
                    ) : (
                      <div />
                    )}
                  </div>
                </nav>
              )}

              {/* Related articles */}
              {relatedPosts.length > 0 && (
                <section className="mt-20 pt-12 border-t border-frost-border-subtle">
                  <h2 className="font-display text-2xl font-bold text-frost-white mb-8">
                    Continue Reading
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {relatedPosts.map((related) => (
                      <BlogCard key={related.slug} post={related} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
