// lmsistts\src\components\lecturer\MaterialManager.tsx

"use client";

import { useState, useTransition } from "react"; // ❌ Hapus useEffect
import {
  Box,
  Button,
  Group,
  Modal,
  TextInput,
  Textarea,
  ActionIcon,
  Text,
  Tooltip,
  LoadingOverlay,
  Stack,
  Divider,
  ThemeIcon,
  List,
  rem,
  Title,
  Badge,
  Accordion,
  AccordionItem,
  AccordionControl,
  AccordionPanel,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconListDetails,
  IconVideo,
  IconFileText,
  IconLink,
  IconClipboardText,
  IconQuestionMark,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import {
  createMaterialSchema,
  updateMaterialSchema,
  CreateMaterialInput,
  UpdateMaterialInput,
  type MaterialWithChildren
} from "@/lib/schemas/material.schema";
import {
  createMaterial,
  deleteMaterial,
  updateMaterial,
} from "@/app/actions/lecturer.actions";
import { zod4Resolver } from "mantine-form-zod-resolver";

// Ikon berdasarkan tipe materi
const getMaterialIcon = (type: number) => {
  switch (type) {
    case 1:
      return <IconVideo size={16} />;
    case 2:
      return <IconFileText size={16} />;
    case 3:
      return <IconLink size={16} />;
    case 4:
      return <IconClipboardText size={16} />;
    default:
      return null;
  }
};

export function MaterialManager({
  materials: initialMaterials,
  courseId,
}: {
  materials: MaterialWithChildren[];
  courseId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithChildren | null>(
    null
  );

  const [
    deleteConfirmOpened,
    { open: openDeleteConfirm, close: closeDeleteConfirm },
  ] = useDisclosure(false);
  const [formModalOpened, { open: openFormModal, close: closeFormModal }] =
    useDisclosure(false);

  const isEditing = modalMode === "edit";

  // Form tambah/edit
  const form = useForm<CreateMaterialInput | UpdateMaterialInput>({
    initialValues: { material_name: "", material_description: "" },
    validate: zod4Resolver(
      isEditing ? updateMaterialSchema : createMaterialSchema
    ),
  });

  // ---- Modal handlers ----
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedMaterial(null);
    form.reset();
    openFormModal();
  };

  const handleOpenEditModal = (material: MaterialWithChildren) => {
    setModalMode("edit");
    setSelectedMaterial(material);
    form.setValues({
      material_name: material.material_name ?? "",
      material_description: material.material_description ?? "",
    });
    openFormModal();
  };

  const handleOpenDeleteConfirm = (material: MaterialWithChildren) => {
    setSelectedMaterial(material);
    openDeleteConfirm();
  };

  // ---- Submit ----
  const handleSubmit = (values: CreateMaterialInput | UpdateMaterialInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateMaterial(
            selectedMaterial!.material_id,
            values as UpdateMaterialInput
          )
        : // Kirim objek 'values' langsung
          await createMaterial(courseId, values as CreateMaterialInput);

      if (result?.success) {
        notifications.show({
          title: "Sukses",
          message: result.success,
          color: "green",
        });
        closeFormModal();
        router.refresh(); // Panggil refresh untuk mengambil data baru
      } else {
        notifications.show({
          title: "Gagal",
          message: result?.error,
          color: "red",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!selectedMaterial) return;
    startTransition(async () => {
      const result = await deleteMaterial(selectedMaterial.material_id);
      if (result?.success) {
        notifications.show({
          title: "Sukses",
          message: result.success,
          color: "teal",
        });
        closeDeleteConfirm();
        router.refresh();
      } else {
        notifications.show({
          title: "Gagal",
          message: result?.error,
          color: "red",
        });
      }
    });
  };

  // ---- Render ----
  return (
    <Box
      pos="relative"
      // key={initialMaterials.map((m) => m.material_id).join("-")} // <== TRIK PENGGANTI useEffect
    >
      <LoadingOverlay visible={isPending} overlayProps={{ blur: 2 }} />

      {/* Modal Tambah/Edit */}
      <Modal
        opened={formModalOpened}
        onClose={closeFormModal}
        title={isEditing ? "Edit Bab Materi" : "Tambah Bab Materi"}
        centered
      >
        <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
          <TextInput
            label="Nama Bab"
            placeholder="Masukkan nama Bab materi"
            withAsterisk
            {...form.getInputProps("material_name")}
          />
          <Textarea
            label="Deskripsi Bab"
            placeholder="Masukkan deskripsi Bab materi"
            mt="md"
            {...form.getInputProps("material_description")}
          />
          <Group mt="md" justify="flex-end">
            <Button variant="default" onClick={closeFormModal}>
              Batal
            </Button>
            <Button type="submit">
              {isEditing ? "Simpan Perubahan" : "Tambah Bab"}
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Konfirmasi Hapus */}
      <Modal
        opened={deleteConfirmOpened}
        onClose={closeDeleteConfirm}
        title="Konfirmasi Hapus Bab Materi"
        centered
      >
        <Text>
          Apakah Anda yakin ingin menghapus Bab materi "
          {selectedMaterial?.material_name}"? Tindakan ini tidak dapat
          dibatalkan.
        </Text>
        <Group mt="md" justify="flex-end">
          <Button variant="default" onClick={closeDeleteConfirm}>
            Batal
          </Button>
          <Button color="red" onClick={handleDelete}>
            Hapus
          </Button>
        </Group>
      </Modal>

      {/* Tombol Tambah */}
      <Group justify="flex-end" mb="md">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleOpenCreateModal}
        >
          Tambah Bab
        </Button>
      </Group>

      {/* Accordion Daftar Materi */}
      {initialMaterials.length > 0 ? (
        <Accordion variant="separated">
          {initialMaterials.map((material) => (
            <AccordionItem
              value={String(material.material_id)}
              key={material.material_id}
            >
              <AccordionControl>
                <Group justify="space-between">
                  <Stack gap={0}>
                    <Text fw={500}>{material.material_name}</Text>
                    <Text size="xs" c="dimmed">
                      {material.material_description}
                    </Text>
                  </Stack>

                  <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                    <Tooltip label="Lihat/Edit Konten Bab Ini">
                      <ActionIcon
                        component="div"
                        variant="light"
                        color="cyan"
                        onClick={() =>
                          router.push(
                            `/lecturer/dashboard/courses/${courseId}/materials/${material.material_id}`
                          )
                        }
                      >
                        <IconListDetails size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Edit Bab">
                      <ActionIcon
                        component="div"
                        variant="light"
                        color="blue"
                        onClick={() => handleOpenEditModal(material)}
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Hapus Bab">
                      <ActionIcon
                        component="div"
                        variant="light"
                        color="red"
                        onClick={() => handleOpenDeleteConfirm(material)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </AccordionControl>

              <AccordionPanel>
                <Stack>
                  <Title order={6} c="dimmed">
                    Konten Materi (Tugas, Video, PDF, Link):
                  </Title>

                  {/* Pisahkan detail berdasarkan tipe */}
                  {(() => {
                    const videos =
                      material.details?.filter(
                        (d) => d.material_detail_type === 1
                      ) || [];
                    const pdfs =
                      material.details?.filter(
                        (d) => d.material_detail_type === 2
                      ) || [];
                    const links =
                      material.details?.filter(
                        (d) => d.material_detail_type === 3
                      ) || [];
                    const tasks =
                      material.details?.filter(
                        (d) => d.material_detail_type === 4
                      ) || [];

                    return (
                      <>
                        {/* VIDEO */}
                        <Title order={6} mt="xs">
                          🎥 Video:
                        </Title>
                        {videos.length > 0 ? (
                          <List spacing="xs" size="sm" center>
                            {videos.map((detail: any) => (
                              <List.Item
                                key={`video-${detail.material_detail_id}`}
                                icon={
                                  <ThemeIcon
                                    size={24}
                                    radius="xl"
                                    variant="light"
                                  >
                                    <IconVideo size={16} />
                                  </ThemeIcon>
                                }
                              >
                                {detail.material_detail_name}
                                {detail.is_free && (
                                  <Badge
                                    size="xs"
                                    variant="light"
                                    color="teal"
                                    ml="sm"
                                  >
                                    Gratis
                                  </Badge>
                                )}
                              </List.Item>
                            ))}
                          </List>
                        ) : (
                          <Text size="sm" c="dimmed">
                            Belum ada video.
                          </Text>
                        )}

                        {/* PDF */}
                        <Title order={6} mt="xs">
                          📄 PDF:
                        </Title>
                        {pdfs.length > 0 ? (
                          <List spacing="xs" size="sm" center>
                            {pdfs.map((detail: any) => (
                              <List.Item
                                key={`pdf-${detail.material_detail_id}`}
                                icon={
                                  <ThemeIcon
                                    size={24}
                                    radius="xl"
                                    variant="light"
                                  >
                                    <IconFileText size={16} />
                                  </ThemeIcon>
                                }
                              >
                                {detail.material_detail_name}
                                {detail.is_free && (
                                  <Badge
                                    size="xs"
                                    variant="light"
                                    color="teal"
                                    ml="sm"
                                  >
                                    Gratis
                                  </Badge>
                                )}
                              </List.Item>
                            ))}
                          </List>
                        ) : (
                          <Text size="sm" c="dimmed">
                            Belum ada PDF.
                          </Text>
                        )}

                        {/* LINK */}
                        <Title order={6} mt="xs">
                          🔗 Link:
                        </Title>
                        {links.length > 0 ? (
                          <List spacing="xs" size="sm" center>
                            {links.map((detail: any) => (
                              <List.Item
                                key={`link-${detail.material_detail_id}`}
                                icon={
                                  <ThemeIcon
                                    size={24}
                                    radius="xl"
                                    variant="light"
                                  >
                                    <IconLink size={16} />
                                  </ThemeIcon>
                                }
                              >
                                {detail.material_detail_name}
                                {detail.is_free && (
                                  <Badge
                                    size="xs"
                                    variant="light"
                                    color="teal"
                                    ml="sm"
                                  >
                                    Gratis
                                  </Badge>
                                )}
                              </List.Item>
                            ))}
                          </List>
                        ) : (
                          <Text size="sm" c="dimmed">
                            Belum ada link.
                          </Text>
                        )}

                        {/* TUGAS */}
                        <Title order={6} mt="xs">
                          🧾 Tugas:
                        </Title>
                        {tasks.length > 0 ? (
                          <List spacing="xs" size="sm" center>
                            {tasks.map((detail: any) => (
                              <List.Item
                                key={`task-${detail.material_detail_id}`}
                                icon={
                                  <ThemeIcon
                                    size={24}
                                    radius="xl"
                                    variant="light"
                                  >
                                    <IconClipboardText size={16} />
                                  </ThemeIcon>
                                }
                              >
                                {detail.material_detail_name}
                                {detail.is_free && (
                                  <Badge
                                    size="xs"
                                    variant="light"
                                    color="teal"
                                    ml="sm"
                                  >
                                    Gratis
                                  </Badge>
                                )}
                              </List.Item>
                            ))}
                          </List>
                        ) : (
                          <Text size="sm" c="dimmed">
                            Belum ada tugas.
                          </Text>
                        )}
                      </>
                    );
                  })()}

                  <Divider label="Quiz" labelPosition="center" my="xs" />

                  <Title order={6} c="dimmed">
                    Quiz:
                  </Title>
                  {material.quizzes?.length ? (
                    <List spacing="xs" size="sm" center>
                      {material.quizzes.map((quiz: any) => (
                        <List.Item
                          key={`quiz-${quiz.quiz_id}`}
                          icon={
                            <ThemeIcon
                              size={24}
                              radius="xl"
                              variant="light"
                              color="orange"
                            >
                              <IconQuestionMark size={16} />
                            </ThemeIcon>
                          }
                        >
                          {quiz.quiz_title}
                        </List.Item>
                      ))}
                    </List>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Belum ada quiz.
                    </Text>
                  )}

                  <Button
                    mt="sm"
                    variant="light"
                    size="xs"
                    fullWidth
                    leftSection={<IconListDetails size={14} />}
                    onClick={() =>
                      router.push(
                        `/lecturer/dashboard/courses/${courseId}/materials/${material.material_id}`
                      )
                    }
                  >
                    Kelola Semua Konten Bab Ini
                  </Button>
                </Stack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Text ta="center" c="dimmed">
          Belum ada Bab materi untuk kursus ini.
        </Text>
      )}
    </Box>
  );
}
