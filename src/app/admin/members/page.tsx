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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Building2 } from 'lucide-react';
import { Plus, Users, Search, Power, PowerOff, Copy, CheckCircle2, MoreVertical, Pencil, Trash2, ArrowLeft, ArrowUpCircle, ArrowDownCircle, Download, Upload, FileText, AlertCircle, User, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { Badge } from '@/components/ui/badge';
import { exportMembersToCSV, exportMembersToPDF } from '@/lib/exportUtils';
import Papa from 'papaparse';
import type { Id } from '../../../../convex/_generated/dataModel';

type StatusType = 'active' | 'dormant' | 'all';
type DormantReason = 'resignation' | 'retirement' | 'dismissal' | 'deferred' | 'other';

export default function MembersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<Id<'members'> | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState<boolean>(false);
  const [statusToggleMemberId, setStatusToggleMemberId] = useState<Id<'members'> | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [showPasswordDialog, setShowPasswordDialog] = useState<boolean>(false);
  const [passwordCopied, setPasswordCopied] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusType>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUploadData, setBulkUploadData] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    // Personal Information
    staffId: '',
    firstName: '',
    lastName: '',
    email: '',
    ghCard: '',
    gender: '' as 'male' | 'female' | '',
    dateOfBirth: '',
    
    // Employment Details
    companyId: '',
    position: '',
    department: '',
    region: '',
    locationDistrict: '',
    phone: '',
    address: '',
    
    // Family Information
    fatherName: '',
    fatherDob: '',
    motherName: '',
    motherDob: '',
    spouseName: '',
    spouseDob: '',
    child1Name: '',
    child1Dob: '',
    child2Name: '',
    child2Dob: '',
    child3Name: '',
    child3Dob: '',
    child4Name: '',
    child4Dob: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    
    // Status
    status: 'active' as 'active' | 'dormant',
    dormantReason: '' as DormantReason | '',
    dormantNote: '',
  });

  const companies = useQuery(api.companies.list);
  const allMembers = useQuery(api.members.list);
  const createMember = useMutation(api.members.create);
  const createBulk = useMutation(api.members.createBulk);
  const updateMember = useMutation(api.members.update);
  const deleteMember = useMutation(api.members.remove);
  const deleteBulk = useMutation(api.members.removeBulk);
  const toggleMemberStatus = useMutation(api.members.toggleStatus);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Filter members by search term, status, and company
  const members = allMembers?.filter((member) => {
    const matchesSearch = !searchTerm || 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.position && member.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || member.companyId === companyFilter;
    
    return matchesSearch && matchesStatus && matchesCompany;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyId) {
      toast.error('Please select a company');
      return;
    }

    if (!formData.staffId.trim()) {
      toast.error('Please enter a Staff ID');
      return;
    }

    if (!formData.gender) {
      toast.error('Please select a gender');
      return;
    }

    if (formData.status === 'dormant' && !formData.dormantReason) {
      toast.error('Please select a dormant reason');
      return;
    }

    try {
      if (editingMember) {
        await updateMember({
          id: editingMember._id as Id<'members'>,
          staffId: formData.staffId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          ghCard: formData.ghCard || undefined,
          gender: formData.gender as 'male' | 'female',
          dateOfBirth: formData.dateOfBirth || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          position: formData.position || undefined,
          department: formData.department || undefined,
          region: formData.region || undefined,
          locationDistrict: formData.locationDistrict || undefined,
          fatherName: formData.fatherName || undefined,
          fatherDOB: formData.fatherDob || undefined,
          motherName: formData.motherName || undefined,
          motherDOB: formData.motherDob || undefined,
          spouseName: formData.spouseName || undefined,
          spouseDOB: formData.spouseDob || undefined,
          child1Name: formData.child1Name || undefined,
          child1DOB: formData.child1Dob || undefined,
          child2Name: formData.child2Name || undefined,
          child2DOB: formData.child2Dob || undefined,
          child3Name: formData.child3Name || undefined,
          child3DOB: formData.child3Dob || undefined,
          child4Name: formData.child4Name || undefined,
          child4DOB: formData.child4Dob || undefined,
          emergencyContactName: formData.emergencyContactName || undefined,
          emergencyContactPhone: formData.emergencyContactPhone || undefined,
          status: formData.status,
          dormantReason: formData.status === 'dormant' ? formData.dormantReason as DormantReason : undefined,
          dormantNote: formData.status === 'dormant' ? formData.dormantNote : undefined,
        });
        toast.success('Member updated successfully');
      } else {
        // Generate 8-digit password for new member
        const password = Math.floor(10000000 + Math.random() * 90000000).toString();
        
        const result = await createMember({
          companyId: formData.companyId as Id<'companies'>,
          staffId: formData.staffId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password,
          ghCard: formData.ghCard || undefined,
          gender: formData.gender as 'male' | 'female',
          dateOfBirth: formData.dateOfBirth || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          position: formData.position || undefined,
          department: formData.department || undefined,
          region: formData.region || undefined,
          locationDistrict: formData.locationDistrict || undefined,
          fatherName: formData.fatherName || undefined,
          fatherDOB: formData.fatherDob || undefined,
          motherName: formData.motherName || undefined,
          motherDOB: formData.motherDob || undefined,
          spouseName: formData.spouseName || undefined,
          spouseDOB: formData.spouseDob || undefined,
          child1Name: formData.child1Name || undefined,
          child1DOB: formData.child1Dob || undefined,
          child2Name: formData.child2Name || undefined,
          child2DOB: formData.child2Dob || undefined,
          child3Name: formData.child3Name || undefined,
          child3DOB: formData.child3Dob || undefined,
          child4Name: formData.child4Name || undefined,
          child4DOB: formData.child4Dob || undefined,
          emergencyContactName: formData.emergencyContactName || undefined,
          emergencyContactPhone: formData.emergencyContactPhone || undefined,
          status: formData.status,
          dormantReason: formData.status === 'dormant' ? formData.dormantReason as DormantReason : undefined,
          dormantNote: formData.status === 'dormant' ? formData.dormantNote : undefined,
        });
        
        // Show generated password
        setGeneratedPassword(password);
        setShowPasswordDialog(true);
        toast.success('Member created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save member');
    }
  };

  const resetForm = () => {
    setFormData({
      staffId: '',
      firstName: '',
      lastName: '',
      email: '',
      ghCard: '',
      gender: '',
      dateOfBirth: '',
      companyId: '',
      position: '',
      department: '',
      region: '',
      locationDistrict: '',
      phone: '',
      address: '',
      fatherName: '',
      fatherDob: '',
      motherName: '',
      motherDob: '',
      spouseName: '',
      spouseDob: '',
      child1Name: '',
      child1Dob: '',
      child2Name: '',
      child2Dob: '',
      child3Name: '',
      child3Dob: '',
      child4Name: '',
      child4Dob: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      status: 'active',
      dormantReason: '',
      dormantNote: '',
    });
    setEditingMember(null);
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      staffId: member.staffId || '',
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      ghCard: member.ghCard || '',
      gender: member.gender || '',
      dateOfBirth: member.dateOfBirth || '',
      companyId: member.companyId,
      position: member.position || '',
      department: member.department || '',
      region: member.region || '',
      locationDistrict: member.locationDistrict || '',
      phone: member.phone || '',
      address: member.address || '',
      fatherName: member.fatherName || '',
      fatherDob: member.fatherDob || '',
      motherName: member.motherName || '',
      motherDob: member.motherDob || '',
      spouseName: member.spouseName || '',
      spouseDob: member.spouseDob || '',
      child1Name: member.child1Name || '',
      child1Dob: member.child1Dob || '',
      child2Name: member.child2Name || '',
      child2Dob: member.child2Dob || '',
      child3Name: member.child3Name || '',
      child3Dob: member.child3Dob || '',
      child4Name: member.child4Name || '',
      child4Dob: member.child4Dob || '',
      emergencyContactName: member.emergencyContactName || '',
      emergencyContactPhone: member.emergencyContactPhone || '',
      status: member.status,
      dormantReason: member.dormantReason || '',
      dormantNote: member.dormantNote || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteMemberId) return;
    
    try {
      await deleteMember({ id: deleteMemberId });
      toast.success('Member deleted successfully');
      setDeleteMemberId(null);
    } catch (error) {
      toast.error('Failed to delete member');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds) as Id<'members'>[];
      const result = await deleteBulk({ ids });
      
      if (result.deleted.length > 0) {
        toast.success(`${result.deleted.length} members deleted`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} members failed to delete`);
      }
      
      setSelectedIds(new Set());
      setBulkDeleteConfirmOpen(false);
    } catch (error) {
      toast.error('Failed to delete members');
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusToggleMemberId) return;
    
    try {
      const newStatus = await toggleMemberStatus({ id: statusToggleMemberId });
      toast.success(`Member status changed to ${newStatus}`);
      setStatusToggleMemberId(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setPasswordCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Staff ID copied to clipboard');
  };

  const handleClosePasswordDialog = () => {
    setShowPasswordDialog(false);
    setGeneratedPassword('');
    setPasswordCopied(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && members) {
      setSelectedIds(new Set(members.map((m) => m._id)));
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
      const validMembers = bulkUploadData
        .filter((row) => row.staffId && row.firstName && row.lastName && row.email && row.companyId && row.gender)
        .map((row) => ({
          companyId: row.companyId.trim() as Id<'companies'>,
          staffId: row.staffId.trim(),
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          email: row.email.trim(),
          ghCard: row.ghCard?.trim(),
          gender: row.gender.toLowerCase() === 'female' ? 'female' as const : 'male' as const,
          dateOfBirth: row.dateOfBirth?.trim(),
          phone: row.phone?.trim(),
          address: row.address?.trim(),
          position: row.position?.trim(),
          department: row.department?.trim(),
          region: row.region?.trim(),
          locationDistrict: row.locationDistrict?.trim(),
          fatherName: row.fatherName?.trim(),
          fatherDob: row.fatherDob?.trim(),
          motherName: row.motherName?.trim(),
          motherDob: row.motherDob?.trim(),
          spouseName: row.spouseName?.trim(),
          spouseDob: row.spouseDob?.trim(),
          child1Name: row.child1Name?.trim(),
          child1Dob: row.child1Dob?.trim(),
          child2Name: row.child2Name?.trim(),
          child2Dob: row.child2Dob?.trim(),
          child3Name: row.child3Name?.trim(),
          child3Dob: row.child3Dob?.trim(),
          child4Name: row.child4Name?.trim(),
          child4Dob: row.child4Dob?.trim(),
          emergencyContactName: row.emergencyContactName?.trim(),
          emergencyContactPhone: row.emergencyContactPhone?.trim(),
          status: (row.status === 'dormant' ? 'dormant' : 'active') as 'active' | 'dormant',
          dormantReason: row.dormantReason?.trim() as DormantReason | undefined,
          dormantNote: row.dormantNote?.trim(),
        }));

      if (validMembers.length === 0) {
        toast.error('No valid members found in CSV');
        return;
      }

      const result = await createBulk({ members: validMembers });

      toast.success(`${result.results.length} members created successfully`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} members failed`);
      }
      
      setIsBulkUploadDialogOpen(false);
      setBulkUploadData([]);
    } catch (error) {
      toast.error('Failed to create members');
    }
  };

  if (isLoading || !user) return null;

  const getCompanyName = (companyId: string) => {
    const company = companies?.find((c) => c._id === companyId);
    return company?.name || 'Unknown';
  };

  const getDormantReasonLabel = (reason: string | undefined) => {
    if (!reason) return null;
    const labels: Record<string, string> = {
      resignation: 'Resignation',
      retirement: 'Retirement',
      dismissal: 'Dismissal',
      deferred: 'Deferred',
      other: 'Other',
    };
    return labels[reason as keyof typeof labels] || reason;
  };

  const activeCount = allMembers?.filter((m) => m.status === 'active').length || 0;
  const dormantCount = allMembers?.filter((m) => m.status === 'dormant').length || 0;

  const loading = !companies || !allMembers;
  const allSelected = members && members.length > 0 && 
    members.every((m) => selectedIds.has(m._id));

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
              <h1 className="text-2xl sm:text-3xl font-bold">Members</h1>
              <p className="text-muted-foreground mt-1">Manage all members across companies</p>
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
                <DropdownMenuItem onClick={() => allMembers && exportMembersToCSV(allMembers)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => allMembers && exportMembersToPDF(allMembers)}>
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
              Add Member
            </Button>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{allMembers?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <Power className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dormant</p>
                  <p className="text-2xl font-bold text-gray-600">{dormantCount}</p>
                </div>
                <PowerOff className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <CardTitle>All Members ({members?.length || 0})</CardTitle>
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
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={companyFilter}
                    onValueChange={setCompanyFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="All Companies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {companies?.map((company) => (
                        <SelectItem key={company._id} value={company._id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: StatusType) => setStatusFilter(value)}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="dormant">Dormant Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {members && members.length > 0 ? (
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
                        <TableHead>Staff ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">Company</TableHead>
                        <TableHead className="hidden lg:table-cell">Gender</TableHead>
                        <TableHead className="hidden sm:table-cell">Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member._id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(member._id)}
                              onCheckedChange={(checked) =>
                                handleSelectOne(member._id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{member.staffId}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyId(member.staffId)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-600" />
                              <div>
                                <div>
                                  {member.firstName} {member.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground md:hidden">
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {member.email}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {getCompanyName(member.companyId)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant={member.gender === 'male' ? 'default' : 'secondary'}>
                              {member.gender === 'male' ? (
                                <User className="h-3 w-3 mr-1" />
                              ) : (
                                <Heart className="h-3 w-3 mr-1" />
                              )}
                              {member.gender === 'male' ? 'Male' : 'Female'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {member.position || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {member.status === 'dormant' ? (
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Badge variant="secondary" className="cursor-help">
                                    Dormant
                                  </Badge>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4 text-amber-600" />
                                      <h4 className="font-semibold">Dormant Status</h4>
                                    </div>
                                    {member.dormantReason && (
                                      <div>
                                        <p className="text-sm text-muted-foreground">Reason:</p>
                                        <p className="text-sm font-medium">
                                          {getDormantReasonLabel(member.dormantReason)}
                                        </p>
                                      </div>
                                    )}
                                    {member.dormantNote && (
                                      <div>
                                        <p className="text-sm text-muted-foreground">Note:</p>
                                        <p className="text-sm">{member.dormantNote}</p>
                                      </div>
                                    )}
                                    {!member.dormantReason && !member.dormantNote && (
                                      <p className="text-sm text-muted-foreground">
                                        No additional information available
                                      </p>
                                    )}
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            ) : (
                              <Badge variant="default">Active</Badge>
                            )}
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
                                  onClick={() => setStatusToggleMemberId(member._id as Id<'members'>)}
                                >
                                  {member.status === 'active' ? (
                                    <>
                                      <ArrowDownCircle className="h-4 w-4 mr-2 text-gray-600" />
                                      Set Dormant
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUpCircle className="h-4 w-4 mr-2 text-green-600" />
                                      Set Active
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEdit(member)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteMemberId(member._id as Id<'members'>)}
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
                  <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || companyFilter !== 'all'
                      ? 'No members found'
                      : 'No members yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Member Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Edit Member' : 'Add Member'}
              </DialogTitle>
              <DialogDescription>
                {editingMember
                  ? 'Update member information'
                  : 'Create a new member profile with complete details'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6 py-4">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Personal Information</h3>
                  </div>
                  <Separator />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="staffId">Staff ID*</Label>
                      <Input
                        id="staffId"
                        placeholder="AB123456"
                        value={formData.staffId}
                        onChange={(e) =>
                          setFormData({ ...formData, staffId: e.target.value })
                        }
                        required
                        disabled={!!editingMember}
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: 2 letters + 6 digits (e.g., AB123456)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ghCard">Ghana Card Number</Label>
                      <Input
                        id="ghCard"
                        placeholder="GHA-123456789-0"
                        value={formData.ghCard}
                        onChange={(e) =>
                          setFormData({ ...formData, ghCard: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name*</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name*</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email*</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender*</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value: 'male' | 'female') =>
                          setFormData({ ...formData, gender: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Employment Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-lg">Employment Details</h3>
                  </div>
                  <Separator />

                  {!editingMember && (
                    <div className="space-y-2">
                      <Label htmlFor="company">Company*</Label>
                      <Select
                        value={formData.companyId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, companyId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies?.map((company) => (
                            <SelectItem key={company._id} value={company._id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        placeholder="Software Engineer"
                        value={formData.position}
                        onChange={(e) =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        placeholder="Engineering"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({ ...formData, department: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region of Organization</Label>
                      <Input
                        id="region"
                        placeholder="Greater Accra, Ashanti, etc."
                        value={formData.region}
                        onChange={(e) =>
                          setFormData({ ...formData, region: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="locationDistrict">Location/District</Label>
                      <Input
                        id="locationDistrict"
                        placeholder="Accra Metropolitan, Kumasi, etc."
                        value={formData.locationDistrict}
                        onChange={(e) =>
                          setFormData({ ...formData, locationDistrict: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+233 XX XXX XXXX"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St, City"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Family Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-lg">Family Information</h3>
                  </div>
                  <Separator />

                  {/* Parents */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Parents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fatherName">Father's Name</Label>
                        <Input
                          id="fatherName"
                          placeholder="Father's full name"
                          value={formData.fatherName}
                          onChange={(e) =>
                            setFormData({ ...formData, fatherName: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fatherDob">Father's Date of Birth</Label>
                        <Input
                          id="fatherDob"
                          type="date"
                          value={formData.fatherDob}
                          onChange={(e) =>
                            setFormData({ ...formData, fatherDob: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="motherName">Mother's Name</Label>
                        <Input
                          id="motherName"
                          placeholder="Mother's full name"
                          value={formData.motherName}
                          onChange={(e) =>
                            setFormData({ ...formData, motherName: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="motherDob">Mother's Date of Birth</Label>
                        <Input
                          id="motherDob"
                          type="date"
                          value={formData.motherDob}
                          onChange={(e) =>
                            setFormData({ ...formData, motherDob: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Spouse */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Spouse</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="spouseName">Spouse's Name</Label>
                        <Input
                          id="spouseName"
                          placeholder="Spouse's full name"
                          value={formData.spouseName}
                          onChange={(e) =>
                            setFormData({ ...formData, spouseName: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="spouseDob">Spouse's Date of Birth</Label>
                        <Input
                          id="spouseDob"
                          type="date"
                          value={formData.spouseDob}
                          onChange={(e) =>
                            setFormData({ ...formData, spouseDob: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Biological Children Under 18 Years
                    </h4>
                    
                    {/* Child 1 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="child1Name">1st Child's Name</Label>
                        <Input
                          id="child1Name"
                          placeholder="First child's name"
                          value={formData.child1Name}
                          onChange={(e) =>
                            setFormData({ ...formData, child1Name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="child1Dob">1st Child's Date of Birth</Label>
                        <Input
                          id="child1Dob"
                          type="date"
                          value={formData.child1Dob}
                          onChange={(e) =>
                            setFormData({ ...formData, child1Dob: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Child 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="child2Name">2nd Child's Name</Label>
                        <Input
                          id="child2Name"
                          placeholder="Second child's name"
                          value={formData.child2Name}
                          onChange={(e) =>
                            setFormData({ ...formData, child2Name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="child2Dob">2nd Child's Date of Birth</Label>
                        <Input
                          id="child2Dob"
                          type="date"
                          value={formData.child2Dob}
                          onChange={(e) =>
                            setFormData({ ...formData, child2Dob: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Child 3 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="child3Name">3rd Child's Name</Label>
                        <Input
                          id="child3Name"
                          placeholder="Third child's name"
                          value={formData.child3Name}
                          onChange={(e) =>
                            setFormData({ ...formData, child3Name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="child3Dob">3rd Child's Date of Birth</Label>
                        <Input
                          id="child3Dob"
                          type="date"
                          value={formData.child3Dob}
                          onChange={(e) =>
                            setFormData({ ...formData, child3Dob: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Child 4 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="child4Name">4th Child's Name</Label>
                        <Input
                          id="child4Name"
                          placeholder="Fourth child's name"
                          value={formData.child4Name}
                          onChange={(e) =>
                            setFormData({ ...formData, child4Name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="child4Dob">4th Child's Date of Birth</Label>
                        <Input
                          id="child4Dob"
                          type="date"
                          value={formData.child4Dob}
                          onChange={(e) =>
                            setFormData({ ...formData, child4Dob: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-lg">Emergency Contact</h3>
                  </div>
                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Contact Person Name</Label>
                      <Input
                        id="emergencyContactName"
                        placeholder="Full name"
                        value={formData.emergencyContactName}
                        onChange={(e) =>
                          setFormData({ ...formData, emergencyContactName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone">Contact Phone Number</Label>
                      <Input
                        id="emergencyContactPhone"
                        type="tel"
                        placeholder="+233 XX XXX XXXX"
                        value={formData.emergencyContactPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, emergencyContactPhone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Power className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-lg">Account Status</h3>
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'active' | 'dormant') =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="dormant">Dormant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.status === 'dormant' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="dormantReason">Dormant Reason*</Label>
                        <Select
                          value={formData.dormantReason}
                          onValueChange={(value: DormantReason) =>
                            setFormData({ ...formData, dormantReason: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resignation">Resignation</SelectItem>
                            <SelectItem value="retirement">Retirement</SelectItem>
                            <SelectItem value="dismissal">Dismissal</SelectItem>
                            <SelectItem value="deferred">Deferred</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dormantNote">Additional Note</Label>
                        <Textarea
                          id="dormantNote"
                          placeholder="Add any additional information..."
                          value={formData.dormantNote}
                          onChange={(e) =>
                            setFormData({ ...formData, dormantNote: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                    </>
                  )}
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
                  {editingMember ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Generated Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Member Created Successfully
              </DialogTitle>
              <DialogDescription>
                Save this password securely. It will not be shown again.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Generated Login Password
                </Label>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                    {generatedPassword}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPassword}
                    title="Copy password"
                  >
                    {passwordCopied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> This 8-digit password is the member's login credential. Share this with the member along with their email so they can log in to the system.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClosePasswordDialog} className="w-full">
                I've Saved the Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Dialog */}
        <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Upload Members</DialogTitle>
              <DialogDescription>
                Review and confirm the members to be imported. Ensure all required fields are present: staffId, firstName, lastName, email, companyId, gender.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Company ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkUploadData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.staffId}</TableCell>
                      <TableCell>{row.firstName}</TableCell>
                      <TableCell>{row.lastName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.gender}</TableCell>
                      <TableCell>{row.companyId}</TableCell>
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
                Import {bulkUploadData.length} Members
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteMemberId}
          onOpenChange={(open) => !open && setDeleteMemberId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this member and all their documents. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Member
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
              <AlertDialogTitle>Delete {selectedIds.size} members?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the selected members and all their documents. This action cannot be undone.
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

        {/* Status Toggle Confirmation Dialog */}
        <AlertDialog
          open={!!statusToggleMemberId}
          onOpenChange={(open) => !open && setStatusToggleMemberId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change member status?</AlertDialogTitle>
              <AlertDialogDescription>
                This will change the member's account status. You can change it back anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleToggleStatusConfirm}>
                Change Status
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
