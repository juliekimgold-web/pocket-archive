import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pocket Archive — 오래된 물건들의 작은 상점",
  description: "빈티지 토이, 캐릭터 굿즈와 문구류를 소개하는 따뜻한 작은 상점.",
  icons: {
    icon: "/og.png",
    shortcut: "/og.png",
  },
  openGraph: {
    title: "Pocket Archive — Small Things, Old Stories.",
    description: "빈티지 토이, 캐릭터 굿즈와 문구류를 소개하는 따뜻한 작은 상점.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 2184, height: 1005, alt: "Pocket Archive 빈티지 쇼윈도" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pocket Archive — Small Things, Old Stories.",
    description: "빈티지 토이, 캐릭터 굿즈와 문구류를 소개하는 따뜻한 작은 상점.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
