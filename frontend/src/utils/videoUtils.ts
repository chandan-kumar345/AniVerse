/**
 * Front-end video URL normalization and extraction utility
 */

export function cleanAndNormalizeVideoUrl(rawUrl: string): string {
  if (!rawUrl) return '';
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

  // 2. YouTube (convert watch to embed)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  // 3. Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
  }

  // 4. Streamtape (/v/ -> /e/)
  const tapeMatch = url.match(/streamtape\.[a-z0-9]+\/(?:v|e)\/([a-zA-Z0-9]+)/i);
  if (tapeMatch && tapeMatch[1]) {
    return `https://streamtape.com/e/${tapeMatch[1]}/`;
  }

  // 5. Doodstream (/d/ -> /e/)
  const doodMatch = url.match(/(?:dood\.[a-z0-9]+|doodstream\.[a-z0-9]+)\/(?:d|e)\/([a-zA-Z0-9]+)/i);
  if (doodMatch && doodMatch[1]) {
    return `https://dood.to/e/${doodMatch[1]}`;
  }

  // 6. Mixdrop (/f/ -> /e/)
  const mixMatch = url.match(/mixdrop\.[a-z0-9]+\/(?:f|e)\/([a-zA-Z0-9]+)/i);
  if (mixMatch && mixMatch[1]) {
    return `https://mixdrop.co/e/${mixMatch[1]}`;
  }

  // 7. Streamwish (/e/...)
  const wishMatch = url.match(/streamwish\.[a-z0-9]+\/(?:e\/)?([a-zA-Z0-9]+)/i);
  if (wishMatch && wishMatch[1]) {
    return `https://streamwish.to/e/${wishMatch[1]}`;
  }

  // 8. Filemoon (/d/ -> /e/)
  const filemoonMatch = url.match(/filemoon\.[a-z0-9]+\/(?:d|e)\/([a-zA-Z0-9]+)/i);
  if (filemoonMatch && filemoonMatch[1]) {
    return `https://filemoon.sx/e/${filemoonMatch[1]}`;
  }

  // 9. Mp4Upload (/ID -> /embed-ID.html)
  const mp4upMatch = url.match(/mp4upload\.com\/(?:embed-)?([a-zA-Z0-9]+)(?:\.html)?/i);
  if (mp4upMatch && mp4upMatch[1] && !url.includes('/embed-')) {
    return `https://www.mp4upload.com/embed-${mp4upMatch[1]}.html`;
  }

  // 10. Vidguard (/v/ -> /e/)
  const vgMatch = url.match(/vidguard\.[a-z0-9]+\/(?:v|e)\/([a-zA-Z0-9]+)/i);
  if (vgMatch && vgMatch[1]) {
    return `https://vidguard.to/e/${vgMatch[1]}`;
  }

  // 11. Voe (/e/...)
  const voeMatch = url.match(/voe\.sx\/(?:e\/)?([a-zA-Z0-9]+)/i);
  if (voeMatch && voeMatch[1] && !url.includes('/e/')) {
    return `https://voe.sx/e/${voeMatch[1]}`;
  }

  // 12. Luluvdo (/e/...)
  const luluMatch = url.match(/luluvdo\.[a-z0-9]+\/(?:e\/)?([a-zA-Z0-9]+)/i);
  if (luluMatch && luluMatch[1] && !url.includes('/e/')) {
    return `https://luluvdo.com/e/${luluMatch[1]}`;
  }

  return url;
}

export function isDirectMediaFile(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|m3u8|webm|ogg|mpd)(\?|$)/i.test(url);
}
