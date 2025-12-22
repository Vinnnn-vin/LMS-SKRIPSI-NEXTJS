"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stack, Title, Box, Paper, Divider, Group, Text, Badge } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { CountdownTimer } from "@/components/student/CountdownTimer";
import { CompleteButton } from "./CompleteButton";
import { SecureVideoPlayer } from "./SecureVideoPlayer";
import { SecurePdfViewer } from "./SecurePdfViewer";
import { useSession } from "next-auth/react";
import { saveVideoProgress, getVideoProgress } from "@/app/actions/student.actions";

interface MaterialContentProps {
  detail: any;
  course: any;
  enrollmentId: number;
  isCompleted: boolean;
  accessExpiresAt?: Date | string | null;
  enrolledAt?: Date | string;
  onComplete: () => void;
}

const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be");
};

const isPdfUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith(".pdf") || lowerUrl.includes("pdf");
};

export function MaterialContent({
  detail,
  course,
  enrollmentId,
  isCompleted,
  accessExpiresAt,
  enrolledAt,
  onComplete,
}: MaterialContentProps) {
  console.log("🎬 [MaterialContent] Mounted:", {
    material_detail_id: detail?.material_detail_id,
    material_detail_name: detail?.material_detail_name,
    material_detail_type: detail?.material_detail_type,
    isCompleted,
  });

  const { data: session } = useSession();
  const isYouTube = isYouTubeUrl(detail?.materi_detail_url);
  const isPdf = isPdfUrl(detail?.materi_detail_url);
  const userName = session?.user?.name || session?.user?.email || "ISTTS USER";

  // Refs & State
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(0);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [initialTime, setInitialTime] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fungsi Simpan ke Backend
  const saveToBackend = async (seconds: number) => {
    if (seconds > 5 && !isCompleted) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      console.log(`💾 Saving to DB: ${minutes}:${String(secs).padStart(2, '0')} (${seconds}s)`);
      
      setIsSaving(true);
      const result = await saveVideoProgress(
        course.course_id,
        detail.material_detail_id,
        seconds
      );
      setIsSaving(false);

      if (result.success) {
        setLastSavedTime(seconds);
        console.log(`✅ ✨ PROGRESS TERSIMPAN: ${minutes}:${String(secs).padStart(2, '0')} (${seconds}s)`);
      } else {
        console.error("❌ Save failed:", result.error);
      }
    }
  };

  // 2. Auto-Save dengan Debounce (ganti dari 5 detik ke 0.5 detik)
  const debouncedSave = useDebouncedCallback((seconds: number) => {
    saveToBackend(seconds);
  }, 500); // 👈 Ganti dari 5000 ke 500ms (0.5 detik)

  // 3. Handler Progress dari SecureVideoPlayer
  const handleProgress = (seconds: number) => {
    lastTimeRef.current = seconds;
    debouncedSave(seconds);
  };

  // 4. Load Progress dari Database saat mount
  useEffect(() => {
    console.log("🔧 [useEffect] Starting load progress effect");
    console.log("🔧 [useEffect] detail.material_detail_id:", detail.material_detail_id);
    console.log("🔧 [useEffect] isCompleted:", isCompleted);
    
    const loadProgress = async () => {
      if (isCompleted) {
        console.log("⏭️ Video already completed, skipping progress load");
        return;
      }

      try {
        console.log("🔄 [CLIENT] Calling getVideoProgress for:", detail.material_detail_id);
        const result = await getVideoProgress(detail.material_detail_id);
        
        console.log("📥 [CLIENT] Full result object:", result);
        console.log("📥 [CLIENT] result.success:", result.success);
        console.log("📥 [CLIENT] result.data:", result.data);
        console.log("📥 [CLIENT] result.error:", result.error);

        if (result.success && result.data) {
          const savedSeconds = result.data.seconds || 0;
          
          console.log("📊 [CLIENT] Parsed savedSeconds:", savedSeconds);
          console.log("📊 [CLIENT] Type of savedSeconds:", typeof savedSeconds);
          console.log("📊 [CLIENT] Is completed:", result.data.completed);
          
          if (savedSeconds > 0 && !result.data.completed) {
            console.log(`✅ [CLIENT] Will set initialTime to: ${savedSeconds}`);
            
            setInitialTime(savedSeconds);
            setLastSavedTime(savedSeconds);
            lastTimeRef.current = savedSeconds;

            const minutes = Math.floor(savedSeconds / 60);
            const secs = Math.floor(savedSeconds % 60);
            console.log(`✅ ✨ RESUME VIDEO DARI: ${minutes}:${String(secs).padStart(2, '0')} (${savedSeconds}s)`);
            console.log(`✅ [CLIENT] State updated - initialTime = ${savedSeconds}`);
          } else {
            console.log("ℹ️ [CLIENT] Condition not met:", {
              savedSecondsIsZero: savedSeconds <= 0,
              isCompleted: result.data.completed
            });
          }
        } else {
          console.error("❌ [CLIENT] Result not successful or no data:", {
            success: result.success,
            hasData: !!result.data,
            error: result.error
          });
        }
      } catch (error) {
        console.error("❌ [CLIENT] Exception in loadProgress:", error);
      }
    };

    loadProgress();
  }, [detail.material_detail_id, isCompleted]);

  // 5. Cleanup - Save saat unmount
  useEffect(() => {
    return () => {
      const finalTime = lastTimeRef.current;
      if (finalTime > 5 && !isCompleted) {
        console.log("🚪 [Unmount] Force saving:", finalTime);
        void saveVideoProgress(
          course.course_id,
          detail.material_detail_id,
          finalTime
        );
      }

      // Clear interval untuk video regular
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [course.course_id, detail.material_detail_id, isCompleted]);

  // 6. Handlers untuk Regular Video (MP4)
  const handleVideoPlay = () => {
    if (isCompleted) return;

    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    saveIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        const currentSeconds = Math.floor(videoRef.current.currentTime);
        lastTimeRef.current = currentSeconds;

        // Save setiap 1 detik (karena interval 500ms, tapi cek perubahan 1 detik)
        if (Math.abs(currentSeconds - lastSavedTime) >= 1) {
          saveToBackend(currentSeconds);
        }
      }
    }, 500); // 👈 Ganti dari 3000ms ke 500ms (0.5 detik)
  };

  const handleVideoPause = () => {
    if (isCompleted) return;

    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    if (videoRef.current) {
      const currentSeconds = Math.floor(videoRef.current.currentTime);
      const minutes = Math.floor(currentSeconds / 60);
      const secs = currentSeconds % 60;
      console.log(`⏸️ Video paused at: ${minutes}:${String(secs).padStart(2, '0')} (${currentSeconds}s)`);
      saveToBackend(currentSeconds);
    }
  };

  const handleVideoEnded = () => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }
    console.log("🏁 Video ended");
  };

  const handleVideoSeeking = () => {
    if (videoRef.current && !isCompleted) {
      const currentSeconds = Math.floor(videoRef.current.currentTime);
      lastTimeRef.current = currentSeconds;
    }
  };

  const handleLoadedMetadata = () => {
    console.log("📹 [Video] Metadata loaded");
    console.log("📹 [Video] Current initialTime state:", initialTime);
    console.log("📹 [Video] videoRef.current exists:", !!videoRef.current);
    
    if (videoRef.current && initialTime > 0) {
      console.log(`▶️ [Video] Setting currentTime to: ${initialTime}s`);
      videoRef.current.currentTime = initialTime;
      
      const minutes = Math.floor(initialTime / 60);
      const secs = initialTime % 60;
      console.log(`✅ [Video] Resumed from: ${minutes}:${String(secs).padStart(2, '0')}`);
    } else {
      console.log("ℹ️ [Video] No initialTime to resume, starting from 0");
    }
  };

  return (
    <Stack gap="lg">
      {accessExpiresAt && (
        <CountdownTimer
          expiresAt={accessExpiresAt}
          type="course"
          showProgress={true}
          startedAt={enrolledAt}
        />
      )}

      <Group justify="space-between" align="center">
        <Title order={3}>{detail.material_detail_name}</Title>
        
        {/* Badge untuk Regular Video */}
        {!isYouTube && detail.material_detail_type === 1 && (
          <Group gap="xs">
            {isSaving && (
              <Badge color="yellow" variant="light" size="sm">
                💾 Menyimpan...
              </Badge>
            )}
            {lastSavedTime > 0 && !isSaving && (
              <Badge color="green" variant="light" size="sm">
                ✅ Tersimpan: {Math.floor(lastSavedTime / 60)}:{String(lastSavedTime % 60).padStart(2, '0')}
              </Badge>
            )}
          </Group>
        )}
      </Group>

      <Box>
        {/* YouTube Video / SecureVideoPlayer */}
        {(isYouTube || detail.material_detail_type === 3) && detail.materi_detail_url && (
          <>
            {console.log("🎥 [Render] SecureVideoPlayer")}
            {console.log("🎥 [Render] initialTime being passed:", initialTime)}
            {console.log("🎥 [Render] URL:", detail.materi_detail_url)}
            <SecureVideoPlayer
              url={detail.materi_detail_url}
              title={detail.material_detail_name}
              initialTime={initialTime}
              onProgress={handleProgress}
            />
          </>
        )}

        {/* Regular Video (MP4) */}
        {!isYouTube &&
          detail.material_detail_type === 1 &&
          detail.materi_detail_url && (
            <>
              {console.log("🎥 [Render] Regular video element")}
              <video
                ref={videoRef}
                controls
                width="100%"
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
                onSeeking={handleVideoSeeking}
                onLoadedMetadata={handleLoadedMetadata}
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-gray-3)",
                  maxHeight: "70vh",
                }}
              >
                <source src={detail.materi_detail_url} type="video/mp4" />
                Browser Anda tidak mendukung tag video.
              </video>
            </>
          )}

        {/* PDF Viewer */}
        {detail.material_detail_type === 2 && detail.materi_detail_url && (
          <>
            {isPdf ? (
              <SecurePdfViewer
                fileUrl={detail.materi_detail_url}
                userName={userName}
              />
            ) : (
              <Box
                style={{
                  position: "relative",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <iframe
                  src={detail.materi_detail_url}
                  style={{
                    width: "100%",
                    height: "70vh",
                    border: "1px solid var(--mantine-color-gray-3)",
                    borderRadius: "var(--mantine-radius-md)",
                    pointerEvents: "auto",
                  }}
                  title={detail.material_detail_name}
                  sandbox="allow-same-origin allow-scripts"
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Deskripsi Materi */}
      {detail.material_detail_description && (
        <Paper p="md" withBorder radius="md" bg="gray.0">
          <Title order={5} mb="xs">
            Deskripsi Materi
          </Title>
          <Text
            size="sm"
            style={{ whiteSpace: "pre-wrap" }}
            dangerouslySetInnerHTML={{
              __html: detail.material_detail_description.replace(/\n/g, "<br />"),
            }}
          />
        </Paper>
      )}

      <Divider />

      <Group justify="flex-end">
        <CompleteButton
          materialDetailId={detail.material_detail_id}
          courseId={course.course_id}
          enrollmentId={enrollmentId}
          isCompleted={isCompleted}
          onComplete={onComplete}
        />
      </Group>
    </Stack>
  );
}