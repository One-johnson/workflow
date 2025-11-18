"use client";

import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../context/AuthContext";
import { MemberLayout } from "@/components/MemberLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Building2, User, Power } from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { formatDistanceToNow } from "date-fns";
import { GenericId } from "convex/values";

export default function MemberDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const members = useQuery(api.members.list);
  const documents = useQuery(api.documents.listAll);
  const companies = useQuery(api.companies.list);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "member")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const currentMember = members?.find((m) => m.userId === user.userId);
  const myDocuments = documents?.filter(
    (d: { memberId: GenericId<"members"> | undefined }) =>
      d.memberId === currentMember?._id
  );
  const myCompany = companies?.find((c) => c._id === currentMember?.companyId);

  const loading = !members || !documents || !companies || !currentMember;

  if (loading) {
    return (
      <MemberLayout>
        <DashboardSkeleton />
      </MemberLayout>
    );
  }

  const recentDocuments = myDocuments?.slice(0, 5) || [];

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.firstName}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">My Documents</p>
                  <p className="text-2xl font-bold">
                    {myDocuments?.length || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="text-lg font-semibold">
                    {myCompany?.name || "N/A"}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      currentMember.status === "active"
                        ? "default"
                        : "secondary"
                    }
                    className="text-sm mt-1"
                  >
                    {currentMember.status === "active" ? "Active" : "Dormant"}
                  </Badge>
                </div>
                <Power className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Card */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              My Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">
                  {currentMember.firstName} {currentMember.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{currentMember.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member ID</p>
                <p className="font-mono font-medium">{currentMember.staffId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{currentMember.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="font-medium">{currentMember.position || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">
                  {currentMember.department || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{currentMember.address || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date Joined</p>
                <p className="font-medium">
                  {new Date(currentMember.dateJoined).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Documents */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold mb-4">Recent Documents</h3>
            {recentDocuments.length > 0 ? (
              <div className="space-y-3">
                {recentDocuments.map(
                  (doc: {
                    _id: Key | null | undefined;
                    title:
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactElement<
                          unknown,
                          string | JSXElementConstructor<any>
                        >
                      | Iterable<ReactNode>
                      | ReactPortal
                      | Promise<
                          | string
                          | number
                          | bigint
                          | boolean
                          | ReactPortal
                          | ReactElement<
                              unknown,
                              string | JSXElementConstructor<any>
                            >
                          | Iterable<ReactNode>
                          | null
                          | undefined
                        >
                      | null
                      | undefined;
                    uploadedAt: string | number | Date;
                  }) => (
                    <div
                      key={doc._id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="h-10 w-10 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(doc.uploadedAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No documents yet
              </p>
            )}
          </div>
        </Card>
      </div>
    </MemberLayout>
  );
}
