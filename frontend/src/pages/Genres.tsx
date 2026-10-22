import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Flame, Compass, Wand2, Sparkles, Swords, Heart, Smile, Film, Coffee, Skull, Brain, Search, AlertCircle, Rocket, Bot, Trophy, Ghost, Landmark, Users, Music, ShieldAlert } from 'lucide-react';
import { AgeVerificationModal } from '../components/AgeVerificationModal';

interface GenreCard {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGrad: string;
}

const ALL_GENRES: GenreCard[] = [
  { name: 'Action', description: 'High-intensity battles, martial arts, and adrenaline-fueled showdowns.', icon: <Flame size={24} />, color: '#ef4444', bgGrad: 'rgba(239, 68, 68, 0.12)' },
  { name: 'Adventure', description: 'Grand journeys into unknown lands, treasure hunts, and epic expeditions.', icon: <Compass size={24} />, color: '#f59e0b', bgGrad: 'rgba(245, 158, 11, 0.12)' },
  { name: 'Fantasy', description: 'Mythical realms, ancient magic, sorcery, and enchanting worlds.', icon: <Wand2 size={24} />, color: '#4E50DE', bgGrad: 'rgba(78, 80, 222, 0.12)' },
  { name: 'Isekai', description: 'Reincarnated or transported into another universe with unique abilities.', icon: <Sparkles size={24} />, color: '#6365F1', bgGrad: 'rgba(99, 101, 241, 0.12)' },
  { name: 'Shonen', description: 'Friendship, training, overcoming impossible odds, and heroic destinies.', icon: <Swords size={24} />, color: '#3b82f6', bgGrad: 'rgba(59, 130, 246, 0.12)' },
  { name: 'Romance', description: 'Heartfelt emotional connections, sweet confessions, and love stories.', icon: <Heart size={24} />, color: '#ec4899', bgGrad: 'rgba(236, 72, 153, 0.12)' },
  { name: 'Comedy', description: 'Hilarious misadventures, gag comedy, parodies, and lighthearted humor.', icon: <Smile size={24} />, color: '#eab308', bgGrad: 'rgba(234, 179, 8, 0.12)' },
  { name: 'Drama', description: 'Deep human emotions, personal dilemmas, and gripping narratives.', icon: <Film size={24} />, color: '#6366f1', bgGrad: 'rgba(99, 102, 241, 0.12)' },
  { name: 'Slice of Life', description: 'Warm everyday moments, relaxing school life, and heartwarming friendship.', icon: <Coffee size={24} />, color: '#10b981', bgGrad: 'rgba(16, 185, 129, 0.12)' },
  { name: 'Horror', description: 'Chilling dread, terrifying apparitions, dark curses, and suspense.', icon: <Skull size={24} />, color: '#dc2626', bgGrad: 'rgba(220, 38, 38, 0.12)' },
  { name: 'Psychological', description: 'Mind games, moral conflicts, intellectual duels, and fractured sanity.', icon: <Brain size={24} />, color: '#7577EC', bgGrad: 'rgba(117, 119, 236, 0.12)' },
  { name: 'Mystery', description: 'Puzzling crimes, detective cases, cryptic secrets, and unraveled truths.', icon: <Search size={24} />, color: '#14b8a6', bgGrad: 'rgba(20, 184, 166, 0.12)' },
  { name: 'Thriller', description: 'High-stakes suspense, conspiracies, relentless pursuit, and ticking clocks.', icon: <AlertCircle size={24} />, color: '#f97316', bgGrad: 'rgba(249, 115, 22, 0.12)' },
  { name: 'Science Fiction', description: 'Futuristic technology, cybernetics, space odysseys, and dystopian worlds.', icon: <Rocket size={24} />, color: '#06b6d4', bgGrad: 'rgba(6, 182, 212, 0.12)' },
  { name: 'Mecha', description: 'Gigantic robotic combat units, neural interfaces, and armored warfare.', icon: <Bot size={24} />, color: '#0ea5e9', bgGrad: 'rgba(14, 165, 233, 0.12)' },
  { name: 'Sports', description: 'Teamwork, competitive athletic rivalries, tournaments, and passion.', icon: <Trophy size={24} />, color: '#84cc16', bgGrad: 'rgba(132, 204, 22, 0.12)' },
  { name: 'Supernatural', description: 'Shinigami, curses, spirits, psychic powers, and otherworldly entities.', icon: <Ghost size={24} />, color: '#F32E35', bgGrad: 'rgba(243, 46, 53, 0.12)' },
  { name: 'Historical', description: 'Samurai eras, ancient dynasties, war chronicles, and historical epics.', icon: <Landmark size={24} />, color: '#d97706', bgGrad: 'rgba(217, 119, 6, 0.12)' },
  { name: 'Family', description: 'Wholesome adventures, charming magical companions, and all-ages delight.', icon: <Users size={24} />, color: '#22c55e', bgGrad: 'rgba(34, 197, 94, 0.12)' },
  { name: 'Music', description: 'Band performances, classical orchestras, idol dreams, and stage passion.', icon: <Music size={24} />, color: '#f43f5e', bgGrad: 'rgba(244, 63, 94, 0.12)' },
  { name: '18+', description: 'Mature and TV-MA rated anime featuring intense action, psychological suspense, and mature themes.', icon: <ShieldAlert size={24} />, color: '#e11d48', bgGrad: 'rgba(225, 29, 72, 0.12)' }
];

export const Genres: React.FC = () => {
  const navigate = useNavigate();
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);

  const handleGenreClick = (genreName: string) => {
    if (genreName === '18+') {
      const isVerified = localStorage.getItem('aniverse_age_verified') === 'true';
      if (!isVerified) {
        setIsAgeModalOpen(true);
        return;
      }
    }
    navigate(`/search?genre=${encodeURIComponent(genreName)}`);
  };

  const handleAgeConfirm = () => {
    localStorage.setItem('aniverse_age_verified', 'true');
    setIsAgeModalOpen(false);
    navigate(`/search?genre=${encodeURIComponent('18+')}`);
  };

  const handleAgeDecline = () => {
    setIsAgeModalOpen(false);
  };

  return (
    <div className="app-container" style={{ padding: '30px 24px', color: '#fff' }}>
      
      {/* Age Verification Modal */}
      <AgeVerificationModal
        isOpen={isAgeModalOpen}
        onConfirm={handleAgeConfirm}
        onDecline={handleAgeDecline}
      />

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
          <Layers size={22} style={{ color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, margin: 0 }}>
            Browse Anime by Genre
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0' }}>
            Explore our curated 400+ anime library across 21 distinct storytelling categories.
          </p>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0 32px' }} />

      {/* GENRES GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {ALL_GENRES.map((g) => (
          <div
            key={g.name}
            onClick={() => handleGenreClick(g.name)}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              className="nm-card"
              style={{
                padding: '24px',
                borderRadius: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = `${g.color}55`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ background: g.bgGrad, color: g.color, padding: '12px', borderRadius: '12px', display: 'flex' }}>
                    {g.icon}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: g.color, background: g.bgGrad, padding: '3px 10px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Explore
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                  {g.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
                  {g.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: g.color, marginTop: '20px' }}>
                <span>View Anime In Category</span> &rarr;
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
