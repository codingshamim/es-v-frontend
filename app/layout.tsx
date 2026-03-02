import type { Metadata } from "next";
import { SUSE, Hind_Siliguri } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = SUSE({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const notoSansBengali = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "ES FITT - Next Level Tees | Premium T-Shirts",
    template: "%s | ES FITT",
  },
  description: "ES FITT offers premium quality t-shirts with modern designs. Shop the latest collection of comfortable, stylish tees. Free delivery available.",
  keywords: ["t-shirts", "premium t-shirts", "ES FITT", "fashion", "clothing", "bangladesh", "online shopping"],
  authors: [{ name: "ES FITT" }],
  creator: "ES FITT",
  publisher: "ES FITT",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://esfitt.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: "/",
    siteName: "ES FITT",
    title: "ES FITT - Next Level Tees",
    description: "Premium quality t-shirts with modern designs. Shop the latest collection.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ES FITT - Next Level Tees",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ES FITT - Next Level Tees",
    description: "Premium quality t-shirts with modern designs.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark');})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${notoSansBengali.variable} antialiased bg-white dark:bg-black text-black dark:text-white min-h-screen transition-colors duration-300`}
        style={{
          fontFamily: "var(--font-inter), var(--font-bengali), sans-serif",
        }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
