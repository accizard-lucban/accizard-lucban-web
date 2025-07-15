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
import { Search, Plus, Edit, Trash2, Calendar, AlertTriangle, Info, X } from "lucide-react";
import { Layout } from "./Layout";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
  
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
  const [announcementTypes, setAnnouncementTypes] = useState([
    "Weather Warning",
    "Flood",
    "Landslide/Earthquake",
    "Road Closure",
    "Evacuation Order",
    "Missing Person",
    "Informational"
  ]);
  const [newTypeInput, setNewTypeInput] = useState("");

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.description.toLowerCase().includes(searchTerm.toLowerCase()) || announcement.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || announcement.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || announcement.priority === priorityFilter;
    return matchesSearch && matchesType && matchesPriority;
  });

  const pagedAnnouncements = filteredAnnouncements.slice((announcementPage - 1) * announcementRowsPerPage, announcementPage * announcementRowsPerPage);
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
  };
  const handleEditAnnouncement = (announcement: any) => {
    setEditingAnnouncement({
      ...announcement
    });
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
  };
  const handleDeleteAnnouncement = async (id: string) => {
    await deleteDoc(doc(db, "announcements", id));
    setAnnouncements(announcements.filter(a => a.id !== id));
  };
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
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
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
                      <SelectItem value="Weather Warning">Weather Warning</SelectItem>
                      <SelectItem value="Flood">Flood</SelectItem>
                      <SelectItem value="Landslide/Earthquake">Landslide/Earthquake</SelectItem>
                      <SelectItem value="Road Closure">Road Closure</SelectItem>
                      <SelectItem value="Evacuation Order">Evacuation Order</SelectItem>
                      <SelectItem value="Missing Person">Missing Person</SelectItem>
                      <SelectItem value="Informational">Informational</SelectItem>
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
                            <Button type="button" size="icon" variant="ghost" onClick={() => {
                              setAnnouncementTypes(types => types.filter(t => t !== type));
                              if (newAnnouncement.type === type) {
                                setNewAnnouncement({ ...newAnnouncement, type: "" });
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
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newTypeInput.trim()) {
                              if (!announcementTypes.includes(newTypeInput.trim())) {
                                setAnnouncementTypes([...announcementTypes, newTypeInput.trim()]);
                                setNewAnnouncement({ ...newAnnouncement, type: newTypeInput.trim() });
                              }
                              setNewTypeInput("");
                            }
                          }}
                        />
                        <Button type="button" onClick={() => {
                          if (newTypeInput.trim() && !announcementTypes.includes(newTypeInput.trim())) {
                            setAnnouncementTypes([...announcementTypes, newTypeInput.trim()]);
                            setNewAnnouncement({ ...newAnnouncement, type: newTypeInput.trim() });
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
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedAnnouncements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 py-8">
                        No announcements found.
                      </td>
                    </tr>
                  ) : (
                    pagedAnnouncements.map(announcement => (
                      <tr key={announcement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{announcement.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs">{announcement.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span>{announcement.date}</span>
                          <br />
                          <span className="text-xs text-gray-500">{formatTimeNoSeconds(announcement.createdTime)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${getPriorityColor(announcement.priority)} text-white`}>
                            {announcement.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => handleEditAnnouncement(announcement)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Announcement</DialogTitle>
                              </DialogHeader>
                              {editingAnnouncement && <div className="space-y-4">
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
                                        <SelectItem value="Weather Warning">Weather Warning</SelectItem>
                                        <SelectItem value="Flood">Flood</SelectItem>
                                        <SelectItem value="Landslide/Earthquake">Landslide/Earthquake</SelectItem>
                                        <SelectItem value="Road Closure">Road Closure</SelectItem>
                                        <SelectItem value="Evacuation Order">Evacuation Order</SelectItem>
                                        <SelectItem value="Missing Person">Missing Person</SelectItem>
                                        <SelectItem value="Informational">Informational</SelectItem>
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
                                </div>}
                              <DialogFooter>
                                <Button onClick={handleSaveEdit}>Save Changes</Button>
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
      </div>
    </Layout>;
}