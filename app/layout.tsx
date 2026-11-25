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
          <div>
            <a href="mailto:harukaze-works@muse.ai?subject=%E3%80%90%E6%B3%95%E4%BB%A4%E3%82%AB%E3%83%90%E3%83%AC%E3%83%83%E3%82%B8%E7%AE%A1%E7%90%86%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%80%91%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B">
              お問い合わせ
            </a>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
