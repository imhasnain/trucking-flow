// src/components/layout/header.tsx - Top header bar
'use client';

import { Bell, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  const [notifications, setNotifications] = useState<number>(0);

  useEffect(() => {
    // Fetch unread notifications count
    fetch('/api/notifications/count')
      .then(res => res.json())
      .then(data => setNotifications(data.count || 0))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search loads, drivers, invoices..."
            className="w-full h-9 rounded-md border border-gray-300 bg-gray-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <a href="/notifications" className="relative p-2 rounded-md hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-500" />
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </a>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
