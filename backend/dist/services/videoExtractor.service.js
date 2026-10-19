"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanAndNormalizeVideoUrl = cleanAndNormalizeVideoUrl;
exports.extractCleanEmbedFromWebPage = extractCleanEmbedFromWebPage;
const axios_1 = __importDefault(require("axios"));
/**
 * Normalizes video URLs and extracts embed sources from iframe codes or page links
 */
function cleanAndNormalizeVideoUrl(rawUrl) {
    if (!rawUrl)
        return '';
    let url = rawUrl.trim();
    // 1. If user pasted an iframe or embed HTML snippet, extract the src attribute
    const iframeMatch = url.match(/<iframe[^>]*\s+src=["']([^"']+)["']/i) ||
        url.match(/<embed[^>]*\s+src=["']([^"']+)["']/i);
    if (iframeMatch && iframeMatch[1]) {
        url = iframeMatch[1].trim();
    }
    // Handle protocol-relative URLs (e.g. //domain.com/embed)
    if (url.startsWith('//')) {
        url = 'https:' + url;
    }
    // 2. YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
        return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    // 3. Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
    if (vimeoMatch && vimeoMatch[3]) {
        return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
    }
    // 4. Streamtape (streamtape.com/v/ID -> streamtape.com/e/ID)
    const tapeMatch = url.match(/streamtape\.[a-z0-9]+\/(?:v|e)\/([a-zA-Z0-9]+)/i);
    if (tapeMatch && tapeMatch[1]) {
        return `https://streamtape.com/e/${tapeMatch[1]}/`;
    }
    // 5. Doodstream (dood.to, dood.watch, doodstream.com /d/ID -> /e/ID)
    const doodMatch = url.match(/(?:dood\.[a-z0-9]+|doodstream\.[a-z0-9]+)\/(?:d|e)\/([a-zA-Z0-9]+)/i);
    if (doodMatch && doodMatch[1]) {
        return `https://dood.to/e/${doodMatch[1]}`;
    }
    // 6. Mixdrop (mixdrop.co/f/ID -> mixdrop.co/e/ID)
    const mixMatch = url.match(/mixdrop\.[a-z0-9]+\/(?:f|e)\/([a-zA-Z0-9]+)/i);
    if (mixMatch && mixMatch[1]) {
        return `https://mixdrop.co/e/${mixMatch[1]}`;
    }
    // 7. Streamwish (streamwish.to/... -> streamwish.to/e/...)
    const wishMatch = url.match(/streamwish\.[a-z0-9]+\/(?:e\/)?([a-zA-Z0-9]+)/i);
    if (wishMatch && wishMatch[1]) {
        return `https://streamwish.to/e/${wishMatch[1]}`;
    }
    // 8. Filemoon (filemoon.sx/d/ID -> filemoon.sx/e/ID)
    const filemoonMatch = url.match(/filemoon\.[a-z0-9]+\/(?:d|e)\/([a-zA-Z0-9]+)/i);
    if (filemoonMatch && filemoonMatch[1]) {
        return `https://filemoon.sx/e/${filemoonMatch[1]}`;
    }
    // 9. Mp4Upload (mp4upload.com/ID -> mp4upload.com/embed-ID.html)
    const mp4upMatch = url.match(/mp4upload\.com\/(?:embed-)?([a-zA-Z0-9]+)(?:\.html)?/i);
    if (mp4upMatch && mp4upMatch[1] && !url.includes('/embed-')) {
        return `https://www.mp4upload.com/embed-${mp4upMatch[1]}.html`;
    }
    // 10. Vidguard (vidguard.to/v/ID -> vidguard.to/e/ID)
    const vgMatch = url.match(/vidguard\.[a-z0-9]+\/(?:v|e)\/([a-zA-Z0-9]+)/i);
    if (vgMatch && vgMatch[1]) {
        return `https://vidguard.to/e/${vgMatch[1]}`;
    }
    // 11. Voe (voe.sx/ID -> voe.sx/e/ID)
    const voeMatch = url.match(/voe\.sx\/(?:e\/)?([a-zA-Z0-9]+)/i);
    if (voeMatch && voeMatch[1] && !url.includes('/e/')) {
        return `https://voe.sx/e/${voeMatch[1]}`;
    }
    // 12. Luluvdo / Lulustream (luluvdo.com/ID -> luluvdo.com/e/ID)
    const luluMatch = url.match(/luluvdo\.[a-z0-9]+\/(?:e\/)?([a-zA-Z0-9]+)/i);
    if (luluMatch && luluMatch[1] && !url.includes('/e/')) {
        return `https://luluvdo.com/e/${luluMatch[1]}`;
    }
    return url;
}
/**
 * Given a URL, inspects whether it's already an embed/direct video.
 * If it's a full web page, fetches and scrapes the page to extract the actual embedded video player iframe or direct video file.
 */
async function extractCleanEmbedFromWebPage(pageUrl) {
    if (!pageUrl || !pageUrl.trim()) {
        return { cleanUrl: '', sourceType: 'original' };
    }
    // Step 1: Check if already an iframe snippet or known embed transform
    const normalized = cleanAndNormalizeVideoUrl(pageUrl);
    if (normalized !== pageUrl) {
        return { cleanUrl: normalized, sourceType: 'embed' };
    }
    // Direct media files
    if (/\.(mp4|m3u8|webm|ogg|mpd)(\?|$)/i.test(pageUrl)) {
        return { cleanUrl: pageUrl, sourceType: 'direct' };
    }
    // If already an /embed/ or /player/ URL, it's likely already clean
    if (/\/(embed|e|player|play)\//i.test(pageUrl)) {
        return { cleanUrl: pageUrl, sourceType: 'embed' };
    }
    // Step 2: Try fetching the web page to find embedded player or video tags
    try {
        const response = await axios_1.default.get(pageUrl, {
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            maxRedirects: 5,
        });
        const html = typeof response.data === 'string' ? response.data : '';
        if (!html) {
            return { cleanUrl: pageUrl, sourceType: 'original' };
        }
        // 1. Look for OpenGraph or Twitter player embeds
        const ogVideoMatch = html.match(/<meta\s+property=["']og:video(?::url|:secure_url)?["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:video(?::url|:secure_url)?["']/i);
        if (ogVideoMatch && ogVideoMatch[1]) {
            return { cleanUrl: cleanAndNormalizeVideoUrl(ogVideoMatch[1]), sourceType: 'extracted' };
        }
        const twitterPlayerMatch = html.match(/<meta\s+(?:name|property)=["']twitter:player["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+content=["']([^"']+)["']\s+(?:name|property)=["']twitter:player["']/i);
        if (twitterPlayerMatch && twitterPlayerMatch[1]) {
            return { cleanUrl: cleanAndNormalizeVideoUrl(twitterPlayerMatch[1]), sourceType: 'extracted' };
        }
        // 2. Look for inner iframes that host the actual video player
        const iframeMatches = [...html.matchAll(/<iframe[^>]*\s+src=["']([^"']+)["']/gi)];
        for (const match of iframeMatches) {
            const src = match[1];
            if (src.includes('embed') ||
                src.includes('/e/') ||
                src.includes('player') ||
                src.includes('streamtape') ||
                src.includes('dood') ||
                src.includes('mixdrop') ||
                src.includes('streamwish') ||
                src.includes('filemoon') ||
                src.includes('mp4upload') ||
                src.includes('vidguard') ||
                src.includes('voe') ||
                src.includes('luluvdo') ||
                src.includes('youtube') ||
                src.includes('vimeo')) {
                let clean = src.startsWith('//') ? 'https:' + src : src;
                if (clean.startsWith('/')) {
                    const parsed = new URL(pageUrl);
                    clean = `${parsed.protocol}//${parsed.host}${clean}`;
                }
                return { cleanUrl: cleanAndNormalizeVideoUrl(clean), sourceType: 'extracted' };
            }
        }
        // 3. Look for direct <video src="..."> or <source src="..."> tags
        const videoSrcMatch = html.match(/<video[^>]*\s+src=["']([^"']+)["']/i) ||
            html.match(/<source[^>]*\s+src=["']([^"']+)["']/i);
        if (videoSrcMatch && videoSrcMatch[1]) {
            let src = videoSrcMatch[1];
            if (src.startsWith('//'))
                src = 'https:' + src;
            else if (src.startsWith('/')) {
                const parsed = new URL(pageUrl);
                src = `${parsed.protocol}//${parsed.host}${src}`;
            }
            return { cleanUrl: src, sourceType: 'direct' };
        }
        // 4. Look for JavaScript player configs (e.g. JWPlayer, VideoJS, or HLS manifests)
        const scriptFileMatch = html.match(/(?:file|source|src):\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
        if (scriptFileMatch && scriptFileMatch[1]) {
            return { cleanUrl: scriptFileMatch[1], sourceType: 'direct' };
        }
        // Fallback: return normalized URL
        return { cleanUrl: normalized, sourceType: 'original' };
    }
    catch (err) {
        // If request failed (e.g. timeout or blocked), return normalized
        return { cleanUrl: normalized, sourceType: 'original' };
    }
}
