export const DEFAULT_POSTER_FALLBACK = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
export const DEFAULT_BANNER_FALLBACK = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80';

export const handlePosterError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = DEFAULT_POSTER_FALLBACK;
};

export const handleBannerError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = DEFAULT_BANNER_FALLBACK;
};
