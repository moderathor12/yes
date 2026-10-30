import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = 'https://youthensoc.org';
const DEFAULT_IMG = `${SITE_URL}/plant-image.png`;
const DEFAULT_TITLE = 'Youth Environment Society — YES';
const DEFAULT_DESC = 'Empowering youth for a sustainable future through education, community organizing, and environmental action.';

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanDescription(text: string): string {
  if (!text) return DEFAULT_DESC;
  const cleaned = text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/>\s+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, 200) || DEFAULT_DESC;
}

// Botları (WhatsApp, Telegram, Instagram, Facebook və s.) aşkar edən funksiya
function isSocialBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const bots = [
    'whatsapp', 'telegram', 'facebookexternalhit', 'facebot',
    'twitterbot', 'linkedinbot', 'slackbot', 'discordbot',
    'instagram', 'applebot', 'googlebot', 'bingbot', 'duckduckbot',
    'vkshare', 'pinterest', 'skype', 'viber', 'redditbot', 'embedly',
    'quora link preview', 'outbrain', 'yahoo', 'crawler', 'spider'
  ];
  const ua = userAgent.toLowerCase();
  return bots.some(b => ua.includes(b));
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') || '';
  const type = url.searchParams.get('type') || 'article';
  const userAgent = req.headers.get('user-agent') || '';

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let image = DEFAULT_IMG;
  let redirectUrl = `${SITE_URL}/articles.html`;
  let ogType = 'website';

  if (id) {
    if (type === 'event') {
      const { data } = await sb
        .from('events')
        .select('title_en, title_az, desc_en, desc_az, image')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        title = data.title_en || data.title_az || title;
        description = cleanDescription(data.desc_en || data.desc_az);
        image = data.image && data.image.startsWith('http') ? data.image : DEFAULT_IMG;
        redirectUrl = `${SITE_URL}/events.html#event-${id}`;
        ogType = 'article';
      } else {
        redirectUrl = `${SITE_URL}/events.html`;
      }
    } else {
      // Articles
      const { data } = await sb
        .from('articles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data && data.status !== 'draft') {
        title = data.title_en || data.title_az || title;
        description = cleanDescription(data.desc_en || data.desc_az);
        image = data.image && data.image.startsWith('http') ? data.image : DEFAULT_IMG;
        redirectUrl = `${SITE_URL}/articles.html#article-${id}`;
        ogType = 'article';
      } else {
        redirectUrl = `${SITE_URL}/articles.html`;
      }
    }
  }

  // Əgər daxil olan real istifadəçidirsə (brauzerdirsə) -> DƏRHAL 302 ilə SAYTA YÖNLƏNDİR
  if (!isSocialBot(userAgent)) {
    return Response.redirect(redirectUrl, 302);
  }

  // Əgər WhatsApp, Telegram və s. botudursa -> Open Graph HTML qaytar
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = escapeHtml(image);
  const pageUrl = escapeHtml(req.url);

  const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <title>${t}</title>
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:image" content="${i}">
  <meta property="og:image:secure_url" content="${i}">
  <meta property="og:site_name" content="Youth Environment Society — YES">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
  <meta name="twitter:image" content="${i}">
</head>
<body></body>
</html>`;

  const headers = new Headers();
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=300');

  return new Response(html, {
    status: 200,
    headers: headers,
  });
});
