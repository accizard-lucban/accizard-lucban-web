import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Search, Activity, Users, Clock } from "lucide-react";
import { Layout } from "./Layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";

// Helper function to format time without seconds
function formatTimeNoSeconds(time: string | number | null | undefined) {
  if (!time) return '-';
  let dateObj;
  if (typeof time === 'number') {
    dateObj = new Date(time);
  } else if (/\d{1,2}:\d{2}:\d{2}/.test(time)) { // e.g. '14:23:45'
    const today = new Date();
    dateObj = new Date(`${today.toDateString()} ${time}`);
  } else {
    dateObj = new Date(time);
  }
  if (isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function SystemLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [activityLogs, setActivityLogs] = useState([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [activitySortDirection, setActivitySortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination state
  const [activityPage, setActivityPage] = useState(1);
  const [activityRowsPerPage, setActivityRowsPerPage] = useState(20);
  const ROWS_OPTIONS = [10, 20, 50, 100];

  // Fetch admin users for filtering
  useEffect(() => {
    async function fetchAdmins() {
      try {
        const querySnapshot = await getDocs(collection(db, "admins"));
        const admins = querySnapshot.docs.map(doc => {
          let userId = doc.data().userId;
          if (typeof userId === 'number') {
            userId = `AID-${userId}`;
          } else if (typeof userId === 'string' && !userId.startsWith('AID-')) {
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
    
    fetchAdmins();
  }, []);

  // Real-time listener for activity logs
  useEffect(() => {
    const q = query(collection(db, "activityLogs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivityLogs(logs);
    });
    return () => unsubscribe();
  }, []);

  // Filter activity logs based on search and filters
  const filteredActivityLogs = activityLogs.filter(log => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      log.action?.toLowerCase().includes(search) ||
      log.admin?.toLowerCase().includes(search) ||
      log.actor?.toLowerCase().includes(search) ||
      log.actionType?.toLowerCase().includes(search);
    const matchesUser = userFilter === "all" || log.admin === userFilter || log.actor === userFilter;
    const matchesActionType = actionTypeFilter === "all" || log.actionType === actionTypeFilter;
    return matchesSearch && matchesUser && matchesActionType;
  });
  
  // Sort activity logs
  const sortedActivityLogs = [...filteredActivityLogs].sort((a, b) => {
    const aTime = typeof a.timestamp === 'number' ? a.timestamp : Date.parse(a.timestamp);
    const bTime = typeof b.timestamp === 'number' ? b.timestamp : Date.parse(b.timestamp);
    if (activitySortDirection === 'asc') {
      return aTime - bTime;
    } else {
      return bTime - aTime;
    }
  });

  // Pagination
  const pagedActivityLogs = sortedActivityLogs.slice((activityPage - 1) * activityRowsPerPage, activityPage * activityRowsPerPage);
  const activityTotalPages = Math.ceil(filteredActivityLogs.length / activityRowsPerPage);

  // Handler for sorting
  const handleActivitySort = () => {
    setActivitySortDirection(activitySortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5 text-brand-orange" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Total Logs</p>
                    <p className="text-xs text-brand-orange font-medium">All time</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{activityLogs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-brand-orange" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Today's Logs</p>
                    <p className="text-xs text-brand-orange font-medium">Last 24 hours</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {activityLogs.filter(log => {
                      const logDate = typeof log.timestamp === 'number' ? new Date(log.timestamp) : new Date(log.timestamp);
                      const today = new Date();
                      return logDate.toDateString() === today.toDateString();
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-brand-orange" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Active Admins</p>
                    <p className="text-xs text-brand-orange font-medium">System users</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{adminUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Activity Logs Table */}
        <Card>
          {/* Table Toolbar */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9"
                />
              </div>

              {/* User Filter */}
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="All Users" />
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

              {/* Action Type Filter */}
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="permission">Permission</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={handleActivitySort}>
                      <div className="flex items-center gap-1">
                        Created Date
                        {activitySortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </TableHead>
                    <TableHead>Action Type</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedActivityLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No activity logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedActivityLogs.map(log => {
                      // Try to find the admin user by name
                      const admin = adminUsers.find(a => a.name === log.admin);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{admin ? admin.userId : "-"}</TableCell>
                          <TableCell>{admin ? admin.position || admin.role || "-" : "-"}</TableCell>
                          <TableCell>{log.admin || (admin ? admin.name : "-")}</TableCell>
                          <TableCell>
                            {log.timestamp ? (
                              <>
                                <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                                <br />
                                <span className="text-xs text-gray-500">{formatTimeNoSeconds(log.timestamp)}</span>
                              </>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                log.actionType === 'create' ? 'bg-green-100 text-green-600' :
                                log.actionType === 'edit' ? 'bg-blue-100 text-blue-600' :
                                log.actionType === 'delete' ? 'bg-red-100 text-red-600' :
                                log.actionType === 'permission' ? 'bg-purple-100 text-purple-600' :
                                log.actionType === 'verification' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-gray-100 text-gray-600'
                              }
                            >
                              {log.actionType || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{log.action}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Showing {filteredActivityLogs.length > 0 ? ((activityPage - 1) * activityRowsPerPage + 1) : 0} to {Math.min(activityPage * activityRowsPerPage, filteredActivityLogs.length)} of {filteredActivityLogs.length} results
                </div>
                <label className="text-sm text-gray-700 flex items-center gap-1">
                  Rows per page:
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={activityRowsPerPage}
                    onChange={e => { setActivityRowsPerPage(Number(e.target.value)); setActivityPage(1); }}
                  >
                    {ROWS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActivityPage(p => Math.max(1, p - 1))} disabled={activityPage === 1}>
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, activityTotalPages) }, (_, i) => {
                    let pageNum;
                    if (activityTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (activityPage <= 3) {
                      pageNum = i + 1;
                    } else if (activityPage >= activityTotalPages - 2) {
                      pageNum = activityTotalPages - 4 + i;
                    } else {
                      pageNum = activityPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={activityPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActivityPage(pageNum)}
                        className={activityPage === pageNum ? "bg-brand-orange hover:bg-brand-orange-400 text-white" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {activityTotalPages > 5 && activityPage < activityTotalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivityPage(activityTotalPages)}
                      >
                        {activityTotalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button variant="outline" size="sm" onClick={() => setActivityPage(p => Math.min(activityTotalPages, p + 1))} disabled={activityPage === activityTotalPages || activityTotalPages === 0}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
