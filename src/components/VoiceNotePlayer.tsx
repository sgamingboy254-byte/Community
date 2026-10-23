import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
  durationSeconds?: number;
  themeMode?: string;
  isMine?: boolean;
  isSender?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  duration,
  durationSeconds,
  themeMode,
  isMine,
  isSender,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || durationSeconds || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback error:', err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = Number(e.target.value);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      className={`my-2 p-2.5 sm:p-3 rounded-2xl flex items-center gap-3 max-w-sm sm:max-w-md transition-all shadow-md backdrop-blur-md border ${
        isMine || isSender
          ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-900 dark:text-indigo-100'
          : 'bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play / Pause Toggle Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer ${
          isPlaying
            ? 'bg-amber-500 text-black scale-105 shadow-amber-500/30'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 active:scale-95'
        }`}
        title={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform Visualization & Scrubber */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-0.5 h-6 px-1">
          {/* Simulated Animated Equalizer Bars */}
          {[40, 75, 55, 90, 65, 80, 50, 95, 70, 60, 85, 45, 90, 65, 55, 75, 40, 85].map(
            (heightPercent, idx) => {
              const barProgress = (idx / 18) * 100;
              const isPast = barProgress <= progressPercent;

              return (
                <div
                  key={idx}
                  style={{
                    height: isPlaying ? `${Math.max(20, Math.sin((idx + currentTime * 8)) * 35 + 50)}%` : `${heightPercent}%`,
                  }}
                  className={`flex-1 rounded-full transition-all duration-150 ${
                    isPast
                      ? 'bg-indigo-600 dark:bg-cyan-400'
                      : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                />
              );
            }
          )}
        </div>

        {/* Range Scrubber and Time Counters */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400 px-0.5">
          <div className="flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5 text-indigo-500" />
            <span>{formatTime(currentTime)}</span>
          </div>
          <span>{formatTime(totalDuration || currentTime)}</span>
        </div>

        <input
          type="range"
          min="0"
          max={totalDuration || 1}
          step="0.05"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-transparent appearance-none cursor-pointer accent-indigo-600 -mt-0.5"
        />
      </div>
    </div>
  );
};
