import re

# Read file as bytes first to see exact line endings
with open('index.html', encoding='utf-8') as f:
    content = f.read()

# Normalize all CRLF to LF for easier processing
content = content.replace('\r\n', '\n')

# 1) Add Supabase SDK script tag + replace GALLERY LOGIC comment
old_gallery_header = (
    '  </div>\n'
    '  <script>\n'
    '    // ──────────────────────────────────────────────────\n'
    '    //  GALLERY LOGIC\n'
    '    // ──────────────────────────────────────────────────\n'
)
new_gallery_header = (
    '  </div>\n'
    '  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n'
    '  <script>\n'
    '    // ── Supabase (Gallery) ──────────────────────────────────\n'
    "    const SUPABASE_URL = 'https://wqcugmhjfuvnwxhspytw.supabase.co';\n"
    "    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxY3VnbWhqZnV2bnd4aHNweXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzY2NzcsImV4cCI6MjA5MTYxMjY3N30.A2rZNI2hOpDNC_JLeQNO9Is50HswX-jB5he9wNOpYLo';\n"
    '    const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);\n'
    '    // ────────────────────────────────────────────────────────\n'
    '\n'
)

if old_gallery_header in content:
    content = content.replace(old_gallery_header, new_gallery_header, 1)
    print('Step 1 OK: SDK + config added')
else:
    print('Step 1 FAIL: header not found')

# 2) Replace hardcoded allEvents array with empty array
pattern_events = r'var allEvents = \[[\s\S]*?\];\n'
replacement_events = 'var allEvents = []; // Supabase-den yuklenir (en son meqale)\n'
new_content, count = re.subn(pattern_events, replacement_events, content, count=1)
if count:
    content = new_content
    print('Step 2 OK: allEvents cleared')
else:
    print('Step 2 FAIL: allEvents pattern not found')

# 3) Replace old fetchEvents function
pattern_fetch = r'async function fetchEvents\(\) \{[^}]*(?:\{[^}]*\}[^}]*)*\}\n'
pos = content.find('async function fetchEvents()')
if pos != -1:
    # find the function boundaries manually
    brace_count = 0
    start = content.find('{', pos)
    i = start
    while i < len(content):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end = i + 1
                break
        i += 1
    
    old_fetch = content[pos:end]
    new_fetch = (
        'async function fetchEvents() {\n'
        '      try {\n'
        '        const { data, error } = await sbClient\n'
        "          .from('articles')\n"
        "          .select('*')\n"
        "          .order('created_at', { ascending: false })\n"
        '          .limit(1);\n'
        '        if (error) throw error;\n'
        '        allEvents = data || [];\n'
        '      } catch (err) {\n'
        "        console.warn('Supabase fetch failed:', err);\n"
        '      }\n'
        "      document.getElementById('events-loader').style.display = 'none';\n"
        '      renderGallery();\n'
        '    }'
    )
    content = content[:pos] + new_fetch + content[end:]
    print('Step 3 OK: fetchEvents replaced')
else:
    print('Step 3 FAIL: fetchEvents not found')

# 4) Fix renderGallery: use allEvents[0] instead of allEvents[allEvents.length - 1]
old_render = (
    '      // Display only the last (latest) article on the home page\n'
    '      const ev = allEvents[allEvents.length - 1];\n'
    '      const index = allEvents.length - 1;\n'
)
new_render = (
    '      const ev = allEvents[0];\n'
    '      const index = 0;\n'
)
if old_render in content:
    content = content.replace(old_render, new_render, 1)
    print('Step 4 OK: renderGallery fixed')
else:
    print('Step 4 FAIL: renderGallery pattern not found')

# Write back (keep LF since we normalized)
with open('index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print('\nAll done! Verify with grep below.')
