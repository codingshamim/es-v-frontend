
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturedProducts } from '@/components/sections/FeaturedProducts';
import LiveChatWidget from '@/components/ui/LiveChatWidget';
import { Header } from '@/components/layout/Header';


export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'ES FITT',
    description: 'Premium quality t-shirts with modern designs',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://esfitt.com',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://esfitt.com'}/logo.png`,
    sameAs: [
      'https://www.facebook.com/esfitt',
      'https://www.instagram.com/esfitt',
      'https://www.linkedin.com/company/esfitt',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+880-1816628413',
      contactType: 'Customer Service',
      email: 'contact@esfitt.com',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <main>
        <HeroSection />
        <FeaturedProducts />
      </main>
      <Footer />
      <LiveChatWidget />
      <MobileNav />
    </>
  );
}
