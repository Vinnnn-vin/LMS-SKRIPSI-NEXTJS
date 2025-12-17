// lmsistts\src\components\ui\TransitionLinkButton.tsx

"use client";

import { Button, ButtonProps } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface TransitionLinkButtonProps extends ButtonProps {
  href: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: React.CSSProperties;
}

export function TransitionLinkButton({ 
  href, 
  children, 
  onClick, 
  ...props 
}: TransitionLinkButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
    e.preventDefault(); 
    
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Button
      onClick={handleClick}
      loading={isPending}
      loaderProps={{ type: 'dots' }} 
      {...props}
    >
      {children}
    </Button>
  );
}