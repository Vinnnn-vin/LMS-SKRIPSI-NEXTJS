// lmsistts\src\app\(auth)\login\page.tsx

'use client';

import { Suspense, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import {
  Paper, Title, Text, TextInput, PasswordInput, Button, Container, Stack, Alert, Anchor, Divider, Group,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconAlertCircle, IconAt, IconLock } from '@tabler/icons-react';
import { loginSchema } from '@/lib/schemas/user.schema';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import z from 'zod';

function GoogleIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="1.25rem" height="1.25rem" {...props}><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.057 4.844C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-8.736 0-16.14 4.337-19.694 10.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.641-3.657-11.303-8.524l-6.057 4.844C9.407 39.426 16.14 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.916 35.637 44 29.839 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
  );
}

function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get('error') ? 'Email atau password salah.' : null;

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: zod4Resolver(loginSchema),
  });

  const handleCredentialsLogin = (values: z.infer<typeof loginSchema>) => {
    setError(null);
    startTransition(async () => {
      const result = await signIn('credentials', {
        ...values,
        redirect: false,
      });
      if (result?.error) {
        setError('Email atau password salah.');
      } else if (result?.ok) {
        router.push('/');
        router.refresh();
      }
    });
  };

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    startTransition(() => {
      signIn(provider, {
        callbackUrl: '/',
      });
    });
  };
  
  return (
     <Container size={420} my={40}>
      <Title ta="center">Selamat Datang</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Belum punya akun?{' '}
        <Anchor component={Link} href="/register" size="sm">
          Buat akun baru
        </Anchor>
      </Text>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleCredentialsLogin)}>
          <Stack gap="md">
            {(error || callbackError) && (
              <Alert title="Login Gagal" color="red" icon={<IconAlertCircle />}>
                {error || callbackError}
              </Alert>
            )}
            <TextInput required label="Email" placeholder="email@domain.com" leftSection={<IconAt size={16} />} {...form.getInputProps('email')} />
            <PasswordInput required label="Password" placeholder="Password Anda" leftSection={<IconLock size={16} />} {...form.getInputProps('password')} />
            <Button type="submit" fullWidth mt="xl" loading={isPending}>Login</Button>
          </Stack>
        </form>
        <Divider label="Atau masuk dengan" labelPosition="center" my="lg" />
        <Group grow>
           <Button leftSection={<GoogleIcon />} variant="default" onClick={() => handleOAuthLogin('google')} loading={isPending}>Google</Button>
        </Group>
      </Paper>
    </Container>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}