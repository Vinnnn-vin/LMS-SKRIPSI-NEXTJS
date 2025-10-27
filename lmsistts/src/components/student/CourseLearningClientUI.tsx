"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Box, Grid } from "@mantine/core";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { LearningHeader } from "./LearningHeader";
import { CourseSidebar } from "./CourseSidebar";
import { MaterialContent } from "./MaterialContent";
import { AssignmentContent } from "./AssignmentContent";
import { QuizContent } from "./QuizContent";
import { CountdownTimer } from "@/components/student/CountdownTimer";
import { ActiveQuizPlayer } from "@/components/student/ActiveQuizPlayer";
import { AssignmentSubmissionArea } from "@/components/student/AssignmentSubmissionArea";

export function CourseLearningClientUI({
  course,
  completedItems,
  enrollmentId,
  totalProgress,
  initialSubmissionData = [],
  initialQuizAttempts = [],
  submissionHistoryMap = {},
  accessExpiresAt,
  enrolledAt,
}: {
  course: any;
  completedItems: {
    details: Set<number>;
    quizzes: Set<number>;
    assignments: Set<number>;
  };
  enrollmentId: number;
  totalProgress: number;
  initialSubmissionData?: any[];
  initialQuizAttempts?: any[];
  submissionHistoryMap?: Record<number, any[]>;
  accessExpiresAt?: Date | string | null;
  enrolledAt?: Date | string;
}) {
  const router = useRouter();
  const [activeContent, setActiveContent] = useState<any>(null);
  const [contentType, setContentType] = useState<"detail" | "quiz" | null>(
    null
  );
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isPending, startTransition] = useTransition();

  const completedDetails = completedItems.details;
  const completedQuizzes = completedItems.quizzes;
  const completedAssignments = completedItems.assignments;

  const currentSubmission = useMemo(() => {
    if (
      contentType === "detail" &&
      activeContent?.material_detail_type === 4 &&
      initialSubmissionData
    ) {
      return initialSubmissionData.find(
        (s: any) => s.material_detail_id === activeContent.material_detail_id
      );
    }
    return null;
  }, [activeContent, contentType, initialSubmissionData]);

  const currentSubmissionHistory = useMemo(() => {
    if (
      contentType === "detail" &&
      activeContent?.material_detail_type === 4 &&
      submissionHistoryMap
    ) {
      return submissionHistoryMap[activeContent.material_detail_id] || [];
    }
    return [];
  }, [activeContent, contentType, submissionHistoryMap]);

  const currentQuizAttempts = useMemo(() => {
    if (
      contentType === "quiz" &&
      activeContent?.quiz_id &&
      initialQuizAttempts
    ) {
      return initialQuizAttempts.filter(
        (attempt: any) => attempt.quiz_id === activeContent.quiz_id
      );
    }
    return [];
  }, [activeContent, contentType, initialQuizAttempts]);

  const latestQuizAttempt = useMemo(() => {
    if (currentQuizAttempts.length === 0) return null;
    return [...currentQuizAttempts].sort(
      (a: any, b: any) => b.attempt_session - a.attempt_session
    )[0];
  }, [currentQuizAttempts]);

  const isAccessExpired = accessExpiresAt
    ? dayjs().isAfter(dayjs(accessExpiresAt))
    : false;

  const handleSelectContent = (content: any, type: "detail" | "quiz") => {
    if (isAccessExpired) return;
    setActiveContent(content);
    setContentType(type);
    setIsQuizActive(false);
  };

  const handleStartQuiz = () => {
    const maxAttempts = activeContent?.max_attempts || 1;
    const uniqueAttempts = new Set(
      currentQuizAttempts.map((a: any) => a.attempt_session)
    );
    if (uniqueAttempts.size >= maxAttempts) return;
    setIsQuizActive(true);
  };

  const handleQuizFinish = (result: {
    score: number;
    status: "passed" | "failed";
  }) => {
    setIsQuizActive(false);
    router.refresh();
  };

  const renderContent = () => {
    if (isAccessExpired) {
      return (
        <Box p="xl" style={{ textAlign: "center" }}>
          <CountdownTimer
            expiresAt={accessExpiresAt}
            type="course"
            showProgress={true}
            startedAt={enrolledAt}
          />
        </Box>
      );
    }

    if (!activeContent) {
      return (
        <Box h="100%">
          {accessExpiresAt && (
            <CountdownTimer
              expiresAt={accessExpiresAt}
              type="course"
              title="Sisa Waktu Akses Kursus"
              showProgress={true}
              startedAt={enrolledAt}
            />
          )}
        </Box>
      );
    }

    if (
      contentType === "detail" &&
      [1, 2, 3].includes(activeContent.material_detail_type)
    ) {
      return (
        <MaterialContent
          detail={activeContent}
          course={course}
          enrollmentId={enrollmentId}
          isCompleted={completedDetails.has(activeContent.material_detail_id)}
          accessExpiresAt={accessExpiresAt}
          enrolledAt={enrolledAt}
          onComplete={() => router.refresh()}
        />
      );
    }

    if (contentType === "detail" && activeContent.material_detail_type === 4) {
      return (
        <AssignmentContent
          detail={activeContent}
          course={course}
          enrollmentId={enrollmentId}
          existingSubmission={currentSubmission}
          submissionHistory={currentSubmissionHistory}
          accessExpiresAt={accessExpiresAt}
          enrolledAt={enrolledAt}
          onSubmit={() => router.refresh()}
        />
      );
    }

    if (contentType === "quiz") {
      return (
        <QuizContent
          quiz={activeContent}
          course={course}
          enrollmentId={enrollmentId}
          currentQuizAttempts={currentQuizAttempts}
          completedQuizzes={completedQuizzes}
          onStartQuiz={handleStartQuiz}
          isQuizActive={isQuizActive}
          onFinish={handleQuizFinish}
          accessExpiresAt={accessExpiresAt}
          enrolledAt={enrolledAt}
          latestQuizAttempt={latestQuizAttempt}
        />
      );
    }

    return null;
  };

  return (
    <Box>
      <LearningHeader
        courseTitle={course.course_title}
        totalProgress={totalProgress}
      />
      <Grid gutter={0}>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <CourseSidebar
            course={course}
            completedDetails={completedDetails}
            completedQuizzes={completedQuizzes}
            completedAssignments={completedAssignments}
            handleSelectContent={handleSelectContent}
            isAccessExpired={isAccessExpired}
            accessExpiresAt={accessExpiresAt}
            enrolledAt={enrolledAt}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Box
            p="lg"
            style={{
              height: "calc(100vh - 70px)",
              overflowY: "auto",
              backgroundColor: "var(--mantine-color-gray-0)",
            }}
          >
            {renderContent()}
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
