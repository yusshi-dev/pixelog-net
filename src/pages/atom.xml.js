import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getPostSlug } from '../utils/slug';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
  const blog = await getCollection('blog');

  const feed = blog
                .filter(post => !post.data.draft)
                .sort((a, b) => b.data.published_at.getTime() - a.data.published_at.getTime())
                .slice(0, 10);
  return rss({
    title: 'Pixelog',
    description: '技術に関するメモと日記',
    site: context.site,
    items: feed.map((post) => ({
      title: post.data.title,
      pubDate: post.data.published_at,
      description: post.data.description,
      // Compute RSS link from post `id`
      // This example assumes all posts are rendered as `/blog/[id]` routes
      link: `/posts/${getPostSlug(post)}/`,
      content: sanitizeHtml(parser.render(post.body)),
    })),
  });
}