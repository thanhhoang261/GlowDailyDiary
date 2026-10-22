import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Volume2, Sparkles, RefreshCw } from 'lucide-react';

interface AudioRecorderProps {
  existingAudioUrl?: string | null;
  existingDuration?: number | null;
  onAudioReady: (blob: Blob, duration: number) => void;
  onAudioDelete?: () => void;
  isSaving?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  existingAudioUrl,
  existingDuration,
  onAudioReady,
  onAudioDelete,
  isSaving = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingAudioUrl || null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState<number>(existingDuration || 0);

  // Media references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Visualizer audio context
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [visualLevels, setVisualLevels] = useState<number[]>([15, 25, 40, 20, 30, 50, 25, 15]);

  useEffect(() => {
    if (existingAudioUrl) {
      setPreviewUrl(existingAudioUrl);
      if (existingDuration) setTotalDuration(existingDuration);
    } else {
      setPreviewUrl(null);
      setAudioBlob(null);
      setTotalDuration(0);
    }
  }, [existingAudioUrl, existingDuration]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWave = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Pick 8 representative bars
        const bars: number[] = [];
        const step = Math.floor(bufferLength / 8);
        for (let i = 0; i < 8; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.max(12, Math.round((val / 255) * 60)));
        }
        setVisualLevels(bars);
        animationFrameRef.current = requestAnimationFrame(updateWave);
      };

      updateWave();
    } catch (e) {
      console.warn('Audio visualizer not supported or failed:', e);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVisualLevels([15, 25, 40, 20, 30, 50, 25, 15]);
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setTotalDuration(recordDuration);
        onAudioReady(blob, recordDuration);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // slices every 250ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordDuration(0);

      // Visualizer
      startVisualizer(stream);

      // Timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      alert('Microphone access was denied or is not supported by your browser.');
    }
  };

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    stopVisualizer();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopRecordingCleanup();
    }
  };

  const handleTogglePlay = () => {
    if (!audioPlayerRef.current) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio play failed:', err));
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioPlayerRef.current) {
      setPlaybackTime(audioPlayerRef.current.currentTime);
      if (audioPlayerRef.current.duration && !isNaN(audioPlayerRef.current.duration)) {
        setTotalDuration(Math.round(audioPlayerRef.current.duration));
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlaybackTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setPlaybackTime(time);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = time;
    }
  };

  const handleDeleteAudio = () => {
    if (window.confirm('Delete this voice note?')) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsPlaying(false);
      setPreviewUrl(null);
      setAudioBlob(null);
      setTotalDuration(0);
      setPlaybackTime(0);
      if (onAudioDelete) {
        onAudioDelete();
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-rose-50/70 via-amber-50/60 to-purple-50/70 p-5 rounded-3xl border border-pink-100/90 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-pink-100 text-pink-600 rounded-2xl">
            <Mic className="w-5 h-5" />
          </span>
          <div>
            <h4 className="font-bold text-glow-cocoa text-base flex items-center gap-1.5">
              English Voice Note <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h4>
            <p className="text-xs text-glow-muted">
              Practice speaking English & record your thoughts for today!
            </p>
          </div>
        </div>

        {previewUrl && (
          <button
            type="button"
            onClick={handleDeleteAudio}
            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-100/60 rounded-xl transition"
            title="Delete Voice Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recording State */}
      {isRecording ? (
        <div className="bg-white/90 rounded-2xl p-4 border border-rose-200/80 shadow-sm flex flex-col items-center gap-3">
          {/* Animated Waveform */}
          <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-xs">
            {visualLevels.map((h, i) => (
              <div
                key={i}
                className="w-2.5 bg-gradient-to-t from-pink-400 to-rose-500 rounded-full transition-all duration-75"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono font-bold text-rose-600 text-lg">
              {formatTime(recordDuration)}
            </span>
            <span className="text-xs text-glow-muted uppercase tracking-wider font-semibold">
              Recording
            </span>
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-cute bouncy-button"
          >
            <Square className="w-4 h-4 fill-white" />
            Done Recording
          </button>
        </div>
      ) : previewUrl ? (
        /* Preview / Playback State */
        <div className="bg-white/95 rounded-2xl p-4 border border-pink-100 shadow-sm flex flex-col gap-3">
          <audio
            ref={audioPlayerRef}
            src={previewUrl}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={handleAudioEnded}
            onLoadedMetadata={handleAudioTimeUpdate}
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 text-white shadow-cute bouncy-button"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white translate-x-0.5" />
              )}
            </button>

            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-xs text-glow-muted font-mono font-semibold">
                <span>{formatTime(playbackTime)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={totalDuration || 100}
                step="0.1"
                value={playbackTime}
                onChange={handleSeek}
                className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            <button
              type="button"
              onClick={startRecording}
              className="p-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl transition text-xs font-bold flex items-center gap-1.5"
              title="Record again"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-record
            </button>
          </div>
        </div>
      ) : (
        /* Idle State (Prompt to Record) */
        <div className="bg-white/70 rounded-2xl p-4 border border-dashed border-pink-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-glow-muted text-sm">
            <span className="w-10 h-10 rounded-2xl bg-amber-100/70 text-amber-600 flex items-center justify-center">
              🎙️
            </span>
            <div>
              <p className="font-semibold text-glow-cocoa text-sm">
                No voice note recorded yet today
              </p>
              <p className="text-xs text-glow-muted">
                Tap the record button to speak in English for 30–60 seconds!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-2xl shadow-cute bouncy-button whitespace-nowrap"
          >
            <Mic className="w-4 h-4" />
            Start Voice Note
          </button>
        </div>
      )}
    </div>
  );
};
