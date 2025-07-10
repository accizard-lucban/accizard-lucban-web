import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Shield, ShieldOff, ShieldCheck, ShieldX, Eye, User, FileText, Calendar, CheckSquare, Square, UserPlus, EyeOff } from "lucide-react";
import { Layout } from "./Layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

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
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [confirmBatchAction, setConfirmBatchAction] = useState<{
    type: 'delete' | 'permission' | 'verification';
    value?: boolean;
    items: string[];
  } | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    position: "",
    idNumber: "",
    username: "",
    password: ""
  });
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
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

  // Add new state for account status modal
  const [accountStatusModal, setAccountStatusModal] = useState<{ open: boolean, resident: any | null }>({ open: false, resident: null });
  const [positions, setPositions] = useState<string[]>(["Responder", "Rider"]);
  const [newPosition, setNewPosition] = useState("");
  const [confirmDeletePosition, setConfirmDeletePosition] = useState<string | null>(null);
  const [confirmAddAdmin, setConfirmAddAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showAdminPasswords, setShowAdminPasswords] = useState<{ [id: string]: boolean }>({});
  const [showAllAdminPasswords, setShowAllAdminPasswords] = useState(false);

  // Add state for residentReportsCount
  const [residentReportsCount, setResidentReportsCount] = useState(0);

  useEffect(() => {
    async function fetchAdmins() {
      try {
        const querySnapshot = await getDocs(collection(db, "admins"));
        const admins = querySnapshot.docs.map(doc => {
          let userId = doc.data().userId;
          if (typeof userId === 'number') {
            userId = `AID-${userId}`;
          } else if (typeof userId === 'string' && !userId.startsWith('AID-')) {
            // Try to parse as number and reformat
            const num = parseInt(userId);
            if (!isNaN(num)) userId = `AID-${num}`;
          }
          return {
            id: doc.id,
            ...doc.data(),
            userId: userId || `AID-${doc.id.slice(-6)}`
          };
        });
        setAdminUsers(admins);
      } catch (error) {
        console.error("Error fetching admins:", error);
      }
    }
    
    async function fetchResidents() {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = querySnapshot.docs.map(doc => {
          let userId = doc.data().userId;
          if (typeof userId === 'number') {
            userId = `RID-${userId}`;
          } else if (typeof userId === 'string' && !userId.startsWith('RID-')) {
            // Try to parse as number and reformat
            const num = parseInt(userId);
            if (!isNaN(num)) userId = `RID-${num}`;
          }
          return {
            id: doc.id,
            ...doc.data(),
            verified: doc.data().verified || false,
            createdDate: doc.data().createdDate || new Date().toLocaleDateString(),
            userId: userId || `RID-${doc.id.slice(-6)}`,
            fullName: doc.data().fullName || doc.data().name || "Unknown",
            mobileNumber: doc.data().mobileNumber || doc.data().phone || "N/A",
            barangay: doc.data().barangay || "Unknown",
            cityTown: doc.data().cityTown || doc.data().city || "Unknown"
          };
        });
        setResidents(users);
      } catch (error) {
        console.error("Error fetching residents:", error);
        // If users collection doesn't exist, set empty array
        setResidents([]);
      }
    }

    fetchAdmins();
    fetchResidents();
  }, []);

  // Filter functions
  const filteredAdmins = adminUsers.filter(admin => {
    const matchesSearch = admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) || admin.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === "all" || admin.position === positionFilter;
    const matchesPermission = permissionFilter === "all" || permissionFilter === "has_permission" && admin.hasEditPermission || permissionFilter === "no_permission" && !admin.hasEditPermission;
    return matchesSearch && matchesPosition && matchesPermission;
  });
  
  // Enhanced search: match any field
  const filteredResidents = residents.filter(resident => {
    const search = searchTerm.toLowerCase();
    const matchesAnyField = [
      resident.fullName,
      resident.userId,
      resident.mobileNumber,
      resident.email,
      resident.barangay,
      resident.cityTown,
      resident.homeAddress,
      resident.gender,
      resident.verified ? 'verified' : 'pending',
      resident.suspended ? 'suspended' : ''
    ].some(field => (field || '').toString().toLowerCase().includes(search));
    const matchesBarangay = barangayFilter === "all" || resident.barangay === barangayFilter;
    const matchesVerification = verificationFilter === "all" || 
      (verificationFilter === "verified" && resident.verified) || 
      (verificationFilter === "pending" && !resident.verified);
    return matchesAnyField && matchesBarangay && matchesVerification;
  });

  const handleAddAdmin = async () => {
    try {
      // Find the highest userId in the current adminUsers
      const maxUserId = adminUsers.length > 0
        ? Math.max(...adminUsers.map(a => {
            const raw = a.userId;
            if (typeof raw === 'string' && raw.startsWith('AID-')) {
              const num = parseInt(raw.replace('AID-', ''));
              return isNaN(num) ? 0 : num;
            }
            return Number(raw) || 0;
          }))
        : 0;
      const nextUserId = maxUserId + 1;
      const formattedUserId = `AID-${nextUserId}`;
      const docRef = await addDoc(collection(db, "admins"), {
        userId: formattedUserId,
        name: newAdmin.name,
        position: newAdmin.position,
        idNumber: newAdmin.idNumber,
        username: newAdmin.username,
        password: newAdmin.password,
        hasEditPermission: false,
        role: "admin"
      });
      setAdminUsers(prev => [
        ...prev,
        {
          id: docRef.id,
          userId: formattedUserId,
          name: newAdmin.name,
          position: newAdmin.position,
          idNumber: newAdmin.idNumber,
          username: newAdmin.username,
          password: newAdmin.password,
          hasEditPermission: false,
          role: "admin"
        }
      ]);
      setIsAddAdminOpen(false);
      setNewAdmin({
        name: "",
        position: "",
        idNumber: "",
        username: "",
        password: ""
      });
    } catch (error) {
      console.error("Error adding admin:", error);
    }
  };

  const handleEditAdmin = (admin: any) => {
    setEditingAdmin({
      ...admin
    });
  };

  const handleSaveAdminEdit = async () => {
    try {
      await updateDoc(doc(db, "admins", editingAdmin.id), {
        name: editingAdmin.name,
        position: editingAdmin.position,
        idNumber: editingAdmin.idNumber,
        username: editingAdmin.username
      });
      setAdminUsers(adminUsers.map(a => a.id === editingAdmin.id ? editingAdmin : a));
      setEditingAdmin(null);
    } catch (error) {
      console.error("Error updating admin:", error);
    }
  };

  const handleTogglePermission = (admin: any) => {
    setConfirmPermissionChange(admin);
  };

  const confirmTogglePermission = async () => {
    try {
      await updateDoc(doc(db, "admins", confirmPermissionChange.id), {
        hasEditPermission: !confirmPermissionChange.hasEditPermission
      });
      setAdminUsers(adminUsers.map(admin => admin.id === confirmPermissionChange.id ? {
        ...admin,
        hasEditPermission: !admin.hasEditPermission
      } : admin));
      setConfirmPermissionChange(null);
    } catch (error) {
      console.error("Error updating permission:", error);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await deleteDoc(doc(db, "admins", adminId));
      setAdminUsers(adminUsers.filter(a => a.id !== adminId));
    } catch (error) {
      console.error("Error deleting admin:", error);
    }
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

  const handleSaveResidentEdit = async () => {
    try {
      await updateDoc(doc(db, "users", selectedResident.id), {
        fullName: selectedResident.fullName,
        mobileNumber: selectedResident.mobileNumber,
        barangay: selectedResident.barangay,
        cityTown: selectedResident.cityTown,
        homeAddress: selectedResident.homeAddress,
        email: selectedResident.email,
        validId: selectedResident.validId,
        validIdImage: selectedResident.validIdImage,
        additionalInfo: selectedResident.additionalInfo
      });
      setResidents(residents.map(r => r.id === selectedResident.id ? selectedResident : r));
      setIsEditResidentOpen(false);
      setSelectedResident(null);
    } catch (error) {
      console.error("Error updating resident:", error);
    }
  };

  const handleDeleteResident = async (residentId: string) => {
    try {
      await deleteDoc(doc(db, "users", residentId));
      setResidents(residents.filter(r => r.id !== residentId));
    } catch (error) {
      console.error("Error deleting resident:", error);
    }
  };

  const handleToggleVerification = async (residentId: string) => {
    try {
      const resident = residents.find(r => r.id === residentId);
      if (resident) {
        await updateDoc(doc(db, "users", residentId), {
          verified: !resident.verified
        });
        setResidents(residents.map(resident => resident.id === residentId ? {
          ...resident,
          verified: !resident.verified
        } : resident));
      }
    } catch (error) {
      console.error("Error updating verification:", error);
    }
  };

  const handleSelectAdmin = (adminId: string) => {
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

  const handleSelectResident = (residentId: string) => {
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

  const executeBatchAction = async () => {
    if (!confirmBatchAction) return;

    const { type, value, items } = confirmBatchAction;

    try {
      switch (type) {
        case 'delete':
          if (items === selectedAdmins) {
            // Delete admins
            for (const adminId of items) {
              await deleteDoc(doc(db, "admins", adminId));
            }
            setAdminUsers(prev => prev.filter(admin => !items.includes(admin.id)));
            setSelectedAdmins([]);
          } else {
            // Delete residents
            for (const residentId of items) {
              await deleteDoc(doc(db, "users", residentId));
            }
            setResidents(prev => prev.filter(resident => !items.includes(resident.id)));
            setSelectedResidents([]);
          }
          break;

        case 'permission':
          // Update admin permissions
          for (const adminId of items) {
            await updateDoc(doc(db, "admins", adminId), {
              hasEditPermission: value
            });
          }
          setAdminUsers(prev => prev.map(admin => 
            items.includes(admin.id) 
              ? { ...admin, hasEditPermission: value }
              : admin
          ));
          setSelectedAdmins([]);
          break;

        case 'verification':
          // Update resident verification
          for (const residentId of items) {
            await updateDoc(doc(db, "users", residentId), {
              verified: value
            });
          }
          setResidents(prev => prev.map(resident => 
            items.includes(resident.id) 
              ? { ...resident, verified: value }
              : resident
          ));
          setSelectedResidents([]);
          break;
      }
    } catch (error) {
      console.error("Error executing batch action:", error);
    }

    setConfirmBatchAction(null);
  };

  // Add resident with auto-incremented userId
  const handleAddResident = async (newResident: any) => {
    try {
      // Fetch all userIds and find the max number
      const querySnapshot = await getDocs(collection(db, "users"));
      // Extract the number from userId if it matches 'RID-[Number]'
      const userIds = querySnapshot.docs.map(doc => {
        const raw = doc.data().userId;
        if (typeof raw === 'string' && raw.startsWith('RID-')) {
          const num = parseInt(raw.replace('RID-', ''));
          return isNaN(num) ? 0 : num;
        }
        // fallback for legacy userIds
        return Number(raw) || 0;
      });
      const maxUserId = userIds.length > 0 ? Math.max(...userIds) : 0;
      const nextUserId = maxUserId + 1;
      const formattedUserId = `RID-${nextUserId}`;
      const docRef = await addDoc(collection(db, "users"), {
        ...newResident,
        userId: formattedUserId,
        verified: false,
        suspended: false,
        createdDate: new Date().toLocaleDateString()
      });
      setResidents(prev => [
        ...prev,
        {
          id: docRef.id,
          ...newResident,
          userId: formattedUserId,
          verified: false,
          suspended: false,
          createdDate: new Date().toLocaleDateString()
        }
      ]);
    } catch (error) {
      console.error("Error adding resident:", error);
    }
  };

  // Account status modal actions
  const handleAccountStatus = (resident: any) => {
    setAccountStatusModal({ open: true, resident });
  };
  const closeAccountStatusModal = () => {
    setAccountStatusModal({ open: false, resident: null });
  };
  const updateAccountStatus = async (status: 'verify' | 'unverify' | 'suspend') => {
    if (!accountStatusModal.resident) return;
    const residentId = accountStatusModal.resident.id;
    let updates: any = {};
    if (status === 'verify') updates.verified = true, updates.suspended = false;
    if (status === 'unverify') updates.verified = false, updates.suspended = false;
    if (status === 'suspend') updates.suspended = true, updates.verified = false;
    try {
      await updateDoc(doc(db, "users", residentId), updates);
      setResidents(residents.map(r => r.id === residentId ? { ...r, ...updates } : r));
      closeAccountStatusModal();
    } catch (error) {
      console.error("Error updating account status:", error);
    }
  };

  // Add position
  const handleAddPosition = () => {
    const trimmed = newPosition.trim();
    if (trimmed && !positions.includes(trimmed)) {
      setPositions([...positions, trimmed]);
      setNewPosition("");
    }
  };
  // Delete position with confirmation
  const handleDeletePosition = (pos: string) => {
    setConfirmDeletePosition(pos);
  };
  const confirmDeletePositionAction = () => {
    if (confirmDeletePosition) {
      setPositions(positions.filter(p => p !== confirmDeletePosition));
      if (newAdmin.position === confirmDeletePosition) setNewAdmin({ ...newAdmin, position: "" });
      if (positionFilter === confirmDeletePosition) setPositionFilter("all");
      setConfirmDeletePosition(null);
    }
  };

  // Add New Admin confirmation
  const handleAddAdminClick = () => setConfirmAddAdmin(true);
  const confirmAddAdminAction = () => {
    setConfirmAddAdmin(false);
    handleAddAdmin();
  };

  // Password validation
  const validatePassword = (password: string) => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    // Add more rules as needed
    return "";
  };

  const toggleShowAdminPassword = (adminId: string) => {
    setShowAdminPasswords(prev => ({ ...prev, [adminId]: !prev[adminId] }));
  };

  // Fetch report count when previewing a resident
  useEffect(() => {
    async function fetchReportCount() {
      if (showResidentPreview && selectedResident) {
        // Try to fetch from Firestore if available
        try {
          const querySnapshot = await getDocs(collection(db, "reports"));
          // Prefer userId if available, else fallback to fullName
          const count = querySnapshot.docs.filter(doc => {
            const data = doc.data();
            return (data.userId && selectedResident.userId && data.userId === selectedResident.userId) ||
                   (data.reportedBy && selectedResident.fullName && data.reportedBy === selectedResident.fullName);
          }).length;
          setResidentReportsCount(count);
        } catch (e) {
          setResidentReportsCount(0);
        }
      }
    }
    fetchReportCount();
  }, [showResidentPreview, selectedResident]);

  return <Layout>
      <div className="">

        <Tabs defaultValue="admins" className="w-full">
          <TabsList>
            <TabsTrigger value="admins">Admin Accounts</TabsTrigger>
            <TabsTrigger value="residents">Resident Accounts</TabsTrigger>
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
                        {positions.map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
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
                      <Label>Full Name</Label>
                      <Input value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} />
                    </div>
                    <div>
                      <Label>Position</Label>
                      <Select value={newAdmin.position} onValueChange={value => setNewAdmin({ ...newAdmin, position: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map(pos => (
                            <div key={pos} className="flex items-center justify-between pr-2">
                              <SelectItem value={pos}>{pos}</SelectItem>
                              <Button type="button" size="icon" variant="ghost" onClick={() => handleDeletePosition(pos)} className="ml-2 text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex gap-2 p-2 border-t border-gray-100 mt-2">
                            <Input
                              value={newPosition}
                              onChange={e => setNewPosition(e.target.value)}
                              placeholder="Add new position"
                              className="flex-1"
                            />
                            <Button type="button" onClick={handleAddPosition} disabled={!newPosition.trim()} className="bg-[#FF4F0B] hover:bg-[#FF4F0B]/90 text-white">
                              Add
                            </Button>
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>ID Number</Label>
                      <Input value={newAdmin.idNumber} onChange={e => setNewAdmin({...newAdmin, idNumber: e.target.value})} />
                    </div>
                    <div>
                      <Label>Account Username</Label>
                      <Input value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <div className="relative flex items-center">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={newAdmin.password}
                          onChange={e => {
                            setNewAdmin({ ...newAdmin, password: e.target.value });
                            setPasswordError(validatePassword(e.target.value));
                          }}
                          className={passwordError ? "pr-10 border-red-500" : "pr-10"}
                          placeholder="Enter password"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(v => !v)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {passwordError && <div className="text-xs text-red-600 mt-1">{passwordError}</div>}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddAdminClick} className="bg-[#FF4F0B] hover:bg-[#FF4F0B]/90 text-white">
                      Add New Admin
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
                            checked={selectedAdmins.length === adminUsers.length && adminUsers.length > 0}
                            onCheckedChange={handleSelectAllAdmins}
                          />
                        </TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>ID Number</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Password
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setShowAllAdminPasswords(v => !v)}
                              className="ml-1"
                              title={showAllAdminPasswords ? 'Hide All Passwords' : 'Show All Passwords'}
                            >
                              {showAllAdminPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdmins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                            No results found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAdmins.map(admin => (
                          <TableRow key={admin.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedAdmins.includes(admin.id)}
                                onCheckedChange={() => handleSelectAdmin(admin.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{admin.userId}</TableCell>
                            <TableCell className="font-medium">{admin.name}</TableCell>
                            <TableCell>{admin.position}</TableCell>
                            <TableCell>{admin.idNumber}</TableCell>
                            <TableCell>{admin.username}</TableCell>
                            <TableCell>
                              {showAllAdminPasswords ? (
                                <span>{admin.password}</span>
                              ) : (
                                <span>{'•'.repeat(Math.max(8, (admin.password || '').length))}</span>
                              )}
                            </TableCell>
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
                                              <SelectItem value="Responder">Responder</SelectItem>
                                              <SelectItem value="Rider">Rider</SelectItem>
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
                        ))
                      )}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Suspended Accounts</p>
                      <p className="text-2xl font-bold text-gray-900">{residents.filter(r => r.suspended).length}</p>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <ShieldOff className="h-4 w-4 text-gray-600" />
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
                        {Array.from(new Set(residents.map(r => r.barangay).filter(Boolean))).map(barangay => (
                          <SelectItem key={barangay} value={barangay}>{barangay}</SelectItem>
                        ))}
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
                            checked={selectedResidents.length === residents.length && residents.length > 0}
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
                      {filteredResidents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                            No residents found. {residents.length === 0 ? "No residents have been registered yet." : "No residents match your search criteria."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredResidents.map(resident => (
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
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditResident(resident)}
                                      title="Edit Resident"
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
                                        <div>
                                          <Label>Valid ID Type</Label>
                                          <Input value={selectedResident.validId || ''} onChange={e => setSelectedResident({ ...selectedResident, validId: e.target.value })} />
                                        </div>
                                        <div>
                                          <Label>Valid ID Image URL</Label>
                                          <Input value={selectedResident.validIdImage || ''} onChange={e => setSelectedResident({ ...selectedResident, validIdImage: e.target.value })} />
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
                                    <Button size="sm" variant="outline" className="text-red-600" title="Delete Resident">
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
                                  className={resident.suspended ? "text-gray-400" : resident.verified ? "text-green-600" : "text-yellow-600"}
                                  onClick={() => handleAccountStatus(resident)}
                                  title="Account Status"
                                >
                                  {resident.suspended ? <ShieldOff className="h-4 w-4" /> : resident.verified ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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

        {/* Permission Change Confirmation Dialog */}
        <AlertDialog
          open={!!confirmPermissionChange}
          onOpenChange={() => setConfirmPermissionChange(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmPermissionChange?.hasEditPermission ? 'Revoke Permission' : 'Grant Permission'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {confirmPermissionChange?.hasEditPermission ? 'revoke' : 'grant'} edit permission for {confirmPermissionChange?.name}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmTogglePermission}
                className={confirmPermissionChange?.hasEditPermission ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
              <DialogTitle>Resident Details</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Profile Picture</TableCell>
                    <TableCell>
                      {selectedResident?.profilePicture ? (
                        <img src={selectedResident.profilePicture} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">User ID</TableCell>
                    <TableCell>{selectedResident?.userId || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Full Name</TableCell>
                    <TableCell>{selectedResident?.fullName || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Mobile Number</TableCell>
                    <TableCell>{selectedResident?.mobileNumber || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Email</TableCell>
                    <TableCell>{selectedResident?.email || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Barangay</TableCell>
                    <TableCell>{selectedResident?.barangay || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">City/Town</TableCell>
                    <TableCell>{selectedResident?.cityTown || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Home Address</TableCell>
                    <TableCell>{selectedResident?.homeAddress || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Valid ID Type</TableCell>
                    <TableCell>{selectedResident?.validId || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Valid ID Image</TableCell>
                    <TableCell>
                      {selectedResident?.validIdImage ? (
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-blue-600 hover:text-blue-800" 
                          onClick={() => setPreviewImage(selectedResident.validIdImage)}
                        >
                          View ID Image
                        </Button>
                      ) : (
                        <span className="text-gray-500">No image uploaded</span>
                      )}
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
                    <TableCell>{selectedResident?.createdDate || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Additional Info</TableCell>
                    <TableCell>
                      {selectedResident?.additionalInfo ? (
                        <div className="text-sm text-gray-600">
                          {selectedResident.additionalInfo}
                        </div>
                      ) : (
                        <span className="text-gray-500">No additional information</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {/* 4. Add total number of submitted reports by the resident in the details preview */}
                  <TableRow>
                    <TableCell className="font-medium text-gray-700 align-top">Total Reports Submitted</TableCell>
                    <TableCell>{residentReportsCount}</TableCell>
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

        {/* Account Status Modal */}
        <Dialog open={accountStatusModal.open} onOpenChange={closeAccountStatusModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Account Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Choose an action for <b>{accountStatusModal.resident?.fullName}</b>:</p>
              <div className="flex gap-2">
                <Button onClick={() => updateAccountStatus('verify')} className="bg-green-600 hover:bg-green-700 text-white">Verify</Button>
                <Button onClick={() => updateAccountStatus('unverify')} className="bg-yellow-600 hover:bg-yellow-700 text-white">Unverify</Button>
                <Button onClick={() => updateAccountStatus('suspend')} className="bg-gray-600 hover:bg-gray-700 text-white">Suspend</Button>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Position Modal */}
        <AlertDialog open={!!confirmDeletePosition} onOpenChange={() => setConfirmDeletePosition(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Position</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the position <b>{confirmDeletePosition}</b>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePositionAction} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm Add Admin Modal */}
        <AlertDialog open={confirmAddAdmin} onOpenChange={setConfirmAddAdmin}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Add Admin</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to add this new admin account?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAddAdminAction} className="bg-[#FF4F0B] hover:bg-[#FF4F0B]/90">
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>;
}