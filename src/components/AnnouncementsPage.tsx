import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, Calendar, AlertTriangle, Info, X, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { Layout } from "./Layout";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
  
function formatTimeNoSeconds(time: string | number | null | undefined) {
  if (!time) return '-';
  let dateObj;
  if (typeof time === 'number') {
    dateObj = new Date(time);
  } else if (/\d{1,2}:\d{2}(:\d{2})?/.test(time)) {
    const today = new Date();
    dateObj = new Date(`${today.toDateString()} ${time}`);
  } else {
    dateObj = new Date(time);
  }
  if (isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function AnnouncementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isNewAnnouncementOpen, setIsNewAnnouncementOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    type: "",
    description: "",
    priority: ""
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [announcementRowsPerPage, setAnnouncementRowsPerPage] = useState(10);
  const ANNOUNCEMENT_ROWS_OPTIONS = [10, 20, 50, 100];
  const [announcementTypes, setAnnouncementTypes] = useState<string[]>([]);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [previewAnnouncement, setPreviewAnnouncement] = useState<any>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>("desc");
  const [editDialogOpenId, setEditDialogOpenId] = useState<string | null>(null);

  const today = new Date();
  // For dual calendar date range picker
  const [fromMonth, setFromMonth] = useState((dateRange?.from || today).getMonth());
  const [fromYear, setFromYear] = useState((dateRange?.from || today).getFullYear());
  const [toMonth, setToMonth] = useState((dateRange?.to || today).getMonth());
  const [toYear, setToYear] = useState((dateRange?.to || today).getFullYear());
  // For month/year dropdowns in date range picker
  const currentMonth = (dateRange?.from || today).getMonth();
  const currentYear = (dateRange?.from || today).getFullYear();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i);

  // Fetch announcement types from Firestore on mount
  useEffect(() => {
    async function fetchTypes() {
      try {
        const querySnapshot = await getDocs(collection(db, "announcementTypes"));
        const types = querySnapshot.docs.map(doc => doc.data().name);
        setAnnouncementTypes(types);
      } catch (error) {
        console.error("Error fetching announcement types:", error);
      }
    }
    fetchTypes();
  }, []);

  // Fetch announcements from Firestore on mount
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const querySnapshot = await getDocs(collection(db, "announcements"));
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(fetched);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    }
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(announcement => {
    const search = searchTerm.toLowerCase();
    // Search matches any field
    const matchesSearch =
      (announcement.description?.toLowerCase().includes(search) ||
      announcement.type?.toLowerCase().includes(search) ||
      announcement.priority?.toLowerCase().includes(search) ||
      announcement.createdBy?.toLowerCase().includes(search) ||
      (announcement.date && announcement.date.toLowerCase().includes(search)));
    // Type filter
    const matchesType = typeFilter === "all" || announcement.type === typeFilter;
    // Priority filter
    const matchesPriority = priorityFilter === "all" || announcement.priority === priorityFilter;
    // Date range filter (createdTime)
    let matchesDate = true;
    if (dateRange?.from && dateRange?.to) {
      const created = announcement.createdTime ? new Date(announcement.createdTime) : null;
      if (created) {
        // Set time to 0:00 for from, 23:59 for to
        const from = new Date(dateRange.from);
        from.setHours(0,0,0,0);
        const to = new Date(dateRange.to);
        to.setHours(23,59,59,999);
        matchesDate = created >= from && created <= to;
      }
    }
    return matchesSearch && matchesType && matchesPriority && matchesDate;
  });

  // Sort by createdTime, order based on sortOrder
  const sortedAnnouncements = filteredAnnouncements.sort((a, b) => {
    const aTime = a.createdTime || 0;
    const bTime = b.createdTime || 0;
    return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
  });

  const pagedAnnouncements = sortedAnnouncements.slice((announcementPage - 1) * announcementRowsPerPage, announcementPage * announcementRowsPerPage);
  const announcementTotalPages = Math.ceil(filteredAnnouncements.length / announcementRowsPerPage);
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };
  const handleAddAnnouncement = async () => {
    const newAnnouncementWithDate = {
      ...newAnnouncement,
      date: new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      }),
      createdTime: Date.now(),
      createdBy: 'admin' // Replace with actual user if available
    };
    const docRef = await addDoc(collection(db, "announcements"), newAnnouncementWithDate);
    setAnnouncements(prev => [...prev, { ...newAnnouncementWithDate, id: docRef.id }]);
    setNewAnnouncement({
      type: "",
      description: "",
      priority: ""
    });
    setIsNewAnnouncementOpen(false);
    toast({
      title: "Announcement Created",
      description: "The new announcement has been added successfully.",
    });
  };
  const handleEditAnnouncement = (announcement: any) => {
    setEditingAnnouncement({ ...announcement });
    setEditDialogOpenId(announcement.id);
  };
  const handleSaveEdit = async () => {
    if (!editingAnnouncement) return;
    await updateDoc(doc(db, "announcements", editingAnnouncement.id), {
      type: editingAnnouncement.type,
      description: editingAnnouncement.description,
      priority: editingAnnouncement.priority,
      date: editingAnnouncement.date
    });
    setAnnouncements(announcements.map(a => a.id === editingAnnouncement.id ? editingAnnouncement : a));
    setEditingAnnouncement(null);
    setEditDialogOpenId(null);
    toast({
      title: "Announcement Updated",
      description: "The announcement has been updated successfully.",
    });
  };
  const handleDeleteAnnouncement = async (id: string) => {
    await deleteDoc(doc(db, "announcements", id));
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  // Helper to truncate description
  function truncateDescription(desc: string, maxLength = 20) {
    if (!desc) return '';
    return desc.length > maxLength ? desc.slice(0, maxLength) + '…' : desc;
  }
  return <Layout>
      <div className="">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Announcements</p>
                  <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">{announcements.filter(a => a.priority === 'high').length}</p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search and Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="w-full">
                <Input placeholder="Search announcements..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative w-full">
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                        {dateRange?.from || dateRange?.to ? (
                          <X
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                            onClick={e => {
                              e.stopPropagation();
                              setDateRange(undefined);
                            }}
                          />
                        ) : null}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="flex gap-8 px-4 pt-4 pb-2 items-start">
                        {/* FROM Calendar */}
                        <div>
                          <div className="mb-2 text-xs font-semibold text-gray-500 text-center">From</div>
                          <CalendarComponent
                            month={dateRange?.from || today}
                            selected={dateRange}
                            onSelect={range => setDateRange(r => ({ ...r, from: range?.from }))}
                            mode="range"
                            numberOfMonths={1}
                          />
                        </div>
                        {/* TO Calendar */}
                        <div>
                          <div className="mb-2 text-xs font-semibold text-gray-500 text-center">To</div>
                          <CalendarComponent
                            month={dateRange?.to || today}
                            selected={dateRange}
                            onSelect={range => setDateRange(r => ({ ...r, to: range?.to }))}
                            mode="range"
                            numberOfMonths={1}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {announcementTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Announcement Button */} 
        <div className="mb-6">
          <Dialog open={isNewAnnouncementOpen} onOpenChange={setIsNewAnnouncementOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF4F0B] hover:bg-[#FF4F0B]/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-type">Type</Label>
                  <Select value={newAnnouncement.type} onValueChange={value => setNewAnnouncement({
                    ...newAnnouncement,
                    type: value
                  })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select announcement type" />
                    </SelectTrigger>
                    <SelectContent>
                      {announcementTypes.map(type => (
                        <div key={type} className="flex items-center justify-between pr-2">
                          <SelectItem value={type}>{type}</SelectItem>
                          {announcementTypes.length > 1 && (
                            <Button type="button" size="icon" variant="ghost" onClick={async () => {
                              // Remove type from Firestore
                              try {
                                const querySnapshot = await getDocs(collection(db, "announcementTypes"));
                                const docToDelete = querySnapshot.docs.find(doc => doc.data().name === type);
                                if (docToDelete) {
                                  await deleteDoc(doc(db, "announcementTypes", docToDelete.id));
                              setAnnouncementTypes(types => types.filter(t => t !== type));
                              if (newAnnouncement.type === type) {
                                setNewAnnouncement({ ...newAnnouncement, type: "" });
                                  }
                                }
                              } catch (error) {
                                console.error("Error deleting type:", error);
                              }
                            }} className="ml-2 text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 p-2 border-t border-gray-100 mt-2">
                        <Input
                          value={newTypeInput}
                          onChange={e => setNewTypeInput(e.target.value)}
                          placeholder="Add new type"
                          className="flex-1"
                          onKeyDown={async e => {
                            if (e.key === 'Enter' && newTypeInput.trim()) {
                              if (!announcementTypes.includes(newTypeInput.trim())) {
                                try {
                                  const docRef = await addDoc(collection(db, "announcementTypes"), { name: newTypeInput.trim() });
                                setAnnouncementTypes([...announcementTypes, newTypeInput.trim()]);
                                setNewAnnouncement({ ...newAnnouncement, type: newTypeInput.trim() });
                                } catch (error) {
                                  console.error("Error adding type:", error);
                                }
                              }
                              setNewTypeInput("");
                            }
                          }}
                        />
                        <Button type="button" onClick={async () => {
                          if (newTypeInput.trim() && !announcementTypes.includes(newTypeInput.trim())) {
                            try {
                              const docRef = await addDoc(collection(db, "announcementTypes"), { name: newTypeInput.trim() });
                            setAnnouncementTypes([...announcementTypes, newTypeInput.trim()]);
                            setNewAnnouncement({ ...newAnnouncement, type: newTypeInput.trim() });
                            } catch (error) {
                              console.error("Error adding type:", error);
                            }
                          }
                          setNewTypeInput("");
                        }} disabled={!newTypeInput.trim()} className="bg-[#FF4F0B] hover:bg-[#FF4F0B]/90 text-white">
                          Add
                        </Button>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="new-priority">Priority</Label>
                  <Select value={newAnnouncement.priority} onValueChange={value => setNewAnnouncement({
                    ...newAnnouncement,
                    priority: value
                  })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="new-description">Description</Label>
                  <Textarea id="new-description" value={newAnnouncement.description} onChange={e => setNewAnnouncement({
                    ...newAnnouncement,
                    description: e.target.value
                  })} placeholder="Announcement description" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddAnnouncement} className="bg-[#FF4F0B] hover:bg-[#FF4F0B]/90 text-white">Create Announcement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Announcement Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}>
                      <div className="flex items-center gap-1">
                        Created Date
                        {sortOrder === 'desc' ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedAnnouncements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No announcements found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedAnnouncements.map(announcement => (
                      <TableRow key={announcement.id} className="hover:bg-gray-50">
                        <TableCell>{announcement.type}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">{truncateDescription(announcement.description)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getPriorityColor(announcement.priority)} text-white`}>
                            {announcement.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span>{announcement.date}</span>
                          <br />
                          <span className="text-xs text-gray-500">{formatTimeNoSeconds(announcement.createdTime)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Preview (Eye) Icon with Tooltip */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setPreviewAnnouncement(announcement)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preview</TooltipContent>
                            </Tooltip>
                            {/* Edit Icon with Tooltip */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Dialog open={editDialogOpenId === announcement.id} onOpenChange={open => {
                                  if (!open) {
                                    setEditDialogOpenId(null);
                                    setEditingAnnouncement(null);
                                  }
                                }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => handleEditAnnouncement(announcement)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Announcement</DialogTitle>
                              </DialogHeader>
                                    {editingAnnouncement && editingAnnouncement.id === announcement.id && (
                                      <div className="space-y-4">
                                  <div>
                                    <Label>Type</Label>
                                    <Select value={editingAnnouncement.type} onValueChange={value => setEditingAnnouncement({
                                ...editingAnnouncement,
                                type: value
                              })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                              {announcementTypes.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                              ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Priority</Label>
                                    <Select value={editingAnnouncement.priority} onValueChange={value => setEditingAnnouncement({
                                ...editingAnnouncement,
                                priority: value
                              })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Description</Label>
                                    <Textarea value={editingAnnouncement.description} onChange={e => setEditingAnnouncement({
                                ...editingAnnouncement,
                                description: e.target.value
                              })} />
                                  </div>
                                      </div>
                                    )}
                              <DialogFooter>
                                <Button onClick={handleSaveEdit}>Save Changes</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            {/* Delete Icon with Tooltip */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this announcement? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteAnnouncement(announcement.id)} className="bg-red-600 hover:bg-red-700">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
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
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">Page {announcementTotalPages === 0 ? 0 : announcementPage} of {announcementTotalPages}</span>
                <label className="text-sm text-gray-700 flex items-center gap-1">
                  Rows per page:
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={announcementRowsPerPage}
                    onChange={e => { setAnnouncementRowsPerPage(Number(e.target.value)); setAnnouncementPage(1); }}
                  >
                    {ANNOUNCEMENT_ROWS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setAnnouncementPage(p => Math.max(1, p - 1))} disabled={announcementPage === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAnnouncementPage(p => Math.min(announcementTotalPages, p + 1))} disabled={announcementPage === announcementTotalPages || announcementTotalPages === 0}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={!!previewAnnouncement} onOpenChange={open => !open && setPreviewAnnouncement(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Announcement Details</DialogTitle>
            </DialogHeader>
            {previewAnnouncement && (
              <div className="py-4">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top">Type</TableCell>
                      <TableCell>{previewAnnouncement.type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top">Priority</TableCell>
                      <TableCell>{previewAnnouncement.priority}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top">Created Date</TableCell>
                      <TableCell>
                        {previewAnnouncement.date}
                        <br />
                        <span className="text-xs text-gray-500">{formatTimeNoSeconds(previewAnnouncement.createdTime)}</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top">Description</TableCell>
                      <TableCell className="whitespace-pre-line break-words">{previewAnnouncement.description}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>;
}