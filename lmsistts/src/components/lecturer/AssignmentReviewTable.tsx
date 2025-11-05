// lmsistts\src\components\lecturer\AssignmentReviewTable.tsx

"use client";

import { useState, useTransition } from "react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import {
  Box,
  Group,
  TextInput,
  Text,
  Tooltip,
  Badge,
  ActionIcon,
  Button,
  LoadingOverlay,
  Select,
  ThemeIcon,
} from "@mantine/core";
import {
  IconSearch,
  IconPencilCheck,
  IconExternalLink,
  IconFile,
  IconFileText,
  IconLink,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import sortBy from "lodash/sortBy";
import dayjs from "dayjs";
import { AssignmentGradingModal } from "./AssignmentGradingModal";
import { getAssignmentsToReviewByLecturer } from "@/app/actions/lecturer.actions";

interface AssignmentRow {
  submission_id: number;
  submitted_at: string;
  status: "submitted" | "under_review" | "approved" | "rejected";
  student: {
    user_id: number;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  };
  assignment: {
    material_detail_id: number;
    material_detail_name?: string | null;
    passing_score?: number | null; // ✅ FIXED: Tambahkan passing_score
  };
  course: {
    course_id: number;
    course_title?: string | null;
  };
  score?: number | null;
  feedback?: string | null;
  submission_type: "file" | "url" | "text" | "both";
  file_path?: string | null;
  submission_url?: string | null;
  submission_text?: string | null;
}

const PAGE_SIZE = 15;

export function AssignmentReviewTable({
  initialData,
  totalRecords: initialTotal,
}: {
  initialData: AssignmentRow[];
  totalRecords: number;
}) {
  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<AssignmentRow>
  >({ columnAccessor: "submitted_at", direction: "desc" });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [records, setRecords] = useState(initialData);
  const [totalRecords, setTotalRecords] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [isPendingAction, startTransitionAction] = useTransition();

  const [selectedSubmission, setSelectedSubmission] =
    useState<AssignmentRow | null>(null);
  const [
    gradingModalOpened,
    { open: openGradingModal, close: closeGradingModal },
  ] = useDisclosure(false);

  const convertSortDirection = (direction: "asc" | "desc"): "ASC" | "DESC" => {
    return direction === "asc" ? "ASC" : "DESC";
  };

  // FIXED: Fungsi untuk transform data dari server ke format AssignmentRow
  const transformServerData = (serverData: any[]): AssignmentRow[] => {
    return serverData.map((item: any) => ({
      submission_id: item.submission_id,
      submitted_at: item.submitted_at,
      status: item.status,
      student: {
        user_id: item.student?.user_id || item.user_id,
        first_name: item.student?.first_name || item.student_first_name || null,
        last_name: item.student?.last_name || item.student_last_name || null,
        email: item.student?.email || item.student_email || null,
      },
      assignment: {
        material_detail_id:
          item.assignment?.material_detail_id || item.material_detail_id,
        material_detail_name:
          item.assignment?.material_detail_name ||
          item.material_detail_name ||
          null,
        passing_score:
          item.assignment?.passing_score || item.passing_score || null, // ✅ FIXED
      },
      course: {
        course_id: item.course?.course_id || item.course_id,
        course_title: item.course?.course_title || item.course_title || null,
      },
      score: item.score ?? null,
      feedback: item.feedback ?? null,
      submission_type: item.submission_type,
      file_path: item.file_path ?? null,
      submission_url: item.submission_url ?? null,
      submission_text: item.submission_text ?? null,
    }));
  };

  const fetchData = async (options: {
    page: number;
    sortBy: string;
    sortOrder: "ASC" | "DESC";
    query?: string;
    status?: string | null;
  }) => {
    setIsLoading(true);
    try {
      const result = await getAssignmentsToReviewByLecturer({
        page: options.page,
        limit: PAGE_SIZE,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        statusFilter: options.status ?? undefined,
      });
      if (result.success) {
        // FIXED: Transform data sebelum set ke state
        const transformedData = transformServerData(result.data);
        setRecords(transformedData);
        setTotalRecords(result.total);
      } else {
        console.error("Failed to fetch assignments:", result.error);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData({
      page: newPage,
      sortBy: sortStatus.columnAccessor,
      sortOrder: convertSortDirection(sortStatus.direction),
      status: statusFilter,
    });
  };

  const handleSortChange = (
    newSortStatus: DataTableSortStatus<AssignmentRow>
  ) => {
    setSortStatus(newSortStatus);
    setPage(1);
    fetchData({
      page: 1,
      sortBy: newSortStatus.columnAccessor,
      sortOrder: convertSortDirection(newSortStatus.direction),
      status: statusFilter,
    });
  };

  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter(value);
    setPage(1);
    fetchData({
      page: 1,
      sortBy: sortStatus.columnAccessor,
      sortOrder: convertSortDirection(sortStatus.direction),
      status: value,
    });
  };

  const handleOpenGrading = (submission: AssignmentRow) => {
    setSelectedSubmission(submission);
    openGradingModal();
  };

  const getStatusBadge = (status: AssignmentRow["status"]) => {
    switch (status) {
      case "submitted":
        return (
          <Badge color="blue" variant="light">
            Submitted
          </Badge>
        );
      case "under_review":
        return (
          <Badge color="yellow" variant="light">
            Reviewing
          </Badge>
        );
      case "approved":
        return (
          <Badge color="green" variant="light">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge color="red" variant="light">
            Rejected
          </Badge>
        );
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };

  // ✅ FIXED: Helper untuk icon submission type
  const getSubmissionTypeIcon = (submission: AssignmentRow) => {
    const type = submission.submission_type;

    if (type === "both") {
      return (
        <Group gap={4}>
          <Tooltip label="File + Text">
            <ThemeIcon size="xs" color="blue" variant="light">
              <IconFile size={12} />
            </ThemeIcon>
          </Tooltip>
          <Tooltip label="File + Text">
            <ThemeIcon size="xs" color="violet" variant="light">
              <IconFileText size={12} />
            </ThemeIcon>
          </Tooltip>
        </Group>
      );
    }

    if (type === "file") {
      return (
        <Tooltip label="File Only">
          <ThemeIcon size="xs" color="blue" variant="light">
            <IconFile size={12} />
          </ThemeIcon>
        </Tooltip>
      );
    }

    if (type === "text") {
      return (
        <Tooltip label="Text Only">
          <ThemeIcon size="xs" color="violet" variant="light">
            <IconFileText size={12} />
          </ThemeIcon>
        </Tooltip>
      );
    }

    if (type === "url") {
      return (
        <Tooltip label="URL">
          <ThemeIcon size="xs" color="teal" variant="light">
            <IconLink size={12} />
          </ThemeIcon>
        </Tooltip>
      );
    }

    return (
      <Text size="xs" c="dimmed">
        -
      </Text>
    );
  };

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={isLoading || isPendingAction}
        overlayProps={{ blur: 1 }}
      />

      {selectedSubmission && (
        <AssignmentGradingModal
          opened={gradingModalOpened}
          onClose={closeGradingModal}
          submission={selectedSubmission}
          onGradeSubmit={() => {
            fetchData({
              page,
              sortBy: sortStatus.columnAccessor,
              sortOrder: convertSortDirection(sortStatus.direction),
              status: statusFilter,
            });
          }}
          startTransition={startTransitionAction}
        />
      )}

      <Group justify="flex-end" mb="md">
        <Select
          placeholder="Filter by status"
          data={[
            { value: "submitted", label: "Submitted" },
            { value: "under_review", label: "Reviewing" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
          value={statusFilter}
          onChange={handleStatusFilterChange}
          clearable
        />
        <TextInput
          placeholder="Cari nama/email..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          disabled
        />
      </Group>

      <DataTable<AssignmentRow>
        idAccessor="submission_id"
        withTableBorder
        borderRadius="sm"
        highlightOnHover
        records={records}
        columns={[
          {
            accessor: "student.name",
            title: "Mahasiswa",
            sortable: true,
            render: ({ student }) =>
              `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
              student.email ||
              "N/A",
          },
          { accessor: "course.course_title", title: "Kursus", sortable: true },
          {
            accessor: "assignment.material_detail_name",
            title: "Tugas",
            sortable: true,
          },
          {
            accessor: "submitted_at",
            title: "Tanggal Kumpul",
            sortable: true,
            render: ({ submitted_at }) =>
              dayjs(submitted_at).format("DD MMM YYYY, HH:mm"),
          },
          {
            accessor: "submission_type",
            title: "Tipe",
            textAlign: "center",
            render: (submission) => getSubmissionTypeIcon(submission),
          },
          {
            accessor: "status",
            title: "Status",
            sortable: true,
            render: ({ status }) => getStatusBadge(status),
          },
          {
            accessor: "score",
            title: "Skor",
            sortable: true,
            textAlign: "center",
            render: ({ score }) => score ?? "-",
          },
          {
            accessor: "actions",
            title: "Aksi",
            textAlign: "center",
            render: (submission) => (
              <Tooltip label="Lihat & Nilai Tugas">
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={() => handleOpenGrading(submission)}
                >
                  <IconPencilCheck size={16} />
                </ActionIcon>
              </Tooltip>
            ),
          },
        ]}
        sortStatus={sortStatus}
        onSortStatusChange={handleSortChange}
        totalRecords={totalRecords}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={handlePageChange}
        minHeight={200}
        fetching={isLoading}
        noRecordsText="Tidak ada tugas untuk direview"
      />
    </Box>
  );
}
