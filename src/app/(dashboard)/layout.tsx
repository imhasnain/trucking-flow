// src/app/(dashboard)/layout.tsx - Dashboard layout with sidebar
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userName={user.name} userRole={user.role} />
      <div className="pl-64 transition-all duration-300">
        <Header userName={user.name} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
