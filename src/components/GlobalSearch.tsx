"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, Building2, Users, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import type { Id } from "../../convex/_generated/dataModel";

interface Company {
  _id: Id<"companies">;
  name: string;
  description?: string;
  branch?: string;
  region?: string;
  createdAt: number;
}

interface Member {
  _id: Id<"members">;
staffId: string,
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  status: string;
  dateJoined: number;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedTerm, setDebouncedTerm] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<{
    type: "company" | "member";
    data: Company | Member;
  } | null>(null);

  const searchResults = useQuery(
    api.companies.globalSearch,
    debouncedTerm.length >= 2 ? { searchTerm: debouncedTerm } : "skip"
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleItemClick = (
    type: "company" | "member",
    data: Company | Member
  ) => {
    setSelectedItem({ type, data });
    setIsOpen(false);
  };

  return (
    <>
      {/* Search Trigger */}
      <Button
        variant="outline"
        className="relative w-full sm:w-64 justify-start text-sm text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <span className="sm:hidden">Search</span>
        <kbd className="pointer-events-none absolute right-2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogTitle></DialogTitle>
          <div className="flex items-center border-b px-4 relative">
            <Search className="h-4 w-4 text-muted-foreground absolute ml-2" />
            <Input
            
              placeholder="Search companies, members, or IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-10"
              autoFocus
            />
          
          </div>

          <ScrollArea className="max-h-[400px] p-4">
            {searchTerm.length < 2 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Type at least 2 characters to search</p>
              </div>
            ) : searchResults ? (
              <div className="space-y-4">
                {/* Companies Results */}
                {searchResults.companies.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Companies ({searchResults.companies.length})
                    </h3>
                    <div className="space-y-2">
                      {searchResults.companies.map((company) => (
                        <Button
                          key={company._id}
                          variant="ghost"
                          className="w-full justify-start h-auto py-3 px-3"
                          onClick={() => handleItemClick("company", company)}
                        >
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {company.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {company.name}
                              </Badge>
                            </div>
                            {company.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {company.description}
                              </p>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members Results */}
                {searchResults.members.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Members ({searchResults.members.length})
                    </h3>
                    <div className="space-y-2">
                      {searchResults.members.map((member) => (
                        <Button
                          key={member._id}
                          variant="ghost"
                          className="w-full justify-start h-auto py-3 px-3"
                          onClick={() =>
                            handleItemClick("member", {
                              ...member,
                              staffId: member.staffId, // Provide the required property
                            })
                          }
                        >
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {member.firstName} {member.lastName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {member.staffId}
                              </Badge>
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
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>{member.email}</p>
                              {member.position && (
                                <p>
                                  {member.position}
                                  {member.department &&
                                    ` • ${member.department}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {searchResults.companies.length === 0 &&
                  searchResults.members.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No results found for &quot;{searchTerm}&quot;</p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-30 animate-pulse" />
                <p>Searching...</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog for Company */}
      {selectedItem && selectedItem.type === "company" && (
        <Dialog open={true} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Company Name
                </label>
                <p className="text-lg font-semibold">
                  {(selectedItem.data as Company).name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Company ID
                </label>
                <p className="font-mono">
                  {(selectedItem.data as Company).name}
                </p>
              </div>
              {(selectedItem.data as Company).description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <p>{(selectedItem.data as Company).description}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created Date
                </label>
                <p>
                  {new Date(
                    (selectedItem.data as Company).createdAt
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Detail Dialog for Member */}
      {selectedItem && selectedItem.type === "member" && (
        <Dialog open={true} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Full Name
                </label>
                <p className="text-lg font-semibold">
                  {(selectedItem.data as Member).firstName}{" "}
                  {(selectedItem.data as Member).lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Member ID
                </label>
                <p className="font-mono">
                  {(selectedItem.data as Member).staffId}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p>{(selectedItem.data as Member).email}</p>
              </div>
              {(selectedItem.data as Member).phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <p>{(selectedItem.data as Member).phone}</p>
                </div>
              )}
              {(selectedItem.data as Member).position && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Position
                  </label>
                  <p>{(selectedItem.data as Member).position}</p>
                </div>
              )}
              {(selectedItem.data as Member).department && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Department
                  </label>
                  <p>{(selectedItem.data as Member).department}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1">
                  <Badge
                    variant={
                      (selectedItem.data as Member).status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {(selectedItem.data as Member).status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Date Joined
                </label>
                <p>
                  {new Date(
                    (selectedItem.data as Member).dateJoined
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
