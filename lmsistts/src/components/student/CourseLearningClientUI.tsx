// // lmsistts\src\components\student\CourseLearningClientUI.tsx

// "use client";

// import React, { useState, useTransition, useMemo, useEffect } from "react";
// import {
//   Box,
//   Grid,
//   Paper,
//   Stack,
//   Title,
//   Text,
//   Accordion,
//   NavLink,
//   ThemeIcon,
//   Center,
//   Button,
//   Alert,
//   Divider,
//   Progress,
//   Group,
//   Tooltip,
//   ActionIcon,
//   FileInput,
//   Textarea,
//   Card,
//   List,
//   RingProgress,
//   Modal,
//   Badge,
//   Loader,
// } from "@mantine/core";
// import {
//   IconVideo,
//   IconFileText,
//   IconLink,
//   IconPencil,
//   IconQuestionMark,
//   IconCircleCheckFilled,
//   IconPlayerPlay,
//   IconDownload,
//   IconArrowLeft,
//   IconUpload,
//   IconListCheck,
//   IconAlertCircle,
//   IconClock,
//   IconInfoCircle,
//   IconCheck,
//   IconX,
//   IconRefresh,
//   IconTrophy,
// } from "@tabler/icons-react";
// import { useRouter } from "next/navigation";
// import { notifications } from "@mantine/notifications";
// import Link from "next/link";
// import {
//   createOrUpdateAssignmentSubmission,
//   markMaterialAsComplete,
//   submitQuizAttempt,
// } from "@/app/actions/student.actions";

// // ============================================
// // TYPES & INTERFACES
// // ============================================
// interface QuizOption {
//   option_id: number;
//   option_text: string;
//   is_correct?: boolean;
// }

// interface QuizQuestion {
//   question_id: number;
//   question_text: string;
//   question_type: "multiple_choice" | "checkbox";
//   options: QuizOption[];
// }

// interface QuizData {
//   quiz_id: number;
//   quiz_title: string;
//   quiz_description?: string;
//   time_limit: number;
//   passing_score: number;
//   max_attempts: number;
//   questions: QuizQuestion[];
// }

// interface AssignmentSubmission {
//   submission_id: number;
//   material_detail_id: number;
//   file_path?: string;
//   submission_text?: string;
//   submission_type: "file" | "text" | "url";
//   status: "submitted" | "under_review" | "approved" | "rejected";
//   score?: number;
//   feedback?: string;
//   submitted_at: Date;
// }

// interface QuizAttempt {
//   quiz_id: number;
//   attempt_session: number;
//   score: number;
//   status: "passed" | "failed";
//   completed_at: Date;
// }

// // ============================================
// // HELPER FUNCTIONS
// // ============================================
// const getMaterialIcon = (type: number) => {
//   switch (type) {
//     case 1:
//       return <IconVideo size={16} />;
//     case 2:
//       return <IconFileText size={16} />;
//     case 3:
//       return <IconLink size={16} />;
//     case 4:
//       return <IconPencil size={16} />;
//     default:
//       return null;
//   }
// };

// const getYoutubeEmbedUrl = (url: string): string | null => {
//   try {
//     // Handle berbagai format YouTube URL
//     const patterns = [
//       /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
//       /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
//     ];

//     let videoId = null;

//     for (const pattern of patterns) {
//       const match = url.match(pattern);
//       if (match && match[1]) {
//         videoId = match[1];
//         break;
//       }
//     }

//     // Jika tidak ada videoId yang ditemukan, return null
//     if (!videoId) {
//       console.error("Invalid YouTube URL:", url);
//       return null;
//     }

//     // Return URL embed yang benar
//     return `https://www.youtube.com/embed/${videoId}`;
//   } catch (error) {
//     console.error("Error parsing YouTube URL:", error, url);
//     return null;
//   }
// };

// // ============================================
// // HEADER COMPONENT
// // ============================================
// function LearningHeader({
//   courseTitle,
//   totalProgress,
// }: {
//   courseTitle: string;
//   totalProgress: number;
// }) {
//   return (
//     <Box
//       component="header"
//       h={70}
//       px="md"
//       style={{
//         borderBottom: `1px solid var(--mantine-color-gray-3)`,
//         backgroundColor: "var(--mantine-color-body)",
//         display: "flex",
//         alignItems: "center",
//       }}
//     >
//       <Group h="100%" justify="space-between" style={{ width: "100%" }}>
//         <Group>
//           <Tooltip label="Kembali ke Dashboard">
//             <ActionIcon
//               component={Link}
//               href="/student/dashboard/my-courses"
//               variant="default"
//               size="lg"
//             >
//               <IconArrowLeft size={18} />
//             </ActionIcon>
//           </Tooltip>
//           <div>
//             <Text size="sm" c="dimmed">
//               Sedang Belajar:
//             </Text>
//             <Title order={4} lineClamp={1}>
//               {courseTitle}
//             </Title>
//           </div>
//         </Group>
//         <Group w={{ base: "auto", sm: 300 }}>
//           <Box style={{ flex: 1 }}>
//             <Text size="xs" c="dimmed">
//               {totalProgress}% Selesai
//             </Text>
//             <Progress
//               value={totalProgress}
//               size="lg"
//               radius="sm"
//               animated={totalProgress < 100}
//               color={totalProgress === 100 ? "green" : "blue"}
//             />
//           </Box>
//         </Group>
//       </Group>
//     </Box>
//   );
// }

// // ============================================
// // COMPLETE BUTTON (Video, PDF, YouTube)
// // ============================================
// function CompleteButton({
//   materialDetailId,
//   courseId,
//   enrollmentId,
//   isCompleted,
//   onComplete,
// }: {
//   materialDetailId: number;
//   courseId: number;
//   enrollmentId: number;
//   isCompleted: boolean;
//   onComplete: () => void;
// }) {
//   const [isPending, startTransition] = useTransition();

//   const handleClick = () => {
//     startTransition(async () => {
//       const result = await markMaterialAsComplete(
//         materialDetailId,
//         courseId,
//         enrollmentId
//       );

//       if (result.success) {
//         notifications.show({
//           title: result.certificateGranted
//             ? "🎉 Selamat! Kursus Selesai!"
//             : "Progres Disimpan!",
//           message: result.certificateGranted
//             ? "Anda telah menyelesaikan seluruh kursus! Sertifikat Anda telah dibuat."
//             : "Materi telah ditandai selesai.",
//           color: result.certificateGranted ? "green" : "blue",
//           autoClose: result.certificateGranted ? 10000 : 3000,
//         });
//         onComplete();
//       } else {
//         notifications.show({
//           title: "Error",
//           message: result.error || "Gagal menyimpan progres",
//           color: "red",
//         });
//       }
//     });
//   };

//   return (
//     <Button
//       color={isCompleted ? "green" : "blue"}
//       leftSection={
//         isCompleted ? (
//           <IconCircleCheckFilled size={16} />
//         ) : (
//           <IconPlayerPlay size={16} />
//         )
//       }
//       onClick={handleClick}
//       loading={isPending}
//       disabled={isCompleted}
//     >
//       {isCompleted ? "Telah Selesai" : "Tandai Selesai"}
//     </Button>
//   );
// }

// // ============================================
// // ASSIGNMENT SUBMISSION AREA
// // ============================================
// function AssignmentSubmissionArea({
//   materialDetailId,
//   courseId,
//   enrollmentId,
//   existingSubmission,
//   onSubmit,
// }: {
//   materialDetailId: number;
//   courseId: number;
//   enrollmentId: number;
//   existingSubmission: AssignmentSubmission | null;
//   onSubmit: () => void;
// }) {
//   const [isPending, startTransition] = useTransition();
//   const [isUploading, setIsUploading] = useState(false);
//   const [file, setFile] = useState<File | null>(null);
//   const [text, setText] = useState("");
//   const [submissionType, setSubmissionType] = useState<"file" | "text">("file");

//   const status = existingSubmission?.status;
//   const isApproved = status === "approved";
//   const isRejected = status === "rejected";
//   const isUnderReview = status === "submitted" || status === "under_review";

//   const handleSubmit = async () => {
//     if (submissionType === "file" && !file) {
//       notifications.show({
//         title: "Error",
//         message: "Pilih file untuk dikumpulkan.",
//         color: "red",
//       });
//       return;
//     }

//     if (submissionType === "text" && !text.trim()) {
//       notifications.show({
//         title: "Error",
//         message: "Isi jawaban teks untuk dikumpulkan.",
//         color: "red",
//       });
//       return;
//     }

//     startTransition(async () => {
//       try {
//         let filePath: string | null = null;

//         // Upload file jika tipe file
//         if (submissionType === "file" && file) {
//           setIsUploading(true);
//           const formData = new FormData();
//           formData.append("file", file);
//           formData.append("folder", "assignments");

//           // Call your upload API route
//           const uploadRes = await fetch("/api/upload/file", {
//             method: "POST",
//             body: formData,
//           });

//           if (!uploadRes.ok) {
//             throw new Error("Gagal mengupload file");
//           }

//           const uploadData = await uploadRes.json();
//           filePath = uploadData.url;
//           setIsUploading(false);
//         }

//         // Prepare form data for server action
//         const formData = new FormData();
//         formData.append("materialDetailId", String(materialDetailId));
//         formData.append("courseId", String(courseId));
//         formData.append("enrollmentId", String(enrollmentId));
//         formData.append("submission_type", submissionType);

//         if (submissionType === "file" && filePath) {
//           formData.append("file_path", filePath);
//         } else if (submissionType === "text") {
//           formData.append("submission_text", text);
//         }

//         const result = await createOrUpdateAssignmentSubmission(formData);

//         if (result.success) {
//           notifications.show({
//             title: "Sukses",
//             message:
//               result.message ||
//               "Tugas berhasil dikumpulkan! Menunggu penilaian dosen.",
//             color: "green",
//           });

//           setFile(null);
//           setText("");
//           onSubmit();
//         } else {
//           throw new Error(result.error || "Gagal mengumpulkan tugas");
//         }
//       } catch (err: any) {
//         notifications.show({
//           title: "Error",
//           message: err.message,
//           color: "red",
//         });
//       } finally {
//         setIsUploading(false);
//       }
//     });
//   };

//   return (
//     <Paper p="md" withBorder radius="md">
//       <Title order={5} mb="md">
//         Area Pengumpulan Tugas
//       </Title>

//       {/* Show existing submission status */}
//       {existingSubmission && (
//         <Alert
//           color={isApproved ? "green" : isRejected ? "red" : "yellow"}
//           title={
//             isApproved
//               ? "Tugas Diterima (Lulus)"
//               : isRejected
//                 ? "Tugas Ditolak"
//                 : "Menunggu Penilaian"
//           }
//           icon={
//             isApproved ? (
//               <IconCircleCheckFilled />
//             ) : isRejected ? (
//               <IconX />
//             ) : (
//               <IconClock />
//             )
//           }
//           mb="md"
//         >
//           <Stack gap="xs">
//             <Text size="sm">
//               Dikumpulkan pada:{" "}
//               {new Date(existingSubmission.submitted_at).toLocaleString(
//                 "id-ID"
//               )}
//             </Text>

//             {existingSubmission.file_path && (
//               <Button
//                 component="a"
//                 href={existingSubmission.file_path}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 variant="light"
//                 size="xs"
//                 leftSection={<IconDownload size={14} />}
//               >
//                 Lihat File yang Dikumpulkan
//               </Button>
//             )}

//             {existingSubmission.submission_text && (
//               <>
//                 <Text size="sm" fw={500}>
//                   Jawaban Anda:
//                 </Text>
//                 <Paper withBorder p="sm" radius="xs" bg="white">
//                   <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
//                     {existingSubmission.submission_text}
//                   </Text>
//                 </Paper>
//               </>
//             )}

//             {(isApproved || isRejected) && (
//               <>
//                 {existingSubmission.score !== null &&
//                   existingSubmission.score !== undefined && (
//                     <Text size="sm">
//                       Skor: <strong>{existingSubmission.score}</strong>
//                     </Text>
//                   )}
//                 {existingSubmission.feedback && (
//                   <>
//                     <Text size="sm" fw={500}>
//                       Feedback Dosen:
//                     </Text>
//                     <Paper withBorder p="sm" radius="xs" bg="gray.0">
//                       <Text size="sm" fs="italic">
//                         {existingSubmission.feedback}
//                       </Text>
//                     </Paper>
//                   </>
//                 )}
//               </>
//             )}
//           </Stack>
//         </Alert>
//       )}

//       {/* Submission form - only show if not approved */}
//       {!isApproved && (
//         <Stack>
//           <Group>
//             <Button
//               variant={submissionType === "file" ? "filled" : "light"}
//               onClick={() => setSubmissionType("file")}
//               size="xs"
//             >
//               Upload File
//             </Button>
//             <Button
//               variant={submissionType === "text" ? "filled" : "light"}
//               onClick={() => setSubmissionType("text")}
//               size="xs"
//             >
//               Tulis Jawaban
//             </Button>
//           </Group>

//           {submissionType === "file" ? (
//             <FileInput
//               label="Upload File Tugas"
//               placeholder="Pilih file tugas (.pdf, .docx, .zip, dll)"
//               onChange={setFile}
//               value={file}
//               leftSection={<IconUpload size={16} />}
//               accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png"
//             />
//           ) : (
//             <Textarea
//               label="Tulis Jawaban Tugas"
//               placeholder="Ketik jawaban Anda di sini..."
//               minRows={6}
//               onChange={(e) => setText(e.currentTarget.value)}
//               value={text}
//             />
//           )}

//           <Button
//             onClick={handleSubmit}
//             loading={isPending || isUploading}
//             leftSection={<IconUpload size={16} />}
//             disabled={
//               (submissionType === "file" && !file) ||
//               (submissionType === "text" && !text.trim())
//             }
//           >
//             {isUploading
//               ? "Mengupload..."
//               : existingSubmission
//                 ? "Kumpulkan Ulang"
//                 : "Kumpulkan Tugas"}
//           </Button>

//           {!existingSubmission && (
//             <Alert variant="light" color="blue" icon={<IconInfoCircle />}>
//               Progress akan bertambah setelah tugas dinilai dan disetujui dosen.
//             </Alert>
//           )}
//         </Stack>
//       )}
//     </Paper>
//   );
// }

// // ============================================
// // ACTIVE QUIZ PLAYER
// // ============================================
// function ActiveQuizPlayer({
//   quizData,
//   courseId,
//   enrollmentId,
//   attemptNumber,
//   onFinish,
// }: {
//   quizData: QuizData;
//   courseId: number;
//   enrollmentId: number;
//   attemptNumber: number;
//   onFinish: (result: { score: number; status: "passed" | "failed" }) => void;
// }) {
//   const [answers, setAnswers] = useState<Record<number, number | number[]>>({});
//   const [timeLeft, setTimeLeft] = useState(quizData.time_limit * 60); // in seconds
//   const [isPending, startTransition] = useTransition();
//   const [showTimeoutModal, setShowTimeoutModal] = useState(false);
//   const [isSubmitted, setIsSubmitted] = useState(false);

//   // Timer countdown
//   useEffect(() => {
//     if (isSubmitted) return;

//     const timer = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(timer);
//           setShowTimeoutModal(true);
//           handleSubmit(true);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [isSubmitted]);

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, "0")}`;
//   };

//   const handleAnswerChange = (
//     questionId: number,
//     optionId: number,
//     type: "multiple_choice" | "checkbox"
//   ) => {
//     setAnswers((prev) => {
//       if (type === "multiple_choice") {
//         return { ...prev, [questionId]: optionId };
//       } else {
//         // Checkbox
//         const current = (prev[questionId] as number[]) || [];
//         const newAnswers = current.includes(optionId)
//           ? current.filter((id) => id !== optionId)
//           : [...current, optionId];
//         return { ...prev, [questionId]: newAnswers };
//       }
//     });
//   };

//   const handleSubmit = (isTimeout = false) => {
//     if (isSubmitted) return;

//     if (!isTimeout && Object.keys(answers).length < quizData.questions.length) {
//       const confirm = window.confirm(
//         "Anda belum menjawab semua pertanyaan. Yakin ingin mengumpulkan?"
//       );
//       if (!confirm) return;
//     }

//     setIsSubmitted(true);

//     startTransition(async () => {
//       try {
//         const result = await submitQuizAttempt({
//           quizId: quizData.quiz_id,
//           courseId,
//           enrollmentId,
//           answers,
//           timeTaken: quizData.time_limit * 60 - timeLeft,
//           attemptSession: attemptNumber,
//         });

//         if (result.success) {
//           if (isTimeout) {
//             notifications.show({
//               title: "Waktu Habis!",
//               message: `Quiz otomatis dikumpulkan. Skor: ${result.score}%`,
//               color: "orange",
//               autoClose: 10000,
//             });
//           }

//           if (result.certificateGranted) {
//             notifications.show({
//               title: "🎉 Selamat! Kursus Selesai!",
//               message:
//                 "Anda telah menyelesaikan seluruh kursus! Sertifikat Anda telah dibuat.",
//               color: "green",
//               autoClose: 10000,
//             });
//           }

//           const normalizedStatus =
//             result.status === "passed" || result.status === "failed"
//               ? result.status
//               : result.status?.toLowerCase() === "passed"
//                 ? "passed"
//                 : "failed";

//           onFinish({ score: result.score!, status: normalizedStatus });

//           onFinish({ score: result.score!, status: normalizedStatus });
//         } else {
//           throw new Error(result.error || "Gagal submit quiz");
//         }
//       } catch (err: any) {
//         notifications.show({
//           title: "Error",
//           message: err.message,
//           color: "red",
//         });
//         setIsSubmitted(false);
//       }
//     });
//   };

//   const percentage = (timeLeft / (quizData.time_limit * 60)) * 100;
//   const isLowTime = timeLeft < 60;
//   const answeredCount = Object.keys(answers).length;

//   return (
//     <Stack>
//       {/* Progress & Timer */}
//       <Paper withBorder p="md" radius="md" bg={isLowTime ? "red.0" : "blue.0"}>
//         <Group justify="space-between">
//           <div>
//             <Text size="sm" c="dimmed">
//               Sisa Waktu
//             </Text>
//             <Title order={3} c={isLowTime ? "red" : "blue"}>
//               {formatTime(timeLeft)}
//             </Title>
//           </div>
//           <RingProgress
//             size={80}
//             thickness={8}
//             sections={[
//               { value: percentage, color: isLowTime ? "red" : "blue" },
//             ]}
//             label={
//               <Center>
//                 <IconClock size={24} color={isLowTime ? "red" : "blue"} />
//               </Center>
//             }
//           />
//           <div>
//             <Text size="sm" c="dimmed">
//               Progress
//             </Text>
//             <Text fw={500}>
//               {answeredCount} / {quizData.questions.length}
//             </Text>
//           </div>
//         </Group>
//       </Paper>

//       {/* Questions */}
//       <Stack gap="xl" mt="md">
//         {quizData.questions.map((q, index) => {
//           const userAnswer = answers[q.question_id];
//           const isAnswered = userAnswer !== undefined;

//           return (
//             <Paper
//               key={q.question_id}
//               p="md"
//               withBorder
//               radius="md"
//               bg={isAnswered ? "blue.0" : undefined}
//             >
//               <Group justify="space-between" mb="sm">
//                 <Text fw={500}>
//                   {index + 1}. {q.question_text}
//                 </Text>
//                 {isAnswered && (
//                   <Badge color="blue" variant="light">
//                     Terjawab
//                   </Badge>
//                 )}
//               </Group>

//               {q.question_type === "checkbox" && (
//                 <Text size="xs" c="dimmed" mb="sm">
//                   (Pilih semua yang benar)
//                 </Text>
//               )}

//               <Stack gap="xs">
//                 {q.options.map((opt) => {
//                   const isSelected =
//                     q.question_type === "multiple_choice"
//                       ? userAnswer === opt.option_id
//                       : Array.isArray(userAnswer) &&
//                         userAnswer.includes(opt.option_id);

//                   return (
//                     <Button
//                       key={opt.option_id}
//                       variant={isSelected ? "filled" : "outline"}
//                       onClick={() =>
//                         handleAnswerChange(
//                           q.question_id,
//                           opt.option_id,
//                           q.question_type
//                         )
//                       }
//                       fullWidth
//                       justify="flex-start"
//                       disabled={isSubmitted}
//                     >
//                       {opt.option_text}
//                     </Button>
//                   );
//                 })}
//               </Stack>
//             </Paper>
//           );
//         })}
//       </Stack>

//       {/* Submit Button */}
//       <Group justify="center" mt="xl">
//         <Button
//           size="lg"
//           onClick={() => handleSubmit(false)}
//           loading={isPending}
//           disabled={isSubmitted}
//           leftSection={<IconListCheck size={18} />}
//         >
//           {isPending ? "Mengirim Jawaban..." : "Kumpulkan Jawaban Quiz"}
//         </Button>
//       </Group>

//       {/* Timeout Modal */}
//       <Modal
//         opened={showTimeoutModal}
//         onClose={() => setShowTimeoutModal(false)}
//         title="Waktu Habis!"
//         centered
//         withCloseButton={false}
//       >
//         <Stack>
//           <Text>
//             Quiz telah otomatis dikumpulkan karena waktu pengerjaan telah habis.
//           </Text>
//           {isPending && (
//             <Group justify="center">
//               <Loader size="sm" />
//               <Text size="sm" c="dimmed">
//                 Menyimpan jawaban...
//               </Text>
//             </Group>
//           )}
//         </Stack>
//       </Modal>
//     </Stack>
//   );
// }

// // ============================================
// // MAIN COMPONENT
// // ============================================
// export function CourseLearningClientUI({
//   course,
//   completedItems,
//   enrollmentId,
//   totalProgress,
//   initialSubmissionData = [],
//   initialQuizAttempts = [],
// }: {
//   course: any;
//   completedItems: {
//     details: Set<number>;
//     quizzes: Set<number>;
//     assignments: Set<number>;
//   };
//   enrollmentId: number;
//   totalProgress: number;
//   initialSubmissionData?: any[];
//   initialQuizAttempts?: QuizAttempt[];
// }) {
//   const router = useRouter();
//   const [activeContent, setActiveContent] = useState<any>(null);
//   const [contentType, setContentType] = useState<"detail" | "quiz" | null>(
//     null
//   );
//   const [isQuizActive, setIsQuizActive] = useState(false);

//   const completedDetails = completedItems.details;
//   const completedQuizzes = completedItems.quizzes;
//   const completedAssignments = completedItems.assignments;

//   // Find current submission for active assignment
//   const currentSubmission = useMemo(() => {
//     if (
//       contentType === "detail" &&
//       activeContent?.material_detail_type === 4 &&
//       initialSubmissionData
//     ) {
//       return initialSubmissionData.find(
//         (s: any) => s.material_detail_id === activeContent.material_detail_id
//       );
//     }
//     return null;
//   }, [activeContent, contentType, initialSubmissionData]);

//   // Find quiz attempts for active quiz
//   const currentQuizAttempts = useMemo(() => {
//     if (
//       contentType === "quiz" &&
//       activeContent?.quiz_id &&
//       initialQuizAttempts
//     ) {
//       return initialQuizAttempts.filter(
//         (attempt: any) => attempt.quiz_id === activeContent.quiz_id
//       );
//     }
//     return [];
//   }, [activeContent, contentType, initialQuizAttempts]);

//   const latestQuizAttempt = useMemo(() => {
//     if (currentQuizAttempts.length === 0) return null;
//     return [...currentQuizAttempts].sort(
//       (a: any, b: any) => b.attempt_session - a.attempt_session
//     )[0];
//   }, [currentQuizAttempts]);

//   const handleSelectContent = (content: any, type: "detail" | "quiz") => {
//     setActiveContent(content);
//     setContentType(type);
//     setIsQuizActive(false);
//   };

//   const handleStartQuiz = () => {
//     const maxAttempts = activeContent?.max_attempts || 1;
//     const uniqueAttempts = new Set(
//       currentQuizAttempts.map((a: any) => a.attempt_session)
//     );

//     if (uniqueAttempts.size >= maxAttempts) {
//       notifications.show({
//         title: "Batas Percobaan Habis",
//         message: `Anda sudah mencapai batas maksimal ${maxAttempts} percobaan untuk quiz ini.`,
//         color: "orange",
//       });
//       return;
//     }
//     setIsQuizActive(true);
//   };

//   const handleQuizFinish = (result: {
//     score: number;
//     status: "passed" | "failed";
//   }) => {
//     setIsQuizActive(false);

//     notifications.show({
//       title: result.status === "passed" ? "🎉 Quiz Lulus!" : "Quiz Belum Lulus",
//       message: `Skor Anda: ${result.score}%. Minimum kelulusan: ${activeContent?.passing_score}%`,
//       color: result.status === "passed" ? "green" : "red",
//       autoClose: 10000,
//     });

//     router.refresh();
//   };

//   // Render main content area
//   const renderContent = () => {
//     if (!activeContent) {
//       return (
//         <Center h="100%">
//           <Stack align="center" gap="xs">
//             <IconPlayerPlay size={48} stroke={1} color="gray" />
//             <Title order={4}>Selamat Datang</Title>
//             <Text c="dimmed">Pilih materi dari sidebar untuk memulai.</Text>
//           </Stack>
//         </Center>
//       );
//     }

//     // MATERIAL (Video, PDF, YouTube) - Type 1, 2, 3
//     if (
//       contentType === "detail" &&
//       [1, 2, 3].includes(activeContent.material_detail_type)
//     ) {
//       const detail = activeContent;
//       const isCompleted = completedDetails.has(detail.material_detail_id);

//       return (
//         <Stack gap="lg">
//           {/* Title */}
//           <Title order={3}>{detail.material_detail_name}</Title>

//           {/* Content (Video/PDF/YouTube) */}
//           <Box>
//             {detail.material_detail_type === 1 && detail.materi_detail_url && (
//               <video
//                 controls
//                 width="100%"
//                 style={{
//                   borderRadius: "var(--mantine-radius-md)",
//                   border: "1px solid var(--mantine-color-gray-3)",
//                   maxHeight: "70vh",
//                 }}
//               >
//                 <source src={detail.materi_detail_url} type="video/mp4" />
//                 Browser Anda tidak mendukung tag video.
//               </video>
//             )}

//             {detail.material_detail_type === 2 && detail.materi_detail_url && (
//               <iframe
//                 src={detail.materi_detail_url}
//                 style={{
//                   width: "100%",
//                   height: "70vh",
//                   border: "1px solid var(--mantine-color-gray-3)",
//                   borderRadius: "var(--mantine-radius-md)",
//                 }}
//                 title={detail.material_detail_name}
//               />
//             )}

//             {detail.material_detail_type === 3 && detail.materi_detail_url && (
//               <>
//                 {(() => {
//                   const embedUrl = getYoutubeEmbedUrl(detail.materi_detail_url);

//                   if (!embedUrl) {
//                     return (
//                       <Alert color="red" icon={<IconAlertCircle />}>
//                         URL YouTube tidak valid. Format yang didukung:
//                         <List size="xs" mt="xs">
//                           <List.Item>
//                             https://www.youtube.com/watch?v=VIDEO_ID
//                           </List.Item>
//                           <List.Item>https://youtu.be/VIDEO_ID</List.Item>
//                           <List.Item>
//                             https://www.youtube.com/embed/VIDEO_ID
//                           </List.Item>
//                         </List>
//                         <Text size="xs" mt="xs" c="dimmed">
//                           URL yang diberikan: {detail.materi_detail_url}
//                         </Text>
//                       </Alert>
//                     );
//                   }

//                   return (
//                     <Box
//                       style={{
//                         position: "relative",
//                         paddingBottom: "56.25%", // 16:9 aspect ratio
//                         height: 0,
//                         overflow: "hidden",
//                         borderRadius: "var(--mantine-radius-md)",
//                         border: "1px solid var(--mantine-color-gray-3)",
//                       }}
//                     >
//                       <iframe
//                         style={{
//                           position: "absolute",
//                           top: 0,
//                           left: 0,
//                           width: "100%",
//                           height: "100%",
//                           border: "none",
//                         }}
//                         src={embedUrl}
//                         title={detail.material_detail_name}
//                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                         allowFullScreen
//                       />
//                     </Box>
//                   );
//                 })()}
//               </>
//             )}
//           </Box>

//           {/* Description */}
//           {detail.material_detail_description && (
//             <Paper p="md" withBorder radius="md" bg="gray.0">
//               <Title order={5} mb="xs">
//                 Deskripsi Materi
//               </Title>
//               <Text
//                 size="sm"
//                 style={{ whiteSpace: "pre-wrap" }}
//                 dangerouslySetInnerHTML={{
//                   __html: detail.material_detail_description.replace(
//                     /\n/g,
//                     "<br />"
//                   ),
//                 }}
//               />
//             </Paper>
//           )}

//           <Divider />

//           {/* Complete Button */}
//           <Group justify="flex-end">
//             <CompleteButton
//               materialDetailId={detail.material_detail_id}
//               courseId={course.course_id}
//               enrollmentId={enrollmentId}
//               isCompleted={isCompleted}
//               onComplete={() => router.refresh()}
//             />
//           </Group>
//         </Stack>
//       );
//     }

//     // ASSIGNMENT - Type 4
//     if (contentType === "detail" && activeContent.material_detail_type === 4) {
//       const detail = activeContent;
//       const isApproved = completedAssignments.has(detail.material_detail_id);

//       return (
//         <Stack gap="lg">
//           {/* Title */}
//           <Group justify="space-between">
//             <Title order={3}>{detail.material_detail_name}</Title>
//             {isApproved && (
//               <Badge
//                 color="green"
//                 size="lg"
//                 leftSection={<IconTrophy size={14} />}
//               >
//                 Lulus
//               </Badge>
//             )}
//           </Group>

//           {/* Description */}
//           <Paper p="md" withBorder radius="md" bg="gray.0">
//             <Title order={5} mb="xs">
//               Instruksi Tugas
//             </Title>
//             <Text
//               size="sm"
//               style={{ whiteSpace: "pre-wrap" }}
//               dangerouslySetInnerHTML={{
//                 __html: (detail.material_detail_description || "").replace(
//                   /\n/g,
//                   "<br />"
//                 ),
//               }}
//             />
//           </Paper>

//           {/* Passing Score Info */}
//           {detail.passing_score && (
//             <Alert color="blue" icon={<IconInfoCircle />}>
//               <Text size="sm">
//                 Nilai Minimum Kelulusan: <strong>{detail.passing_score}</strong>
//               </Text>
//             </Alert>
//           )}

//           {/* Template/Attachment */}
//           {detail.assignment_template_url && (
//             <Button
//               component="a"
//               href={detail.assignment_template_url}
//               download
//               target="_blank"
//               rel="noopener noreferrer"
//               variant="light"
//               leftSection={<IconDownload size={16} />}
//             >
//               Unduh Template/Lampiran Tugas
//             </Button>
//           )}

//           <Divider
//             my="md"
//             label="Area Pengumpulan & Status"
//             labelPosition="center"
//           />

//           {/* Submission Area */}
//           <AssignmentSubmissionArea
//             materialDetailId={detail.material_detail_id}
//             courseId={course.course_id}
//             enrollmentId={enrollmentId}
//             existingSubmission={currentSubmission}
//             onSubmit={() => router.refresh()}
//           />
//         </Stack>
//       );
//     }

//     // QUIZ
//     if (contentType === "quiz") {
//       const quiz = activeContent;
//       const maxAttempts = quiz.max_attempts || 1;
//       const uniqueAttempts = new Set(
//         currentQuizAttempts.map((a: any) => a.attempt_session)
//       );
//       const attemptsMade = uniqueAttempts.size;
//       const isPassed = completedQuizzes.has(quiz.quiz_id);
//       const canRetry = attemptsMade < maxAttempts && !isPassed;

//       // Active quiz mode
//       if (isQuizActive) {
//         return (
//           <ActiveQuizPlayer
//             quizData={quiz}
//             courseId={course.course_id}
//             enrollmentId={enrollmentId}
//             attemptNumber={attemptsMade + 1}
//             onFinish={handleQuizFinish}
//           />
//         );
//       }

//       // Quiz overview/summary
//       return (
//         <Stack gap="lg">
//           {/* Title */}
//           <Group justify="space-between">
//             <Title order={3}>{quiz.quiz_title}</Title>
//             {isPassed && (
//               <Badge
//                 color="green"
//                 size="lg"
//                 leftSection={<IconTrophy size={14} />}
//               >
//                 Lulus
//               </Badge>
//             )}
//           </Group>

//           {/* Description */}
//           {quiz.quiz_description && (
//             <Paper p="md" withBorder radius="md" bg="gray.0">
//               <Title order={5} mb="xs">
//                 Deskripsi Quiz
//               </Title>
//               <Text size="sm">{quiz.quiz_description}</Text>
//             </Paper>
//           )}

//           {/* Quiz Rules */}
//           <Card withBorder padding="lg" radius="md">
//             <Title order={5} mb="md">
//               Peraturan Quiz
//             </Title>
//             <List
//               spacing="sm"
//               size="sm"
//               icon={
//                 <ThemeIcon size={20} radius="xl" color="blue">
//                   <IconInfoCircle size={12} />
//                 </ThemeIcon>
//               }
//             >
//               <List.Item>
//                 Jumlah Pertanyaan:{" "}
//                 <strong>{quiz.questions?.length || 0} Soal</strong>
//               </List.Item>
//               <List.Item>
//                 Skor Kelulusan Minimum: <strong>{quiz.passing_score}%</strong>
//               </List.Item>
//               <List.Item>
//                 Batas Waktu Pengerjaan: <strong>{quiz.time_limit} Menit</strong>
//               </List.Item>
//               <List.Item>
//                 Maksimal Percobaan: <strong>{maxAttempts} kali</strong>
//               </List.Item>
//               <List.Item>
//                 Percobaan Tersisa:{" "}
//                 <strong>{Math.max(0, maxAttempts - attemptsMade)} kali</strong>
//               </List.Item>
//             </List>
//           </Card>

//           {/* Latest Result */}
//           {latestQuizAttempt && (
//             <Alert
//               variant="light"
//               color={latestQuizAttempt.status === "passed" ? "green" : "red"}
//               title={`Hasil Percobaan Terakhir (Percobaan ke-${latestQuizAttempt.attempt_session})`}
//               icon={
//                 latestQuizAttempt.status === "passed" ? (
//                   <IconCheck />
//                 ) : (
//                   <IconAlertCircle />
//                 )
//               }
//             >
//               <Stack gap="xs">
//                 <Text size="sm">
//                   Skor Anda: <strong>{latestQuizAttempt.score}%</strong>
//                 </Text>
//                 <Text size="sm">
//                   Skor Kelulusan: <strong>{quiz.passing_score}%</strong>
//                 </Text>
//                 <Text size="sm" c="dimmed">
//                   Selesai pada:{" "}
//                   {new Date(latestQuizAttempt.completed_at).toLocaleString(
//                     "id-ID"
//                   )}
//                 </Text>
//                 {latestQuizAttempt.status === "passed" ? (
//                   <Text size="sm" c="green" fw={500}>
//                     ✓ Anda telah lulus quiz ini!
//                   </Text>
//                 ) : (
//                   <Text size="sm" c="red" fw={500}>
//                     ✗ Skor belum mencapai nilai minimum.{" "}
//                     {canRetry && "Silakan coba lagi."}
//                   </Text>
//                 )}
//               </Stack>
//             </Alert>
//           )}

//           {/* All Attempts History */}
//           {currentQuizAttempts.length > 1 && (
//             <Paper withBorder p="md" radius="md">
//               <Title order={5} mb="sm">
//                 Riwayat Percobaan
//               </Title>
//               <Stack gap="xs">
//                 {[...currentQuizAttempts]
//                   .sort(
//                     (a: any, b: any) => b.attempt_session - a.attempt_session
//                   )
//                   .map((attempt: any, index: number) => (
//                     <Group
//                       key={`${attempt.quiz_id}-${attempt.attempt_session}-${index}`}
//                       justify="space-between"
//                       p="xs"
//                       style={{
//                         borderRadius: "var(--mantine-radius-sm)",
//                         backgroundColor:
//                           attempt.status === "passed"
//                             ? "var(--mantine-color-green-0)"
//                             : "var(--mantine-color-red-0)",
//                       }}
//                     >
//                       <Text size="sm">
//                         Percobaan ke-{attempt.attempt_session}
//                       </Text>
//                       <Group gap="xs">
//                         <Badge
//                           color={attempt.status === "passed" ? "green" : "red"}
//                           variant="filled"
//                         >
//                           {attempt.score}%
//                         </Badge>
//                         {attempt.status === "passed" ? (
//                           <IconCheck size={16} color="green" />
//                         ) : (
//                           <IconX size={16} color="red" />
//                         )}
//                       </Group>
//                     </Group>
//                   ))}
//               </Stack>
//             </Paper>
//           )}

//           {/* Start/Retry Button */}
//           <Group justify="center" mt="md">
//             <Button
//               size="lg"
//               onClick={handleStartQuiz}
//               disabled={!canRetry}
//               leftSection={
//                 attemptsMade > 0 && canRetry ? (
//                   <IconRefresh size={18} />
//                 ) : (
//                   <IconPlayerPlay size={18} />
//                 )
//               }
//             >
//               {isPassed
//                 ? "Quiz Sudah Lulus"
//                 : attemptsMade > 0 && canRetry
//                   ? `Ulangi Quiz (${attemptsMade}/${maxAttempts})`
//                   : attemptsMade >= maxAttempts
//                     ? "Batas Percobaan Habis"
//                     : "Mulai Quiz"}
//             </Button>
//           </Group>

//           {!canRetry && !isPassed && attemptsMade >= maxAttempts && (
//             <Alert color="orange" icon={<IconAlertCircle />}>
//               Anda telah mencapai batas maksimal percobaan untuk quiz ini.
//               Silakan hubungi dosen jika ingin mendapat kesempatan tambahan.
//             </Alert>
//           )}
//         </Stack>
//       );
//     }

//     return null;
//   };

//   return (
//     <Box>
//       {/* Header */}
//       <LearningHeader
//         courseTitle={course.course_title}
//         totalProgress={totalProgress}
//       />

//       <Grid gutter={0}>
//         {/* Sidebar - Curriculum */}
//         <Grid.Col span={{ base: 12, md: 4 }}>
//           <Paper
//             withBorder
//             radius={0}
//             p="md"
//             style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}
//           >
//             <Title order={5} mb="md">
//               Kurikulum Kursus
//             </Title>

//             {course.materials?.length === 0 && (
//               <Alert color="gray" icon={<IconInfoCircle />}>
//                 Belum ada materi tersedia untuk kursus ini.
//               </Alert>
//             )}

//             <Accordion
//               chevronPosition="left"
//               variant="separated"
//               defaultValue={course.materials?.[0]?.material_id.toString()}
//             >
//               {course.materials?.map((material: any) => {
//                 // Count completed items in this material
//                 const detailsCount = material.details?.length || 0;
//                 const quizzesCount = material.quizzes?.length || 0;
//                 const totalItems = detailsCount + quizzesCount;

//                 let completedCount = 0;
//                 material.details?.forEach((d: any) => {
//                   if (d.material_detail_type === 4) {
//                     if (completedAssignments.has(d.material_detail_id))
//                       completedCount++;
//                   } else {
//                     if (completedDetails.has(d.material_detail_id))
//                       completedCount++;
//                   }
//                 });
//                 material.quizzes?.forEach((q: any) => {
//                   if (completedQuizzes.has(q.quiz_id)) completedCount++;
//                 });

//                 const isChapterComplete =
//                   totalItems > 0 && completedCount === totalItems;

//                 return (
//                   <Accordion.Item
//                     key={material.material_id}
//                     value={String(material.material_id)}
//                   >
//                     <Accordion.Control>
//                       <Group justify="space-between" wrap="nowrap">
//                         <Text size="sm" fw={500} lineClamp={2}>
//                           {material.material_name}
//                         </Text>
//                         {isChapterComplete && (
//                           <IconCircleCheckFilled size={16} color="green" />
//                         )}
//                       </Group>
//                       <Text size="xs" c="dimmed" mt={4}>
//                         {completedCount}/{totalItems} selesai
//                       </Text>
//                     </Accordion.Control>
//                     <Accordion.Panel>
//                       <Stack gap="xs">
//                         {/* Material Details */}
//                         {material.details?.map((detail: any) => {
//                           const isCompleted =
//                             detail.material_detail_type === 4
//                               ? completedAssignments.has(
//                                   detail.material_detail_id
//                                 )
//                               : completedDetails.has(detail.material_detail_id);

//                           return (
//                             <NavLink
//                               key={`detail-${detail.material_detail_id}`}
//                               label={detail.material_detail_name}
//                               leftSection={
//                                 <ThemeIcon
//                                   variant="light"
//                                   color={isCompleted ? "green" : "gray"}
//                                   size={20}
//                                 >
//                                   {getMaterialIcon(detail.material_detail_type)}
//                                 </ThemeIcon>
//                               }
//                               rightSection={
//                                 isCompleted ? (
//                                   <IconCircleCheckFilled
//                                     size={16}
//                                     style={{
//                                       color: "var(--mantine-color-green-5)",
//                                     }}
//                                   />
//                                 ) : null
//                               }
//                               onClick={() =>
//                                 handleSelectContent(detail, "detail")
//                               }
//                               active={
//                                 contentType === "detail" &&
//                                 activeContent?.material_detail_id ===
//                                   detail.material_detail_id
//                               }
//                               styles={{
//                                 label: { fontSize: "0.875rem" },
//                               }}
//                             />
//                           );
//                         })}

//                         {/* Quizzes */}
//                         {material.quizzes?.map((quiz: any) => {
//                           const isCompleted = completedQuizzes.has(
//                             quiz.quiz_id
//                           );
//                           return (
//                             <NavLink
//                               key={`quiz-${quiz.quiz_id}`}
//                               label={quiz.quiz_title}
//                               leftSection={
//                                 <ThemeIcon
//                                   variant="light"
//                                   color={isCompleted ? "green" : "orange"}
//                                   size={20}
//                                 >
//                                   <IconQuestionMark size={16} />
//                                 </ThemeIcon>
//                               }
//                               rightSection={
//                                 isCompleted ? (
//                                   <IconCircleCheckFilled
//                                     size={16}
//                                     style={{
//                                       color: "var(--mantine-color-green-5)",
//                                     }}
//                                   />
//                                 ) : null
//                               }
//                               onClick={() => handleSelectContent(quiz, "quiz")}
//                               active={
//                                 contentType === "quiz" &&
//                                 activeContent?.quiz_id === quiz.quiz_id
//                               }
//                               styles={{
//                                 label: { fontSize: "0.875rem" },
//                               }}
//                             />
//                           );
//                         })}
//                       </Stack>
//                     </Accordion.Panel>
//                   </Accordion.Item>
//                 );
//               })}
//             </Accordion>
//           </Paper>
//         </Grid.Col>

//         {/* Main Content Area */}
//         <Grid.Col span={{ base: 12, md: 8 }}>
//           <Box
//             p="lg"
//             style={{
//               height: "calc(100vh - 70px)",
//               overflowY: "auto",
//               backgroundColor: "var(--mantine-color-gray-0)",
//             }}
//           >
//             {renderContent()}
//           </Box>
//         </Grid.Col>
//       </Grid>
//     </Box>
//   );
// }


// lmsistts\src\components\student\CourseLearningClientUI.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Box, Grid, Paper, Stack, Title, Text, Accordion, NavLink, ThemeIcon, Center, Alert } from "@mantine/core";
import { IconVideo, IconFileText, IconLink, IconPencil, IconQuestionMark, IconCircleCheckFilled, IconPlayerPlay, IconInfoCircle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

// Import komponen terpisah
import { LearningHeader } from "./LearningHeader";
import { MaterialContent } from "./MaterialContent";
import { AssignmentContent } from "./AssignmentContent";
import { QuizContent } from "./QuizContent";
import { Group } from "@mantine/core";

// ============================================
// TYPES & INTERFACES
// ============================================
interface QuizAttempt {
  quiz_id: number;
  attempt_session: number;
  score: number;
  status: "pending" | "passed" | "failed";
  completed_at: Date;
}

interface CompletedItems {
  details: Set<number>;
  quizzes: Set<number>;
  assignments: Set<number>;
}

interface CourseLearningClientUIProps {
  course: any;
  completedItems: CompletedItems;
  enrollmentId: number;
  totalProgress: number;
  initialSubmissionData?: any[];
  initialQuizAttempts?: QuizAttempt[];
  submissionHistoryMap?: Record<number, any[]>;
  accessExpiresAt?: Date | string | null;
  enrolledAt?: Date | string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const getMaterialIcon = (type: number) => {
  switch (type) {
    case 1:
      return <IconVideo size={16} />;
    case 2:
      return <IconFileText size={16} />;
    case 3:
      return <IconLink size={16} />;
    case 4:
      return <IconPencil size={16} />;
    default:
      return null;
  }
};

// ============================================
// MAIN COMPONENT
// ============================================
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
}: CourseLearningClientUIProps) {
  const router = useRouter();
  const [activeContent, setActiveContent] = useState<any>(null);
  const [contentType, setContentType] = useState<"detail" | "quiz" | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);

  const { details: completedDetails, quizzes: completedQuizzes, assignments: completedAssignments } = completedItems;

  // Find current submission for active assignment
  const currentSubmission = useMemo(() => {
    if (contentType === "detail" && activeContent?.material_detail_type === 4 && initialSubmissionData) {
      return initialSubmissionData.find((s: any) => s.material_detail_id === activeContent.material_detail_id);
    }
    return null;
  }, [activeContent, contentType, initialSubmissionData]);

  // Get submission history for current assignment
  const currentSubmissionHistory = useMemo(() => {
    if (contentType === "detail" && activeContent?.material_detail_type === 4) {
      return submissionHistoryMap[activeContent.material_detail_id] || [];
    }
    return [];
  }, [activeContent, contentType, submissionHistoryMap]);

  // Find quiz attempts for active quiz
  const currentQuizAttempts = useMemo(() => {
    if (contentType === "quiz" && activeContent?.quiz_id && initialQuizAttempts) {
      return initialQuizAttempts.filter((attempt: any) => attempt.quiz_id === activeContent.quiz_id);
    }
    return [];
  }, [activeContent, contentType, initialQuizAttempts]);

  const latestQuizAttempt = useMemo(() => {
    if (currentQuizAttempts.length === 0) return null;
    return [...currentQuizAttempts].sort((a: any, b: any) => b.attempt_session - a.attempt_session)[0];
  }, [currentQuizAttempts]);

  const handleSelectContent = (content: any, type: "detail" | "quiz") => {
    setActiveContent(content);
    setContentType(type);
    setIsQuizActive(false);
  };

  const handleStartQuiz = () => {
    const maxAttempts = activeContent?.max_attempts || 1;
    const uniqueAttempts = new Set(currentQuizAttempts.map((a: any) => a.attempt_session));

    if (uniqueAttempts.size >= maxAttempts) {
      notifications.show({
        title: "Batas Percobaan Habis",
        message: `Anda sudah mencapai batas maksimal ${maxAttempts} percobaan untuk quiz ini.`,
        color: "orange",
      });
      return;
    }
    setIsQuizActive(true);
  };

  const handleQuizFinish = (result: { score: number; status: "passed" | "failed" }) => {
    setIsQuizActive(false);
    notifications.show({
      title: result.status === "passed" ? "🎉 Quiz Lulus!" : "Quiz Belum Lulus",
      message: `Skor Anda: ${result.score}%. Minimum kelulusan: ${activeContent?.passing_score}%`,
      color: result.status === "passed" ? "green" : "red",
      autoClose: 10000,
    });
    router.refresh();
  };

  // Render main content area
  const renderContent = () => {
    if (!activeContent) {
      return (
        <Center h="100%">
          <Stack align="center" gap="xs">
            <IconPlayerPlay size={48} stroke={1} color="gray" />
            <Title order={4}>Selamat Datang</Title>
            <Text c="dimmed">Pilih materi dari sidebar untuk memulai.</Text>
          </Stack>
        </Center>
      );
    }

    // MATERIAL (Video, PDF, YouTube) - Type 1, 2, 3
    if (contentType === "detail" && [1, 2, 3].includes(activeContent.material_detail_type)) {
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

    // ASSIGNMENT - Type 4
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

    // QUIZ
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
      {/* Header */}
      <LearningHeader courseTitle={course.course_title} totalProgress={totalProgress} />

      <Grid gutter={0}>
        {/* Sidebar - Curriculum */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder radius={0} p="md" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>
            <Title order={5} mb="md">
              Kurikulum Kursus
            </Title>

            {course.materials?.length === 0 && (
              <Alert color="gray" icon={<IconInfoCircle />}>
                Belum ada materi tersedia untuk kursus ini.
              </Alert>
            )}

            <Accordion chevronPosition="left" variant="separated" defaultValue={course.materials?.[0]?.material_id.toString()}>
              {course.materials?.map((material: any) => {
                // Count completed items in this material
                const detailsCount = material.details?.length || 0;
                const quizzesCount = material.quizzes?.length || 0;
                const totalItems = detailsCount + quizzesCount;

                let completedCount = 0;
                material.details?.forEach((d: any) => {
                  if (d.material_detail_type === 4) {
                    if (completedAssignments.has(d.material_detail_id)) completedCount++;
                  } else {
                    if (completedDetails.has(d.material_detail_id)) completedCount++;
                  }
                });
                material.quizzes?.forEach((q: any) => {
                  if (completedQuizzes.has(q.quiz_id)) completedCount++;
                });

                const isChapterComplete = totalItems > 0 && completedCount === totalItems;

                return (
                  <Accordion.Item key={material.material_id} value={String(material.material_id)}>
                    <Accordion.Control>
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm" fw={500} lineClamp={2}>
                          {material.material_name}
                        </Text>
                        {isChapterComplete && <IconCircleCheckFilled size={16} color="green" />}
                      </Group>
                      <Text size="xs" c="dimmed" mt={4}>
                        {completedCount}/{totalItems} selesai
                      </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="xs">
                        {/* Material Details */}
                        {material.details?.map((detail: any) => {
                          const isCompleted =
                            detail.material_detail_type === 4
                              ? completedAssignments.has(detail.material_detail_id)
                              : completedDetails.has(detail.material_detail_id);

                          return (
                            <NavLink
                              key={`detail-${detail.material_detail_id}`}
                              label={detail.material_detail_name}
                              leftSection={
                                <ThemeIcon variant="light" color={isCompleted ? "green" : "gray"} size={20}>
                                  {getMaterialIcon(detail.material_detail_type)}
                                </ThemeIcon>
                              }
                              rightSection={
                                isCompleted ? <IconCircleCheckFilled size={16} style={{ color: "var(--mantine-color-green-5)" }} /> : null
                              }
                              onClick={() => handleSelectContent(detail, "detail")}
                              active={contentType === "detail" && activeContent?.material_detail_id === detail.material_detail_id}
                              styles={{ label: { fontSize: "0.875rem" } }}
                            />
                          );
                        })}

                        {/* Quizzes */}
                        {material.quizzes?.map((quiz: any) => {
                          const isCompleted = completedQuizzes.has(quiz.quiz_id);
                          return (
                            <NavLink
                              key={`quiz-${quiz.quiz_id}`}
                              label={quiz.quiz_title}
                              leftSection={
                                <ThemeIcon variant="light" color={isCompleted ? "green" : "orange"} size={20}>
                                  <IconQuestionMark size={16} />
                                </ThemeIcon>
                              }
                              rightSection={
                                isCompleted ? <IconCircleCheckFilled size={16} style={{ color: "var(--mantine-color-green-5)" }} /> : null
                              }
                              onClick={() => handleSelectContent(quiz, "quiz")}
                              active={contentType === "quiz" && activeContent?.quiz_id === quiz.quiz_id}
                              styles={{ label: { fontSize: "0.875rem" } }}
                            />
                          );
                        })}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          </Paper>
        </Grid.Col>

        {/* Main Content Area */}
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