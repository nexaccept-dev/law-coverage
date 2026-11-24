import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "法令カバレッジ管理システム",
    template: "%s | 法令カバレッジ管理",
  },
  description:
    "OKFバンドルの法令要件と社内文書の紐づけから、カバレッジの過不足を機械判定するMVP。",
};

const navItems = [
  { href: "/", label: "ダッシュボード" },
  { href: "/matrix", label: "マトリクス" },
  { href: "/gaps", label: "ギャップ一覧" },
  { href: "/report", label: "診断レポート" },
  { href: "/decisions", label: "意思決定（ADR）" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <header className="app-header">
          <div className="header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark">LC</span>
              <span>
                <span className="brand-name">法令カバレッジ</span>
                <span className="brand-sub">OKF Coverage Console</span>
              </span>
            </Link>
            <nav className="main-nav" aria-label="メインナビゲーション">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="app-main">{children}</main>
        <footer className="app-footer">
          <div>
            読み取り専用の診断コンソールです。判定は起動時にバンドルから都度計算し、DBは使用しません。
          </div>
          <div>
            バンドルは環境変数 <code>BUNDLE_DIR</code> で切り替えできます（既定は同梱の
            <code>bundle/</code>）。
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
