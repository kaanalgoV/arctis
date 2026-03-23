'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { BlogCard } from './BlogCard'
import type { BlogPost } from '@/lib/blog'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BlogFilterProps {
  posts: BlogPost[]
  categories: string[]
}

// ─── BlogFilter ────────────────────────────────────────────────────────────────

export function BlogFilter({ posts, categories }: BlogFilterProps) {
  const [activeCategory, setActiveCategory] = useState('All')

  const allCategories = ['All', ...categories]

  const filteredPosts =
    activeCategory === 'All'
      ? posts
      : posts.filter((post) => post.category === activeCategory)

  const showFeatured = activeCategory === 'All'
  const featuredPost = showFeatured ? filteredPosts[0] : undefined
  const gridPosts = showFeatured ? filteredPosts.slice(1) : filteredPosts

  return (
    <div>
      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Filter articles by category">
        {allCategories.map((category) => (
          <button
            key={category}
            role="tab"
            aria-selected={activeCategory === category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer',
              activeCategory === category
                ? 'bg-ice-muted text-ice border border-ice/20'
                : 'text-frost-muted hover:text-frost-secondary bg-transparent border border-transparent',
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Featured post (All category only) */}
      <AnimatePresence mode="wait">
        {showFeatured && featuredPost && (
          <motion.div
            key={`featured-${featuredPost.slug}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <BlogCard post={featuredPost} featured />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtered posts section header */}
      {showFeatured && gridPosts.length > 0 && (
        <h2 className="font-display text-xl font-semibold text-frost-white mb-6">
          More Articles
        </h2>
      )}

      {/* Posts grid */}
      <AnimatePresence>
        {gridPosts.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {gridPosts.map((post) => (
                <motion.div
                  key={post.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <BlogCard post={post} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-frost-muted text-sm py-12 text-center"
          >
            No articles in this category yet.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
