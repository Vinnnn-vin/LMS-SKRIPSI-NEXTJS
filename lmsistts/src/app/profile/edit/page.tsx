// lmsistts/src/app/profile/edit/page.tsx
"use client";

import { useState, useTransition } from "react";
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
  Divider,
  rem,
  Box,
  UnstyledButton,
  Center,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconUser,
  IconCamera,
  IconArrowLeft,
  IconCheck,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  updateProfileSchema,
  UpdateProfileInput,
} from "@/lib/schemas/user.schema";
import { updateUserProfile } from "@/app/actions/user.actions";
import { notifications } from "@mantine/notifications";
import type { Session } from "next-auth";
import { zod4Resolver } from "mantine-form-zod-resolver";

function ProfileForm({
  session,
  updateSession,
}: {
  session: Session;
  updateSession: () => Promise<Session | null>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nameParts = session.user?.name?.split(" ") ?? [];
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  const [imagePreview, setImagePreview] = useState<string | null>(
    session.user?.image || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<UpdateProfileInput>({
    initialValues: {
      first_name: initialFirstName,
      last_name: initialLastName,
    },
    validate: zod4Resolver(updateProfileSchema),
  });

  const handleImageChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notifications.show({
        title: "File Terlalu Besar",
        message: "Maksimal ukuran file 5MB.",
        color: "red",
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      notifications.show({
        title: "Format Tidak Valid",
        message: "Hanya file gambar yang diperbolehkan.",
        color: "red",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (values: UpdateProfileInput) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      if (imageFile) formData.append("image", imageFile);

      const result = await updateUserProfile(formData as any);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.success) {
        // PENTING: Trigger update session untuk refresh token & session
        await updateSession();

        // Tunggu sebentar untuk memastikan session terupdate
        await new Promise((resolve) => setTimeout(resolve, 500));

        notifications.show({
          title: "Sukses",
          message: "Profil berhasil diperbarui!",
          color: "green",
          icon: <IconCheck size={16} />,
        });

        // Redirect setelah notifikasi
        setTimeout(() => router.push("/"), 1500);
      }
    });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Paper
        shadow="sm"
        radius="xl"
        p="xl"
        withBorder
        pos="relative"
        style={{
          border: "1px solid #e9ecef",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        }}
      >
        <LoadingOverlay
          visible={isPending}
          overlayProps={{ radius: "sm", blur: 2 }}
        />

        {error && (
          <Alert
            title="Gagal"
            color="red"
            icon={<IconAlertCircle />}
            mb="lg"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Avatar Section */}
        <Center mb="lg">
          <Box pos="relative">
            <Avatar
              src={imagePreview}
              size={160}
              radius={100}
              style={{
                border: "3px solid #f1f3f5",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />

            <UnstyledButton
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) =>
                  handleImageChange(
                    (e.target as HTMLInputElement).files?.[0] || null
                  );
                input.click();
              }}
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                backgroundColor: "white",
                borderRadius: "50%",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                padding: rem(6),
                cursor: "pointer",
                transition: "0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#e7f5ff")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "white")
              }
            >
              <IconCamera size={18} color="#228be6" />
            </UnstyledButton>
          </Box>
        </Center>

        <Stack align="center" gap={4} mb="lg">
          <Text fw={600} size="lg">
            {`${form.values.first_name} ${form.values.last_name}`.trim()}
          </Text>
          <Text size="sm" c="dimmed">
            {session.user?.email}
          </Text>
          <Text size="xs" c="gray.5">
            Ukuran maksimal: 5MB
          </Text>
        </Stack>

        <Divider my="lg" label="Informasi Pribadi" labelPosition="center" />

        {/* Form Fields */}
        <Stack gap="md" mt="sm">
          <TextInput
            label="Nama Depan"
            placeholder="Masukkan nama depan"
            leftSection={<IconUser size={16} />}
            {...form.getInputProps("first_name")}
          />
          <TextInput
            label="Nama Belakang"
            placeholder="Masukkan nama belakang"
            leftSection={<IconUser size={16} />}
            {...form.getInputProps("last_name")}
          />
        </Stack>

        <Divider my="xl" />

        <Group justify="space-between" mt="md">
          <Button
            variant="default"
            color="gray"
            onClick={() => router.back()}
            leftSection={<IconArrowLeft size={16} />}
          >
            Batal
          </Button>
          <Button
            type="submit"
            loading={isPending}
            leftSection={<IconCheck size={16} />}
            color="blue"
          >
            Simpan Perubahan
          </Button>
        </Group>
      </Paper>
    </form>
  );
}

export default function EditProfilePage() {
  const { data: session, status, update: updateSession } = useSession();

  if (status === "loading") return <LoadingOverlay visible />;
  if (status === "unauthenticated")
    return (
      <Container py="xl">
        <Alert color="red" title="Akses Ditolak">
          Anda harus login untuk mengakses halaman ini.
        </Alert>
      </Container>
    );

  return (
    <Container size="sm" py="xl">
      <Group justify="center" mb="xl" pos="relative">
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

      {session && (
        <ProfileForm session={session} updateSession={updateSession} />
      )}
    </Container>
  );
}
