'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '../../../context/AuthContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Building2, Search, ArrowUpDown, MoreVertical, Pencil, Trash2, Users as UsersIcon, ArrowLeft, Download, Upload, FileText, TrendingUp, TrendingDown, User } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { Badge } from '@/components/ui/badge';
import { Company, exportCompaniesToCSV, exportCompaniesToPDF } from '@/lib/exportUtils';
import Papa from 'papaparse';
import type { Id } from '../../../../convex/_generated/dataModel';

type SortField = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function CompaniesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isCompanyMembersDialogOpen, setIsCompanyMembersDialogOpen] = useState<boolean>(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<Id<'companies'> | null>(null);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState<Id<'companies'> | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: '',
    branch: '',
  });
  const [bulkUploadData, setBulkUploadData] = useState<any[]>([]);

  const companies = useQuery(api.companies.list);
  const companyMembers = useQuery(
    api.companies.getMembersWithDetails,
    selectedCompanyId ? { companyId: selectedCompanyId } : 'skip'
  );
  const companyStatistics = useQuery(
    api.companies.getStatistics,
    selectedCompanyId ? { companyId: selectedCompanyId } : 'skip'
  );
  const createCompany = useMutation(api.companies.create);
  const createBulk = useMutation(api.companies.createBulk);
  const updateCompany = useMutation(api.companies.update);
  const deleteCompany = useMutation(api.companies.remove);
  const deleteBulk = useMutation(api.companies.removeBulk);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCompany) {
        await updateCompany({
          id: editingCompany._id as Id<'companies'>,
          name: formData.name,
          description: formData.description,
          region: formData.region || undefined,
          branch: formData.branch || undefined,
        });
        toast.success('Company updated successfully');
      } else {
        await createCompany({
          name: formData.name,
          description: formData.description,
          region: formData.region || undefined,
          branch: formData.branch || undefined,
          createdBy: user!.userId,
        });
        toast.success('Company created successfully');
      }

      setIsDialogOpen(false);
      setFormData({ name: '', description: '', region: '', branch: '' });
      setEditingCompany(null);
    } catch (error) {
      toast.error('Failed to save company');
    }
  };

  const handleEdit = (company: any) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description || '',
      region: company.region || '',
      branch: company.branch || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCompanyId) return;
    
    try {
      await deleteCompany({ id: deleteCompanyId });
      toast.success('Company deleted successfully');
      setDeleteCompanyId(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete company');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds) as Id<'companies'>[];
      const result = await deleteBulk({ ids });
      
      if (result.deleted.length > 0) {
        toast.success(`${result.deleted.length} companies deleted`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} companies failed: ${result.errors[0]}`);
      }
      
      setSelectedIds(new Set());
      setBulkDeleteConfirmOpen(false);
    } catch (error) {
      toast.error('Failed to delete companies');
    }
  };

  const handleAdd = () => {
    setEditingCompany(null);
    setFormData({ name: '', description: '', region: '', branch: '' });
    setIsDialogOpen(true);
  };

  const handleViewMembers = (companyId: Id<'companies'>) => {
    setSelectedCompanyId(companyId);
    setIsCompanyMembersDialogOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredCompanies) {
      setSelectedIds(new Set(filteredCompanies.map((c) => c._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setBulkUploadData(results.data);
        setIsBulkUploadDialogOpen(true);
      },
      error: (error: Error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBulkUploadConfirm = async () => {
    try {
      const validCompanies = bulkUploadData
        .filter((row) => row.name && row.name.trim())
        .map((row) => ({
          name: row.name.trim(),
          description: row.description?.trim() || undefined,
          region: row.region?.trim() || undefined,
          branch: row.branch?.trim() || undefined,
        }));

      if (validCompanies.length === 0) {
        toast.error('No valid companies found in CSV');
        return;
      }

      const result = await createBulk({
        companies: validCompanies,
        createdBy: user!.userId,
      });

      toast.success(`${result.length} companies created successfully`);
      setIsBulkUploadDialogOpen(false);
      setBulkUploadData([]);
    } catch (error) {
      toast.error('Failed to create companies');
    }
  };

  if (isLoading || !user) return null;

  // Filter and sort companies
  const filteredCompanies = companies
    ?.filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.branch?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortField === 'createdAt') {
        // Ensure values are properly converted to Date before comparing
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortOrder === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }
      
      // For string fields
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const loading = !companies;
  const selectedCompany = companies?.find((c) => c._id === selectedCompanyId);
  const allSelected = filteredCompanies && filteredCompanies.length > 0 && 
    filteredCompanies.every((c) => selectedIds.has(c._id));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              <h1 className="text-2xl sm:text-3xl font-bold">Companies</h1>
              <p className="text-muted-foreground mt-1">Manage all companies in the system</p>
            </div>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => filteredCompanies && exportCompaniesToCSV(filteredCompanies as unknown as Company[])}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => filteredCompanies && exportCompaniesToPDF(filteredCompanies as unknown as Company[])}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <CardTitle>All Companies ({filteredCompanies?.length || 0})</CardTitle>
                  {selectedIds.size > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedIds.size} selected
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  {selectedIds.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBulkDeleteConfirmOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedIds.size})
                    </Button>
                  )}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={`${sortField}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split('-') as [SortField, SortOrder];
                      setSortField(field);
                      setSortOrder(order);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="createdAt-desc">Newest First</SelectItem>
                      <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCompanies && filteredCompanies.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Description
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">Region</TableHead>
                        <TableHead className="hidden lg:table-cell">Branch</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Created
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company) => (
                        <TableRow key={company._id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(company._id)}
                              onCheckedChange={(checked) =>
                                handleSelectOne(company._id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <button
                                  onClick={() => handleViewMembers(company._id as Id<'companies'>)}
                                  className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                                  onMouseEnter={() => setSelectedCompanyId(company._id as Id<'companies'>)}
                                >
                                  <Building2 className="h-4 w-4 text-blue-600" />
                                  {company.name}
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-semibold">{company.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {company.description || 'No description'}
                                    </p>
                                  </div>
                                  {companyStatistics && selectedCompanyId === company._id && (
                                    <div className="space-y-3 pt-2 border-t">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <div className="text-2xl font-bold">
                                            {companyStatistics.totalMembers}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Total Members
                                          </div>
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <div className="text-2xl font-bold text-green-600">
                                              {companyStatistics.activeMembers}
                                            </div>
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Active ({companyStatistics.activePercentage}%)
                                          </div>
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <div className="text-2xl font-bold text-gray-600">
                                              {companyStatistics.dormantMembers}
                                            </div>
                                            <TrendingDown className="h-4 w-4 text-gray-600" />
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Dormant ({companyStatistics.dormantPercentage}%)
                                          </div>
                                        </div>
                                      </div>
                                      {/* Gender Statistics */}
                                      <div className="border-t pt-2">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <User className="h-4 w-4 text-blue-600" />
                                              <div className="text-lg font-bold text-blue-600">
                                                {companyStatistics.maleMembers}
                                              </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              Male ({companyStatistics.malePercentage}%)
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <User className="h-4 w-4 text-pink-600" />
                                              <div className="text-lg font-bold text-pink-600">
                                                {companyStatistics.femaleMembers}
                                              </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              Female ({companyStatistics.femalePercentage}%)
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-md">
                            <p className="truncate">{company.description || 'N/A'}</p>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {company.region ? (
                              <Badge variant="outline">{company.region}</Badge>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {company.branch ? (
                              <Badge variant="outline">{company.branch}</Badge>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleViewMembers(company._id as Id<'companies'>)}
                                >
                                  <UsersIcon className="h-4 w-4 mr-2" />
                                  View Members
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(company)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteCompanyId(company._id as Id<'companies'>)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No companies found' : 'No companies yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Company Members Dialog */}
        <Dialog open={isCompanyMembersDialogOpen} onOpenChange={setIsCompanyMembersDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                {selectedCompany?.name} - Members
              </DialogTitle>
              <DialogDescription>
                View all members registered to this company
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {companyMembers && companyMembers.length > 0 ? (
                <div className="space-y-3">
                  {companyMembers.map((member) => (
                    <Card key={member._id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <UsersIcon className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Staff ID</p>
                                <p className="font-mono font-semibold">{member.staffId}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Position</p>
                                <p className="font-medium">{member.position || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Department</p>
                                <p className="font-medium">{member.department || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                  {member.status}
                                </Badge>
                              </div>
                            </div>

                            {member.phone && (
                              <div className="text-sm">
                                <p className="text-muted-foreground">Phone</p>
                                <p className="font-medium">{member.phone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No members registered to this company</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setIsCompanyMembersDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Dialog */}
        <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Bulk Upload Companies</DialogTitle>
              <DialogDescription>
                Review and confirm the companies to be imported
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Branch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkUploadData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.description || 'N/A'}</TableCell>
                      <TableCell>{row.region || 'N/A'}</TableCell>
                      <TableCell>{row.branch || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsBulkUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleBulkUploadConfirm}>
                Import {bulkUploadData.length} Companies
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit/Add Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? 'Edit Company' : 'Add Company'}
              </DialogTitle>
              <DialogDescription>
                {editingCompany
                  ? 'Update company information'
                  : 'Create a new company'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name*</Label>
                  <Input
                    id="name"
                    placeholder="Acme Corporation"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Company description..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      placeholder="North America, EMEA, etc."
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      placeholder="New York Office, London HQ, etc."
                      value={formData.branch}
                      onChange={(e) =>
                        setFormData({ ...formData, branch: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCompany ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteCompanyId}
          onOpenChange={(open) => !open && setDeleteCompanyId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this company. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog
          open={bulkDeleteConfirmOpen}
          onOpenChange={setBulkDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedIds.size} companies?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the selected companies. Companies with existing members cannot be deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Selected
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
