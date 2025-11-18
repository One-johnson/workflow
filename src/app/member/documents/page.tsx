"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../../../context/AuthContext";
import { MemberLayout } from "@/components/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function MemberDocumentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const members = useQuery(api.members.list);
  const documents = useQuery(api.documents.listAllWithDetails);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "member")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const currentMember = members?.find((m) => m.userId === user.userId);
  const myDocuments = documents?.filter(
    (d) => d.memberId === currentMember?._id
  );

  const loading = !members || !documents || !currentMember;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Documents</h1>
          <p className="text-muted-foreground mt-1">
            View and download your documents. Thank you.
          </p>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Documents ({myDocuments?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {myDocuments && myDocuments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Type
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Size
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Uploaded
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myDocuments.map((doc) => (
                        <TableRow key={doc._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="font-medium">{doc.title}</div>
                                {doc.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {doc.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {doc.fileType.split("/")[1]?.toUpperCase() ||
                                "FILE"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatFileSize(doc.fileSize)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (doc.fileUrl) {
                                  window.open(doc.fileUrl, "_blank");
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No documents available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MemberLayout>
  );
}
