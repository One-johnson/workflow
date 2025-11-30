'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { AdminLayout } from '@/components/AdminLayout';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdvancedSearchPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Advanced Search</h1>
            <p className="text-muted-foreground mt-1">
              Search and filter across companies, members, and documents
            </p>
          </div>
        </div>

        <AdvancedSearch userId={user.userId} />
      </div>
    </AdminLayout>
  );
}
