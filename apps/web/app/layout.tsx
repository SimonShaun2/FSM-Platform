import type { ReactNode } from "react";

import { publicEnv } from "@fsm/config";

import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body data-api-base-url={publicEnv.NEXT_PUBLIC_API_URL}>{children}</body>
    </html>
  );
}
