import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./components/ToastProvider";
import AdminRouteGuard from "./components/AdminRouteGuard";

export const metadata: Metadata = {
  title: "DevClass — 개발자 온라인 강의 플랫폼",
  description: "개발자를 위한 온라인 강의 플랫폼. 원하는 강의를 찾고 언제 어디서나 학습하세요.",
  keywords: ["강의", "개발자", "프로그래밍", "온라인 강의", "DevClass"],
  openGraph: {
    title: "DevClass",
    description: "개발자를 위한 온라인 강의 플랫폼",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#03071e" />
      </head>
      <body><ToastProvider><AdminRouteGuard>{children}</AdminRouteGuard></ToastProvider></body>
    </html>
  );
}
