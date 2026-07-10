import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, FastForward, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface CustomPlayerProps {
  videoUrl: string;
  animeId: string;
  episodeNumber: number;
}

export const CustomPlayer: React.FC<CustomPlayerProps> = ({ videoUrl, animeId, episodeNumber }) => {
  const { isAuthenticated } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const controlsTimeoutRef = useRef<number | null>(null);

  // Sync state if videoUrl change (new episode)
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  // Mouse movement hides controls after 3 seconds of idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Periodic watch progress logging to backend (every 10s if playing)
  useEffect(() => {
    if (!isAuthenticated || !isPlaying) return;

    const saveHistory = async () => {
      if (!videoRef.current) return;
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      if (cur > 0 && dur > 0) {
        try {
          await axios.post('/api/history', {
            animeId,
            episodeNumber,
            watchedTime: cur,
            duration: dur,
          });
        } catch (err) {
          console.error('Failed to update watch history:', err);
        }
      }
    };

    const interval = setInterval(saveHistory, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [isPlaying, animeId, episodeNumber, isAuthenticated]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch((err) => console.log('Video play interrupted:', err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekTime = parseFloat(e.target.value);
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
    if (!nextMute && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => console.error('Fullscreen request rejected:', err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Skip 10s forward/backward
  const skipTime = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.currentTime + amount, duration)
      );
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle play pause with Spacebar
      if (e.code === 'Space') {
        // Prevent window scroll
        e.preventDefault();
        handlePlayPause();
      }
      if (e.code === 'ArrowRight') {
        skipTime(10);
      }
      if (e.code === 'ArrowLeft') {
        skipTime(-10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  // Format time (e.g. 01:23 or 01:05:42)
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const hrs = Math.floor(timeInSeconds / 3600);
    const mins = Math.floor((timeInSeconds % 3600) / 60);
    const secs = Math.floor(timeInSeconds % 60);

    const formattedMins = String(mins).padStart(2, '0');
    const formattedSecs = String(secs).padStart(2, '0');

    if (hrs > 0) {
      return `${hrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${formattedMins}:${formattedSecs}`;
  };

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000',
        borderRadius: isTheaterMode || isFullscreen ? '0' : '12px',
        overflow: 'hidden',
        boxShadow: 'var(--glass-shadow)',
        aspectRatio: '16/9',
      }}
      className={`video-player-container ${isFullscreen ? 'fullscreen' : ''} ${isTheaterMode ? 'theater' : ''}`}
    >
      {/* NATIVE VIDEO TAG */}
      <video
        ref={videoRef}
        src={videoUrl}
        onClick={handlePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
      />

      {/* CONTROLS OVERLAY CONTAINER */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.4) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'all' : 'none',
          transition: 'opacity 0.4s ease',
          zIndex: 10,
        }}
      >
        
        {/* TOP METADATA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            Episode {episodeNumber}
          </div>
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'var(--transition-fast)' }}
            className="theater-btn"
          >
            {isTheaterMode ? 'Normal Mode' : 'Theater Mode'}
          </button>
        </div>

        {/* MIDDLE WATERMARK OR LARGE PLAY BUTTON */}
        <div onClick={handlePlayPause} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, cursor: 'pointer' }}>
          {!isPlaying && (
            <div style={{ background: 'var(--color-primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-shadow)', transform: 'scale(1)', transition: 'transform 0.2s ease' }} className="large-play-icon">
              <Play size={28} style={{ fill: '#fff', color: '#fff', marginLeft: '4px' }} />
            </div>
          )}
        </div>

        {/* BOTTOM CONTROLS PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Progress Seek Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="custom-range"
              style={{ flex: 1 }}
            />
          </div>

          {/* Buttons row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            
            {/* Left controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              
              {/* Play Pause */}
              <button onClick={handlePlayPause} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              {/* Backward 10s */}
              <button onClick={() => skipTime(-10)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <RotateCcw size={18} />
              </button>

              {/* Forward 10s */}
              <button onClick={() => skipTime(10)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <FastForward size={18} />
              </button>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="volume-widget">
                <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{ width: '70px', height: '4px', cursor: 'pointer' }}
                  className="volume-slider"
                />
              </div>

              {/* Time display */}
              <div style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: 500 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
              
              {/* Speed Settings Menu */}
              <div>
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 }}
                >
                  <Settings size={18} />
                  <span>{playbackSpeed}x</span>
                </button>

                {showSpeedMenu && (
                  <div style={{ position: 'absolute', bottom: '130%', right: 0, background: '#11111a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', width: '80px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 12 }}>
                    {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => changeSpeed(speed)}
                        style={{ width: '100%', border: 'none', background: playbackSpeed === speed ? 'var(--color-primary)' : 'none', color: '#fff', padding: '6px 0', fontSize: '12px', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                        className="speed-option"
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .theater-btn:hover { background: var(--color-primary) !important; border-color: var(--color-primary) !important; }
        .large-play-icon:hover { transform: scale(1.1) !important; }
        .speed-option:hover { background: rgba(255,255,255,0.06); }
      `}</style>
    </div>
  );
};
