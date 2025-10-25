// lmsistts\src\components\admin\SalesManagementTable.tsx

'use client';

import { useState, useEffect } from 'react';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { Box, Group, TextInput, Select, Text, Badge, Tooltip } from '@mantine/core';
import { IconSearch, IconFilter, IconExternalLink } from '@tabler/icons-react';
import sortBy from 'lodash/sortBy';

// Tipe data untuk setiap baris di tabel
interface PaymentData {
    payment_id: number;
    amount: number | null;
    status: 'pending' | 'paid' | 'failed' | 'expired' | null;
    gateway_invoice_id: string | null;
    payment_method: string | null;
    paid_at: string | null;
    created_at: string | null;
    user?: { first_name?: string | null, last_name?: string | null, email?: string | null };
    course?: { course_title?: string | null };
}

const PAGE_SIZE = 15;

export function SalesManagementTable({ payments: initialPayments }: { payments: PaymentData[] }) {
    const [page, setPage] = useState(1);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus<PaymentData>>({ columnAccessor: 'created_at', direction: 'desc' });
    const [query, setQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [records, setRecords] = useState<PaymentData[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);

    // Efek untuk memfilter, mengurutkan, dan paginasi data
    useEffect(() => {
        let data = [...initialPayments];
        // Filter berdasarkan pencarian (nama user, email, atau judul kursus)
        if (query) {
            const lowerQuery = query.toLowerCase();
            data = data.filter((p) =>
                `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.toLowerCase().includes(lowerQuery) ||
                p.user?.email?.toLowerCase().includes(lowerQuery) ||
                p.course?.course_title?.toLowerCase().includes(lowerQuery)
            );
        }
        // Filter berdasarkan status
        if (selectedStatus) {
            data = data.filter((p) => p.status === selectedStatus);
        }
        setTotalRecords(data.length);
        // Urutkan data
        data = sortBy(data, sortStatus.columnAccessor) as PaymentData[];
        if (sortStatus.direction === 'desc') data.reverse();
        // Paginasi
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE;
        setRecords(data.slice(from, to));
    }, [initialPayments, query, selectedStatus, sortStatus, page]);

    // Fungsi untuk mendapatkan warna badge berdasarkan status
    const getStatusColor = (status: PaymentData['status']) => {
        switch (status) {
            case 'paid': return 'green';
            case 'pending': return 'yellow';
            case 'failed': return 'red';
            case 'expired': return 'gray';
            default: return 'dark';
        }
    };

    return (
        <Box>
            {/* Filter Group */}
            <Group justify="space-between" mb="md">
                <TextInput
                    placeholder="Cari user, email, atau kursus..."
                    leftSection={<IconSearch size={16} />}
                    value={query}
                    onChange={(e) => { setQuery(e.currentTarget.value); setPage(1); }}
                    style={{ flex: 1 }}
                />
                <Select
                    placeholder="Filter by status"
                    leftSection={<IconFilter size={16} />}
                    data={[
                        { value: 'paid', label: 'Paid' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'failed', label: 'Failed' },
                        { value: 'expired', label: 'Expired' },
                    ]}
                    value={selectedStatus}
                    onChange={(value) => { setSelectedStatus(value); setPage(1); }}
                    clearable
                />
            </Group>

            {/* DataTable */}
            <DataTable<PaymentData>
                idAccessor="payment_id"
                withTableBorder
                borderRadius="sm"
                highlightOnHover
                records={records}
                columns={[
                    { accessor: 'gateway_invoice_id', title: 'Invoice ID', sortable: true },
                    {
                        accessor: 'user.name',
                        title: 'Pembeli',
                        sortable: true,
                        render: (p) => `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim() || p.user?.email || 'N/A',
                    },
                    { accessor: 'course.course_title', title: 'Kursus', sortable: true },
                    {
                        accessor: 'amount',
                        title: 'Jumlah',
                        sortable: true,
                        textAlign: 'right',
                        render: (p) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p.amount ?? 0),
                    },
                    {
                        accessor: 'status',
                        title: 'Status',
                        sortable: true,
                        render: (p) => <Badge color={getStatusColor(p.status)} variant="light" tt="capitalize">{p.status || 'Unknown'}</Badge>,
                    },
                    {
                        accessor: 'paid_at',
                        title: 'Tanggal Bayar',
                        sortable: true,
                        render: (p) => p.paid_at ? new Date(p.paid_at).toLocaleString('id-ID') : '-',
                    },
                ]}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                totalRecords={totalRecords}
                recordsPerPage={PAGE_SIZE}
                page={page}
                onPageChange={(p) => setPage(p)}
                minHeight={200}
                noRecordsText=""
            />
        </Box>
    );
}
