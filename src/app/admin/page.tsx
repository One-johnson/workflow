"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../context/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  FileText,
  Power,
  User,
  Plus,
  TrendingUp,
  Clock,
  UserCheck,
} from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const companies = useQuery(api.companies.list);
  const members = useQuery(api.members.list);
  const documents = useQuery(api.documents.listAllWithDetails);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const loading = !companies || !members || !documents;

  if (loading) {
    return (
      <AdminLayout>
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  const activeMembers =
    members?.filter((m) => m.status === "active").length || 0;
  const dormantMembers =
    members?.filter((m) => m.status === "dormant").length || 0;
  const recentCompanies = companies?.slice(0, 5) || [];
  const recentMembers = members?.slice(0, 5) || [];

  // Calculate additional stats
  const recentDocs = documents?.slice(0, 5) || [];
  const docsThisMonth =
    documents?.filter((d) => {
      const docDate = new Date(d.uploadedAt);
      const now = new Date();
      return (
        docDate.getMonth() === now.getMonth() &&
        docDate.getFullYear() === now.getFullYear()
      );
    }).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user.firstName}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Companies
                  </p>
                  <p className="text-2xl font-bold">{companies?.length || 0}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Active organizations
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{members?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeMembers} active • {dormantMembers} dormant
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Documents
                  </p>
                  <p className="text-2xl font-bold">{documents?.length || 0}</p>
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {docsThisMonth} this month
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Members
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {activeMembers}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((activeMembers / (members?.length || 1)) * 100).toFixed(
                      0
                    )}
                    % of total
                  </p>
                </div>
                <Power className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/admin/members">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </Link>
              <Link href="/admin/companies">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </Link>
              <Link href="/admin/documents">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Recent Companies</h3>
                <Link href="/admin/companies">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              {recentCompanies.length > 0 ? (
                <div className="space-y-3">
                  {recentCompanies.map((company) => (
                    <div
                      key={company._id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Building2 className="h-10 w-10 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{company.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(company.createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No companies yet
                </p>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Recent Members</h3>
                <Link href="/admin/members">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              {recentMembers.length > 0 ? (
                <div className="space-y-3">
                  {recentMembers.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <User className="h-10 w-10 text-purple-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {member.firstName} {member.lastName}
                          </p>
                          <Badge
                            variant={
                              member.status === "active"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {member.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(member.dateJoined, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No members yet
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
