'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Search, Filter, Save, Bookmark, X, Calendar, Building2, Users, FileText, ChevronDown, ChevronUp, Trash2, Star, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { toast } from 'sonner';
import type { Id } from '../../convex/_generated/dataModel';

interface AdvancedSearchProps {
  userId: Id<'users'>;
  onClose?: () => void;
}

type SearchModule = 'companies' | 'members' | 'documents';

interface SearchFilters {
  companyRegion?: string;
  companyBranch?: string;
  memberStatus?: 'active' | 'dormant';
  memberGender?: 'male' | 'female';
  memberRegion?: string;
  memberDepartment?: string;
  memberPosition?: string;
  companyId?: Id<'companies'>;
  documentFileType?: string;
  dateFrom?: number;
  dateTo?: number;
}

export function AdvancedSearch({ userId, onClose }: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModules, setSelectedModules] = useState<SearchModule[]>(['companies', 'members', 'documents']);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [savedSearchesOpen, setSavedSearchesOpen] = useState<boolean>(false);
  const [searchName, setSearchName] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Queries
  const filterOptions = useQuery(api.search.getFilterOptions);
  const searchResults = useQuery(
    api.search.advancedSearch,
    debouncedSearch || Object.keys(filters).length > 0 || selectedModules.length < 3
      ? {
          searchTerm: debouncedSearch,
          modules: selectedModules,
          filters,
        }
      : 'skip'
  );
  const savedSearches = useQuery(api.search.getSavedSearches, { userId });

  // Mutations
  const saveSearch = useMutation(api.search.saveSearch);
  const updateSearchUsage = useMutation(api.search.updateSearchUsage);
  const deleteSavedSearch = useMutation(api.search.deleteSavedSearch);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const toggleModule = (module: SearchModule) => {
    setSelectedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | number | undefined) => {
    setFilters((prev) => {
      if (value === undefined || value === '') {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSelectedModules(['companies', 'members', 'documents']);
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }

    try {
      await saveSearch({
        userId,
        name: searchName,
        searchTerm: searchTerm || undefined,
        modules: selectedModules,
        filters,
      });
      toast.success('Search saved successfully');
      setSaveDialogOpen(false);
      setSearchName('');
    } catch (error) {
      toast.error('Failed to save search');
    }
  };

  const loadSavedSearch = async (search: any) => {
    setSearchTerm(search.searchTerm || '');
    setSelectedModules(search.modules);
    setFilters(search.filters);
    setSavedSearchesOpen(false);
    
    try {
      await updateSearchUsage({ searchId: search._id });
    } catch (error) {
      console.error('Failed to update search usage:', error);
    }
  };

  const handleDeleteSearch = async (searchId: Id<'savedSearches'>, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSavedSearch({ searchId });
      toast.success('Search deleted');
    } catch (error) {
      toast.error('Failed to delete search');
    }
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof SearchFilters] !== undefined
  ).length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Search Bar and Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Advanced Search</CardTitle>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search across all modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover open={savedSearchesOpen} onOpenChange={setSavedSearchesOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="Saved Searches">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Saved Searches</h4>
                  {savedSearches && savedSearches.length > 0 ? (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {savedSearches.map((search) => (
                          <div
                            key={search._id}
                            className="p-3 rounded-lg border hover:bg-accent cursor-pointer"
                            onClick={() => loadSavedSearch(search)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{search.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3" />
                                  Used {search.useCount} times
                                </div>
                                {search.searchTerm && (
                                  <div className="text-xs text-muted-foreground mt-1 truncate">
                                    &quot;{search.searchTerm}&quot;
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={(e) => handleDeleteSearch(search._id as Id<'savedSearches'>, e)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No saved searches yet
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(true)}
              disabled={!searchTerm && Object.keys(filters).length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>

          {/* Module Selection */}
          <div className="flex gap-2">
            <Label className="text-sm font-medium self-center">Search in:</Label>
            <div className="flex gap-2">
              <Button
                variant={selectedModules.includes('companies') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleModule('companies')}
              >
                <Building2 className="h-3 w-3 mr-1" />
                Companies
              </Button>
              <Button
                variant={selectedModules.includes('members') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleModule('members')}
              >
                <Users className="h-3 w-3 mr-1" />
                Members
              </Button>
              <Button
                variant={selectedModules.includes('documents') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleModule('documents')}
              >
                <FileText className="h-3 w-3 mr-1" />
                Documents
              </Button>
            </div>
            {(activeFilterCount > 0 || searchTerm) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Accordion type="multiple" className="w-full">
              {/* Company Filters */}
              {selectedModules.includes('companies') && (
                <AccordionItem value="company-filters">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Filters
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="company-region">Region</Label>
                        <Select
                          value={filters.companyRegion || ''}
                          onValueChange={(value) => handleFilterChange('companyRegion', value || undefined)}
                        >
                          <SelectTrigger id="company-region">
                            <SelectValue placeholder="All Regions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Regions</SelectItem>
                            {filterOptions?.regions.map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company-branch">Branch</Label>
                        <Select
                          value={filters.companyBranch || ''}
                          onValueChange={(value) => handleFilterChange('companyBranch', value || undefined)}
                        >
                          <SelectTrigger id="company-branch">
                            <SelectValue placeholder="All Branches" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Branches</SelectItem>
                            {filterOptions?.branches.map((branch) => (
                              <SelectItem key={branch} value={branch}>
                                {branch}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Member Filters */}
              {selectedModules.includes('members') && (
                <AccordionItem value="member-filters">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Member Filters
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="member-status">Status</Label>
                        <Select
                          value={filters.memberStatus || ''}
                          onValueChange={(value: '' | 'active' | 'dormant') => 
                            handleFilterChange('memberStatus', value || undefined)
                          }
                        >
                          <SelectTrigger id="member-status">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="dormant">Dormant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="member-gender">Gender</Label>
                        <Select
                          value={filters.memberGender || ''}
                          onValueChange={(value: '' | 'male' | 'female') => 
                            handleFilterChange('memberGender', value || undefined)
                          }
                        >
                          <SelectTrigger id="member-gender">
                            <SelectValue placeholder="All Genders" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Genders</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="member-company">Company</Label>
                        <Select
                          value={filters.companyId || ''}
                          onValueChange={(value) => handleFilterChange('companyId', value || undefined)}
                        >
                          <SelectTrigger id="member-company">
                            <SelectValue placeholder="All Companies" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Companies</SelectItem>
                            {filterOptions?.companies.map((company) => (
                              <SelectItem key={company._id} value={company._id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="member-department">Department</Label>
                        <Select
                          value={filters.memberDepartment || ''}
                          onValueChange={(value) => handleFilterChange('memberDepartment', value || undefined)}
                        >
                          <SelectTrigger id="member-department">
                            <SelectValue placeholder="All Departments" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Departments</SelectItem>
                            {filterOptions?.departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="member-position">Position</Label>
                        <Select
                          value={filters.memberPosition || ''}
                          onValueChange={(value) => handleFilterChange('memberPosition', value || undefined)}
                        >
                          <SelectTrigger id="member-position">
                            <SelectValue placeholder="All Positions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Positions</SelectItem>
                            {filterOptions?.positions.map((pos) => (
                              <SelectItem key={pos} value={pos}>
                                {pos}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="member-region">Region</Label>
                        <Select
                          value={filters.memberRegion || ''}
                          onValueChange={(value) => handleFilterChange('memberRegion', value || undefined)}
                        >
                          <SelectTrigger id="member-region">
                            <SelectValue placeholder="All Regions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Regions</SelectItem>
                            {filterOptions?.regions.map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Date Range Filters */}
              <AccordionItem value="date-filters">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Range
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="date-from">From Date</Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={filters.dateFrom ? new Date(filters.dateFrom).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value).getTime() : undefined)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-to">To Date</Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={filters.dateTo ? new Date(filters.dateTo).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value).getTime() : undefined)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Search Results ({searchResults.totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {/* Companies Results */}
                {selectedModules.includes('companies') && searchResults.companies.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Companies ({searchResults.companies.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {searchResults.companies.map((company) => (
                        <Card key={company._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-base">{company.name}</h4>
                                {company.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  {company.region && <Badge variant="outline">{company.region}</Badge>}
                                  {company.branch && <Badge variant="outline">{company.branch}</Badge>}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(company.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members Results */}
                {selectedModules.includes('members') && searchResults.members.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold">Members ({searchResults.members.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {searchResults.members.map((member) => (
                        <Card key={member._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-base">
                                    {member.firstName} {member.lastName}
                                  </h4>
                                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                    {member.status}
                                  </Badge>
                                  <Badge variant={member.gender === 'male' ? 'default' : 'secondary'}>
                                    {member.gender}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{member.email}</p>
                                <div className="flex gap-2 mt-2 text-xs">
                                  <span className="font-mono">{member.staffId}</span>
                                  {member.position && <span>• {member.position}</span>}
                                  {member.department && <span>• {member.department}</span>}
                                  {member.companyName && <span>• {member.companyName}</span>}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents Results */}
                {selectedModules.includes('documents') && searchResults.documents.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Documents ({searchResults.documents.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {searchResults.documents.map((doc) => (
                        <Card key={doc._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-base">{doc.title}</h4>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                                )}
                                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>{doc.memberName}</span>
                                  <span>•</span>
                                  <span>{doc.companyName}</span>
                                  <span>•</span>
                                  <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <Badge variant="outline">
                                {doc.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {searchResults.totalCount === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm || Object.keys(filters).length > 0
                        ? 'No results found for your search criteria'
                        : 'Enter a search term or apply filters to find results'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Save this search configuration for quick access later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name*</Label>
              <Input
                id="search-name"
                placeholder="e.g., Active members in North region"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This search will save:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {searchTerm && <li>Search term: &quot;{searchTerm}&quot;</li>}
                <li>Selected modules: {selectedModules.join(', ')}</li>
                {activeFilterCount > 0 && <li>{activeFilterCount} active filters</li>}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch}>
              <Save className="h-4 w-4 mr-2" />
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
