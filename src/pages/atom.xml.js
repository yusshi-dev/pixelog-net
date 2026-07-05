import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getPostSlug } from '../utils/slug';

export async function GET(context) {
  const blog = await getCollection('blog');
  return rss({
    title: 'Pixelog',
    description: '技術に関するメモと日記',
    site: context.site,
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.published_at,
      description: post.data.description,
      // Compute RSS link from post `id`
      // This example assumes all posts are rendered as `/blog/[id]` routes
      link: `/posts/${getPostSlug(post)}/`,
    })),
  });
}