import { Hero } from '@/components/landing/hero';
import { QuickStart } from '@/components/landing/quick-start';
import { RecordStrip } from '@/components/landing/record-strip';
import { Problem } from '@/components/landing/features';
import { Solution } from '@/components/landing/solution';
import { Toolkit } from '@/components/landing/showcase';
import { Vision } from '@/components/landing/vision';
import { Footer } from '@/components/layout/footer';

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <RecordStrip />
      <QuickStart />
      <Problem />
      <Solution />
      <Toolkit />
      <Vision />
      <Footer />
    </div>
  );
}
