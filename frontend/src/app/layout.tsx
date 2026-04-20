import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import AuthLayout from '@/components/AuthLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Recruitment System',
  description: 'AI-powered applicant screening',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#f0f4f8] dark:bg-slate-950 transition-colors duration-300">
      <body className={`${inter.className} transition-colors duration-300`}>
        <Providers>
          <AuthLayout>
            {children}
          </AuthLayout>
        </Providers>
      </body>
    </html>
  );
}
