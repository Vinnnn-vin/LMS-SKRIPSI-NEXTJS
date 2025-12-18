"use client";

import dynamic from "next/dynamic";

// Dynamic import - NO SSR
const SecurePdfViewerClient = dynamic(
  () => import("./SecurePdfViewerClient"),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading secure PDF viewer...
      </div>
    ),
  }
);

interface Props {
  fileUrl: string;
  userName: string;
}

export function SecurePdfViewer({ fileUrl, userName }: Props) {
  return <SecurePdfViewerClient fileUrl={fileUrl} userName={userName} />;
}