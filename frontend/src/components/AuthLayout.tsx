"use client";

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { RootState, AppDispatch } from '@/store';
import { initializeAuth, logout } from '@/store/slices/authSlice';
import Link from 'next/link';
import { Home, Briefcase, Users, LogOut, Bell, Search, Cpu, CheckSquare } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    // Redirect to login if not authenticated (allow public pages)
    const publicPaths = ['/', '/landing', '/login', '/register'];
    if (!isAuthenticated && !publicPaths.includes(pathname)) {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router]);

  // Prevent hydration mismatch by showing consistent loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  // Public pages (no sidebar) - only when not authenticated
  const publicPaths = ['/landing', '/login', '/register'];
  const isPublicPage = publicPaths.includes(pathname);
  
  // Root path / shows landing for guests, dashboard for logged-in users (with sidebar)
  if (isPublicPage || (!isAuthenticated && pathname === '/')) {
    return <>{children}</>;
  }

  // Not authenticated - show loading or redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-68 bg-[#11315e] dark:bg-[#071326] text-white flex flex-col shadow-lg z-20 transition-colors duration-300">
        <div className="p-6 flex items-center space-x-3 mb-4 border-b border-white/10 dark:border-white/5 pb-6">
          <div className="bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg p-1.5 shadow flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <span className="text-[19px] font-bold tracking-wide">AI Recruitment</span>
        </div>
        
        <nav className="flex-1 space-y-1 mt-2">
          <Link href="/" className={`flex items-center space-x-4 px-6 py-4 transition-colors border-l-4 ${
            pathname === '/' 
              ? 'bg-[#234b8c] dark:bg-[#122b54] border-blue-300 dark:border-blue-500' 
              : 'hover:bg-[#1a3d6f] dark:hover:bg-[#0b1b36] border-transparent text-gray-300'
          }`}>
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          
          <Link href="/jobs" className={`flex items-center space-x-4 px-6 py-4 transition-colors border-l-4 ${
            pathname.startsWith('/jobs') 
              ? 'bg-[#234b8c] dark:bg-[#122b54] border-blue-300 dark:border-blue-500' 
              : 'hover:bg-[#1a3d6f] dark:hover:bg-[#0b1b36] border-transparent text-gray-300'
          }`}>
            <Briefcase className="w-5 h-5" />
            <span className="font-medium">Job Listings</span>
          </Link>

          {/* My Applications - only for recruiters */}
          {user?.role === 'recruiter' && (
            <Link href="/my-applications" className={`flex items-center space-x-4 px-6 py-4 transition-colors border-l-4 ${
              pathname === '/my-applications' 
                ? 'bg-[#234b8c] dark:bg-[#122b54] border-blue-300 dark:border-blue-500' 
                : 'hover:bg-[#1a3d6f] dark:hover:bg-[#0b1b36] border-transparent text-gray-300'
            }`}>
              <CheckSquare className="w-5 h-5" />
              <span className="font-medium">My Applications</span>
            </Link>
          )}
          
          <Link href="/candidates" className={`flex items-center space-x-4 px-6 py-4 transition-colors border-l-4 ${
            pathname.startsWith('/candidates') 
              ? 'bg-[#234b8c] dark:bg-[#122b54] border-blue-300 dark:border-blue-500' 
              : 'hover:bg-[#1a3d6f] dark:hover:bg-[#0b1b36] border-transparent text-gray-300'
          }`}>
            <Users className="w-5 h-5" />
            <span className="font-medium">Candidate Pool</span>
          </Link>
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t border-white/10 dark:border-white/5">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-blue-300 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition w-full"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-[#f6f8fb] dark:bg-slate-950 overflow-y-auto transition-colors duration-300">
        {/* Top sticky header */}
        <div className="flex justify-between p-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-300">
          <div className="px-4 py-2 text-xl font-bold text-gray-800 dark:text-white">
            Welcome, {user?.name}
          </div>
          <div className="flex items-center space-x-6 text-gray-500 dark:text-gray-400 pr-6">
            <ThemeToggle />
            <Search className="w-5 h-5 cursor-pointer hover:text-blue-500 transition" />
            <div className="relative">
              <Bell className="w-5 h-5 cursor-pointer hover:text-blue-500 transition" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            </div>
          </div>
        </div>

        {/* Dynamic Pages Render Here */}
        <div className="p-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
