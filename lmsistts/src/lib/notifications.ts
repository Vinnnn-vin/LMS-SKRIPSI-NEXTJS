// src/lib/utils/notifications.ts
// Tempatkan file ini di: src/lib/utils/notifications.ts

import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconInfoCircle,
} from '@tabler/icons-react';
import React from 'react';

interface NotificationOptions {
  title: string;
  message: string;
  autoClose?: number;
}

export const showSuccessNotification = ({
  title,
  message,
  autoClose = 4000,
}: NotificationOptions) => {
  notifications.show({
    title,
    message,
    color: 'green',
    icon: React.createElement(IconCheck, { size: 18 }),
    autoClose,
    withCloseButton: true,
    style: { borderLeft: '4px solid var(--mantine-color-green-6)' },
  });
};

export const showErrorNotification = ({
  title,
  message,
  autoClose = 5000,
}: NotificationOptions) => {
  notifications.show({
    title,
    message,
    color: 'red',
    icon: React.createElement(IconX, { size: 18 }),
    autoClose,
    withCloseButton: true,
    style: { borderLeft: '4px solid var(--mantine-color-red-6)' },
  });
};

export const showWarningNotification = ({
  title,
  message,
  autoClose = 4000,
}: NotificationOptions) => {
  notifications.show({
    title,
    message,
    color: 'yellow',
    icon: React.createElement(IconAlertCircle, { size: 18 }),
    autoClose,
    withCloseButton: true,
    style: { borderLeft: '4px solid var(--mantine-color-yellow-6)' },
  });
};

export const showInfoNotification = ({
  title,
  message,
  autoClose = 4000,
}: NotificationOptions) => {
  notifications.show({
    title,
    message,
    color: 'blue',
    icon: React.createElement(IconInfoCircle, { size: 18 }),
    autoClose,
    withCloseButton: true,
    style: { borderLeft: '4px solid var(--mantine-color-blue-6)' },
  });
};

// Helper functions untuk operasi umum
export const notifyCreate = (entityName: string) => {
  showSuccessNotification({
    title: 'Berhasil Dibuat',
    message: `${entityName} berhasil ditambahkan ke sistem.`,
  });
};

export const notifyUpdate = (entityName: string) => {
  showSuccessNotification({
    title: 'Berhasil Diperbarui',
    message: `${entityName} berhasil diperbarui.`,
  });
};

export const notifyDelete = (entityName: string) => {
  showSuccessNotification({
    title: 'Berhasil Dihapus',
    message: `${entityName} telah dihapus dari sistem.`,
    autoClose: 3000,
  });
};

export const notifyApprove = (entityName: string) => {
  showSuccessNotification({
    title: 'Berhasil Disetujui',
    message: `${entityName} telah disetujui dan dipublikasikan.`,
  });
};

export const notifyReject = (entityName: string) => {
  showWarningNotification({
    title: 'Permintaan Ditolak',
    message: `${entityName} telah ditolak.`,
  });
};

export const notifyError = (operation: string, error?: string) => {
  showErrorNotification({
    title: `Gagal ${operation}`,
    message: error || 'Terjadi kesalahan. Silakan coba lagi.',
  });
};