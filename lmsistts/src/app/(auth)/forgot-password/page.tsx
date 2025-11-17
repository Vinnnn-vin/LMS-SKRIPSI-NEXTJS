// app/(auth)/forgot-password/page.tsx
'use client';

import { useState, useTransition } from 'react';
import {
  Paper, Title, Text, TextInput, Button, Container, Stack, Alert, Anchor
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconAlertCircle, IconAt } from '@tabler/icons-react';
import Link from 'next/link';
import { z } from 'zod';
import { sendPasswordResetLink } from '@/app/actions/user.actions'; // Kita akan perbarui ini
import { zod4Resolver } from 'mantine-form-zod-resolver';

// Skema Validasi
const emailSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: zod4Resolver(emailSchema),
  });

  const handleSubmit = (values: { email: string }) => {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      // Kita akan perbarui 'sendPasswordResetLink' agar hanya menerima email
      sendPasswordResetLink(values.email).then((data) => {
        if (data.error) setError(data.error);
        if (data.success) {
          setSuccess(data.success);
          form.reset();
        }
      });
    });
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Lupa Password</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Ingat password Anda?{' '}
        <Anchor component={Link} href="/login" size="sm">
          Login di sini
        </Anchor>
      </Text>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {error && <Alert title="Gagal" color="red" icon={<IconAlertCircle />}>{error}</Alert>}
            {success && <Alert title="Sukses" color="green" icon={<IconAlertCircle />}>{success}</Alert>}

            <Text c="dimmed" size="sm">
              Masukkan email Anda. Kami akan mengirimkan link untuk me-reset password Anda.
            </Text>
            
            <TextInput
              required
              label="Email"
              placeholder="email@domain.com"
              leftSection={<IconAt size={16} />}
              {...form.getInputProps('email')}
            />
            
            <Button type="submit" fullWidth mt="xl" loading={isPending}>
              Kirim Link Reset Password
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}