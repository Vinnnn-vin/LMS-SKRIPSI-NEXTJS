'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Title, Text } from '@mantine/core';

export function CoursePopularityChart({ data }: { data: { name: string, JumlahTerjual: number }[] }) {
  return (
    <Paper withBorder p="lg" radius="md">
        <Title order={5}>Kursus Terlaris</Title>
        <Text c="dimmed" size="sm" mb="md">Top 10 kursus berdasarkan jumlah penjualan.</Text>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical"> {/* Layout vertical */}
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" /> {/* Sumbu X adalah angka */}
                <YAxis dataKey="name" type="category" width={150} /> {/* Sumbu Y adalah nama kursus */}
                <Tooltip formatter={(value) => `${value} penjualan`} />
                <Legend />
                <Bar dataKey="JumlahTerjual" name="Jumlah Terjual" fill="var(--mantine-color-teal-6)" />
            </BarChart>
        </ResponsiveContainer>
    </Paper>
  );
}