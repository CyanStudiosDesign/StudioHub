import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/toast";
import AppShell from "@/components/ui/sidebar/AppShell";
import "./globals.css";

const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/Satoshi-Variable.ttf",
      style: "normal",
      weight: "300 900",
    },
    {
      path: "../../public/fonts/Satoshi-VariableItalic.ttf",
      style: "italic",
      weight: "300 900",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studio Hub",
  description: "Markdown blog page generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${satoshi.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='studio-hub-theme';var s=localStorage.getItem(k);var t=s==='light'||s==='dark'?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='light'}})()`,
          }}
        />
      </head>
      <body className="min-h-full bg-canvas text-fg">
        <ThemeProvider><ToastProvider><AppShell>{children}</AppShell></ToastProvider></ThemeProvider>
      </body>
    </html>
  );
}
