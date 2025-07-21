import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Edit, Trash2, Plus, FileText, Calendar, Clock, MapPin, Upload, FileIcon, Image, Printer, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layout } from "./Layout";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function ManageReportsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const mockReports = [{
    id: "REP-001",
    userId: "USR-001",
    type: "Fire",
    reportedBy: "Juan dela Cruz",
    barangay: "Brgy. Poblacion",
    description: "House fire reported on Main Street. Multiple units dispatched.",
    responders: "Fire Station 1, Rescue Team Alpha",
    location: "123 Main Street, Brgy. Poblacion, Makati City",
    dateSubmitted: "01/15/25",
    timeSubmitted: "2:30 PM",
    status: "Pending",
    attachedMedia: ["fire_scene_1.jpg", "fire_scene_2.jpg"],
    attachedDocument: "incident_report_001.pdf",
    mobileNumber: "+63 912 345 6789"
  }, {
    id: "REP-002",
    userId: "USR-002",
    type: "Flooding",
    reportedBy: "Maria Santos",
    barangay: "Brgy. San Roque",
    description: "Flash flood affecting residential area after heavy rainfall.",
    responders: "Emergency Response Team, Local Barangay Officials",
    location: "Riverside Avenue, Brgy. San Roque, Quezon City",
    dateSubmitted: "01/14/25",
    timeSubmitted: "9:15 AM",
    status: "Ongoing",
    attachedMedia: ["flood_area_1.jpg"],
    attachedDocument: "flood_assessment.pdf",
    mobileNumber: "+63 917 876 5432"
  }, {
    id: "REP-003",
    userId: "USR-003",
    type: "Medical Emergency",
    reportedBy: "Pedro Garcia",
    barangay: "Brgy. Magsaysay",
    description: "Elderly person experiencing chest pains, ambulance requested.",
    responders: "Paramedic Unit 2, Hospital Emergency Team",
    location: "456 Health Street, Brgy. Magsaysay, Manila",
    dateSubmitted: "01/13/25",
    timeSubmitted: "10:45 PM",
    status: "Responded",
    attachedMedia: ["medical_response.jpg"],
    attachedDocument: "medical_report_003.pdf",
    mobileNumber: "+63 998 123 4567"
  }];
  const [formData, setFormData] = useState({
    type: "",
    reportedBy: "",
    barangay: "",
    description: "",
    responders: "",
    location: "",
    status: "Pending",
    attachedMedia: [] as File[],
    attachedDocument: null as File | null
  });
  const handleAddReport = () => {
    console.log("Adding new report:", formData);
    setShowAddModal(false);
    setFormData({
      type: "",
      reportedBy: "",
      barangay: "",
      description: "",
      responders: "",
      location: "",
      status: "Pending",
      attachedMedia: [],
      attachedDocument: null
    });
  };
  const handleEditReport = () => {
    console.log("Editing report:", selectedReport?.id, formData);
    setShowEditModal(false);
  };
  const handleDeleteReport = (reportId: string) => {
    console.log(`Deleting report with ID: ${reportId}`);
  };
  const handlePinOnMap = (report: any) => {
    console.log("Redirecting to map for report:", report.id);
    navigate("/risk-map");
  };
  const handleViewLocation = (location: string) => {
    console.log("Viewing location:", location);
  };
  const handleReportedByClick = (reportedBy: string) => {
    console.log("Redirecting to user:", reportedBy);
    navigate("/manage-users");
  };
  const barangayOptions = ["Brgy. Poblacion", "Brgy. San Roque", "Brgy. Magsaysay", "Brgy. Santo Niño", "Brgy. San Antonio", "Brgy. Santa Cruz"];
  const truncateLocation = (location: string, maxLength: number = 30) => {
    return location.length > maxLength ? `${location.substring(0, maxLength)}...` : location;
  };
  const handleBatchStatusUpdate = (newStatus: string) => {
    console.log(`Updating status to ${newStatus} for reports:`, selectedReports);
    // Implement the actual status update logic here
  };
  const handleBatchDelete = () => {
    console.log("Deleting reports:", selectedReports);
    // Implement the actual delete logic here
  };
  const handleCheckboxChange = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };
  const handleSelectAll = (checked: boolean) => {
    setSelectedReports(checked ? mockReports.map(report => report.id) : []);
  };
  const handlePrintTable = () => {
    window.print();
  };
  const handlePrintPreview = () => {
    // Create a new window with just the preview content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const content = document.getElementById('report-preview-content');
      printWindow.document.write(`
        <html>
          <head>
            <title>Report ${selectedReport?.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              td, th { padding: 8px; border: 1px solid #ddd; }
              th { background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            ${content?.innerHTML || ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [directionsReport, setDirectionsReport] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState("details");
  const [isPreviewEditMode, setIsPreviewEditMode] = useState(false);
  const [previewEditData, setPreviewEditData] = useState<any>(null);
  return <Layout>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reports This Week</p>
                  <p className="text-2xl font-bold text-gray-900">23</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
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
              {/* Search Bar */}
              <div className="w-full">
                <Input placeholder="Search reports..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <Label className="text-sm font-medium">Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "LLL dd, y")} -{" "}
                              {format(date.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(date.from, "LLL dd, y")
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
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm font-medium">Report Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="fire">Fire</SelectItem>
                      <SelectItem value="flooding">Flooding</SelectItem>
                      <SelectItem value="medical">Medical Emergency</SelectItem>
                      <SelectItem value="earthquake">Earthquake</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="not-responded">Not Responded</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="false-report">False Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="">
        <div className="flex items-end gap-4 mb-6">
          
          <Button onClick={() => setShowAddModal(true)} className="bg-[#FF4F0B] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add New Report
          </Button>
          <Button onClick={handlePrintTable} className="bg-[#FF4F0B] text-white">
            <Printer className="h-4 w-4 mr-2" />
            Print Table
          </Button>
          {selectedReports.length > 0 && (
            <>
              <Button onClick={handleBatchDelete} variant="destructive" className="bg-red-500 text-white ml-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </>
          )}
        </div>

        {/* Reports Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedReports.length === mockReports.length}
                        onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                      />
                    </TableHead>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReports.map(report => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedReports.includes(report.id)}
                          onCheckedChange={() => handleCheckboxChange(report.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{report.id}</TableCell>
                      <TableCell>
                        <Badge className={
                          report.type === 'Fire'
                            ? 'bg-red-100 text-red-800 hover:bg-red-50'
                            : report.type === 'Flooding'
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-50'
                            : report.type === 'Medical Emergency'
                            ? 'bg-green-100 text-green-800 hover:bg-green-50'
                            : report.type === 'Earthquake'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-50'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-50'
                        }>
                          {report.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-blue-600 hover:underline focus:outline-none"
                          onClick={() => navigate("/manage-users", { state: { tab: "residents", search: report.userId } })}
                          title="View Resident Account"
                        >
                          {report.userId}
                        </button>
                      </TableCell>
                      <TableCell>
                        {report.dateSubmitted}
                        <br />
                        <span className="text-xs text-gray-500">{report.timeSubmitted}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          report.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-50'
                            : report.status === 'Ongoing'
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-50'
                            : report.status === 'Not Responded'
                            ? 'bg-red-100 text-red-800 hover:bg-red-50'
                            : report.status === 'Responded'
                            ? 'bg-green-100 text-green-800 hover:bg-green-50'
                            : report.status === 'False Report'
                            ? 'bg-gray-100 text-gray-800 hover:bg-gray-50'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-50'
                        }>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport(report);
                              setShowPreviewModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport(report);
                              setFormData({
                                ...formData,
                                type: report.type,
                                reportedBy: report.reportedBy,
                                barangay: report.barangay,
                                description: report.description,
                                responders: report.responders,
                                location: report.location,
                                status: report.status,
                                attachedMedia: [],
                                attachedDocument: null,
                              });
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePinOnMap(report)}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
                Showing 1 to 3 of 3 results
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

        {/* Add Report Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Report</DialogTitle>
              <DialogDescription>
                Create a new emergency report with all required details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={formData.type} onValueChange={value => setFormData({
                  ...formData,
                  type: value
                })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fire">Fire</SelectItem>
                      <SelectItem value="flooding">Flooding</SelectItem>
                      <SelectItem value="medical">Medical Emergency</SelectItem>
                      <SelectItem value="earthquake">Earthquake</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reported-by">Reported By</Label>
                  <Input id="reported-by" value={formData.reportedBy} onChange={e => setFormData({
                  ...formData,
                  reportedBy: e.target.value
                })} placeholder="Enter reporter name" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="barangay">Barangay</Label>
                <Select value={formData.barangay} onValueChange={value => setFormData({
                ...formData,
                barangay: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select barangay" />
                  </SelectTrigger>
                  <SelectContent>
                    {barangayOptions.map(barangay => <SelectItem key={barangay} value={barangay}>{barangay}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder="Describe the incident..." />
              </div>

              <div>
                <Label htmlFor="responders">Responders</Label>
                <Input id="responders" value={formData.responders} onChange={e => setFormData({
                ...formData,
                responders: e.target.value
              })} placeholder="List responding teams/units" />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={formData.location} onChange={e => setFormData({
                ...formData,
                location: e.target.value
              })} placeholder="Enter specific location" />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={value => setFormData({
                ...formData,
                status: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Attached Media</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Upload photos or videos</p>
                  <Input type="file" multiple accept="image/*,video/*" className="hidden" />
                </div>
              </div>

              <div>
                <Label>Attached Document</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <FileIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Upload document</p>
                  <Input type="file" accept=".pdf,.doc,.docx" className="hidden" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleAddReport}>
                Add Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Report Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Report</DialogTitle>
              <DialogDescription>
                Make changes to the selected report.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Same form fields as Add Modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-report-type">Report Type</Label>
                  <Select value={formData.type} onValueChange={value => setFormData({
                  ...formData,
                  type: value
                })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fire">Fire</SelectItem>
                      <SelectItem value="flooding">Flooding</SelectItem>
                      <SelectItem value="medical">Medical Emergency</SelectItem>
                      <SelectItem value="earthquake">Earthquake</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-reported-by">Reported By</Label>
                  <Input id="edit-reported-by" value={formData.reportedBy} onChange={e => setFormData({
                  ...formData,
                  reportedBy: e.target.value
                })} />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-barangay">Barangay</Label>
                <Select value={formData.barangay} onValueChange={value => setFormData({
                ...formData,
                barangay: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select barangay" />
                  </SelectTrigger>
                  <SelectContent>
                    {barangayOptions.map(barangay => <SelectItem key={barangay} value={barangay}>{barangay}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} />
              </div>

              <div>
                <Label htmlFor="edit-responders">Responders</Label>
                <Input id="edit-responders" value={formData.responders} onChange={e => setFormData({
                ...formData,
                responders: e.target.value
              })} />
              </div>

              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" value={formData.location} onChange={e => setFormData({
                ...formData,
                location: e.target.value
              })} />
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={value => setFormData({
                ...formData,
                status: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Update Attached Media</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Upload new photos or videos</p>
                  <Input type="file" multiple accept="image/*,video/*" className="hidden" />
                </div>
              </div>

              <div>
                <Label>Update Attached Document</ Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <FileIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Upload new document</p>
                  <Input type="file" accept=".pdf,.doc,.docx" className="hidden" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleEditReport}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Report Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Preview</DialogTitle>
              <DialogDescription>
                View details of the selected report.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end mb-2">
              {!isPreviewEditMode ? (
                <Button size="sm" variant="outline" onClick={() => {
                  setIsPreviewEditMode(true);
                  setPreviewEditData({ ...selectedReport });
                }}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    // Save logic (mock)
                    setIsPreviewEditMode(false);
                    setSelectedReport({ ...previewEditData });
                  }}>
                    Save
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => {
                    setIsPreviewEditMode(false);
                    setPreviewEditData(null);
                  }}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            <Tabs value={previewTab} onValueChange={setPreviewTab} className="w-full mt-2">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Report Details</TabsTrigger>
                <TabsTrigger value="directions">Directions</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <div className="py-4" id="report-preview-content">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Report ID</TableCell>
                        <TableCell>{selectedReport?.id}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Report Type</TableCell>
                        <TableCell>
                          {isPreviewEditMode ? (
                            <Select value={previewEditData?.type} onValueChange={v => setPreviewEditData((d: any) => ({ ...d, type: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Fire">Fire</SelectItem>
                                <SelectItem value="Flooding">Flooding</SelectItem>
                                <SelectItem value="Medical Emergency">Medical Emergency</SelectItem>
                                <SelectItem value="Earthquake">Earthquake</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={selectedReport?.type === 'Fire' ? 'bg-red-100 text-red-800 hover:bg-red-50' : selectedReport?.type === 'Flooding' ? 'bg-blue-100 text-blue-800 hover:bg-blue-50' : 'bg-gray-100 text-gray-800 hover:bg-gray-50'}>
                              {selectedReport?.type}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Reported By</TableCell>
                        <TableCell>
                          {isPreviewEditMode ? (
                            <Input value={previewEditData?.reportedBy} onChange={e => setPreviewEditData((d: any) => ({ ...d, reportedBy: e.target.value }))} />
                          ) : (
                            <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800" onClick={() => handleReportedByClick(selectedReport?.reportedBy)}>
                              {selectedReport?.reportedBy}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Mobile Number</TableCell>
                        <TableCell>
                          {isPreviewEditMode ? (
                            <Input value={previewEditData?.mobileNumber} onChange={e => setPreviewEditData((d: any) => ({ ...d, mobileNumber: e.target.value }))} />
                          ) : (
                            selectedReport?.mobileNumber
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Barangay</TableCell>
                        <TableCell>
                          {isPreviewEditMode ? (
                            <Select value={previewEditData?.barangay} onValueChange={v => setPreviewEditData((d: any) => ({ ...d, barangay: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {barangayOptions.map(barangay => <SelectItem key={barangay} value={barangay}>{barangay}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            selectedReport?.barangay
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Description</TableCell>
                        <TableCell>
                          {isPreviewEditMode ? (
                            <Textarea value={previewEditData?.description} onChange={e => setPreviewEditData((d: any) => ({ ...d, description: e.target.value }))} />
                          ) : (
                            selectedReport?.description
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Responders</TableCell>
                        <TableCell>
                          {isPreviewEditMode ? (
                            <Input value={previewEditData?.responders} onChange={e => setPreviewEditData((d: any) => ({ ...d, responders: e.target.value }))} />
                          ) : (
                            selectedReport?.responders
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Location</TableCell>
                        <TableCell>
                          {isPreviewEditMode ? (
                            <Input value={previewEditData?.location} onChange={e => setPreviewEditData((d: any) => ({ ...d, location: e.target.value }))} />
                          ) : (
                            <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800" onClick={() => handleViewLocation(selectedReport?.location)}>
                              {selectedReport?.location}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Status</TableCell>
                        <TableCell>
                          {isPreviewEditMode ? (
                            <Select value={previewEditData?.status} onValueChange={v => setPreviewEditData((d: any) => ({ ...d, status: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Ongoing">Ongoing</SelectItem>
                                <SelectItem value="Not Responded">Not Responded</SelectItem>
                                <SelectItem value="Responded">Responded</SelectItem>
                                <SelectItem value="False Report">False Report</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={cn(
                              "capitalize",
                              selectedReport?.status === "Pending" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-50",
                              selectedReport?.status === "Ongoing" && "bg-blue-100 text-blue-800 hover:bg-blue-50",
                              selectedReport?.status === "Not Responded" && "bg-red-100 text-red-800 hover:bg-red-50",
                              selectedReport?.status === "Responded" && "bg-green-100 text-green-800 hover:bg-green-50",
                              selectedReport?.status === "False Report" && "bg-gray-100 text-gray-800 hover:bg-gray-50"
                            )}>
                              {selectedReport?.status}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Date Submitted</TableCell>
                        <TableCell>
                          {selectedReport?.dateSubmitted}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Time Submitted</TableCell>
                        <TableCell>
                          {selectedReport?.timeSubmitted}
                        </TableCell>
                      </TableRow>
                      {/* Attached Media and Document fields can be made editable if needed */}
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Attached Media</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {selectedReport?.attachedMedia?.map((media: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                                <Image className="h-4 w-4" />
                                <span className="text-sm">{media}</span>
                              </div>
                            ))}
                          </div>
                          {isPreviewEditMode && (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center mb-2">
                              <Input type="file" multiple accept="image/*,video/*" onChange={e => {
                                const files = Array.from(e.target.files || []);
                                setPreviewEditData((d: any) => ({
                                  ...d,
                                  attachedMedia: [...(d.attachedMedia || []), ...files.map(f => f.name)]
                                }));
                              }} />
                              <p className="text-xs text-gray-500 mt-1">Attach more photos or videos</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Attached Document</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded mb-2">
                            <FileIcon className="h-4 w-4" />
                            <span className="text-sm">{selectedReport?.attachedDocument}</span>
                          </div>
                          {isPreviewEditMode && (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center">
                              <Input type="file" accept=".pdf,.doc,.docx" onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setPreviewEditData((d: any) => ({
                                    ...d,
                                    attachedDocument: file.name
                                  }));
                                }
                              }} />
                              <p className="text-xs text-gray-500 mt-1">Attach a document</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="directions">
                <div className="py-4">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Address</TableCell>
                        <TableCell>{selectedReport?.location}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Coordinates</TableCell>
                        <TableCell>14.5995, 120.9842 {/* Mocked for now */}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top">Estimated Time of Arrival</TableCell>
                        <TableCell>15 min {/* Mocked for now */}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className="mt-6">
                    <div className="font-medium text-gray-700 mb-2">Map</div>
                    <iframe
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://www.google.com/maps?q=${encodeURIComponent(selectedReport?.location || "")}&output=embed`}
                    ></iframe>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button onClick={handlePrintPreview} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>;
}