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
    .replace(/!\[.*?\]\(.*?\)/g, '')   // Şəkilləri sil
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Linklərin yalnız mətnini saxla
    .replace(/#{1,6}\s+/g, '')        // Başlıq işarələrini sil
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold sil
    .replace(/\*([^*]+)\*/g, '$1')    // Italic sil
    .replace(/`([^`]+)`/g, '$1')      // Inline kod sil
    .replace(/>\s+/g, '')             // Blok sitatları sil
    .replace(/<[^>]+>/g, '')          // HTML teqləri sil
    .replace(/\s+/g, ' ')             // Çoxsaylı boşluqları birləşdir
    .trim();
  return cleaned.slice(0, 200) || DEFAULT_DESC;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') || '';
  const type = url.searchParams.get('type') || 'article';

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
      // Articles üçün
      const { data } = await sb
        .from('articles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      // status draft deyilsə (yəni published və ya null) göstər
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

  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = escapeHtml(image);
  const r = escapeHtml(redirectUrl);
  const pageUrl = escapeHtml(req.url);

  const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t}</title>

  <!-- Open Graph / Facebook / WhatsApp / Telegram / LinkedIn -->
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:image" content="${i}">
  <meta property="og:image:secure_url" content="${i}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Youth Environment Society — YES">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
  <meta name="twitter:image" content="${i}">
  <meta name="twitter:site" content="@youthensoc">

  <!-- Instant Browser Redirect for Real Users -->
  <meta http-equiv="refresh" content="0;url=${r}">
  <script>window.location.replace("${redirectUrl}");</script>
</head>
<body style="font-family:sans-serif;text-align:center;padding:2rem;">
  <p>Yönləndirilirsiniz... <a href="${r}">Davam etmək üçün bura klikləyin</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
});
