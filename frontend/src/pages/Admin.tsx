import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Shield,
  Film,
  Tv,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  Search,
  Volume2,
  X,
  Edit,
  Save,
  Plus,
  ExternalLink,
  Zap,
  Image,
  Trash2,
  Sparkles
} from 'lucide-react';
import { cleanAndNormalizeVideoUrl } from '../utils/videoUtils';

interface AdminStats {
  totalTitles: number;
  totalSeries: number;
  totalMovies: number;
  metadataVerified: number;
  availableTitles: number;
  unavailableTitles: number;
  verifiedEnglishDubs: number;
  verifiedHindiDubs: number;
  totalEpisodes: number;
  verifiedPlayableEpisodes: number;
  verifiedPlayableMovies: number;
  unverifiedMappings: number;
  errorMappings: number;
  providersCount: number;
}

export interface AdminEpisodeItem {
  id?: string;
  episodeNumber: number;
  title: string;
  videoUrl: string; // SUB URL
  dubVideoUrl?: string; // DUB URL
  hindiVideoUrl?: string; // HINDI URL
  duration?: string;
  status?: string;
}

interface AdminAnimeItem {
  id: string;
  slug: string;
  title: string;
  englishTitle?: string | null;
  contentType: string;
  type: string;
  genres: string;
  rating?: string | null;
  releasedYear?: number | null;
  score: number;
  status: string;
  availabilityStatus: string;
  hasDub: boolean;
  hasHindi: boolean;
  posterImage?: string | null;
  bannerImage?: string | null;
  videoUrl?: string | null;
  dubVideoUrl?: string | null;
  hindiVideoUrl?: string | null;
  episodes?: AdminEpisodeItem[];
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    episodes: number;
    videoMappings: number;
  };
}

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'catalog' | 'import' | 'media'>('stats');

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  // Catalog tab
  const [animeList, setAnimeList] = useState<AdminAnimeItem[]>([]);
  const [search, setSearch] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dubFilter, setDubFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingAnime, setLoadingAnime] = useState(false);

  // Edit Anime Modal
  const [editingAnime, setEditingAnime] = useState<AdminAnimeItem | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Bulk Import Tab
  const [bulkTitles, setBulkTitles] = useState('');
  const [bulkType, setBulkType] = useState<'series' | 'movie'>('series');
  const [bulkHasDub, setBulkHasDub] = useState(true);
  const [bulkHasHindi, setBulkHasHindi] = useState(false);
  const [bulkIs18Plus, setBulkIs18Plus] = useState(true);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importLog, setImportLog] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Media Quick-Linker Tab
  const [mediaItems, setMediaItems] = useState<AdminAnimeItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | '18plus' | 'missing_stream' | 'missing_poster' | 'stream_ready'>('all');
  const [mediaSort, setMediaSort] = useState<'newest' | 'oldest' | 'updated' | 'title_asc' | 'title_desc'>('newest');
  const [mediaPage, setMediaPage] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [mediaMessage, setMediaMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  // Episode Manager Modal State
  const [managingEpisodesAnime, setManagingEpisodesAnime] = useState<AdminAnimeItem | null>(null);
  const [modalEpisodes, setModalEpisodes] = useState<AdminEpisodeItem[]>([]);
  const [bulkEpLinks, setBulkEpLinks] = useState('');
  const [savingEpisodes, setSavingEpisodes] = useState(false);
  const [extractingEpNum, setExtractingEpNum] = useState<number | null>(null);
  const [epModalMessage, setEpModalMessage] = useState<string | null>(null);

  // Quick Add Anime Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAnime, setNewAnime] = useState({
    title: '',
    englishTitle: '',
    contentType: 'series',
    type: 'OVA',
    genres: '18+',
    rating: '18+',
    score: 7.5,
    releasedYear: new Date().getFullYear(),
    duration: '25 min',
    description: '',
    posterImage: '',
    videoUrl: '',
    dubVideoUrl: '',
    hindiVideoUrl: '',
    hasDub: false,
    hasHindi: false
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Auth header config with default admin key fallback
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Admin-Key': 'aniverse-admin-secret-2026'
      }
    };
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setApiError(null);
      const res = await axios.get('/api/admin/stats', getAuthHeaders());
      setStats(res.data);
    } catch (err: any) {
      console.error('Failed to fetch admin stats:', err);
      setApiError('Unable to connect to the backend server (http://localhost:5000). Please ensure your backend is started: cd backend && npm run dev');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAnimeList = async (pageNum = 1) => {
    try {
      setLoadingAnime(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (contentTypeFilter) params.append('contentType', contentTypeFilter);
      if (statusFilter) params.append('availabilityStatus', statusFilter);
      if (dubFilter === 'hindi') params.append('hasHindi', 'true');
      if (dubFilter === 'dub') params.append('hasDub', 'true');
      params.append('page', String(pageNum));
      params.append('limit', '15');

      const res = await axios.get(`/api/admin/anime?${params.toString()}`, getAuthHeaders());
      setAnimeList(res.data.animeList || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch admin anime list:', err);
    } finally {
      setLoadingAnime(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchAnimeList(1);
    } else if (activeTab === 'media') {
      fetchMediaItems();
    }
  }, [activeTab, contentTypeFilter, statusFilter, dubFilter]);

  const fetchMediaItems = async () => {
    try {
      setLoadingMedia(true);
      const res = await axios.get('/api/admin/anime?limit=0', getAuthHeaders());
      setMediaItems(res.data.animeList || []);
    } catch (err: any) {
      console.error('Failed to fetch media list:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleInlineMediaChange = (id: string, field: 'posterImage' | 'videoUrl' | 'dubVideoUrl' | 'hindiVideoUrl', value: string) => {
    setMediaItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleUpdateMediaRow = async (item: AdminAnimeItem) => {
    try {
      setSavingId(item.id);
      const payload: any = {
        rating: item.rating || undefined
      };
      if (typeof item.posterImage === 'string' && item.posterImage.trim().length > 0) {
        payload.posterImage = item.posterImage.trim();
      }
      if (typeof item.videoUrl === 'string') {
        payload.videoUrl = item.videoUrl.trim();
      }
      if (typeof item.dubVideoUrl === 'string') {
        payload.dubVideoUrl = item.dubVideoUrl.trim();
      }
      if (typeof item.hindiVideoUrl === 'string') {
        payload.hindiVideoUrl = item.hindiVideoUrl.trim();
      }
      await axios.put(`/api/admin/anime/${item.id}`, payload, getAuthHeaders());
      setMediaMessage(`✓ Saved media for "${item.title}"`);
      setTimeout(() => setMediaMessage(null), 3000);
      fetchStats();
    } catch (err: any) {
      alert(`Save error: ${err.response?.data?.error || err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const extractUrlFromDataTransfer = (dt: DataTransfer): string | null => {
    // 1. HIGHEST PRIORITY: When dragging from a browser webpage, Chrome wraps the element in text/html.
    // Inspect text/html FIRST to extract the real <img src> instead of the parent <a href> webpage link!
    const html = dt.getData('text/html');
    if (html) {
      // 1a. Check lazy-loaded attributes first (many anime sites use data-src, data-original, data-lazy-src)
      const lazyMatch = html.match(/<img[^>]+(?:data-src|data-original|data-lazy-src)=["']([^"']+)["']/i);
      if (lazyMatch && lazyMatch[1]) {
        let u = lazyMatch[1].trim();
        if (u.startsWith('//')) u = `https:${u}`;
        if (u.startsWith('http://') || u.startsWith('https://')) return u;
      }

      // 1b. Check standard src on <img> (ignore inline base64 data: placeholders)
      const srcMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        let u = srcMatch[1].trim();
        if (u.startsWith('//')) u = `https:${u}`;
        if (!u.startsWith('data:') && (u.startsWith('http://') || u.startsWith('https://'))) {
          return u;
        }
      }

      // 1c. Check srcset
      const srcsetMatch = html.match(/<img[^>]+srcset=["']([^"']+)["']/i);
      if (srcsetMatch && srcsetMatch[1]) {
        let first = srcsetMatch[1].split(',')[0].trim().split(' ')[0].trim();
        if (first.startsWith('//')) first = `https:${first}`;
        if (first.startsWith('http://') || first.startsWith('https://')) return first;
      }
    }

    // 2. SECOND PRIORITY: text/uri-list
    const uriList = dt.getData('text/uri-list');
    if (uriList) {
      const firstLine = uriList.split('\r\n')[0].trim();
      if (firstLine.startsWith('http://') || firstLine.startsWith('https://')) {
        return firstLine;
      }
    }

    // 3. THIRD PRIORITY: text/plain
    const text = dt.getData('text/plain');
    if (text) {
      const clean = text.trim();
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        return clean;
      }
    }
    return null;
  };

  const handleInlineImageUpload = async (id: string, file: File) => {
    try {
      setUploadingImageId(id);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) {
          setUploadingImageId(null);
          return;
        }
        try {
          const res = await axios.post('/api/admin/upload/image', {
            image: base64,
            fileName: file.name
          }, getAuthHeaders());
          const uploadedUrl = res.data.url;
          
          setMediaItems(prev => prev.map(m => m.id === id ? { ...m, posterImage: uploadedUrl } : m));

          await axios.put(`/api/admin/anime/${id}`, {
            posterImage: uploadedUrl
          }, getAuthHeaders());

          setMediaMessage(`✓ Image uploaded & saved for "${file.name}"!`);
          setTimeout(() => setMediaMessage(null), 3000);
          fetchStats();
        } catch (uploadErr: any) {
          alert(`Image upload failed: ${uploadErr.response?.data?.error || uploadErr.message}`);
        } finally {
          setUploadingImageId(null);
        }
      };
      reader.onerror = () => {
        setUploadingImageId(null);
        alert('Failed to read image file');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadingImageId(null);
      alert(`Error reading file: ${err.message}`);
    }
  };

  const handleDropImage = async (id: string, e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);

    // Case 1: Native image file dropped from PC
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await handleInlineImageUpload(id, file);
        return;
      }
    }

    // Case 2: Web image URL or card dropped from another tab
    const rawUrl = extractUrlFromDataTransfer(e.dataTransfer);
    if (rawUrl) {
      try {
        setUploadingImageId(id);
        setMediaMessage(`Downloading and caching poster...`);

        // Automatically resolve page links to og:image and cache locally to prevent hotlink blocks
        let finalUrl = rawUrl;
        try {
          const res = await axios.post('/api/admin/resolve-image', { url: rawUrl }, getAuthHeaders());
          if (res.data?.url) {
            finalUrl = res.data.url;
          }
        } catch (resolveErr) {
          console.warn('Backend resolve-image skipped:', resolveErr);
        }

        setMediaItems(prev => prev.map(m => m.id === id ? { ...m, posterImage: finalUrl } : m));
        await axios.put(`/api/admin/anime/${id}`, {
          posterImage: finalUrl
        }, getAuthHeaders());

        setMediaMessage(`✓ Poster updated & cached locally!`);
        setTimeout(() => setMediaMessage(null), 3000);
        fetchStats();
      } catch (err: any) {
        alert(`Failed to save dropped image URL: ${err.response?.data?.error || err.message}`);
      } finally {
        setUploadingImageId(null);
      }
    }
  };

  const handleOpenEpisodeManager = async (item: AdminAnimeItem) => {
    try {
      setManagingEpisodesAnime(item);
      setBulkEpLinks('');
      setEpModalMessage(null);
      const res = await axios.get(`/api/admin/anime/${item.id}/episodes`, getAuthHeaders());
      let eps: AdminEpisodeItem[] = res.data.episodes || [];
      const validEps = eps.filter((e: any) => 
        (e.videoUrl && e.videoUrl.trim().length > 0) ||
        (e.dubVideoUrl && e.dubVideoUrl.trim().length > 0) ||
        (e.hindiVideoUrl && e.hindiVideoUrl.trim().length > 0)
      );
      if (validEps.length > 0) {
        eps = validEps;
      } else if (eps.length === 0 || eps.length > 1) {
        eps = [
          {
            episodeNumber: 1,
            title: 'Episode 1',
            videoUrl: item.videoUrl || '',
            dubVideoUrl: item.dubVideoUrl || '',
            hindiVideoUrl: item.hindiVideoUrl || '',
            duration: '24 min'
          }
        ];
      }
      setModalEpisodes(eps);
    } catch (err: any) {
      console.error('Failed to load episodes:', err);
      setModalEpisodes(item.episodes || [{
        episodeNumber: 1,
        title: 'Episode 1',
        videoUrl: item.videoUrl || '',
        dubVideoUrl: item.dubVideoUrl || '',
        hindiVideoUrl: item.hindiVideoUrl || '',
        duration: '24 min'
      }]);
    }
  };

  const handleAddModalEpisode = () => {
    const nextNum = modalEpisodes.length > 0 ? Math.max(...modalEpisodes.map(e => e.episodeNumber)) + 1 : 1;
    setModalEpisodes(prev => [
      ...prev,
      {
        episodeNumber: nextNum,
        title: `Episode ${nextNum}`,
        videoUrl: '',
        dubVideoUrl: '',
        hindiVideoUrl: '',
        duration: '24 min'
      }
    ]);
  };

  const handleAddMultipleEpisodes = (count: number) => {
    setModalEpisodes(prev => {
      const startNum = prev.length > 0 ? Math.max(...prev.map(e => e.episodeNumber)) + 1 : 1;
      const newEps: AdminEpisodeItem[] = [];
      for (let i = 0; i < count; i++) {
        const num = startNum + i;
        newEps.push({
          episodeNumber: num,
          title: `Episode ${num}`,
          videoUrl: '',
          dubVideoUrl: '',
          hindiVideoUrl: '',
          duration: '24 min'
        });
      }
      return [...prev, ...newEps];
    });
  };

  const handleBulkAssignEpisodeLinks = () => {
    if (!bulkEpLinks.trim()) return;
    const lines = bulkEpLinks.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    setModalEpisodes(prev => {
      const updated = [...prev];
      lines.forEach((line, idx) => {
        const epNum = idx + 1;
        const cleanUrl = cleanAndNormalizeVideoUrl(line);
        const existingIdx = updated.findIndex(e => e.episodeNumber === epNum);
        if (existingIdx >= 0) {
          updated[existingIdx] = { ...updated[existingIdx], videoUrl: cleanUrl };
        } else {
          updated.push({
            episodeNumber: epNum,
            title: `Episode ${epNum}`,
            videoUrl: cleanUrl,
            duration: '24 min'
          });
        }
      });
      return updated.sort((a, b) => a.episodeNumber - b.episodeNumber);
    });

    setEpModalMessage(`✓ Auto-assigned ${lines.length} links to episodes! Click "Save All Episodes" below.`);
    setBulkEpLinks('');
  };

  const handleExtractVideoForEpisode = async (epNum: number, currentUrl: string) => {
    if (!currentUrl) {
      alert('Please enter or paste a URL first.');
      return;
    }
    try {
      setExtractingEpNum(epNum);
      const res = await axios.post('/api/admin/extract-video', { url: currentUrl }, getAuthHeaders());
      const clean = res.data.cleanUrl || currentUrl;
      setModalEpisodes(prev => prev.map(e => e.episodeNumber === epNum ? { ...e, videoUrl: clean } : e));
      setEpModalMessage(`✓ Clean video player embed extracted for Episode ${epNum}!`);
    } catch (err: any) {
      alert(`Extract failed: ${err.message}`);
    } finally {
      setExtractingEpNum(null);
    }
  };

  const handleExtractVideoRow = async (item: AdminAnimeItem) => {
    if (!item.videoUrl) return;
    try {
      setSavingId(item.id);
      const res = await axios.post('/api/admin/extract-video', { url: item.videoUrl }, getAuthHeaders());
      const clean = res.data.cleanUrl || item.videoUrl;
      handleInlineMediaChange(item.id, 'videoUrl', clean);
      await axios.put(`/api/admin/anime/${item.id}`, { videoUrl: clean }, getAuthHeaders());
      setMediaMessage(`✓ Extracted clean player embed for "${item.title}"!`);
      setTimeout(() => setMediaMessage(null), 3000);
      fetchStats();
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAllEpisodes = async () => {
    if (!managingEpisodesAnime) return;
    try {
      setSavingEpisodes(true);
      const res = await axios.put(
        `/api/admin/anime/${managingEpisodesAnime.id}/episodes`,
        { episodes: modalEpisodes },
        getAuthHeaders()
      );
      const savedEpisodes = res.data.episodes;
      setMediaItems(prev => prev.map(m => m.id === managingEpisodesAnime.id ? {
        ...m,
        episodes: savedEpisodes,
        videoUrl: savedEpisodes[0]?.videoUrl || m.videoUrl
      } : m));
      setAnimeList(prev => prev.map(a => a.id === managingEpisodesAnime.id ? {
        ...a,
        episodes: savedEpisodes,
        videoUrl: savedEpisodes[0]?.videoUrl || a.videoUrl
      } : a));
      setMediaMessage(`✓ Saved ${savedEpisodes.length} episodes for "${managingEpisodesAnime.title}"!`);
      setTimeout(() => setMediaMessage(null), 4000);
      setManagingEpisodesAnime(null);
      fetchStats();
    } catch (err: any) {
      alert(`Save episodes error: ${err.message}`);
    } finally {
      setSavingEpisodes(false);
    }
  };

  const handleDeleteEpisode = (epNum: number) => {
    setModalEpisodes(prev => prev.filter(e => e.episodeNumber !== epNum));
  };

  const handleCsvMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return;

      const parseLine = (line: string): string[] => {
        const match = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
        if (!match) return [];
        return match.map((m) => {
          let val = m.startsWith(',') ? m.slice(1) : m;
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          return val.trim();
        });
      };

      const headers = parseLine(lines[0]).map(h => h.toLowerCase());
      const hasHeader = headers.some(h => h.includes('title'));
      const startIndex = hasHeader ? 1 : 0;

      let titleIdx = 0;
      let posterIdx = 1;
      const epIndices: Array<{ idx: number; epNum: number }> = [];

      if (hasHeader) {
        titleIdx = headers.findIndex(h => h.includes('title'));
        if (titleIdx === -1) titleIdx = 0;
        posterIdx = headers.findIndex(h => h.includes('poster') || h.includes('image'));

        headers.forEach((h, idx) => {
          if (idx === titleIdx || idx === posterIdx) return;
          const match = h.match(/episode[_\s-]*(\d+)/i) || h.match(/ep[_\s-]*(\d+)/i);
          if (match) {
            epIndices.push({ idx, epNum: parseInt(match[1], 10) });
          } else if (h.includes('video') || h.includes('embed') || h.includes('url')) {
            epIndices.push({ idx, epNum: 1 });
          }
        });
      } else {
        epIndices.push({ idx: 2, epNum: 1 });
      }

      const batchItems: any[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const parts = parseLine(lines[i]);
        if (parts.length === 0) continue;

        const title = parts[titleIdx];
        const posterImage = posterIdx !== -1 ? (parts[posterIdx] || '') : '';
        const episodes: Array<{ episodeNumber: number; videoUrl: string }> = [];

        for (const epInfo of epIndices) {
          const rawUrl = parts[epInfo.idx];
          if (rawUrl && rawUrl.trim()) {
            episodes.push({
              episodeNumber: epInfo.epNum,
              videoUrl: cleanAndNormalizeVideoUrl(rawUrl.trim())
            });
          }
        }

        if (title && (posterImage || episodes.length > 0)) {
          batchItems.push({
            title,
            posterImage,
            videoUrl: episodes.find(e => e.episodeNumber === 1)?.videoUrl || '',
            episodes
          });
        }
      }

      if (batchItems.length === 0) {
        alert('No rows with poster or video links found in CSV.');
        return;
      }

      try {
        setLoadingMedia(true);
        const res = await axios.post('/api/admin/media/batch', { items: batchItems }, getAuthHeaders());
        setMediaMessage(`✓ ${res.data.message}`);
        fetchMediaItems();
        fetchStats();
      } catch (err: any) {
        alert(`CSV import error: ${err.message}`);
      } finally {
        setLoadingMedia(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadCsvTemplate = () => {
    const rows = ['Title,Poster_Image_URL,Episode_1,Episode_2,Episode_3,Episode_4'];
    const currentList = mediaItems.length > 0 ? mediaItems : animeList;
    currentList.forEach(item => {
      const safeTitle = `"${item.title.replace(/"/g, '""')}"`;
      const poster = item.posterImage ? `"${item.posterImage}"` : '""';
      const ep1 = item.episodes?.find(e => e.episodeNumber === 1)?.videoUrl || item.videoUrl || '';
      const ep2 = item.episodes?.find(e => e.episodeNumber === 2)?.videoUrl || '';
      const ep3 = item.episodes?.find(e => e.episodeNumber === 3)?.videoUrl || '';
      const ep4 = item.episodes?.find(e => e.episodeNumber === 4)?.videoUrl || '';
      rows.push(`${safeTitle},${poster},"${ep1}","${ep2}","${ep3}","${ep4}"`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'anime_media_links.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runAudit = async () => {
    try {
      setAuditRunning(true);
      setAuditMessage(null);
      const res = await axios.post('/api/admin/verify/audit', {}, getAuthHeaders());
      setAuditMessage(`Audit Completed: ${res.data.audit.totalChecked} checked, ${res.data.audit.verifiedAvailable} available.`);
      await fetchStats();
      if (activeTab === 'catalog') fetchAnimeList(page);
    } catch (err: any) {
      setAuditMessage(`Audit error: ${err.message}`);
    } finally {
      setAuditRunning(false);
    }
  };

  const exportData = async () => {
    try {
      window.open('/api/admin/export', '_blank');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            const titles = parsed
              .map((item: any) => (typeof item === 'string' ? item : item.title))
              .filter(Boolean);
            setBulkTitles(titles.join('\n'));
            setImportLog(`Successfully loaded ${titles.length} titles from ${file.name}. Review below and click "Start Bulk Import".`);
          }
        } catch (err: any) {
          alert(`Invalid JSON format: ${err.message}`);
        }
      } else if (file.name.endsWith('.csv')) {
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        const startIndex = lines[0].toLowerCase().includes('title') ? 1 : 0;
        const titles: string[] = [];
        for (let i = startIndex; i < lines.length; i++) {
          const match = lines[i].match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
          if (match && match[0]) {
            let t = match[0].startsWith(',') ? match[0].slice(1) : match[0];
            if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
            if (t.trim()) titles.push(t.trim());
          }
        }
        setBulkTitles(titles.join('\n'));
        setImportLog(`Successfully loaded ${titles.length} titles from CSV ${file.name}. Review below and click "Start Bulk Import".`);
      } else {
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        setBulkTitles(lines.join('\n'));
        setImportLog(`Successfully loaded ${lines.length} titles from ${file.name}. Review below and click "Start Bulk Import".`);
      }
    };

    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!bulkTitles.trim()) return;
    try {
      setImportLoading(true);
      setImportLog(null);
      const titlesArray = bulkTitles
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await axios.post('/api/admin/import/bulk', {
        titles: titlesArray,
        contentType: bulkType,
        defaultHasDub: bulkHasDub,
        defaultHasHindi: bulkHasHindi,
        defaultGenres: bulkIs18Plus ? '18+' : undefined,
        defaultRating: bulkIs18Plus ? '18+' : undefined
      }, getAuthHeaders());

      setImportLog(`✓ Successfully processed ${res.data.importedCount} titles (${res.data.failedCount} failures).`);
      setBulkTitles('');
      setUploadedFileName(null);
      fetchStats();
    } catch (err: any) {
      setImportLog(`Import Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveAnime = async () => {
    if (!editingAnime) return;
    try {
      setSaveLoading(true);
      await axios.put(`/api/admin/anime/${editingAnime.id}`, editingAnime, getAuthHeaders());
      setEditingAnime(null);
      fetchAnimeList(page);
      fetchStats();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCreateAnime = async () => {
    if (!newAnime.title.trim()) {
      alert('Please enter an anime title.');
      return;
    }
    try {
      setCreateLoading(true);
      await axios.post('/api/admin/anime', newAnime, getAuthHeaders());
      setIsAddModalOpen(false);
      setNewAnime({
        title: '',
        englishTitle: '',
        contentType: 'series',
        type: 'OVA',
        genres: '18+',
        rating: '18+',
        score: 7.5,
        releasedYear: new Date().getFullYear(),
        duration: '25 min',
        description: '',
        posterImage: '',
        videoUrl: '',
        dubVideoUrl: '',
        hindiVideoUrl: '',
        hasDub: false,
        hasHindi: false
      });
      fetchStats();
      fetchAnimeList(1);
      alert('Anime published successfully!');
    } catch (err: any) {
      alert(`Create Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ padding: '30px 24px', color: '#fff' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
              <Shield size={24} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, margin: 0 }}>
                AniVerse Catalog Administration
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
                Manage 400 titles, verified video mappings, Hindi/English dubbing, and content integrity.
              </p>
            </div>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="nm-btn-primary"
            style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 800 }}
          >
            <Plus size={16} /> Add Anime
          </button>

          <button
            onClick={runAudit}
            disabled={auditRunning}
            className="nm-pill"
            style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700 }}
          >
            <RefreshCw size={15} style={{ color: 'var(--color-primary)', animation: auditRunning ? 'spin 1s linear infinite' : 'none' }} />
            {auditRunning ? 'Auditing...' : 'Run Verification Audit'}
          </button>

          <button
            onClick={exportData}
            className="nm-pill"
            style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', color: '#cbd5e1', fontSize: '13px', fontWeight: 700 }}
          >
            <Download size={15} style={{ color: '#06b6d4' }} /> Export Catalog JSON
          </button>
        </div>
      </div>

      {auditMessage && (
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(243, 46, 53, 0.3)', borderRadius: '12px', padding: '12px 20px', marginBottom: '20px', color: 'var(--color-primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={16} />
          <span>{auditMessage}</span>
        </div>
      )}

      {apiError && (
        <div style={{ background: '#1e111a', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', color: '#f87171', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <strong>Backend Connection Notice:</strong> {apiError}
          </div>
        </div>
      )}

      {/* ADMIN NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('stats')}
          className={`nav-pill ${activeTab === 'stats' ? 'active' : ''}`}
          style={{ border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, padding: '8px 20px' }}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`nav-pill ${activeTab === 'catalog' ? 'active' : ''}`}
          style={{ border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, padding: '8px 20px' }}
        >
          Catalog Manager ({stats?.totalTitles || 0})
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`nav-pill ${activeTab === 'import' ? 'active' : ''}`}
          style={{ border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, padding: '8px 20px' }}
        >
          Bulk Import Studio
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`nav-pill ${activeTab === 'media' ? 'active' : ''}`}
          style={{ border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Zap size={14} style={{ color: '#ec4899' }} /> Fast Media Linker
        </button>
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'stats' && (
        <div>
          {loadingStats ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Loading metrics...
            </div>
          ) : stats ? (
            <div>
              {/* PRIMARY STAT METRIC CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                
                <div className="nm-card" style={{ padding: '20px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                    <span>Total Library Titles</span>
                    <Film size={18} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginTop: '10px' }}>
                    {stats.totalTitles}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {stats.totalSeries} Series • {stats.totalMovies} Movies
                  </div>
                </div>

                <div className="nm-card" style={{ padding: '20px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                    <span>Metadata Verified</span>
                    <CheckCircle size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '10px' }}>
                    {stats.metadataVerified}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    100% Verified against AniList/MAL Index
                  </div>
                </div>

                <div className="nm-card" style={{ padding: '20px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                    <span>Verified Playable Series</span>
                    <Tv size={18} style={{ color: '#06b6d4' }} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#06b6d4', marginTop: '10px' }}>
                    {stats.verifiedPlayableEpisodes} eps
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Mapped across canonical video nodes
                  </div>
                </div>

                <div className="nm-card" style={{ padding: '20px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                    <span>Verified Playable Movies</span>
                    <Film size={18} style={{ color: '#f59e0b' }} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', marginTop: '10px' }}>
                    {stats.verifiedPlayableMovies} movies
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Full-length feature film releases
                  </div>
                </div>
              </div>

              {/* DUBBING & INTEGRITY AUDIT CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                
                <div className="nm-card" style={{ padding: '24px', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Volume2 size={18} style={{ color: 'var(--color-primary)' }} /> Verified Dubbing Availability
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#10121d', padding: '12px 16px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>🇯🇵</span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Japanese Audio (CC Subtitled)</span>
                      </div>
                      <span className="nm-tag" style={{ color: '#10b981', fontWeight: 800 }}>{stats.totalTitles} Titles (100%)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#10121d', padding: '12px 16px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>🎙️</span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>English-Dubbed Releases</span>
                      </div>
                      <span className="nm-tag" style={{ color: '#06b6d4', fontWeight: 800 }}>{stats.verifiedEnglishDubs} Titles</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#10121d', padding: '12px 16px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>🇮🇳</span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Hindi-Dubbed Releases (Verified)</span>
                      </div>
                      <span className="nm-tag" style={{ color: '#f59e0b', fontWeight: 800 }}>{stats.verifiedHindiDubs} Titles</span>
                    </div>
                  </div>
                </div>

                <div className="nm-card" style={{ padding: '24px', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={18} style={{ color: '#10b981' }} /> Content Integrity & QA Audit
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Configured Video Providers:</span>
                      <strong style={{ color: '#fff' }}>{stats.providersCount} Providers Active</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Unverified Video Mappings:</span>
                      <strong style={{ color: stats.unverifiedMappings > 0 ? '#f59e0b' : '#10b981' }}>{stats.unverifiedMappings}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Broken / Error Stream Nodes:</span>
                      <strong style={{ color: stats.errorMappings > 0 ? '#ef4444' : '#10b981' }}>{stats.errorMappings}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Placeholder / Dummy URLs Policy:</span>
                      <strong style={{ color: '#10b981' }}>Enforced (Blocked)</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Deduplication Rules:</span>
                      <strong style={{ color: '#10b981' }}>Strict Slug/MAL Indexing</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: CATALOG MANAGER */}
      {activeTab === 'catalog' && (
        <div>
          {/* SEARCH & FILTERS BAR */}
          <div className="nm-card" style={{ padding: '16px 20px', borderRadius: '16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
              <Search size={18} style={{ color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search title, English title, or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAnimeList(1)}
                style={{ background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 14px', color: '#fff', fontSize: '13px', flex: 1, outline: 'none' }}
              />
              <button onClick={() => fetchAnimeList(1)} className="nm-pill" style={{ padding: '8px 16px', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                Filter
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                style={{ background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              >
                <option value="">All Formats (Series + Movies)</option>
                <option value="series">Series Only</option>
                <option value="movie">Movies Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              >
                <option value="">All Verification Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="METADATA_VERIFIED">METADATA_VERIFIED</option>
                <option value="MAPPING_PENDING">MAPPING_PENDING</option>
                <option value="UNAVAILABLE">UNAVAILABLE</option>
                <option value="ERROR">ERROR</option>
              </select>

              <select
                value={dubFilter}
                onChange={(e) => setDubFilter(e.target.value)}
                style={{ background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              >
                <option value="">All Dub Audio</option>
                <option value="hindi">🇮🇳 Hindi Dubbed Only</option>
                <option value="dub">🎙️ English Dubbed Only</option>
              </select>
            </div>
          </div>

          {/* TABLE OF ANIME */}
          <div className="nm-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#0e101a', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                    <th style={{ padding: '14px 18px' }}>Poster & Title</th>
                    <th style={{ padding: '14px 18px' }}>Type</th>
                    <th style={{ padding: '14px 18px' }}>Genres</th>
                    <th style={{ padding: '14px 18px' }}>Year</th>
                    <th style={{ padding: '14px 18px' }}>Available Audio</th>
                    <th style={{ padding: '14px 18px' }}>Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAnime ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        Loading anime catalog...
                      </td>
                    </tr>
                  ) : animeList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        No anime matching the current query filters.
                      </td>
                    </tr>
                  ) : (
                    animeList.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              referrerPolicy="no-referrer"
                              src={item.posterImage || ''}
                              alt={item.title}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80';
                              }}
                              style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '6px' }}
                            />
                            <div>
                              <strong style={{ color: '#fff', display: 'block', fontSize: '14px' }}>{item.title}</strong>
                              {item.englishTitle && (
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{item.englishTitle}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px 18px' }}>
                          <span className="nm-tag" style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 800 }}>
                            {item.contentType === 'movie' ? 'Movie' : 'Series'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 18px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                          {item.genres}
                        </td>

                        <td style={{ padding: '12px 18px', color: '#94a3b8' }}>
                          {item.releasedYear || '—'}
                        </td>

                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-accent)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                              SUB
                            </span>
                            {item.hasDub && (
                              <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                                EN DUB
                              </span>
                            )}
                            {item.hasHindi && (
                              <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                HI DUB
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            color: item.availabilityStatus === 'AVAILABLE' ? '#10b981' : item.availabilityStatus === 'METADATA_VERIFIED' ? '#38bdf8' : '#fbbf24',
                            background: item.availabilityStatus === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                            border: `1px solid ${item.availabilityStatus === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                          }}>
                            {item.availabilityStatus}
                          </span>
                        </td>

                        <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                          <button
                            onClick={() => setEditingAnime(item)}
                            className="nm-pill"
                            style={{ padding: '6px 14px', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <Edit size={13} style={{ color: 'var(--color-primary)' }} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                Page {page} of {totalPages}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => fetchAnimeList(page - 1)}
                  disabled={page <= 1}
                  className="nm-pill"
                  style={{ padding: '6px 14px', border: 'none', color: page <= 1 ? '#475569' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchAnimeList(page + 1)}
                  disabled={page >= totalPages}
                  className="nm-pill"
                  style={{ padding: '6px 14px', border: 'none', color: page >= totalPages ? '#475569' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BULK IMPORT STUDIO */}
      {activeTab === 'import' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="nm-card" style={{ padding: '28px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
              Bulk Anime Importer
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
              Upload an anime list file (<code>.txt</code> or <code>.json</code>) or paste titles below. The catalog engine will automatically resolve rich metadata from AniList/MAL, assign canonical slug identifiers, and initialize season/episode entities.
            </p>

            {/* FILE UPLOAD CARD */}
            <div style={{ background: '#0e101a', border: '2px dashed rgba(139, 92, 246, 0.35)', borderRadius: '12px', padding: '22px', textAlign: 'center', marginBottom: '24px' }}>
              <Upload size={32} style={{ color: '#a78bfa', margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px' }}>
                Upload Anime List File (.txt or .json)
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px' }}>
                Select a plain text file (one title per line) or a JSON file.
              </p>
              
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', color: '#fff', padding: '10px 22px', borderRadius: '9999px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)' }}>
                <span>📁 Select File From Computer</span>
                <input
                  type="file"
                  accept=".txt,.json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {uploadedFileName && (
                <div style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  <CheckCircle size={14} />
                  <span>Loaded file: <strong>{uploadedFileName}</strong></span>
                  <button
                    onClick={() => {
                      setUploadedFileName(null);
                      setBulkTitles('');
                      setImportLog(null);
                    }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 2px', display: 'flex' }}
                    title="Clear file"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  Target Content Type
                </label>
                <select
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value as any)}
                  style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  <option value="series">Anime Series / OVA</option>
                  <option value="movie">Anime Movie</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  18+ Rating & Badge
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bulkIs18Plus}
                    onChange={(e) => setBulkIs18Plus(e.target.checked)}
                    style={{ accentColor: '#e11d48' }}
                  />
                  <span style={{ fontSize: '13px', color: '#f43f5e', fontWeight: 700 }}>🔞 Tag all as 18+ Adult</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  English Dub Availability
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bulkHasDub}
                    onChange={(e) => setBulkHasDub(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontSize: '13px', color: '#fff' }}>Has English Dub Track</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  Hindi Dub Availability
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bulkHasHindi}
                    onChange={(e) => setBulkHasHindi(e.target.checked)}
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <span style={{ fontSize: '13px', color: '#fff' }}>Has Hindi Dub Track</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                Titles List (One per line)
              </label>
              {bulkTitles.trim() && (
                <span style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 700 }}>
                  {bulkTitles.split('\n').filter(t => t.trim().length > 0).length} titles ready
                </span>
              )}
            </div>
            <textarea
              rows={10}
              placeholder="e.g.&#10;Attack on Titan&#10;Solo Leveling&#10;Frieren: Beyond Journey's End"
              value={bulkTitles}
              onChange={(e) => setBulkTitles(e.target.value)}
              style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px', color: '#fff', fontSize: '13px', fontFamily: 'monospace', outline: 'none', resize: 'vertical', marginBottom: '18px' }}
            />

            <button
              onClick={handleBulkImport}
              disabled={importLoading || !bulkTitles.trim()}
              className="nm-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: '14px', border: 'none', cursor: importLoading || !bulkTitles.trim() ? 'not-allowed' : 'pointer' }}
            >
              <Upload size={16} />
              {importLoading ? 'Importing Titles & Hydrating Metadata...' : `Start Bulk Import (${bulkTitles.split('\n').filter(t => t.trim().length > 0).length} Titles)`}
            </button>

            {importLog && (
              <div style={{ marginTop: '20px', background: '#0e101a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#38bdf8' }}>
                {importLog}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FAST MEDIA LINKER (POSTERS & VIDEO STREAMS) */}
      {activeTab === 'media' && (
        <div>
          {/* HEADER BANNER */}
          <div className="nm-card" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={22} style={{ color: '#ec4899' }} /> Fast Media Linker (Posters & Video Streams)
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                  The easiest way to attach cover images and video embed streams to your titles. Edit inline, upload images directly from your PC, or import everything via CSV spreadsheet.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', padding: '10px 20px', borderRadius: '9999px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}>
                  <Upload size={15} /> Upload CSV Spreadsheet
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvMediaUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  onClick={handleDownloadCsvTemplate}
                  className="nm-pill"
                  style={{ padding: '10px 18px', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={15} style={{ color: '#38bdf8' }} /> Download CSV Template
                </button>

                <button
                  onClick={fetchMediaItems}
                  className="nm-pill"
                  style={{ padding: '10px 14px', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Refresh list"
                >
                  <RefreshCw size={15} style={{ color: '#a78bfa' }} />
                </button>
              </div>
            </div>

            {mediaMessage && (
              <div style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
                {mediaMessage}
              </div>
            )}
          </div>

          {/* SEARCH, FILTERS & SORT */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '360px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search anime title..."
                value={mediaSearch}
                onChange={(e) => {
                  setMediaSearch(e.target.value);
                  setMediaPage(1);
                }}
                style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 14px 10px 40px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => { setMediaFilter('all'); setMediaPage(1); }}
                className={`nm-pill ${mediaFilter === 'all' ? 'active' : ''}`}
                style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: mediaFilter === 'all' ? '#fff' : '#94a3b8' }}
              >
                All Anime
              </button>
              <button
                onClick={() => { setMediaFilter('18plus'); setMediaPage(1); }}
                className={`nm-pill ${mediaFilter === '18plus' ? 'active' : ''}`}
                style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: mediaFilter === '18plus' ? '#f43f5e' : '#94a3b8' }}
              >
                🔞 18+ Mature Only
              </button>
              <button
                onClick={() => { setMediaFilter('stream_ready'); setMediaPage(1); }}
                className={`nm-pill ${mediaFilter === 'stream_ready' ? 'active' : ''}`}
                style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: mediaFilter === 'stream_ready' ? '#34d399' : '#94a3b8' }}
              >
                ✅ Stream Ready
              </button>
              <button
                onClick={() => { setMediaFilter('missing_stream'); setMediaPage(1); }}
                className={`nm-pill ${mediaFilter === 'missing_stream' ? 'active' : ''}`}
                style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: mediaFilter === 'missing_stream' ? '#f59e0b' : '#94a3b8' }}
              >
                ⚠️ Missing Stream
              </button>
              <button
                onClick={() => { setMediaFilter('missing_poster'); setMediaPage(1); }}
                className={`nm-pill ${mediaFilter === 'missing_poster' ? 'active' : ''}`}
                style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: mediaFilter === 'missing_poster' ? '#f59e0b' : '#94a3b8' }}
              >
                🖼️ Missing Poster
              </button>

              {/* SORT SECTION DROPDOWN */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                <select
                  value={mediaSort}
                  onChange={(e) => {
                    setMediaSort(e.target.value as any);
                    setMediaPage(1);
                  }}
                  style={{
                    background: '#141624',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--color-accent)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  title="Sort anime list"
                >
                  <option value="newest">🕒 Newest Added</option>
                  <option value="oldest">⏳ Oldest Added</option>
                  <option value="updated">🔄 Recently Updated</option>
                  <option value="title_asc">🔤 Title (A → Z)</option>
                  <option value="title_desc">🔤 Title (Z → A)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SPREADSHEET TABLE OF ANIME */}
          {loadingMedia ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Loading anime media list...
            </div>
          ) : (() => {
            const filteredMedia = mediaItems
              .filter(item => {
                const matchQuery = !mediaSearch || item.title.toLowerCase().includes(mediaSearch.toLowerCase()) || (item.englishTitle && item.englishTitle.toLowerCase().includes(mediaSearch.toLowerCase()));
                if (!matchQuery) return false;
                if (mediaFilter === '18plus') return item.genres?.includes('18+') || item.rating === '18+';
                if (mediaFilter === 'stream_ready') return !!item.videoUrl && item.videoUrl.trim() !== '';
                if (mediaFilter === 'missing_stream') return !item.videoUrl || item.videoUrl.trim() === '';
                if (mediaFilter === 'missing_poster') return !item.posterImage || item.posterImage.includes('unsplash');
                return true;
              })
              .sort((a, b) => {
                if (mediaSort === 'newest') {
                  return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
                }
                if (mediaSort === 'oldest') {
                  return (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime());
                }
                if (mediaSort === 'updated') {
                  return (new Date(b.updatedAt || 0).getTime()) - (new Date(a.updatedAt || 0).getTime());
                }
                if (mediaSort === 'title_asc') {
                  return a.title.localeCompare(b.title);
                }
                if (mediaSort === 'title_desc') {
                  return b.title.localeCompare(a.title);
                }
                return 0;
              });

            const pageSize = 30;
            const totalMediaPages = Math.max(1, Math.ceil(filteredMedia.length / pageSize));
            const safeMediaPage = Math.min(Math.max(1, mediaPage), totalMediaPages);
            const startIndex = (safeMediaPage - 1) * pageSize;
            const paginatedMedia = filteredMedia.slice(startIndex, startIndex + pageSize);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* STATUS BAR: SHOWING RANGE & TOTAL */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', color: '#94a3b8', fontSize: '13px' }}>
                  <div>
                    {filteredMedia.length > 0 ? (
                      <span>
                        Showing <strong style={{ color: '#fff' }}>{startIndex + 1}–{Math.min(startIndex + pageSize, filteredMedia.length)}</strong> of <strong style={{ color: 'var(--color-accent)' }}>{filteredMedia.length}</strong> anime
                        <span style={{ marginLeft: '8px', color: '#64748b' }}>(30 per page)</span>
                      </span>
                    ) : (
                      <span>No anime matched your filter</span>
                    )}
                  </div>
                  <div>
                    Page <strong style={{ color: '#fff' }}>{safeMediaPage}</strong> of <strong style={{ color: '#fff' }}>{totalMediaPages}</strong>
                  </div>
                </div>

                {paginatedMedia.length === 0 ? (
                  <div className="nm-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', borderRadius: '12px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '15px', color: '#94a3b8' }}>No titles match your search or filter.</p>
                    <button
                      onClick={() => { setMediaSearch(''); setMediaFilter('all'); setMediaPage(1); }}
                      className="nm-pill"
                      style={{ padding: '6px 14px', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Clear search & filters
                    </button>
                  </div>
                ) : (
                  paginatedMedia.map((item) => (
                  <div
                    key={item.id}
                    className="nm-card"
                    style={{ padding: '16px 20px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(280px, 2fr) minmax(320px, 2.5fr) auto', gap: '16px', alignItems: 'center' }}
                  >
                    {/* Column 1: Title & Tags */}
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px', color: '#fff', marginBottom: '4px' }}>
                        {item.title}
                      </strong>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.contentType || 'series'}</span>
                        {(item.genres?.includes('18+') || item.rating === '18+') && (
                          <span style={{ fontSize: '10px', background: '#e11d48', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                            18+
                          </span>
                        )}
                        {item.videoUrl && (
                          <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Stream Ready
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Poster Image & Drag-and-Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (dragOverId !== item.id) setDragOverId(item.id);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverId(item.id);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        setDragOverId(null);
                      }}
                      onDrop={(e) => handleDropImage(item.id, e)}
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        border: dragOverId === item.id 
                          ? '2px dashed var(--color-primary)' 
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        background: dragOverId === item.id 
                          ? 'rgba(139, 92, 246, 0.12)' 
                          : 'rgba(255, 255, 255, 0.02)',
                        transition: 'all 0.2s ease',
                        boxShadow: dragOverId === item.id ? '0 0 16px rgba(139, 92, 246, 0.35)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ position: 'relative', width: '38px', height: '54px', flexShrink: 0 }}>
                          <img
                            src={item.posterImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80'}
                            alt=""
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80';
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: dragOverId === item.id ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                              opacity: uploadingImageId === item.id ? 0.35 : 1,
                              transition: 'opacity 0.2s ease'
                            }}
                          />
                          {uploadingImageId === item.id && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <RefreshCw size={14} color="var(--color-accent)" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                          <input
                            type="text"
                            placeholder="Poster Image URL or Page Link..."
                            value={item.posterImage || ''}
                            onChange={(e) => handleInlineMediaChange(item.id, 'posterImage', e.target.value)}
                            style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', color: '#fff' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                            <label style={{ fontSize: '11px', color: '#a78bfa', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                              <Image size={12} /> Choose from PC
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleInlineImageUpload(item.id, f);
                                }}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <span style={{ fontSize: '10px', color: dragOverId === item.id ? 'var(--color-accent)' : '#64748b', fontWeight: dragOverId === item.id ? 700 : 400 }}>
                              {dragOverId === item.id ? '✨ Drop image here!' : 'or drag & drop image file / link'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Video Stream URLs (SUB, DUB, HINDI) & Multi-Episode Controls */}
                    <div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {/* 1. SUB Video URL */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 6px', borderRadius: '4px', width: '42px', textAlign: 'center' }}>
                            SUB
                          </span>
                          <input
                            type="text"
                            placeholder="Episode 1 SUB (Japanese) URL..."
                            value={item.videoUrl || ''}
                            onChange={(e) => handleInlineMediaChange(item.id, 'videoUrl', cleanAndNormalizeVideoUrl(e.target.value))}
                            style={{ flex: 1, background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}
                          />
                          {item.videoUrl && (
                            <button
                              type="button"
                              onClick={() => handleExtractVideoRow(item)}
                              className="nm-pill"
                              style={{ padding: '4px 6px', border: 'none', color: '#a78bfa', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                              title="Extract clean video player embed from this page"
                            >
                              <Sparkles size={10} /> Clean
                            </button>
                          )}
                          {item.videoUrl && (
                            <a
                              href={item.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="nm-pill"
                              style={{ padding: '4px 8px', textDecoration: 'none', color: '#38bdf8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
                              title="Test SUB Stream"
                            >
                              <ExternalLink size={10} /> Test
                            </a>
                          )}
                        </div>

                        {/* 2. DUB Video URL */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-accent)', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '2px 6px', borderRadius: '4px', width: '42px', textAlign: 'center' }}>
                            DUB
                          </span>
                          <input
                            type="text"
                            placeholder="Episode 1 DUB (English) URL..."
                            value={item.dubVideoUrl || ''}
                            onChange={(e) => handleInlineMediaChange(item.id, 'dubVideoUrl', cleanAndNormalizeVideoUrl(e.target.value))}
                            style={{ flex: 1, background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}
                          />
                          {item.dubVideoUrl && (
                            <a
                              href={item.dubVideoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="nm-pill"
                              style={{ padding: '4px 8px', textDecoration: 'none', color: 'var(--color-accent)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
                              title="Test DUB Stream"
                            >
                              <ExternalLink size={10} /> Test
                            </a>
                          )}
                        </div>

                        {/* 3. HINDI Video URL */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 6px', borderRadius: '4px', width: '42px', textAlign: 'center' }}>
                            HINDI
                          </span>
                          <input
                            type="text"
                            placeholder="Episode 1 HINDI Dub URL..."
                            value={item.hindiVideoUrl || ''}
                            onChange={(e) => handleInlineMediaChange(item.id, 'hindiVideoUrl', cleanAndNormalizeVideoUrl(e.target.value))}
                            style={{ flex: 1, background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}
                          />
                          {item.hindiVideoUrl && (
                            <a
                              href={item.hindiVideoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="nm-pill"
                              style={{ padding: '4px 8px', textDecoration: 'none', color: '#fbbf24', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
                              title="Test HINDI Stream"
                            >
                              <ExternalLink size={10} /> Test
                            </a>
                          )}
                        </div>

                        {/* Multi-Episode Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEpisodeManager(item)}
                            className="nm-pill"
                            style={{
                              background: (item.episodes && item.episodes.length > 1) ? 'rgba(139, 92, 246, 0.2)' : '#10121d',
                              border: '1px solid rgba(139, 92, 246, 0.4)',
                              color: 'var(--color-accent)',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '4px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              borderRadius: '6px'
                            }}
                          >
                            <Tv size={12} />
                            Manage Episodes ({(item.episodes && item.episodes.length > 0) ? item.episodes.length : ((item.videoUrl || item.dubVideoUrl || item.hindiVideoUrl) ? 1 : 0)})
                          </button>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {(item.episodes && item.episodes.length > 1) ? `${item.episodes.length} episodes configured` : 'Configure Ep 2, 3... (Sub, Dub, Hindi)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Column 4: Quick Save Button */}
                    <div>
                      <button
                        onClick={() => handleUpdateMediaRow(item)}
                        disabled={savingId === item.id}
                        className="nm-btn-primary"
                        style={{ padding: '8px 18px', fontSize: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                      >
                        <Save size={13} />
                        {savingId === item.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))
              )}

                {/* BOTTOM PAGINATION CONTROLS BAR (30 ANIME PER PAGE) */}
                {totalMediaPages > 1 && (
                  <div
                    className="nm-card"
                    style={{
                      padding: '14px 20px',
                      borderRadius: '12px',
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setMediaPage(1)}
                        disabled={safeMediaPage === 1}
                        className="nm-pill"
                        style={{ padding: '6px 12px', border: 'none', cursor: safeMediaPage === 1 ? 'not-allowed' : 'pointer', opacity: safeMediaPage === 1 ? 0.4 : 1, fontSize: '12px', color: '#fff' }}
                      >
                        « First
                      </button>
                      <button
                        onClick={() => setMediaPage(prev => Math.max(1, prev - 1))}
                        disabled={safeMediaPage === 1}
                        className="nm-pill"
                        style={{ padding: '6px 12px', border: 'none', cursor: safeMediaPage === 1 ? 'not-allowed' : 'pointer', opacity: safeMediaPage === 1 ? 0.4 : 1, fontSize: '12px', color: '#fff' }}
                      >
                        ‹ Prev
                      </button>

                      {/* Numbered Page Buttons */}
                      {Array.from({ length: totalMediaPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalMediaPages || Math.abs(p - safeMediaPage) <= 2)
                        .map((p, idx, arr) => (
                          <React.Fragment key={p}>
                            {idx > 0 && p - arr[idx - 1] > 1 && (
                              <span style={{ color: '#64748b', padding: '0 4px', fontSize: '12px' }}>...</span>
                            )}
                            <button
                              onClick={() => setMediaPage(p)}
                              className="nm-pill"
                              style={{
                                padding: '6px 12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: p === safeMediaPage ? 800 : 500,
                                background: p === safeMediaPage ? 'linear-gradient(135deg, var(--color-primary), #ec4899)' : '#10121d',
                                color: p === safeMediaPage ? '#fff' : '#94a3b8'
                              }}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        ))}

                      <button
                        onClick={() => setMediaPage(prev => Math.min(totalMediaPages, prev + 1))}
                        disabled={safeMediaPage === totalMediaPages}
                        className="nm-pill"
                        style={{ padding: '6px 12px', border: 'none', cursor: safeMediaPage === totalMediaPages ? 'not-allowed' : 'pointer', opacity: safeMediaPage === totalMediaPages ? 0.4 : 1, fontSize: '12px', color: '#fff' }}
                      >
                        Next ›
                      </button>
                      <button
                        onClick={() => setMediaPage(totalMediaPages)}
                        disabled={safeMediaPage === totalMediaPages}
                        className="nm-pill"
                        style={{ padding: '6px 12px', border: 'none', cursor: safeMediaPage === totalMediaPages ? 'not-allowed' : 'pointer', opacity: safeMediaPage === totalMediaPages ? 0.4 : 1, fontSize: '12px', color: '#fff' }}
                      >
                        Last »
                      </button>
                    </div>

                    {/* JUMP TO PAGE */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Jump to page:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalMediaPages}
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(jumpPageInput);
                            if (!isNaN(val) && val >= 1 && val <= totalMediaPages) {
                              setMediaPage(val);
                              setJumpPageInput('');
                            }
                          }
                        }}
                        placeholder={`1–${totalMediaPages}`}
                        style={{
                          width: '65px',
                          background: '#10121d',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          padding: '5px 8px',
                          fontSize: '12px',
                          color: '#fff',
                          textAlign: 'center'
                        }}
                      />
                      <button
                        onClick={() => {
                          const val = parseInt(jumpPageInput);
                          if (!isNaN(val) && val >= 1 && val <= totalMediaPages) {
                            setMediaPage(val);
                            setJumpPageInput('');
                          }
                        }}
                        className="nm-pill"
                        style={{ padding: '5px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--color-accent)', fontWeight: 700 }}
                      >
                        Go
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* MULTI-EPISODE MANAGER MODAL */}
      {managingEpisodesAnime && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="nm-card" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '16px', background: '#141624' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {managingEpisodesAnime.posterImage && (
                  <img
                    referrerPolicy="no-referrer"
                    src={managingEpisodesAnime.posterImage}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80';
                    }}
                    style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--color-primary)' }}
                  />
                )}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fff' }}>
                    Episode Manager: {managingEpisodesAnime.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {modalEpisodes.length} episode{modalEpisodes.length === 1 ? '' : 's'} configured • Individual video stream & iframe embeds
                  </span>
                </div>
              </div>
              <button
                onClick={() => setManagingEpisodesAnime(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {epModalMessage && (
              <div style={{ background: '#0e101a', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '10px', padding: '10px 16px', color: 'var(--color-accent)', fontSize: '13px', marginBottom: '16px' }}>
                {epModalMessage}
              </div>
            )}

            {/* Quick Bulk Link Inserter */}
            <div style={{ background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> ⚡ Fast Bulk-Paste Episode Links
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Paste 1 video URL per line (Line 1 = Ep 1, Line 2 = Ep 2...)
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="https://my-video-host.com/ep1.mp4&#10;https://my-video-host.com/ep2.mp4&#10;https://my-video-host.com/ep3.mp4"
                value={bulkEpLinks}
                onChange={(e) => setBulkEpLinks(e.target.value)}
                style={{ width: '100%', background: '#0e101a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleBulkAssignEpisodeLinks}
                  disabled={!bulkEpLinks.trim()}
                  className="nm-pill"
                  style={{
                    background: bulkEpLinks.trim() ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: bulkEpLinks.trim() ? '#38bdf8' : '#64748b',
                    padding: '6px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: bulkEpLinks.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  ⚡ Auto-Assign to Episodes
                </button>
              </div>
            </div>

            {/* Episode List */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>Episodes List ({modalEpisodes.length})</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleAddModalEpisode}
                    className="nm-pill"
                    style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 700, border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={13} /> Add Episode
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMultipleEpisodes(6)}
                    className="nm-pill"
                    style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 700, border: 'none', color: '#a78bfa', cursor: 'pointer' }}
                  >
                    + 6 Episodes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMultipleEpisodes(12)}
                    className="nm-pill"
                    style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 700, border: 'none', color: '#a78bfa', cursor: 'pointer' }}
                  >
                    + 12 Episodes
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                {modalEpisodes.map((ep) => (
                  <div
                    key={ep.episodeNumber}
                    style={{
                      background: '#10121d',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    {/* Top Row: Episode number, title, delete */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-accent)', minWidth: '46px' }}>
                          Ep {ep.episodeNumber}
                        </div>
                        <input
                          type="text"
                          placeholder={`Episode ${ep.episodeNumber} Title`}
                          value={ep.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setModalEpisodes(prev => prev.map(item => item.episodeNumber === ep.episodeNumber ? { ...item, title: val } : item));
                          }}
                          style={{ background: '#0e101a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', color: '#fff', width: '220px' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteEpisode(ep.episodeNumber)}
                        className="nm-pill"
                        style={{ padding: '5px 8px', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                        title="Delete Episode"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>

                    {/* Stream Inputs: SUB, DUB, HINDI */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px', borderLeft: '2px solid rgba(139, 92, 246, 0.3)' }}>
                      {/* SUB URL */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 6px', borderRadius: '4px', width: '42px', textAlign: 'center' }}>
                          SUB
                        </span>
                        <input
                          type="text"
                          placeholder="SUB (Japanese) stream or embed URL (e.g. https://...)"
                          value={ep.videoUrl || ''}
                          onChange={(e) => {
                            const val = cleanAndNormalizeVideoUrl(e.target.value);
                            setModalEpisodes(prev => prev.map(item => item.episodeNumber === ep.episodeNumber ? { ...item, videoUrl: val } : item));
                          }}
                          style={{ flex: 1, background: '#0e101a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}
                        />
                        {ep.videoUrl && (
                          <button
                            type="button"
                            onClick={() => handleExtractVideoForEpisode(ep.episodeNumber, ep.videoUrl)}
                            disabled={extractingEpNum === ep.episodeNumber}
                            className="nm-pill"
                            style={{ padding: '5px 8px', border: 'none', color: '#a78bfa', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}
                            title="Extract clean video player from webpage"
                          >
                            <Sparkles size={10} /> {extractingEpNum === ep.episodeNumber ? '...' : 'Clean'}
                          </button>
                        )}
                        {ep.videoUrl && (
                          <a
                            href={ep.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nm-pill"
                            style={{ padding: '5px 8px', textDecoration: 'none', color: '#38bdf8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}
                            title="Test SUB Stream"
                          >
                            <ExternalLink size={10} /> Test
                          </a>
                        )}
                      </div>

                      {/* DUB URL */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-accent)', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '2px 6px', borderRadius: '4px', width: '42px', textAlign: 'center' }}>
                          DUB
                        </span>
                        <input
                          type="text"
                          placeholder="DUB (English) stream or embed URL (e.g. https://...)"
                          value={ep.dubVideoUrl || ''}
                          onChange={(e) => {
                            const val = cleanAndNormalizeVideoUrl(e.target.value);
                            setModalEpisodes(prev => prev.map(item => item.episodeNumber === ep.episodeNumber ? { ...item, dubVideoUrl: val } : item));
                          }}
                          style={{ flex: 1, background: '#0e101a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}
                        />
                        {ep.dubVideoUrl && (
                          <a
                            href={ep.dubVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nm-pill"
                            style={{ padding: '5px 8px', textDecoration: 'none', color: 'var(--color-accent)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}
                            title="Test DUB Stream"
                          >
                            <ExternalLink size={10} /> Test
                          </a>
                        )}
                      </div>

                      {/* HINDI URL */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 6px', borderRadius: '4px', width: '42px', textAlign: 'center' }}>
                          HINDI
                        </span>
                        <input
                          type="text"
                          placeholder="HINDI Dub stream or embed URL (e.g. https://...)"
                          value={ep.hindiVideoUrl || ''}
                          onChange={(e) => {
                            const val = cleanAndNormalizeVideoUrl(e.target.value);
                            setModalEpisodes(prev => prev.map(item => item.episodeNumber === ep.episodeNumber ? { ...item, hindiVideoUrl: val } : item));
                          }}
                          style={{ flex: 1, background: '#0e101a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}
                        />
                        {ep.hindiVideoUrl && (
                          <a
                            href={ep.hindiVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nm-pill"
                            style={{ padding: '5px 8px', textDecoration: 'none', color: '#fbbf24', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}
                            title="Test HINDI Stream"
                          >
                            <ExternalLink size={10} /> Test
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                💡 Tip: If you paste an external webpage, click <strong>Clean</strong> to automatically isolate the video player and remove the other website's headers and ads.
              </span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setManagingEpisodesAnime(null)}
                  className="nm-pill"
                  style={{ padding: '8px 20px', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllEpisodes}
                  disabled={savingEpisodes}
                  className="nm-btn-primary"
                  style={{ padding: '8px 26px', border: 'none', cursor: savingEpisodes ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={14} />
                  {savingEpisodes ? 'Saving Episodes...' : `Save All Episodes (${modalEpisodes.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ANIME METADATA MODAL */}
      {editingAnime && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="nm-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '16px', background: '#141624' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Edit Anime Metadata</h3>
              <button onClick={() => setEditingAnime(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Canonical Title</label>
                <input
                  type="text"
                  value={editingAnime.title}
                  onChange={(e) => setEditingAnime({ ...editingAnime, title: e.target.value })}
                  style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>English Title</label>
                <input
                  type="text"
                  value={editingAnime.englishTitle || ''}
                  onChange={(e) => setEditingAnime({ ...editingAnime, englishTitle: e.target.value })}
                  style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Format</label>
                  <select
                    value={editingAnime.contentType}
                    onChange={(e) => setEditingAnime({ ...editingAnime, contentType: e.target.value })}
                    style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="series">Series</option>
                    <option value="movie">Movie</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Availability Status</label>
                  <select
                    value={editingAnime.availabilityStatus}
                    onChange={(e) => setEditingAnime({ ...editingAnime, availabilityStatus: e.target.value })}
                    style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="METADATA_VERIFIED">METADATA_VERIFIED</option>
                    <option value="MAPPING_PENDING">MAPPING_PENDING</option>
                    <option value="MAPPING_VERIFIED">MAPPING_VERIFIED</option>
                    <option value="UNAVAILABLE">UNAVAILABLE</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Genres (Comma-separated)</label>
                  <input
                    type="text"
                    value={editingAnime.genres}
                    onChange={(e) => setEditingAnime({ ...editingAnime, genres: e.target.value })}
                    style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Age Rating</label>
                  <select
                    value={editingAnime.rating || 'PG-13'}
                    onChange={(e) => setEditingAnime({ ...editingAnime, rating: e.target.value })}
                    style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="18+">🔞 18+ Adult (Mature/Uncensored)</option>
                    <option value="R - 17+">R - 17+ (Violence & Profanity)</option>
                    <option value="TV-MA">TV-MA</option>
                    <option value="PG-13">PG-13 (Teens 13+)</option>
                    <option value="PG">PG (Children)</option>
                    <option value="G">G (All Ages)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  Poster Image (Paste URL, Drag & Drop, or Choose File)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId('modal-edit-poster'); }}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId('modal-edit-poster'); }}
                  onDragLeave={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverId(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault(); e.stopPropagation(); setDragOverId(null);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const file = e.dataTransfer.files[0];
                      if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          const base64 = ev.target?.result as string;
                          if (!base64) return;
                          try {
                            const res = await axios.post('/api/admin/upload/image', { image: base64, fileName: file.name }, getAuthHeaders());
                            setEditingAnime({ ...editingAnime, posterImage: res.data.url });
                          } catch (err: any) {
                            alert(`Upload failed: ${err.message}`);
                          }
                        };
                        reader.readAsDataURL(file);
                        return;
                      }
                    }
                    const rawUrl = extractUrlFromDataTransfer(e.dataTransfer);
                    if (rawUrl) {
                      try {
                        const res = await axios.post('/api/admin/resolve-image', { url: rawUrl }, getAuthHeaders());
                        setEditingAnime({ ...editingAnime, posterImage: res.data?.url || rawUrl });
                      } catch (_) {
                        setEditingAnime({ ...editingAnime, posterImage: rawUrl });
                      }
                    }
                  }}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: dragOverId === 'modal-edit-poster' ? '2px dashed var(--color-primary)' : '1px solid rgba(255,255,255,0.06)',
                    background: dragOverId === 'modal-edit-poster' ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="https://your-image-host.com/poster.jpg"
                      value={editingAnime.posterImage || ''}
                      onChange={(e) => setEditingAnime({ ...editingAnime, posterImage: e.target.value })}
                      style={{ flex: 1, background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                    />
                    {editingAnime.posterImage && (
                      <img
                        referrerPolicy="no-referrer"
                        src={editingAnime.posterImage}
                        alt="Preview"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80';
                        }}
                        style={{ width: '38px', height: '54px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--color-primary)' }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#a78bfa', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Image size={12} /> Choose image from PC
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              const base64 = ev.target?.result as string;
                              if (!base64) return;
                              try {
                                const res = await axios.post('/api/admin/upload/image', { image: base64, fileName: file.name }, getAuthHeaders());
                                setEditingAnime({ ...editingAnime, posterImage: res.data.url });
                              } catch (err: any) {
                                alert(`Upload failed: ${err.message}`);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '11px', color: dragOverId === 'modal-edit-poster' ? 'var(--color-accent)' : '#64748b' }}>
                      {dragOverId === 'modal-edit-poster' ? '✨ Drop image now!' : 'or drag & drop image file or web link here'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  Banner Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-image-host.com/banner.jpg"
                  value={editingAnime.bannerImage || ''}
                  onChange={(e) => setEditingAnime({ ...editingAnime, bannerImage: e.target.value })}
                  style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ background: '#0e101a', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                    ▶️ Episode 1 SUB (Japanese) Video URL
                  </label>
                  <input
                    type="text"
                    placeholder="Paste SUB iframe embed link or direct video stream URL (e.g. https://...)"
                    value={editingAnime.videoUrl || ''}
                    onChange={(e) => setEditingAnime({ ...editingAnime, videoUrl: e.target.value })}
                    style={{ width: '100%', background: '#141624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '4px' }}>
                    🎙️ Episode 1 DUB (English) Video URL
                  </label>
                  <input
                    type="text"
                    placeholder="Paste English DUB iframe embed link or direct stream URL (e.g. https://...)"
                    value={editingAnime.dubVideoUrl || ''}
                    onChange={(e) => setEditingAnime({ ...editingAnime, dubVideoUrl: e.target.value })}
                    style={{ width: '100%', background: '#141624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
                    🇮🇳 Episode 1 HINDI Dub Video URL
                  </label>
                  <input
                    type="text"
                    placeholder="Paste HINDI Dub iframe embed link or direct stream URL (e.g. https://...)"
                    value={editingAnime.hindiVideoUrl || ''}
                    onChange={(e) => setEditingAnime({ ...editingAnime, hindiVideoUrl: e.target.value })}
                    style={{ width: '100%', background: '#141624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
                  />
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                  Tip: Supports any standard streaming embed link, HLS .m3u8, or direct .mp4 stream per language.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '24px', margin: '8px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingAnime.hasDub}
                    onChange={(e) => setEditingAnime({ ...editingAnime, hasDub: e.target.checked })}
                    style={{ accentColor: '#06b6d4' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>English Dubbed Verified</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingAnime.hasHindi}
                    onChange={(e) => setEditingAnime({ ...editingAnime, hasHindi: e.target.checked })}
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Hindi Dubbed Verified</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => setEditingAnime(null)}
                  className="nm-pill"
                  style={{ padding: '8px 18px', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAnime}
                  disabled={saveLoading}
                  className="nm-btn-primary"
                  style={{ padding: '8px 24px', border: 'none', cursor: saveLoading ? 'not-allowed' : 'pointer' }}
                >
                  <Save size={15} />
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD NEW ANIME MODAL */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="nm-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '16px', background: '#141624' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <Plus size={18} color="#fff" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Quick Add Anime</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  Anime Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Berserk (1997) or My Custom Anime"
                  value={newAnime.title}
                  onChange={(e) => setNewAnime({ ...newAnime, title: e.target.value })}
                  style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>English / Romanized Title</label>
                <input
                  type="text"
                  placeholder="e.g. Alternate English title"
                  value={newAnime.englishTitle}
                  onChange={(e) => setNewAnime({ ...newAnime, englishTitle: e.target.value })}
                  style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Content Format</label>
                  <select
                    value={newAnime.contentType}
                    onChange={(e) => setNewAnime({ ...newAnime, contentType: e.target.value as any })}
                    style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="series">Anime Series</option>
                    <option value="movie">Anime Movie</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Age Rating</label>
                  <select
                    value={newAnime.rating}
                    onChange={(e) => setNewAnime({ ...newAnime, rating: e.target.value })}
                    style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="18+">18+ (Adult / Mature / Uncensored)</option>
                    <option value="TV-MA">TV-MA (Mature Audience)</option>
                    <option value="R - 17+">R - 17+ (Violence & Gore)</option>
                    <option value="PG-13">PG-13 (Teens 13+)</option>
                    <option value="PG">PG (Children)</option>
                    <option value="G">G (All Ages)</option>
                  </select>
                </div>
              </div>

              {/* Quick Tag Pills for Genres */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  Genres (Click pills to quickly toggle tags)
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {['18+', 'Action', 'Ecchi', 'Horror', 'Psychological', 'Fantasy', 'Romance', 'Comedy', 'Drama', 'Supernatural'].map((tag) => {
                    const active = newAnime.genres.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const currentTags = newAnime.genres.split(',').map((g) => g.trim()).filter(Boolean);
                          const updated = active
                            ? currentTags.filter((g) => g !== tag)
                            : [...currentTags, tag];
                          setNewAnime({ ...newAnime, genres: updated.join(', ') });
                        }}
                        style={{
                          background: active
                            ? (tag === '18+' ? 'rgba(225, 29, 72, 0.3)' : 'rgba(139, 92, 246, 0.3)')
                            : 'rgba(255, 255, 255, 0.05)',
                          color: active
                            ? (tag === '18+' ? '#fb7185' : 'var(--color-accent)')
                            : '#94a3b8',
                          border: `1px solid ${active ? (tag === '18+' ? 'rgba(225, 29, 72, 0.5)' : 'rgba(139, 92, 246, 0.5)') : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '6px',
                          padding: '3px 9px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {tag === '18+' ? '🔞 18+' : tag}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Action, Horror, 18+"
                  value={newAnime.genres}
                  onChange={(e) => setNewAnime({ ...newAnime, genres: e.target.value })}
                  style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Release Year</label>
                  <input
                    type="number"
                    value={newAnime.releasedYear}
                    onChange={(e) => setNewAnime({ ...newAnime, releasedYear: parseInt(e.target.value) || 2024 })}
                    style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>Episode 1 SUB (Japanese) URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://domain.com/embed/ep1 (optional)"
                    value={newAnime.videoUrl}
                    onChange={(e) => setNewAnime({ ...newAnime, videoUrl: e.target.value })}
                    style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '6px' }}>Episode 1 DUB (English) URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://domain.com/embed/ep1-dub (optional)"
                    value={newAnime.dubVideoUrl}
                    onChange={(e) => setNewAnime({ ...newAnime, dubVideoUrl: e.target.value })}
                    style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '6px' }}>Episode 1 HINDI Dub URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://domain.com/embed/ep1-hindi (optional)"
                    value={newAnime.hindiVideoUrl}
                    onChange={(e) => setNewAnime({ ...newAnime, hindiVideoUrl: e.target.value })}
                    style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  Poster Image (Paste URL, Drag & Drop, or Choose File)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId('modal-add-poster'); }}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId('modal-add-poster'); }}
                  onDragLeave={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverId(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault(); e.stopPropagation(); setDragOverId(null);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const file = e.dataTransfer.files[0];
                      if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          const base64 = ev.target?.result as string;
                          if (!base64) return;
                          try {
                            const res = await axios.post('/api/admin/upload/image', { image: base64, fileName: file.name }, getAuthHeaders());
                            setNewAnime({ ...newAnime, posterImage: res.data.url });
                          } catch (err: any) {
                            alert(`Upload failed: ${err.message}`);
                          }
                        };
                        reader.readAsDataURL(file);
                        return;
                      }
                    }
                    const rawUrl = extractUrlFromDataTransfer(e.dataTransfer);
                    if (rawUrl) {
                      try {
                        const res = await axios.post('/api/admin/resolve-image', { url: rawUrl }, getAuthHeaders());
                        setNewAnime({ ...newAnime, posterImage: res.data?.url || rawUrl });
                      } catch (_) {
                        setNewAnime({ ...newAnime, posterImage: rawUrl });
                      }
                    }
                  }}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: dragOverId === 'modal-add-poster' ? '2px dashed var(--color-primary)' : '1px solid rgba(255,255,255,0.06)',
                    background: dragOverId === 'modal-add-poster' ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="https://... (optional, fallback provided automatically)"
                      value={newAnime.posterImage}
                      onChange={(e) => setNewAnime({ ...newAnime, posterImage: e.target.value })}
                      style={{ flex: 1, background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px' }}
                    />
                    {newAnime.posterImage && (
                      <img
                        referrerPolicy="no-referrer"
                        src={newAnime.posterImage}
                        alt="Preview"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80';
                        }}
                        style={{ width: '38px', height: '54px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--color-primary)' }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#a78bfa', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Image size={12} /> Choose image from PC
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              const base64 = ev.target?.result as string;
                              if (!base64) return;
                              try {
                                const res = await axios.post('/api/admin/upload/image', { image: base64, fileName: file.name }, getAuthHeaders());
                                setNewAnime({ ...newAnime, posterImage: res.data.url });
                              } catch (err: any) {
                                alert(`Upload failed: ${err.message}`);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '11px', color: dragOverId === 'modal-add-poster' ? 'var(--color-accent)' : '#64748b' }}>
                      {dragOverId === 'modal-add-poster' ? '✨ Drop image now!' : 'or drag & drop image file or web link here'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Plot Synopsis</label>
                <textarea
                  rows={3}
                  placeholder="Overview or synopsis of the anime..."
                  value={newAnime.description}
                  onChange={(e) => setNewAnime({ ...newAnime, description: e.target.value })}
                  style={{ width: '100%', background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="nm-pill"
                  style={{ padding: '8px 18px', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateAnime}
                  disabled={createLoading || !newAnime.title.trim()}
                  className="nm-btn-primary"
                  style={{ padding: '8px 24px', border: 'none', cursor: createLoading ? 'not-allowed' : 'pointer' }}
                >
                  <Plus size={15} />
                  {createLoading ? 'Publishing...' : 'Publish Anime'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
