'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type BlogPost, formatDate } from '@/lib/blog'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
}

// ─── BlogCard ──────────────────────────────────────────────────────────────────

export function BlogCard({ post, featured = false }: BlogCardProps) {
  if (featured) {
    return <FeaturedCard post={post} />
  }
  return <StandardCard post={post} />
}

// ─── Standard Card ─────────────────────────────────────────────────────────────

function StandardCard({ post }: { post: BlogPost }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <article className="glass-card rounded-2xl overflow-hidden h-full flex flex-col cursor-pointer">
          {/* Accent strip */}
          <div className="h-0.5 bg-gradient-to-r from-ice to-ice-light flex-shrink-0" />

          {/* Content */}
          <div className="p-6 flex flex-col flex-1">
            {/* Category badge */}
            <div className="mb-3">
              <span className="inline-block bg-ice-muted text-ice text-xs font-medium px-3 py-1 rounded-full">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h3
              className={cn(
                'font-display text-xl font-semibold text-frost-white leading-snug mb-2',
                'group-hover:text-ice-light transition-colors duration-200 line-clamp-2',
              )}
            >
              {post.title}
            </h3>

            {/* Excerpt */}
            <p className="text-frost-secondary text-sm leading-relaxed line-clamp-3 flex-1">
              {post.excerpt}
            </p>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-frost-border-subtle flex items-center justify-between">
              <span className="text-frost-muted text-xs">{post.author}</span>
              <div className="flex items-center gap-3 text-frost-muted text-xs">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {post.readingTime}
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}

// ─── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mb-10 col-span-full"
    >
      <Link href={`/blog/${post.slug}`} className="group block">
        <article
          className={cn(
            'glass-card rounded-2xl overflow-hidden cursor-pointer',
            'transition-shadow duration-300',
            'group-hover:shadow-[0_0_32px_0_rgba(92,184,240,0.15)]',
          )}
        >
          {/* Accent strip — taller for featured */}
          <div className="h-1.5 bg-gradient-to-r from-ice to-ice-light" />

          <div className="p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8">
            {/* Left: meta + title + excerpt */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                {/* Featured badge */}
                <span className="inline-block bg-ice text-arctic-base text-xs font-semibold px-3 py-1 rounded-full">
                  Featured
                </span>
                <span className="inline-block bg-ice-muted text-ice text-xs font-medium px-3 py-1 rounded-full">
                  {post.category}
                </span>
              </div>

              <h2
                className={cn(
                  'font-display text-2xl sm:text-3xl font-bold text-frost-white leading-tight mb-3',
                  'group-hover:text-ice-light transition-colors duration-200',
                )}
              >
                {post.title}
              </h2>

              <p className="text-frost-secondary text-base leading-relaxed line-clamp-3 mb-5">
                {post.excerpt}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-frost-muted bg-arctic-raised px-2.5 py-0.5 rounded-md border border-frost-border-subtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-frost-muted text-sm">
                <span>{post.author}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  {post.readingTime}
                </span>
              </div>
            </div>

            {/* Right: CTA arrow */}
            <div className="flex-shrink-0 flex items-center">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  'bg-ice-subtle border border-frost-border-subtle',
                  'group-hover:bg-ice-muted group-hover:border-ice/30 transition-all duration-200',
                )}
              >
                <ChevronRight
                  className="w-5 h-5 text-ice group-hover:translate-x-0.5 transition-transform duration-200"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}
