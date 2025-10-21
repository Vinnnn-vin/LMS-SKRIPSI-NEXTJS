'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Title, Text } from '@mantine/core';

const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

export function FinancialTrendChart({ data }: { data: { tanggal: string, Pemasukan: number }[] }) {
  return (
    <Paper withBorder p="lg" radius="md">
        <Title order={5}>Pergerakan Keuangan</Title>
        <Text c="dimmed" size="sm" mb="md">Total pemasukan harian selama 30 hari terakhir.</Text>
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tanggal" />
                <YAxis tickFormatter={(value) => `Rp${(value as number / 1000000).toFixed(1)} Jt`} />
                <Tooltip formatter={(value) => formatRupiah(value as number)} />
                <Area type="monotone" dataKey="Pemasukan" stroke="var(--mantine-color-green-6)" fill="var(--mantine-color-green-1)" />
            </AreaChart>
        </ResponsiveContainer>
    </Paper>
  );
}
