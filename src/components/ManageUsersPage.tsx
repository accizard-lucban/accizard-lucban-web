import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Shield, ShieldOff, ShieldCheck, ShieldX, Eye, User, FileText, Calendar, CheckSquare, Square } from "lucide-react";
import { Layout } from "./Layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export function ManageUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [permissionFilter, setPermissionFilter] = useState("all");
  const [barangayFilter, setBarangayFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [isEditResidentOpen, setIsEditResidentOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [showResidentPreview, setShowResidentPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [confirmPermissionChange, setConfirmPermissionChange] = useState<any>(null);
  const [selectedAdmins, setSelectedAdmins] = useState<number[]>([]);
  const [selectedResidents, setSelectedResidents] = useState<number[]>([]);
  const [confirmBatchAction, setConfirmBatchAction] = useState<{
    type: 'delete' | 'permission' | 'verification';
    value?: boolean;
    items: number[];
  } | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    position: "",
    idNumber: "",
    username: "",
    password: ""
  });
  const [adminUsers, setAdminUsers] = useState([{
    id: 1,
    name: "John Admin",
    position: "System Admin",
    idNumber: "ADM001",
    username: "admin",
    password: "admin123",
    hasEditPermission: true
  }, {
    id: 2,
    name: "Jane Manager",
    position: "Manager",
    idNumber: "ADM002",
    username: "manager",
    password: "manager456",
    hasEditPermission: false
  }]);
  const [residents, setResidents] = useState([{
    id: 1,
    userId: "USR001",
    fullName: "Maria Santos",
    mobileNumber: "+63 912 345 6789",
    homeAddress: "123 Main St, Barangay 1",
    barangay: "Barangay 1",
    cityTown: "Makati City",
    email: "maria@email.com",
    gender: "Female",
    validId: "Driver's License",
    validIdImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400",
    profilePicture: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400",
    verified: true,
    createdDate: "01/10/24"
  }, {
    id: 2,
    userId: "USR002",
    fullName: "Juan Dela Cruz",
    mobileNumber: "+63 917 876 5432",
    homeAddress: "456 Oak Ave, Barangay 2",
    barangay: "Barangay 2",
    cityTown: "Quezon City",
    email: "juan@email.com",
    gender: "Male",
    validId: "Passport",
    validIdImage: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400",
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    verified: false,
    createdDate: "01/12/24"
  }]);
  const [activityLogs] = useState([{
    id: 1,
    admin: "John Admin",
    action: "Added new pin",
    timestamp: "01/15/24 - 10:30",
    details: "Emergency pin at Main Street"
  }, {
    id: 2,
    admin: "Jane Manager",
    action: "Edited resident info",
    timestamp: "01/15/24 - 09:15",
    details: "Updated Maria Santos profile"
  }, {
    id: 3,
    admin: "John Admin",
    action: "Added announcement",
    timestamp: "01/14/24 - 14:20",
    details: "Emergency drill schedule"
  }, {
    id: 4,
    admin: "Jane Manager",
    action: "Logged in",
    timestamp: "01/14/24 - 08:00",
    details: "System access granted"
  }, {
    id: 5,
    admin: "John Admin",
    action: "Edited report",
    timestamp: "01/13/24 - 16:45",
    details: "Updated REP-001 status"
  }]);

  // Filter functions
  const filteredAdmins = adminUsers.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) || admin.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === "all" || admin.position === positionFilter;
    const matchesPermission = permissionFilter === "all" || permissionFilter === "has_permission" && admin.hasEditPermission || permissionFilter === "no_permission" && !admin.hasEditPermission;
    return matchesSearch && matchesPosition && matchesPermission;
  });
  const filteredResidents = residents.filter(resident => {
    const matchesSearch = resident.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || resident.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarangay = barangayFilter === "all" || resident.barangay === barangayFilter;
    const matchesGender = userFilter === "all" || resident.gender === userFilter;
    return matchesSearch && matchesBarangay && matchesGender;
  });
  const handleAddAdmin = () => {
    const id = Math.max(...adminUsers.map(a => a.id)) + 1;
    const newAdminWithId = {
      ...newAdmin,
      id,
      hasEditPermission: false
    };
    setAdminUsers([...adminUsers, newAdminWithId]);
    setIsAddAdminOpen(false);
    setNewAdmin({
      name: "",
      position: "",
      idNumber: "",
      username: "",
      password: ""
    });
  };
  const handleEditAdmin = (admin: any) => {
    setEditingAdmin({
      ...admin
    });
  };
  const handleSaveAdminEdit = () => {
    setAdminUsers(adminUsers.map(a => a.id === editingAdmin.id ? editingAdmin : a));
    setEditingAdmin(null);
  };
  const handleTogglePermission = (admin: any) => {
    setConfirmPermissionChange(admin);
  };
  const confirmTogglePermission = () => {
    setAdminUsers(adminUsers.map(admin => admin.id === confirmPermissionChange.id ? {
      ...admin,
      hasEditPermission: !admin.hasEditPermission
    } : admin));
    setConfirmPermissionChange(null);
  };
  const handleDeleteAdmin = (adminId: number) => {
    setAdminUsers(adminUsers.filter(a => a.id !== adminId));
  };
  const handleEditResident = (resident: any) => {
    setSelectedResident({
      ...resident
    });
    setIsEditResidentOpen(true);
  };
  const handlePreviewResident = (resident: any) => {
    setSelectedResident(resident);
    setShowResidentPreview(true);
  };
  const handleSaveResidentEdit = () => {
    setResidents(residents.map(r => r.id === selectedResident.id ? selectedResident : r));
    setIsEditResidentOpen(false);
    setSelectedResident(null);
  };
  const handleDeleteResident = (residentId: number) => {
    setResidents(residents.filter(r => r.id !== residentId));
  };
  const handleToggleVerification = (residentId: number) => {
    setResidents(residents.map(resident => resident.id === residentId ? {
      ...resident,
      verified: !resident.verified
    } : resident));
  };
  const handleSelectAdmin = (adminId: number) => {
    setSelectedAdmins(prev => 
      prev.includes(adminId) 
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };
  const handleSelectAllAdmins = () => {
    setSelectedAdmins(prev => 
      prev.length === adminUsers.length 
        ? [] 
        : adminUsers.map(admin => admin.id)
    );
  };
  const handleSelectResident = (residentId: number) => {
    setSelectedResidents(prev => 
      prev.includes(residentId) 
        ? prev.filter(id => id !== residentId)
        : [...prev, residentId]
    );
  };
  const handleSelectAllResidents = () => {
    setSelectedResidents(prev => 
      prev.length === residents.length 
        ? [] 
        : residents.map(resident => resident.id)
    );
  };
  const handleBatchDelete = (type: 'admin' | 'resident') => {
    const items = type === 'admin' ? selectedAdmins : selectedResidents;
    setConfirmBatchAction({
      type: 'delete',
      items
    });
  };
  const handleBatchPermission = (value: boolean) => {
    setConfirmBatchAction({
      type: 'permission',
      value,
      items: selectedAdmins
    });
  };
  const handleBatchVerification = (value: boolean) => {
    setConfirmBatchAction({
      type: 'verification',
      value,
      items: selectedResidents
    });
  };
  const executeBatchAction = () => {
    if (!confirmBatchAction) return;

    const { type, value, items } = confirmBatchAction;

    switch (type) {
      case 'delete':
        if (items === selectedAdmins) {
          setAdminUsers(prev => prev.filter(admin => !items.includes(admin.id)));
          setSelectedAdmins([]);
        } else {
          setResidents(prev => prev.filter(resident => !items.includes(resident.id)));
          setSelectedResidents([]);
        }
        break;

      case 'permission':
        setAdminUsers(prev => prev.map(admin => 
          items.includes(admin.id) 
            ? { ...admin, hasEditPermission: value }
            : admin
        ));
        setSelectedAdmins([]);
        break;

      case 'verification':
        setResidents(prev => prev.map(resident => 
          items.includes(resident.id) 
            ? { ...resident, verified: value }
            : resident
        ));
        setSelectedResidents([]);
        break;
    }

    setConfirmBatchAction(null);
  };
  return <Layout>
      <div className="">

        <Tabs defaultValue="admins" className="w-full">
          <TabsList>
            <TabsTrigger value="admins">Admin Accounts</TabsTrigger>
            <TabsTrigger value="residents">Residents</TabsTrigger>
            <TabsTrigger value="activity">System Activity Logs</TabsTrigger>
          </TabsList>

          
          
          <TabsContent value="admins">

            {/* Admin Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Search and Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full">
                    <Input placeholder="Search admin accounts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={positionFilter} onValueChange={setPositionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Positions</SelectItem>
                        <SelectItem value="System Admin">System Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Operator">Operator</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={permissionFilter} onValueChange={setPermissionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by permissions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Permissions</SelectItem>
                        <SelectItem value="has_permission">Has Edit Permission</SelectItem>
                        <SelectItem value="no_permission">No Edit Permission</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add New Admin Button */}
            <div className="mb-6">
              <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                <DialogTrigger asChild>
                  <Button className="w bg-[#FF4F0B] hover:bg-[#FF4F0B]/90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Admin Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} />
                    </div>
                    <div>
                      <Label>Position</Label>
                      <Select value={newAdmin.position} onValueChange={value => setNewAdmin({...newAdmin, position: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="System Admin">System Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Operator">Operator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>ID Number</Label>
                      <Input value={newAdmin.idNumber} onChange={e => setNewAdmin({...newAdmin, idNumber: e.target.value})} />
                    </div>
                    <div>
                      <Label>Username</Label>
                      <Input value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddAdmin} className="bg-[#FF4F0B] hover:bg-[#FF4F0B]/90 text-white">
                      Add Admin
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Batch Actions for Admins */}
            {selectedAdmins.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchDelete('admin')}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Delete Selected ({selectedAdmins.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchPermission(true)}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  Grant Permission
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchPermission(false)}
                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                >
                  Revoke Permission
                </Button>
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedAdmins.length === adminUsers.length}
                            onCheckedChange={handleSelectAllAdmins}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>ID Number</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Password</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdmins.map(admin => (
                        <TableRow key={admin.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedAdmins.includes(admin.id)}
                              onCheckedChange={() => handleSelectAdmin(admin.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{admin.name}</TableCell>
                          <TableCell>{admin.position}</TableCell>
                          <TableCell>{admin.idNumber}</TableCell>
                          <TableCell>{admin.username}</TableCell>
                          <TableCell>{admin.password}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => handleEditAdmin(admin)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Admin Account</DialogTitle>
                                  </DialogHeader>
                                  {editingAdmin && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Name</Label>
                                        <Input
                                          value={editingAdmin.name}
                                          onChange={e => setEditingAdmin({
                                            ...editingAdmin,
                                            name: e.target.value
                                          })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Position</Label>
                                        <Select
                                          value={editingAdmin.position}
                                          onValueChange={value => setEditingAdmin({
                                            ...editingAdmin,
                                            position: value
                                          })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="System Admin">System Admin</SelectItem>
                                            <SelectItem value="Manager">Manager</SelectItem>
                                            <SelectItem value="Operator">Operator</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>ID Number</Label>
                                        <Input
                                          value={editingAdmin.idNumber}
                                          onChange={e => setEditingAdmin({
                                            ...editingAdmin,
                                            idNumber: e.target.value
                                          })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Username</Label>
                                        <Input
                                          value={editingAdmin.username}
                                          onChange={e => setEditingAdmin({
                                            ...editingAdmin,
                                            username: e.target.value
                                          })}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <DialogFooter>
                                    <Button onClick={handleSaveAdminEdit}>Save Changes</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTogglePermission(admin)}
                                title={admin.hasEditPermission ? "Revoke Permission" : "Grant Permission"}
                                className={admin.hasEditPermission ? "text-green-600" : "text-yellow-600"}
                              >
                                {admin.hasEditPermission ? (
                                  <Shield className="h-4 w-4" />
                                ) : (
                                  <ShieldOff className="h-4 w-4" />
                                )}
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Admin Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {admin.name}'s admin account? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteAdmin(admin.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing 1 to {filteredAdmins.length} of {filteredAdmins.length} results
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="residents">
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Residents</p>
                      <p className="text-2xl font-bold text-gray-900">{residents.length}</p>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Verified Residents</p>
                      <p className="text-2xl font-bold text-gray-900">{residents.filter(r => r.verified).length}</p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                      <p className="text-2xl font-bold text-gray-900">{residents.filter(r => !r.verified).length}</p>
                    </div>
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <ShieldX className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resident Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Search and Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full">
                    <Input
                      placeholder="Search residents..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={barangayFilter} onValueChange={setBarangayFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Barangays</SelectItem>
                        <SelectItem value="Barangay 1">Barangay 1</SelectItem>
                        <SelectItem value="Barangay 2">Barangay 2</SelectItem>
                        <SelectItem value="Barangay 3">Barangay 3</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="pending">Pending Verification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Batch Actions for Residents */}
            {selectedResidents.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchDelete('resident')}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Delete Selected ({selectedResidents.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchVerification(true)}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  Verify Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchVerification(false)}
                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                >
                  Revoke Verification
                </Button>
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedResidents.length === residents.length}
                            onCheckedChange={handleSelectAllResidents}
                          />
                        </TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Mobile Number</TableHead>
                        <TableHead>Barangay</TableHead>
                        <TableHead>City/Town</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResidents.map(resident => (
                        <TableRow key={resident.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedResidents.includes(resident.id)}
                              onCheckedChange={() => handleSelectResident(resident.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{resident.userId}</TableCell>
                          <TableCell>{resident.fullName}</TableCell>
                          <TableCell>{resident.mobileNumber}</TableCell>
                          <TableCell>{resident.barangay}</TableCell>
                          <TableCell>{resident.cityTown}</TableCell>
                          <TableCell>{resident.createdDate}</TableCell>
                          <TableCell>
                            <Badge
                              className={resident.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                            >
                              {resident.verified ? 'Verified' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePreviewResident(resident)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditResident(resident)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Resident Information</DialogTitle>
                                  </DialogHeader>
                                  {selectedResident && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label>User ID</Label>
                                        <Input value={selectedResident.userId} onChange={e => setSelectedResident({
                                    ...selectedResident,
                                    userId: e.target.value
                                  })} />
                                      </div>
                                      <div>
                                        <Label>Full Name</Label>
                                        <Input value={selectedResident.fullName} onChange={e => setSelectedResident({
                                    ...selectedResident,
                                    fullName: e.target.value
                                  })} />
                                      </div>
                                      <div>
                                        <Label>Mobile Number</Label>
                                        <Input value={selectedResident.mobileNumber} onChange={e => setSelectedResident({
                                    ...selectedResident,
                                    mobileNumber: e.target.value
                                  })} />
                                      </div>
                                      <div>
                                        <Label>Barangay</Label>
                                        <Select value={selectedResident.barangay} onValueChange={value => setSelectedResident({
                                    ...selectedResident,
                                    barangay: value
                                  })}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Barangay 1">Barangay 1</SelectItem>
                                            <SelectItem value="Barangay 2">Barangay 2</SelectItem>
                                            <SelectItem value="Barangay 3">Barangay 3</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>City/Town</Label>
                                        <Input value={selectedResident.cityTown} onChange={e => setSelectedResident({
                                    ...selectedResident,
                                    cityTown: e.target.value
                                  })} />
                                      </div>
                                      <div>
                                        <Label>Home Address</Label>
                                        <Input value={selectedResident.homeAddress} onChange={e => setSelectedResident({
                                    ...selectedResident,
                                    homeAddress: e.target.value
                                  })} />
                                      </div>
                                      <div>
                                        <Label>Email Address</Label>
                                        <Input value={selectedResident.email} onChange={e => setSelectedResident({
                                    ...selectedResident,
                                    email: e.target.value
                                  })} />
                                      </div>
                                    </div>
                                  )}
                                  <DialogFooter>
                                    <Button onClick={handleSaveResidentEdit}>Save Changes</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Resident Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {resident.fullName}'s account? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteResident(resident.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <Button
                                size="sm"
                                variant="outline"
                                className={resident.verified ? "text-red-600" : "text-green-600"}
                                onClick={() => handleToggleVerification(resident.id)}
                              >
                                {resident.verified ? (
                                  <ShieldX className="h-4 w-4" />
                                ) : (
                                  <ShieldCheck className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing 1 to {filteredResidents.length} of {filteredResidents.length} results
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Search and Filter</CardTitle>
              </CardHeader>
              <CardContent>
              <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {adminUsers.map(admin => (
                        <SelectItem key={admin.id} value={admin.name}>
                          {admin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by action type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                    </SelectContent>
                  </Select>

                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">ADM-{log.id}</TableCell>
                        <TableCell>{log.admin}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell>{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing 1 to {activityLogs.length} of {activityLogs.length} results
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Batch Action Confirmation Dialog */}
        <AlertDialog
          open={!!confirmBatchAction}
          onOpenChange={() => setConfirmBatchAction(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmBatchAction?.type === 'delete'
                  ? 'Delete Selected Items'
                  : confirmBatchAction?.type === 'permission'
                  ? `${confirmBatchAction.value ? 'Grant' : 'Revoke'} Permissions`
                  : `${confirmBatchAction?.value ? 'Verify' : 'Revoke Verification for'} Selected Accounts`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {confirmBatchAction?.type === 'delete'
                  ? 'delete'
                  : confirmBatchAction?.type === 'permission'
                  ? `${confirmBatchAction.value ? 'grant permissions to' : 'revoke permissions from'}`
                  : `${confirmBatchAction?.value ? 'verify' : 'revoke verification for'}`
                } the selected {confirmBatchAction?.items.length} {
                  confirmBatchAction?.items === selectedAdmins ? 'admin' : 'resident'
                } accounts?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={executeBatchAction}
                className={
                  confirmBatchAction?.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmBatchAction?.value
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Resident Preview Modal */}
        <Dialog open={showResidentPreview} onOpenChange={setShowResidentPreview}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Resident Preview</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Profile Picture</TableCell>
                    <TableCell>
                      <img src={selectedResident?.profilePicture} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">User ID</TableCell>
                    <TableCell>{selectedResident?.userId}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Full Name</TableCell>
                    <TableCell>{selectedResident?.fullName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Mobile Number</TableCell>
                    <TableCell>{selectedResident?.mobileNumber}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Email</TableCell>
                    <TableCell>{selectedResident?.email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Gender</TableCell>
                    <TableCell>{selectedResident?.gender}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Barangay</TableCell>
                    <TableCell>{selectedResident?.barangay}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">City/Town</TableCell>
                    <TableCell>{selectedResident?.cityTown}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Home Address</TableCell>
                    <TableCell>{selectedResident?.homeAddress}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Valid ID</TableCell>
                    <TableCell>
                      <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800" onClick={() => setPreviewImage(selectedResident?.validIdImage)}>
                        {selectedResident?.validId}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Verification Status</TableCell>
                    <TableCell>
                      <Badge className={selectedResident?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {selectedResident?.verified ? 'Verified' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Created Date</TableCell>
                    <TableCell>{selectedResident?.createdDate}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Preview Modal */}
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Valid ID Preview</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img src={previewImage || ""} alt="Valid ID Preview" className="max-w-full h-auto rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>;
}