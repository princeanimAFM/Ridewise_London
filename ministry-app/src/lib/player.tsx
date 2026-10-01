import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { Episode } from './podcast';
import { ministry } from '@/content/ministry';

type PlayerContext = {
  episode?: Episode;
  playing: boolean;
  buffering: boolean;
  position: number;
  duration: number;
  play: (e: Episode) => void;
  toggle: () => void;
  seekBy: (seconds: number) => void;
  seekTo: (seconds: number) => void;
  stop: () => void;
};

const Ctx = createContext<PlayerContext | null>(null);

/** One shared audio player for the whole app, so a sermon keeps playing while you browse. */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [episode, setEpisode] = useState<Episode>();

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  }, []);

  const play = (e: Episode) => {
    if (episode?.id === e.id) {
      player.play();
      return;
    }
    setEpisode(e);
    player.replace({ uri: e.audioUrl });
    player.play();
    try {
      player.setActiveForLockScreen(true, {
        title: e.title,
        artist: ministry.minister,
        albumTitle: ministry.podcast.title,
        artworkUrl: e.image,
      });
    } catch {
      // lock screen controls unavailable (e.g. web)
    }
  };

  const value: PlayerContext = {
    episode,
    playing: status.playing,
    buffering: status.isBuffering,
    position: status.currentTime,
    duration: status.duration || episode?.duration || 0,
    play,
    toggle: () => (status.playing ? player.pause() : player.play()),
    seekBy: (s) => player.seekTo(Math.max(0, status.currentTime + s)),
    seekTo: (s) => player.seekTo(s),
    stop: () => {
      player.pause();
      try {
        player.clearLockScreenControls();
      } catch {}
      setEpisode(undefined);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
