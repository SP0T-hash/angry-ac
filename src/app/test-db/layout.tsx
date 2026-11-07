import { notFound } from 'next/navigation';
import LandingLayout from '../(landing)/layout';

export default function TestDBLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return <LandingLayout>{children}</LandingLayout>;
}
