import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'BMAD Board',
  description: 'Local project board powered by BMAD Method markdown files',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-jira-gray-50">
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}