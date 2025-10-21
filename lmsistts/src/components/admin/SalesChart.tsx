// lmsistts/src/components/admin/SalesChart.tsx

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Title, Text } from '@mantine/core';

// Helper untuk format Rupiah
const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

export function SalesChart({ data }: { data: any[] }) {
  // Proses data untuk chart
  const chartData = data.map(item => ({
      name: item.month.substring(0, 3), // Ambil 3 huruf pertama dari nama bulan
      Penjualan: item.totalSales,
  }));

  return (
    <Paper withBorder p="lg" radius="md">
        <Title order={5}>Pendapatan Bulanan</Title>
        <Text c="dimmed" size="sm" mb="md">Total pendapatan dari kursus yang terjual setiap bulan.</Text>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `Rp ${(value as number / 1000000)} Jt`} />
                <Tooltip formatter={(value) => formatRupiah(value as number)} />
                <Legend />
                <Bar dataKey="Penjualan" fill="var(--mantine-color-blue-6)" />
            </BarChart>
        </ResponsiveContainer>
    </Paper>
  );
}