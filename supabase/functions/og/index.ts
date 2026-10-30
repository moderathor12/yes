// Supabase Edge Function: og
// URL formatı: https://<project>.supabase.co/functions/v1/og?id=ARTICLE_OR_EVENT_ID&type=article
// type = 'article' (default) | 'event'
//
// Bu funksiya:
//   1. Botlar (WhatsApp, Telegram, İnstagram) üçün → OG meta taglarla HTML qaytarır
//   2. Adi istifadəçilər üçün → articles.html#article-ID-ə redirect edir

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = 'https://youthensoc.org';
const DEFAULT_IMG = `${SITE_URL}/plant-image.png`;
const DEFAULT_TITLE = 'Youth Environment Society — YES';
const DEFAULT_DESC = 'Empowering youth for a sustainable future through education, advocacy and environmental action.';

// User-Agent yoxlaması — botları aşkarlayır
function isBot(userAgent: string): boolean {
  const botPatterns = [
    'whatsapp', 'telegram', 'twitterbot', 'facebookexternalhit',
    'linkedinbot', 'slackbot', 'discordbot', 'applebot', 'googlebot',
    'bingbot', 'duckduckbot', 'vkshare', 'pinterest', 'instagram',
    'tumblr', 'embedly', 'quora', 'outbrain', 'screaming frog',
    'preview', 'crawler', 'spider', 'bot', 'curl', 'python-requests'
  ];
  const ua = userAgent.toLowerCase();
  return botPatterns.some(p => ua.includes(p));
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripMarkdown(text: string): string {
  return (text || '')
    .replace(/!\[.*?\]\(.*?\)/g, '')  // şəkillər
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // linklər
    .replace(/#{1,6}\s+/g, '')  // başlıqlar
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // bold
    .replace(/\*([^*]+)\*/g, '$1')  // italic
    .replace(/`([^`]+)`/g, '$1')  // kod
    .replace(/>\s+/g, '')  // quote
    .replace(/\n+/g, ' ')  // yeni sətir
    .replace(/<[^>]+>/g, '')  // HTML taglar
    .trim();
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const id   = url.searchParams.get('id')   || '';
  const type = url.searchParams.get('type') || 'article';
  const userAgent = req.headers.get('user-agent') || '';

  // Supabase client
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  let title       = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let image       = DEFAULT_IMG;
  let redirectUrl = `${SITE_URL}/articles.html`;
  let ogType      = 'website';

  if (id) {
    if (type === 'event') {
      const { data } = await sb
        .from('events')
        .select('title_en, title_az, desc_en, desc_az, image')
        .eq('id', id)
        .single();

      if (data) {
        title       = data.title_en || data.title_az || title;
        description = stripMarkdown(data.desc_en || data.desc_az || '').slice(0, 250);
        image       = data.image || DEFAULT_IMG;
        redirectUrl = `${SITE_URL}/events.html#event-${id}`;
        ogType      = 'article';
      } else {
        redirectUrl = `${SITE_URL}/events.html`;
      }
    } else {
      // default: article
      const { data } = await sb
        .from('articles')
        .select('title_en, title_az, desc_en, desc_az, image, status')
        .eq('id', id)
        .single();

      if (data && data.status === 'published') {
        title       = data.title_en || data.title_az || title;
        description = stripMarkdown(data.desc_en || data.desc_az || '').slice(0, 250);
        image       = data.image || DEFAULT_IMG;
        redirectUrl = `${SITE_URL}/articles.html#article-${id}`;
        ogType      = 'article';
      } else {
        redirectUrl = `${SITE_URL}/articles.html`;
      }
    }
  }

  const safeTitle = escapeHtml(title);
  const safeDesc  = escapeHtml(description || DEFAULT_DESC);
  const safeImg   = escapeHtml(image);
  const ogUrl     = escapeHtml(req.url);
  const safeRedir = escapeHtml(redirectUrl);

  // Botlar üçün OG HTML qaytarırıq, insanlar üçün redirect
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>

  <!-- Open Graph (WhatsApp, Facebook, LinkedIn, Telegram, Discord) -->
  <meta property="og:type"               content="${ogType}">
  <meta property="og:url"                content="${ogUrl}">
  <meta property="og:title"              content="${safeTitle}">
  <meta property="og:description"        content="${safeDesc}">
  <meta property="og:image"              content="${safeImg}">
  <meta property="og:image:width"        content="1200">
  <meta property="og:image:height"       content="630">
  <meta property="og:image:alt"          content="${safeTitle}">
  <meta property="og:site_name"          content="Youth Environment Society — YES">
  <meta property="og:locale"             content="en_US">

  <!-- Twitter / X Card -->
  <meta name="twitter:card"              content="summary_large_image">
  <meta name="twitter:title"             content="${safeTitle}">
  <meta name="twitter:description"       content="${safeDesc}">
  <meta name="twitter:image"             content="${safeImg}">
  <meta name="twitter:site"              content="@youthensoc">

  <!-- Adi istifadəçiləri redirect et -->
  <meta http-equiv="refresh" content="0;url=${safeRedir}">
</head>
<body>
  <p>Yönləndirilirsiniz... <a href="${safeRedir}">Buraya klikləyin</a></p>
  <script>window.location.replace("${redirectUrl}");</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300', // 5 dəqiqə cache
    },
  });
});
