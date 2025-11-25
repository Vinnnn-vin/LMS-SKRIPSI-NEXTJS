// lmsistts\src\app\(auth)\forgot-password\[token]\page.tsx
'use client';

import { useState, useTransition } from 'react';
import {
  Paper, Title, Button, Container, Stack, Alert, PasswordInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconLock } from '@tabler/icons-react';
import { z } from 'zod';
import { resetPassword } from '@/app/actions/user.actions';
import { useRouter } from 'next/navigation';
import { zod4Resolver } from 'mantine-form-zod-resolver';

// Skema validasi
const resetSchema = z.object({
  newPassword: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type ResetInput = z.infer<typeof resetSchema>;

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const token = params.token;

  const form = useForm({
    initialValues: { newPassword: '', confirmPassword: '' },
    validate: zod4Resolver(resetSchema),
  });

  const handleSubmit = (values: ResetInput) => {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      resetPassword(token, values.newPassword).then((data) => {
        if (data.error) setError(data.error);
        if (data.success) {
          setSuccess(data.success);
          form.reset();
          setTimeout(() => router.push('/login'), 2000);
        }
      });
    });
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Reset Password Anda</Title>
      
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {error && <Alert title="Gagal" color="red" icon={<IconAlertCircle />}>{error}</Alert>}
            {success && <Alert title="Sukses" color="green" icon={<IconAlertCircle />}>{success}</Alert>}

            <PasswordInput
              required
              label="Password Baru"
              placeholder="Masukkan password baru"
              leftSection={<IconLock size={16} />}
              {...form.getInputProps('newPassword')}
            />
            <PasswordInput
              required
              label="Konfirmasi Password Baru"
              placeholder="Ketik ulang password baru"
              leftSection={<IconLock size={16} />}
              {...form.getInputProps('confirmPassword')}
            />
            
            <Button type="submit" fullWidth mt="xl" loading={isPending} disabled={!!success}>
              Simpan Password Baru
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}