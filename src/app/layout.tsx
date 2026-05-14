import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "DevClass", description: "개발자 인강 플랫폼" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
