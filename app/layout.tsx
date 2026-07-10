import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리들의 롤링페이퍼",
  description: "마음을 담아 전하는 롤링페이퍼 💌",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
