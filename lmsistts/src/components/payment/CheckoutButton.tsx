// lmsistts\src\components\payment\CheckoutButton.tsx

"use client";

import { Button } from "@mantine/core";
import { IconCreditCard } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { createXenditInvoice } from "@/app/actions/payment.actions";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  courseId: number;
  userId: number;
  amount: number;
  email: string;
  name: string;
}

export function CheckoutButton({
  courseId,
  userId,
  amount,
  email,
  name,
}: CheckoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCheckout = () => {
    startTransition(async () => {
      const result = await createXenditInvoice({
        courseId,
        userId,
        amount,
        email,
        name,
      });

      if (result.success && result.invoiceUrl) {
        router.push(result.invoiceUrl);
      } else {
        notifications.show({
          title: "Gagal",
          message: result.error || "Tidak dapat memproses pembayaran saat ini.",
          color: "red",
        });
      }
    });
  };

  return (
    <Button
      size="lg"
      fullWidth
      onClick={handleCheckout}
      loading={isPending}
      leftSection={<IconCreditCard size={18} />}
    >
      {isPending ? "Memproses..." : "Bayar Sekarang via Xendit"}
    </Button>
  );
}
