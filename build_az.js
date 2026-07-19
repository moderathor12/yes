const fs = require('fs');
const path = require('path');

const filesToProcess = ['index.html', 'articles.html', 'wiki.html'];
const azDir = path.join(__dirname, 'az');

if (!fs.existsSync(azDir)) {
    fs.mkdirSync(azDir);
}

for (const file of filesToProcess) {
    if (!fs.existsSync(file)) {
        console.log(`Skipping ${file}, not found.`);
        continue;
    }
    
    let content = fs.readFileSync(file, 'utf-8');
    
    // Add hreflang tags to original file if not present
    if (!content.includes('hreflang="az"')) {
        const hreflangTags = `\n  <link rel="alternate" hreflang="az" href="https://youthensoc.org/az/${file === 'index.html' ? '' : file}" />
  <link rel="alternate" hreflang="en" href="https://youthensoc.org/${file === 'index.html' ? '' : file}" />
  <link rel="alternate" hreflang="x-default" href="https://youthensoc.org/${file === 'index.html' ? '' : file}" />`;
        content = content.replace('</title>', '</title>' + hreflangTags);
        fs.writeFileSync(file, content, 'utf-8');
    }

    // Prepare AZ content
    let azContent = content;

    // 1. Set language
    azContent = azContent.replace('<html lang="en">', '<html lang="az">');
    
    // 2. Set title and description
    if (file === 'index.html') {
        azContent = azContent.replace(/<title>.*?<\/title>/, '<title>Youth Environment Society \u2014 Gənclər Ekoloji Cəmiyyəti (YES)</title>');
        // Ensure meta description has Azerbaijani keywords
        if (!azContent.includes('Azərbaycanın gənc ekoloji liderləri')) {
             azContent = azContent.replace(/<meta name="description"[^>]*>/, '<meta name="description" content="Youth Environment Society (YES) \u2014 Azərbaycanın gənc ekoloji liderləri üçün platforma. Könüllülük, ekoloji təhsil və davamlı gələcək naminə fəaliyyət.">');
        }
    } else if (file === 'articles.html') {
        azContent = azContent.replace(/<title>.*?<\/title>/, '<title>YES Məqalələr \u2014 Gənclər Ekoloji Cəmiyyəti</title>');
    } else if (file === 'wiki.html') {
        azContent = azContent.replace(/<title>.*?<\/title>/, '<title>YES Wiki \u2014 Gənclər Ekoloji Cəmiyyəti</title>');
    }

    // 3. Fix paths
    if (!azContent.includes('<base href="../">')) {
        azContent = azContent.replace(/<head>/, '<head>\n  <base href="../">');
    }

    // 4. Extract translations block and translate elements
    const translationMatch = azContent.match(/var translations = (\{[\s\S]*?\n    \});/);
    if (translationMatch) {
        try {
            let translationsObj;
            eval(`translationsObj = ${translationMatch[1]}`);
            const azDict = translationsObj.az;

            if (azDict) {
                for (const [key, val] of Object.entries(azDict)) {
                    // Safe string replacement
                    const valEscaped = val.replace(/\$/g, '$$$$');
                    // Replace inner content of tags with data-translate
                    // E.g. <span data-translate="nav_about">About Us</span>
                    const regex1 = new RegExp(`(<[^>]+data-translate="${key}"[^>]*>)(.*?)(<\/[a-zA-Z0-9]+>)`, 'g');
                    azContent = azContent.replace(regex1, `$1${valEscaped}$3`);
                    
                    // E.g. <input placeholder="Search" data-translate="search">
                    const regex2 = new RegExp(`(placeholder=")([^"]+)("[^>]*data-translate="${key}")`, 'g');
                    azContent = azContent.replace(regex2, `$1${valEscaped}$3`);
                    
                    const regex3 = new RegExp(`(data-translate="${key}"[^>]*placeholder=")([^"]+)(")`, 'g');
                    azContent = azContent.replace(regex3, `$1${valEscaped}$3`);
                }
            }
        } catch(e) {
            console.error("Failed to parse translations for", file, e);
        }
    }

    fs.writeFileSync(path.join(azDir, file), azContent, 'utf-8');
    console.log(`Generated az/${file}`);
}
console.log("Done.");
