// lmsistts\src\app\(auth)\register\page.tsx

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Paper, Title, Text, TextInput, PasswordInput, Button, Stack, Alert, Anchor, Box, Container,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUser, IconAt, IconLock } from '@tabler/icons-react';
import { registerFormSchema } from '@/lib/schemas/user.schema';
import { register } from '@/app/actions/user.actions';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import z from 'zod';

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
    validate: zod4Resolver(registerFormSchema),
  });

  const handleSubmit = (values: z.infer<typeof registerFormSchema>) => {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      register(values).then((data) => {
        if (data.error) setError(data.error);
        if (data.success) {
            setSuccess(data.success);
            form.reset();
        }
      });
    });
  };

  return (
    <Box style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Side - Form */}
      <Box
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <Container size={420} style={{ width: '100%' }}>
          <Title ta="center">Registrasi Akun Baru</Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            Sudah punya akun?{' '}
            <Anchor component={Link} href="/login" size="sm">
              Login di sini
            </Anchor>
          </Text>
          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {error && <Alert title="Registrasi Gagal" color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                {success && <Alert title="Registrasi Berhasil" color="green" icon={<IconAlertCircle />}>{success}</Alert>}
                <TextInput label="Nama Depan" placeholder="John" leftSection={<IconUser size={16} />} {...form.getInputProps('first_name')} />
                <TextInput label="Nama Belakang" placeholder="Doe" leftSection={<IconUser size={16} />} {...form.getInputProps('last_name')} />
                <TextInput required label="Email" placeholder="john.doe@example.com" leftSection={<IconAt size={16} />} {...form.getInputProps('email')} />
                <PasswordInput required label="Password" placeholder="Password Anda" description="Minimal 8 karakter, dengan huruf besar, kecil, dan angka." leftSection={<IconLock size={16} />} {...form.getInputProps('password')} />
                <PasswordInput required label="Konfirmasi Password" placeholder="Ketik ulang password" leftSection={<IconLock size={16} />} {...form.getInputProps('confirm_password')} />
                <Button type="submit" fullWidth mt="xl" loading={isPending}>Registrasi</Button>
              </Stack>
            </form>
          </Paper>
        </Container>
      </Box>

      {/* Right Side - Image */}
      <Box
        style={{
          flex: 1,
          backgroundImage: 'url(https://images.unsplash.com/photo-1491975474562-1f4e30bc9468?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MXw4NzUyMDEwfHxlbnwwfHx8fHw%3D&auto=format&fit=crop&q=60&w=600)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          position: 'relative',
        }}
        visibleFrom="md"
      >
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(5, 5, 5, 0.3)",
          }}
        />
      </Box>
    </Box>
  );
}