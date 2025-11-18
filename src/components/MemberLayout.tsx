"use client";

import type React from "react";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { EnhancedNotificationBell } from "./EnhancedNotificationBell";
import { UserProfileDropdown } from "./UserProfileDropdowm";
import { GlobalSearch } from "./GlobalSearch";
import { Building2, FileText, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface MemberLayoutProps {
  children: React.ReactNode;
}

export function MemberLayout({ children }: MemberLayoutProps) {
  useAuth();
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/member", icon: LayoutDashboard },
    { name: "My Documents", href: "/member/documents", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-8">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold hidden sm:block">Profile Hub</h1>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-1 flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right side - Search, Notifications and Profile */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:block">
              <GlobalSearch />
            </div>
            <EnhancedNotificationBell />
            <UserProfileDropdown />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t">
          <nav className="flex items-center justify-around py-2 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-col h-auto py-2 px-6 gap-1"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-xs">{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
