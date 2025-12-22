"use client";

import { useState, useRef, useEffect } from "react";
import { Box, Center, ActionIcon, Group, Text, Progress, Tooltip } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerPauseFilled, IconMaximize, IconHistory } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface SecureVideoPlayerProps {
  url: string;
  title?: string;
  initialTime?: number; // Checkpoint awal
  onProgress?: (seconds: number) => void;
}

const formatTime = (seconds: number) => {
  if (!seconds) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export function SecureVideoPlayer({ url, title, initialTime = 0, onProgress }: SecureVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  
  // State untuk memastikan notifikasi hanya muncul sekali per sesi load
  const [hasResumed, setHasResumed] = useState(false); 

  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getVideoId(url);

  // 1. Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else {
      setIsApiReady(true);
    }
  }, []);

  // 2. Inisialisasi Player
  useEffect(() => {
    if (isApiReady && videoId && containerRef.current && !playerRef.current) {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0, 
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          start: initialTime, // Start awal (mungkin masih 0 jika data belum masuk)
        },
        events: {
          onStateChange: (event: any) => setIsPlaying(event.data === 1),
          onReady: (event: any) => {
             const vidDuration = event.target.getDuration();
             setDuration(vidDuration);
          }
        },
      });
    }
  }, [isApiReady, videoId]); // Hapus initialTime dari dependency ini agar player tidak re-init terus

  // 3. [FIX UTAMA] Watcher untuk 'initialTime'
  // Jika data checkpoint (misal: 26 detik) baru masuk SETELAH player jadi, kita paksa seek.
  useEffect(() => {
    if (playerRef.current && initialTime > 0 && !hasResumed) {
        
        // Cek apakah player sudah siap menerima perintah seek
        if (typeof playerRef.current.seekTo === 'function') {
            console.log("🔄 Melakukan Resume ke detik:", initialTime);
            
            playerRef.current.seekTo(initialTime);
            setCurrentTime(initialTime); // Update UI progress bar
            setHasResumed(true); // Tandai sudah di-resume agar tidak looping

            notifications.show({
                id: 'resume-notif',
                title: 'Video Dilanjutkan',
                message: `Melanjutkan dari ${formatTime(initialTime)}`,
                color: 'blue',
                icon: <IconHistory size={16}/>,
                autoClose: 3000,
            });
        }
    }
  }, [initialTime, hasResumed]); // Efek ini jalan setiap kali initialTime berubah (misal dari 0 -> 26)

  // 4. Interval Tracking Progress
  useEffect(() => {
    if (!playerRef.current || !isPlaying) return;
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        if (onProgress) onProgress(time);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, onProgress]);

  // Controls...
  const togglePlay = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const toggleFullscreen = () => {
    const wrapper = document.getElementById('secure-video-wrapper');
    if (wrapper) {
      !document.fullscreenElement ? wrapper.requestFullscreen().catch(console.error) : document.exitFullscreen();
    }
  };

  if (!videoId) return <Text c="red">URL Video tidak valid</Text>;

  return (
    <Box 
      id="secure-video-wrapper"
      pos="relative" 
      w="100%" 
      h={0} 
      pb="56.25%" 
      bg="black"
      style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      {/* Overlay */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'transparent', zIndex: 10,
          cursor: isPlaying ? 'none' : 'default',
        }}
        onContextMenu={(e) => e.preventDefault()}
        onClick={togglePlay}
      />

      {/* Play Button */}
      {!isPlaying && (
        <Center style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 11, pointerEvents: 'none' }}>
           <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: 20 }}>
             <IconPlayerPlayFilled size={48} color="white" />
           </div>
        </Center>
      )}

      {/* Control Bar */}
      <Box
        style={{
           position: 'absolute', bottom: 0, left: 0, right: 0,
           padding: '10px 20px',
           background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
           zIndex: 12,
           opacity: !isPlaying || isHovered ? 1 : 0,
           transition: 'opacity 0.2s',
           pointerEvents: !isPlaying || isHovered ? 'auto' : 'none'
        }}
      >
        <Tooltip label={`${formatTime(currentTime)} / ${formatTime(duration)}`}>
            <Progress 
                value={(currentTime / (duration || 1)) * 100} 
                size="sm" mb="xs" color="blue" radius="xl" animated={isPlaying} 
            />
        </Tooltip>

        <Group justify="space-between">
            <Group gap="xs">
                <ActionIcon variant="transparent" color="white" onClick={togglePlay}>
                    {isPlaying ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
                </ActionIcon>
                <Text c="white" size="xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </Text>
                {title && <Text c="white" size="sm" lineClamp={1} maw={200} ml="md" fw={500}>{title}</Text>}
            </Group>
            <ActionIcon variant="transparent" color="white" onClick={toggleFullscreen}>
                <IconMaximize />
            </ActionIcon>
        </Group>
      </Box>
    </Box>
  );
}