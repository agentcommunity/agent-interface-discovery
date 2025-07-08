import { Hero } from '@/components/landing/hero';
import { QuickStart } from '@/components/landing/quick-start';
import { Problem } from '@/components/landing/features';
import { Solution } from '@/components/landing/solution';
import { Toolkit } from '@/components/landing/showcase';
import { Vision } from '@/components/landing/vision';

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <QuickStart />
      <Problem />
      <Solution />
      <Toolkit />
      <Vision />
    </div>
  );
}
