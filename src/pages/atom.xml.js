import rss from '@astrojs/rss';
import { getPostSlug } from '../utils/slug';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { getPublishedPosts } from '../utils/posts';
import { SITE, FEED_MAX_ITEMS } from '../consts';

const parser = new MarkdownIt();

export async function GET(context) {
  const posts = (await getPublishedPosts()).slice(0, FEED_MAX_ITEMS);

  const response = await rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.published_at,
      link: `/posts/${getPostSlug(post)}/`,
      content: sanitizeHtml(parser.render(post.body)),
    })),
  });

  response.headers.set('Content-Type', 'application/rss+xml; charset=utf-8');
  return response;
}
