// lmsistts\src\components\admin\EnrollmentListTable.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import {
  Box,
  Group,
  TextInput,
  Text,
  Tooltip,
  Progress,
  Badge,
  Anchor,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import sortBy from "lodash/sortBy";
import dayjs from "dayjs";

interface EnrollmentRow {
  enrollment_id: number;
  student: {
    user_id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  enrolled_at: string | null;
  access_expires_at: string | null;
  progress: number;
}

const PAGE_SIZE = 15;

export function EnrollmentListTable({
  enrollments,
}: {
  enrollments: EnrollmentRow[];
}) {
  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<EnrollmentRow>
  >({ columnAccessor: "enrolled_at", direction: "desc" });
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<EnrollmentRow[]>([]);

  const filteredAndSortedRecords = useMemo(() => {
    let data = [...enrollments];
    if (query) {
      const lowerQuery = query.toLowerCase();
      data = data.filter(
        (e) =>
          `${e.student.first_name || ""} ${e.student.last_name || ""}`
            .toLowerCase()
            .includes(lowerQuery) ||
          e.student.email?.toLowerCase().includes(lowerQuery)
      );
    }
    data = sortBy(data, sortStatus.columnAccessor) as EnrollmentRow[];
    if (sortStatus.direction === "desc") data.reverse();
    return data;
  }, [enrollments, query, sortStatus]);

  useEffect(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setRecords(filteredAndSortedRecords.slice(from, to));
  }, [filteredAndSortedRecords, page]);

  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return <Badge color="gray">Selamanya</Badge>;
    const date = dayjs(dateString);
    const isExpired = date.isBefore(dayjs());
    return (
      <Tooltip label={`Berakhir pada: ${date.format("DD MMM YYYY, HH:mm")}`}>
        <Badge color={isExpired ? "red" : "blue"}>
          {isExpired ? "Telah Berakhir" : date.format("DD MMM YYYY")}
        </Badge>
      </Tooltip>
    );
  };

  return (
    <Box>
      <Group justify="flex-end" mb="md">
        <TextInput
          placeholder="Cari nama atau email..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setPage(1);
          }}
        />
      </Group>

      <DataTable<EnrollmentRow>
        idAccessor="enrollment_id"
        withTableBorder
        borderRadius="sm"
        highlightOnHover
        records={records}
        columns={[
          {
            accessor: "student.name",
            title: "Nama Mahasiswa",
            sortable: true,
            render: ({ student }) =>
              `${student.first_name || ""} ${student.last_name || ""}`.trim(),
          },
          {
            accessor: "student.email",
            title: "Email",
            sortable: true,
            render: ({ student }) => (
              <Anchor href={`mailto:${student.email}`}>{student.email}</Anchor>
            ),
          },
          {
            accessor: "progress",
            title: "Progres",
            sortable: true,
            width: 150,
            render: ({ progress }) => (
              <Progress.Root size="lg" radius="sm">
                <Progress.Section
                  value={progress}
                  color={progress === 100 ? "green" : "blue"}
                >
                  <Progress.Label>{progress}%</Progress.Label>
                </Progress.Section>
              </Progress.Root>
            ),
          },
          {
            accessor: "enrolled_at",
            title: "Tanggal Daftar",
            sortable: true,
            render: ({ enrolled_at }) =>
              enrolled_at ? dayjs(enrolled_at).format("DD MMM YYYY") : "-",
          },
          {
            accessor: "access_expires_at",
            title: "Akses Berakhir",
            sortable: true,
            render: ({ access_expires_at }) =>
              formatExpiryDate(access_expires_at),
          },
        ]}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        totalRecords={filteredAndSortedRecords.length}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
        minHeight={200}
        noRecordsText="Tidak ada mahasiswa terdaftar"
      />
    </Box>
  );
}
