'use client';

import { useState, useTransition } from 'react';
import {
  Container,
  Title,
  Paper,
  TextInput,
  Button,
  Stack,
  Alert,
  LoadingOverlay,
  Avatar,
  Group,
  Text,
  FileInput,
  Divider,
  Center,
  rem,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconAlertCircle,
  IconUser,
  IconCamera,
  IconArrowLeft,
  IconCheck,
} from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { updateProfileSchema, UpdateProfileInput } from '@/lib/schemas/user.schema';
import { updateUserProfile } from '@/app/actions/user.actions';
import { notifications } from '@mantine/notifications';
import type { Session } from 'next-auth';
import { zod4Resolver } from 'mantine-form-zod-resolver';

// --- KOMPONEN FORM TERPISAH ---
// Komponen ini hanya akan dirender setelah data sesi tersedia.
function ProfileForm({ session, updateSession }: { session: Session; updateSession: () => Promise<Session | null> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Inisialisasi data untuk form dari props
  const nameParts = session.user?.name?.split(' ') ?? [];
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';

  const [imagePreview, setImagePreview] = useState<string | null>(session.user?.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<UpdateProfileInput>({
    // Inisialisasi form langsung dengan data dari props
    initialValues: {
      first_name: initialFirstName,
      last_name: initialLastName,
    },
    validate: zod4Resolver(updateProfileSchema),
  });

  const handleImageChange = (file: File | null) => {
    if (file) {
      // Validasi ukuran dan tipe file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        notifications.show({ title: 'File Terlalu Besar', message: 'Maksimal ukuran file 5MB.', color: 'red' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        notifications.show({ title: 'Format Tidak Valid', message: 'Hanya file gambar yang diperbolehkan.', color: 'red' });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      // Handle jika file di-clear
      setImageFile(null);
      setImagePreview(session.user?.image || null);
    }
  };

  const handleSubmit = (values: UpdateProfileInput) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('first_name', values.first_name);
      formData.append('last_name', values.last_name);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const result = await updateUserProfile(formData as any);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Update session untuk refresh data di seluruh aplikasi (termasuk header)
        await updateSession();
        
        notifications.show({ 
          title: 'Sukses', 
          message: 'Profil berhasil diperbarui!', 
          color: 'green',
          icon: <IconCheck size={16} />
        });
        
        // Optional: Redirect ke halaman profile atau dashboard setelah beberapa detik
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Paper withBorder shadow="sm" p={40} radius="md" pos="relative">
        <LoadingOverlay visible={isPending} overlayProps={{ radius: 'sm', blur: 2 }} />
        {error && <Alert title="Gagal" color="red" icon={<IconAlertCircle />} mb="lg" withCloseButton onClose={() => setError(null)}>{error}</Alert>}

        <Center mb={40}>
          <Stack align="center" gap="lg">
            <Avatar src={imagePreview} size={150} radius="50%" alt="Avatar" />
            <Stack gap="xs" align="center">
              <Text fw={600} size="lg">{`${form.values.first_name} ${form.values.last_name}`.trim()}</Text>
              <Text size="sm" c="dimmed">{session.user?.email}</Text>
            </Stack>
          </Stack>
        </Center>

        <Divider my="lg" />
        
        <Stack gap="xl">
            <FileInput
                label="Ubah Foto Profil"
                placeholder="Pilih gambar baru"
                leftSection={<IconCamera size={16} />}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageChange}
                clearable
                description="Ukuran maksimal: 5MB"
            />

            <div>
                <Text fw={600} mb="xs" size="sm">Informasi Pribadi</Text>
                <Stack gap="md">
                    <TextInput
                        label="Nama Depan"
                        placeholder="Masukkan nama depan"
                        leftSection={<IconUser size={16} />}
                        {...form.getInputProps('first_name')}
                    />
                    <TextInput
                        label="Nama Belakang"
                        placeholder="Masukkan nama belakang"
                        leftSection={<IconUser size={16} />}
                        {...form.getInputProps('last_name')}
                    />
                </Stack>
            </div>
        
            <Divider my="md" />

            <Group grow>
                <Button variant="default" onClick={() => router.back()} leftSection={<IconArrowLeft size={16} />}>
                    Batal
                </Button>
                <Button type="submit" loading={isPending} leftSection={<IconCheck size={16} />}>
                    Simpan Perubahan
                </Button>
            </Group>
        </Stack>
      </Paper>
    </form>
  );
}


// --- KOMPONEN HALAMAN UTAMA ---
// Komponen ini bertindak sebagai "loader" data sesi.
export default function EditProfilePage() {
  const { data: session, status, update: updateSession } = useSession();

  if (status === 'loading') {
    return <LoadingOverlay visible />;
  }

  if (status === 'unauthenticated') {
    return (
      <Container py="xl">
        <Alert color="red" title="Akses Ditolak">
          Anda harus login untuk mengakses halaman ini.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Group justify="center" mb="lg" pos="relative">
         <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => history.back()}
            pos="absolute"
            left={0}
          >
            Kembali
        </Button>
        <Title order={2}>Edit Profil</Title>
      </Group>

      {/* Render komponen form HANYA jika sesi sudah ada */}
      {session && <ProfileForm session={session} updateSession={updateSession} />}
    </Container>
  );
}