// src/components/layout/sidebar.tsx - Main navigation sidebar
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Truck,
  FileText,
  DollarSign,
  Receipt,
  Shield,
  Users,
  Car,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Briefcase,
  StickyNote,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  userName: string;
  userRole: string;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/loads', label: 'Loads', icon: Truck },
  { href: '/settlements', label: 'Settlements', icon: DollarSign },
  { href: '/commissions', label: 'Commissions', icon: Briefcase },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/receivables', label: 'Receivables', icon: Receipt },
  { href: '/compliance', label: 'Compliance', icon: Shield },
  { href: '/drivers', label: 'Drivers', icon: Users },
  { href: '/vehicles', label: 'Vehicles', icon: Car },
  { href: '/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings, ownerOnly: true },
];

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const filteredItems = navItems.filter(
    (item) => !item.ownerOnly || userRole === 'OWNER'
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-gray-900 text-white transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold">TruckFlow</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-800 text-gray-400"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info & Logout */}
      <div className="border-t border-gray-800 p-4">
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-gray-400 capitalize">{userRole.toLowerCase()}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
