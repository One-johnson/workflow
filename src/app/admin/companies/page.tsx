'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '../../../context/AuthContext';
import { AdminLayout } from '../../../components/AdminLayout';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Building2, Search, ArrowUpDown, MoreVertical, Pencil, Trash2, Users as UsersIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { Badge } from '@/components/ui/badge';
import type { Id } from '../../../../convex/_generated/dataModel';
import Image from 'next/image';

type SortField = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function CompaniesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isCompanyMembersDialogOpen, setIsCompanyMembersDialogOpen] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<Id<'companies'> | null>(null);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState<Id<'companies'> | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    createdBy: user!.userId,
  });

  const companies = useQuery(api.companies.list);
  const companyMembers = useQuery(
    api.companies.getMembersWithDetails,
    selectedCompanyId ? { companyId: selectedCompanyId } : 'skip'
  );
  const createCompany = useMutation(api.companies.create);
  const updateCompany = useMutation(api.companies.update);
  const deleteCompany = useMutation(api.companies.remove);

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
          logo: formData.logo,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
        });
        toast.success('Company updated successfully');
      } else {
        await createCompany({
          name: formData.name,
          description: formData.description,
          logo: formData.logo,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          createdBy: user!.userId,
        });
        toast.success('Company created successfully');
      }

      setIsDialogOpen(false);
      setFormData({ name: '', description: '',
        logo:'',
        address:'',
        phone:'',
        email:'',
        createdBy: user!.userId,
        });
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
      logo: company.logo || '',
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      createdBy: company.createdBy || user!.userId,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCompanyId) return;
    
    try {
      await deleteCompany({ id: deleteCompanyId });
      toast.success('Company deleted successfully');
      setDeleteCompanyId(null);
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  const handleAdd = () => {
    setEditingCompany(null);
    setFormData({ name: '', description: '', logo: '', address: '', phone: '', email: '', createdBy: user!.userId });
    setIsDialogOpen(true);
  };

  const handleViewMembers = (companyId: Id<'companies'>) => {
    setSelectedCompanyId(companyId);
    setIsCompanyMembersDialogOpen(true);
  };

  if (isLoading || !user) return null;

  // Filter and sort companies
  const filteredCompanies = companies
    ?.filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortField === 'createdAt') {
        // Ensure the values are Date or number for subtraction
        const aTime = new Date(aValue).getTime();
        const bTime = new Date(bValue).getTime();
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }
      
      // For string fields
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const loading = !companies;

  const selectedCompany = companies?.find((c) => c._id === selectedCompanyId);

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
              <p className="text-muted-foreground mt-1">Manage your companies in the system</p>
            </div>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <CardTitle>All Companies ({filteredCompanies?.length || 0})</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
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
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Description
                        </TableHead>
                       
                        <TableHead className="hidden sm:table-cell">
                          Address
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Phone
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Email
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Created
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company) => (
                        <TableRow key={company._id}>
                          <TableCell className="font-medium">
                            <button
                              onClick={() => handleViewMembers(company._id as Id<'companies'>)}
                              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                            >
                              <Building2 className="h-4 w-4 text-blue-600" />
                              {company.name}
                            </button>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-md">
                            <p className="truncate">{company.description || 'N/A'}</p>
                          </TableCell>
                          {/* <TableCell className="hidden sm:table-cell">
                            {company.logo ? (
                              // If using Next.js, replace with `next/image` import
                              <Image
                                src={company.logo}
                                alt={company.name}
                                width={100}
                                height={100}
                                style={{ objectFit: 'contain' }}
                              />
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell> */}
                          <TableCell className="hidden sm:table-cell">
                            <p className="truncate">{company.address || 'N/A'}</p>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <p className="truncate">{company.phone || 'N/A'}</p>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <p className="truncate">{company.email || 'N/A'}</p>
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
                                <p className="text-muted-foreground">ID Number</p>
                                <p className="font-mono font-semibold">{member.memberIdNumber}</p>
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

        {/* Edit/Add Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
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
                  <Label htmlFor="logo">Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({ ...formData, logo: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, City, Country"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                </div>
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+1234567890"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="company@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
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
      </div>
    </AdminLayout>
  );
}
