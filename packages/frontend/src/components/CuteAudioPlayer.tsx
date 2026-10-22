import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface CuteAudioPlayerProps {
  src: string;
  initialDuration?: number | null;
  className?: string;
}

export const CuteAudioPlayer: React.FC<CuteAudioPlayerProps> = ({
  src,
  initialDuration,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(
    initialDuration && Number.isFinite(initialDuration) && initialDuration > 0
      ? Math.round(initialDuration)
      : 0
  );
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (initialDuration && Number.isFinite(initialDuration) && initialDuration > 0) {
      setDuration(Math.round(initialDuration));
    }
  }, [initialDuration]);

  // Decode audio data to extract exact duration if not known or 0
  useEffect(() => {
    if (!src) return;
    if (Number.isFinite(duration) && duration > 0) return;

    let isCancelled = false;
    const detectDuration = async () => {
      try {
        const res = await fetch(src);
        const buffer = await res.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const decoded = await ctx.decodeAudioData(buffer);
        if (!isCancelled && decoded && Number.isFinite(decoded.duration) && decoded.duration > 0) {
          setDuration(Math.round(decoded.duration));
        }
        ctx.close().catch(() => {});
      } catch {
        // Fallback: will update on playback
      }
    };

    detectDuration();
    return () => {
      isCancelled = true;
    };
  }, [src, duration]);

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || isNaN(secs) || secs < 0) {
      return '00:00';
    }
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio play failed:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime || 0;
    setCurrentTime(cur);

    const dur = audioRef.current.duration;
    if (Number.isFinite(dur) && dur > 0) {
      setDuration(Math.round(dur));
    } else if (cur > duration) {
      setDuration(Math.ceil(cur));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (currentTime > 0 && (!Number.isFinite(duration) || duration <= 0)) {
      setDuration(Math.round(currentTime));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const time = parseFloat(e.target.value);
    if (!Number.isFinite(time)) return;
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const maxDuration = Number.isFinite(duration) && duration > 0 ? duration : Math.max(60, Math.ceil(currentTime));

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-3 p-2.5 px-3.5 bg-gradient-to-r from-pink-50/60 via-rose-50/40 to-amber-50/40 hover:from-pink-50/90 rounded-2xl border border-pink-100 transition shadow-2xs ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={handleTogglePlay}
        className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white flex items-center justify-center shadow-cute bouncy-button shrink-0 transition"
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-white" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
        )}
      </button>

      {/* Time & Progress Slider */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <div className="flex justify-between items-center text-[11px] font-mono font-bold text-glow-cocoa px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span className="text-glow-muted">
            {duration > 0 ? formatTime(duration) : '--:--'}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={maxDuration}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-pink-200/60 rounded-lg appearance-none cursor-pointer accent-rose-500"
        />
      </div>

      {/* Mute Toggle */}
      <button
        type="button"
        onClick={handleToggleMute}
        className="p-1.5 text-glow-muted hover:text-rose-500 transition rounded-lg hover:bg-white shrink-0"
        title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
};
