import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  coverImage?: string
  content?: string
}

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(BLOG_DIR)
  const posts = files
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((filename) => {
      const slug = filename.replace(/\.(mdx|md)$/, '')
      const filePath = path.join(BLOG_DIR, filename)
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(raw)
      return {
        slug,
        title: data.title ?? '',
        description: data.description ?? '',
        date: data.date ?? '',
        author: data.author ?? '',
        tags: data.tags ?? [],
        coverImage: data.coverImage,
      } satisfies BlogPost
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return posts
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const extensions = ['.mdx', '.md']
  let filePath: string | null = null

  for (const ext of extensions) {
    const candidate = path.join(BLOG_DIR, `${slug}${ext}`)
    if (fs.existsSync(candidate)) {
      filePath = candidate
      break
    }
  }

  if (!filePath) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content: mdContent } = matter(raw)

  const processed = await remark().use(remarkHtml, { sanitize: false }).process(mdContent)
  const content = processed.toString()

  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ?? '',
    author: data.author ?? '',
    tags: data.tags ?? [],
    coverImage: data.coverImage,
    content,
  }
}

export function getAllTags(): string[] {
  const posts = getAllPosts()
  const tagSet = new Set<string>()
  posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)))
  return Array.from(tagSet)
}
