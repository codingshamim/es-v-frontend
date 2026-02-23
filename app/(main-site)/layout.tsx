import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import LiveChatWidget from "@/components/ui/LiveChatWidget";

export default function mainSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <LiveChatWidget />
    </>
  )
}
