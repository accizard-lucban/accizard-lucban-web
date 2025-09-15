import { useEffect, useState } from "react";
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
import { MapboxMap } from "./MapboxMap";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "@/components/ui/sonner";

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
  const [reports, setReports] = useState<any[]>([]);
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
    mobileNumber: "+63 912 345 6789",
    timeOfDispatch: "14:45",
    timeOfArrival: "15:10",
    coordinates: "14.5995, 120.9842"
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
    mobileNumber: "+63 917 876 5432",
    timeOfDispatch: "09:30",
    timeOfArrival: "10:15",
    coordinates: "14.6342, 121.0355"
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
    mobileNumber: "+63 998 123 4567",
    timeOfDispatch: "22:50",
    timeOfArrival: "23:05",
    coordinates: "14.5964, 120.9445"
  }];
  
  // Fetch reports from Firestore in real-time
  useEffect(() => {
    try {
      const reportsQuery = query(collection(db, "reports"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        const fetched = snapshot.docs.map((doc) => {
          const data: any = doc.data() || {};
          
          // Map timestamp to dateSubmitted and timeSubmitted
          let dateSubmitted = "";
          let timeSubmitted = "";
          try {
            const timestamp: any = data.timestamp;
            if (timestamp && typeof timestamp.toDate === "function") {
              const d = timestamp.toDate();
              // MM/dd/yy and h:mm a formatting
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              const yy = String(d.getFullYear()).slice(-2);
              dateSubmitted = `${mm}/${dd}/${yy}`;
              const hours12 = d.getHours() % 12 || 12;
              const minutes = String(d.getMinutes()).padStart(2, "0");
              const ampm = d.getHours() >= 12 ? "PM" : "AM";
              timeSubmitted = `${hours12}:${minutes} ${ampm}`;
            }
          } catch {}

          // Map imageUrls to attachedMedia
          const attachedMedia = Array.isArray(data.imageUrls) ? data.imageUrls : [];

          return {
            id: data.reportId || doc.id,
            userId: data.userId || "",
            type: data.category || "",
            reportedBy: "", // Not in your schema, will show empty
            barangay: "", // Not in your schema, will show empty
            description: data.description || "",
            responders: "", // Not in your schema, will show empty
            location: data.location || "",
            dateSubmitted,
            timeSubmitted,
            status: data.status || "Pending",
            attachedMedia,
            attachedDocument: "", // Not in your schema, will show empty
            mobileNumber: "", // Not in your schema, will show empty
            timeOfDispatch: "", // Not in your schema, will show empty
            timeOfArrival: "", // Not in your schema, will show empty
            coordinates: "" // Not in your schema, will show empty
          };
        });
        console.log("Fetched reports:", fetched);
        setReports(fetched);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Error subscribing to reports:", err);
    }
  }, []);
  const [formData, setFormData] = useState({
    type: "",
    reportedBy: "",
    barangay: "",
    description: "",
    responders: "",
    location: "",
    status: "Pending",
    attachedMedia: [] as File[],
    attachedDocument: null as File | null,
    timeOfDispatch: "",
    timeOfArrival: ""
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
      attachedDocument: null,
      timeOfDispatch: "",
      timeOfArrival: ""
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
    setSelectedReports(checked ? reports.map(report => report.id) : []);
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
  
  // Function to calculate response time between dispatch and arrival
  const calculateResponseTime = (dispatchTime: string, arrivalTime: string) => {
    try {
      // Parse the time strings (format: HH:MM)
      const [dispatchHours, dispatchMinutes] = dispatchTime.split(':').map(Number);
      const [arrivalHours, arrivalMinutes] = arrivalTime.split(':').map(Number);
      
      // Convert to minutes since midnight
      const dispatchTotalMinutes = dispatchHours * 60 + dispatchMinutes;
      const arrivalTotalMinutes = arrivalHours * 60 + arrivalMinutes;
      
      // Calculate difference in minutes
      let diffMinutes = arrivalTotalMinutes - dispatchTotalMinutes;
      
      // Handle case where arrival is on the next day
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // Add 24 hours in minutes
      }
      
      // Format the result
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      
      if (hours > 0) {
        return `${hours} hr ${minutes} min`;
      } else {
        return `${minutes} min`;
      }
    } catch (error) {
      console.error('Error calculating response time:', error);
      return 'Calculation error';
    }
  };

  // Function to calculate response time in minutes only
  const calculateResponseTimeMinutes = (dispatchTime: string, arrivalTime: string) => {
    try {
      const [dispatchHours, dispatchMinutes] = dispatchTime.split(':').map(Number);
      const [arrivalHours, arrivalMinutes] = arrivalTime.split(':').map(Number);
      
      const dispatchTotalMinutes = dispatchHours * 60 + dispatchMinutes;
      const arrivalTotalMinutes = arrivalHours * 60 + arrivalMinutes;
      
      let diffMinutes = arrivalTotalMinutes - dispatchTotalMinutes;
      
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
      }
      
      return diffMinutes;
    } catch (error) {
      console.error('Error calculating response time:', error);
      return 0;
    }
  };
  
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [directionsReport, setDirectionsReport] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState("details");
  const [isPreviewEditMode, setIsPreviewEditMode] = useState(false);
  const [previewEditData, setPreviewEditData] = useState<any>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    receivedBy: "",
    timeCallReceived: "",
    timeOfDispatch: "",
    timeOfArrival: "",
    hospitalArrival: "",
    returnedToOpcen: "",
    disasterRelated: "",
    agencyPresent: "",
    typeOfEmergency: "",
    // Road Crash / Medical Emergency fields
    classificationOfInjury: "",
    majorInjuryChecklist: {
      airway: false,
      breathing: false,
      circulation: false,
      fractures: false,
      headInjury: false,
      eyeInjury: false,
      deepLacerations: false,
      severeBurns: false,
      severeSymptoms: false
    },
    minorInjuryChecklist: {
      shallowCuts: false,
      sprains: false,
      bruises: false,
      minorBurns: false
    },
    // Medical Assistance fields
    chiefComplaint: "",
    diagnosis: "",
    natureOfIllness: "",
    otherNatureOfIllness: ""
  });

  // Function to upload media files to Firebase Storage
  const handleMediaUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setUploadingMedia(true);
    const storage = getStorage();
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `reports/${selectedReport?.id}/media/${fileName}`);
        
        // Upload file
        await uploadBytes(storageRef, file);
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadURL);
      }
      
      // Update the preview data with new URLs
      setPreviewEditData((d: any) => ({
        ...d,
        attachedMedia: [...(d.attachedMedia || []), ...uploadedUrls]
      }));
      
      toast.success(`${files.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading media files:', error);
      toast.error('Failed to upload media files. Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  // Function to upload document to Firebase Storage
  const handleDocumentUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingDocument(true);
    const storage = getStorage();
    
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `reports/${selectedReport?.id}/documents/${fileName}`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the preview data with new URL
      setPreviewEditData((d: any) => ({
        ...d,
        attachedDocument: downloadURL
      }));
      
      toast.success('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploadingDocument(false);
    }
  };

  return (
    <Layout>

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
                        checked={reports.length > 0 && selectedReports.length === reports.length}
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
                  {reports.map(report => (
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
                <Label>Update Attached Document</Label>
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
          <DialogContent className="sm:max-w-[900px] h-[700px] max-h-[90vh] bg-white flex flex-col">
            {/* Header Row: Title, ID, and Action Buttons */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Report Preview</h2>
                <div className="text-sm text-gray-700">{selectedReport?.id && `Report ID: ${selectedReport.id}`}</div>
              </div>
            </div>
            {/* Navigation Tabs */}
            <Tabs value={previewTab} onValueChange={setPreviewTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="directions">Directions</TabsTrigger>
                <TabsTrigger value="details">Report Details</TabsTrigger>
                <TabsTrigger value="dispatch">Dispatch Form</TabsTrigger>
              </TabsList>

              <TabsContent value="directions" className="mt-4 h-[500px]">
                <div className="bg-gray-200 rounded-lg h-full flex items-center justify-center w-full relative">
                  {selectedReport && (
                    <div 
                      id="report-map-container"
                      className="w-full h-full rounded-lg overflow-hidden absolute inset-0"
                    >
                      <MapboxMap 
                        center={selectedReport.coordinates ? 
                          selectedReport.coordinates.split(',').map(coord => parseFloat(coord.trim())).reverse() as [number, number] : 
                          [120.9842, 14.5995]}
                        zoom={14}
                        singleMarker={{
                          id: selectedReport.id || 'report-marker',
                          type: selectedReport.type || 'Report',
                          title: selectedReport.location || 'Report Location',
                          description: selectedReport.description || '',
                          reportId: selectedReport.id,
                          coordinates: selectedReport.coordinates ? 
                            selectedReport.coordinates.split(',').map(coord => parseFloat(coord.trim())).reverse() as [number, number] : 
                            [120.9842, 14.5995]
                        }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-4 h-[500px] flex flex-col">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <div className="text-lg font-semibold text-gray-900">Report Details</div>
                  <div className="flex gap-2 flex-wrap">
                    {isPreviewEditMode ? (
                      <Button size="sm" variant="outline" onClick={() => {
                        console.log('Saving changes:', previewEditData);
                        setSelectedReport(previewEditData);
                        setIsPreviewEditMode(false);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsPreviewEditMode(true);
                        setPreviewEditData({ ...selectedReport });
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={handlePrintPreview}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto border rounded-lg">
                  <div className="overflow-x-auto">
                    <Table className="w-full min-w-[600px]">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Report Type</TableCell>
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
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Reported By</TableCell>
                      <TableCell>
                        {isPreviewEditMode ? (
                          <Input value={previewEditData?.reportedBy} onChange={e => setPreviewEditData((d: any) => ({ ...d, reportedBy: e.target.value }))} />
                        ) : (
                          <>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-blue-600 hover:text-blue-800 mr-2"
                              onClick={() => navigate("/manage-users", { state: { tab: "residents", search: selectedReport?.userId } })}
                              title="View Resident Account"
                            >
                              {selectedReport?.userId}
                            </Button>
                            <span className="text-gray-700">{selectedReport?.reportedBy}</span>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Mobile Number</TableCell>
                      <TableCell>
                        {isPreviewEditMode ? (
                          <Input value={previewEditData?.mobileNumber} onChange={e => setPreviewEditData((d: any) => ({ ...d, mobileNumber: e.target.value }))} />
                        ) : (
                          selectedReport?.mobileNumber
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Barangay</TableCell>
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
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Description</TableCell>
                      <TableCell>
                        {isPreviewEditMode ? (
                          <Textarea value={previewEditData?.description} onChange={e => setPreviewEditData((d: any) => ({ ...d, description: e.target.value }))} />
                        ) : (
                          selectedReport?.description
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Responders</TableCell>
                      <TableCell>
                        {isPreviewEditMode ? (
                          <Input value={previewEditData?.responders} onChange={e => setPreviewEditData((d: any) => ({ ...d, responders: e.target.value }))} />
                        ) : (
                          selectedReport?.responders
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Location</TableCell>
                      <TableCell>
                        {isPreviewEditMode ? (
                          <Input value={previewEditData?.location} onChange={e => setPreviewEditData((d: any) => ({ ...d, location: e.target.value }))} />
                        ) : (
                          <>
                            <div>{selectedReport?.location}</div>
                            <div className="text-xs text-gray-500 mt-1">{selectedReport?.coordinates || '14.5995, 120.9842'}</div>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Status</TableCell>
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
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Date Submitted</TableCell>
                      <TableCell>
                        {selectedReport?.dateSubmitted}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Time Submitted</TableCell>
                      <TableCell>
                        {selectedReport?.timeSubmitted}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Attached Media</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedReport?.attachedMedia?.map((media: string, index: number) => {
                            // Truncate filename if too long
                            const truncatedName = media.length > 20 ? `${media.substring(0, 20)}...` : media;
                            const fileExtension = media.split('.').pop()?.toLowerCase();
                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
                            
                            return (
                              <div 
                                key={index} 
                                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 p-2 rounded cursor-pointer transition-colors group"
                                 onClick={() => {
                                   // Open image in new tab or show in modal
                                   if (isImage) {
                                     window.open(media, '_blank');
                                   } else {
                                     // For non-images, you could implement a download or preview
                                     window.open(media, '_blank');
                                   }
                                 }}
                                title={media} // Show full filename on hover
                              >
                                {isImage ? (
                                  <Image className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <FileIcon className="h-4 w-4 text-gray-600" />
                                )}
                                <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                                  {truncatedName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                         {isPreviewEditMode && (
                           <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-2">
                             <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                             <p className="text-sm text-gray-600 mb-2">Attach more photos or videos</p>
                             <Input 
                               type="file" 
                               multiple 
                               accept="image/*,video/*" 
                               onChange={e => {
                                 if (e.target.files) {
                                   handleMediaUpload(e.target.files);
                                 }
                               }} 
                               className="w-full"
                               disabled={uploadingMedia}
                             />
                             {uploadingMedia && (
                               <div className="mt-2 text-sm text-blue-600">
                                 Uploading files...
                               </div>
                             )}
                           </div>
                         )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Attached Document</TableCell>
                      <TableCell>
                        {selectedReport?.attachedDocument && (
                          <div 
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 p-2 rounded mb-2 cursor-pointer transition-colors group"
                            onClick={() => {
                              // Open document in new tab or trigger download
                              window.open(selectedReport.attachedDocument, '_blank');
                            }}
                            title={selectedReport.attachedDocument} // Show full filename on hover
                          >
                            <FileIcon className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                              {selectedReport.attachedDocument.length > 25 
                                ? `${selectedReport.attachedDocument.substring(0, 25)}...` 
                                : selectedReport.attachedDocument}
                            </span>
                          </div>
                        )}
                         {isPreviewEditMode && (
                           <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                             <FileIcon className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                             <p className="text-sm text-gray-600 mb-2">Attach a document</p>
                             <Input 
                               type="file" 
                               accept=".pdf,.doc,.docx" 
                               onChange={e => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                   handleDocumentUpload(file);
                                 }
                               }} 
                               className="w-full"
                               disabled={uploadingDocument}
                             />
                             {uploadingDocument && (
                               <div className="mt-2 text-sm text-blue-600">
                                 Uploading document...
                               </div>
                             )}
                           </div>
                         )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                  </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dispatch" className="mt-4 h-[500px] overflow-y-auto">
                <div className="space-y-6 p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="text-lg font-semibold text-gray-900">Dispatch Form</div>
                  </div>
                  
                  {/* I. Dispatch Information */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 border-b pb-2">I. Dispatch Information</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="receivedBy" className="text-sm font-medium text-gray-700">Received by:</Label>
                        <Input 
                          id="receivedBy"
                          value={dispatchData.receivedBy}
                          onChange={e => setDispatchData(prev => ({ ...prev, receivedBy: e.target.value }))}
                          placeholder="Enter name"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="timeCallReceived" className="text-sm font-medium text-gray-700">Time Call Received:</Label>
                        <Input 
                          id="timeCallReceived"
                          type="time"
                          value={dispatchData.timeCallReceived}
                          onChange={e => setDispatchData(prev => ({ ...prev, timeCallReceived: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="timeOfDispatch" className="text-sm font-medium text-gray-700">Time of Dispatch:</Label>
                        <Input 
                          id="timeOfDispatch"
                          type="time"
                          value={dispatchData.timeOfDispatch}
                          onChange={e => setDispatchData(prev => ({ ...prev, timeOfDispatch: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="timeOfArrival" className="text-sm font-medium text-gray-700">Time of Arrival:</Label>
                        <Input 
                          id="timeOfArrival"
                          type="time"
                          value={dispatchData.timeOfArrival}
                          onChange={e => setDispatchData(prev => ({ ...prev, timeOfArrival: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="responseTime" className="text-sm font-medium text-gray-700">Response Time (minutes):</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                          {dispatchData.timeOfDispatch && dispatchData.timeOfArrival ? 
                            calculateResponseTimeMinutes(dispatchData.timeOfDispatch, dispatchData.timeOfArrival) + ' minutes' : 
                            'Not available - Please fill in both dispatch and arrival times'}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="hospitalArrival" className="text-sm font-medium text-gray-700">Hospital Arrival:</Label>
                        <Input 
                          id="hospitalArrival"
                          type="time"
                          value={dispatchData.hospitalArrival}
                          onChange={e => setDispatchData(prev => ({ ...prev, hospitalArrival: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="returnedToOpcen" className="text-sm font-medium text-gray-700">Returned to OPCEN:</Label>
                        <Input 
                          id="returnedToOpcen"
                          type="time"
                          value={dispatchData.returnedToOpcen}
                          onChange={e => setDispatchData(prev => ({ ...prev, returnedToOpcen: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="disasterRelated" className="text-sm font-medium text-gray-700">Disaster Related:</Label>
                        <Select value={dispatchData.disasterRelated} onValueChange={value => setDispatchData(prev => ({ ...prev, disasterRelated: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose Yes or No" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="agencyPresent" className="text-sm font-medium text-gray-700">Agency Present:</Label>
                        <Select value={dispatchData.agencyPresent} onValueChange={value => setDispatchData(prev => ({ ...prev, agencyPresent: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose Agency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PNP">PNP</SelectItem>
                            <SelectItem value="BFP">BFP</SelectItem>
                            <SelectItem value="MTMO">MTMO</SelectItem>
                            <SelectItem value="BPOC">BPOC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="typeOfEmergency" className="text-sm font-medium text-gray-700">Type of Emergency:</Label>
                        <Select value={dispatchData.typeOfEmergency} onValueChange={value => setDispatchData(prev => ({ ...prev, typeOfEmergency: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Road Crash">Road Crash</SelectItem>
                            <SelectItem value="Medical Assistance">Medical Assistance</SelectItem>
                            <SelectItem value="Medical Emergency">Medical Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Road Crash / Medical Emergency Fields */}
                  {(dispatchData.typeOfEmergency === "Road Crash" || dispatchData.typeOfEmergency === "Medical Emergency") && (
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Classification of Injury</h3>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Classification of Injury:</Label>
                        <div className="mt-2 space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="classificationOfInjury"
                              value="Major"
                              checked={dispatchData.classificationOfInjury === "Major"}
                              onChange={e => setDispatchData(prev => ({ ...prev, classificationOfInjury: e.target.value }))}
                              className="text-blue-600"
                            />
                            <span className="text-sm">Major</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="classificationOfInjury"
                              value="Minor"
                              checked={dispatchData.classificationOfInjury === "Minor"}
                              onChange={e => setDispatchData(prev => ({ ...prev, classificationOfInjury: e.target.value }))}
                              className="text-blue-600"
                            />
                            <span className="text-sm">Minor</span>
                          </label>
                        </div>
                      </div>

                      {/* Major Injury Checklist */}
                      {dispatchData.classificationOfInjury === "Major" && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-700">Major Injury Checklist:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(dispatchData.majorInjuryChecklist).map(([key, value]) => (
                              <label key={key} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={e => setDispatchData(prev => ({
                                    ...prev,
                                    majorInjuryChecklist: {
                                      ...prev.majorInjuryChecklist,
                                      [key]: e.target.checked
                                    }
                                  }))}
                                  className="text-blue-600"
                                />
                                <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Minor Injury Checklist */}
                      {dispatchData.classificationOfInjury === "Minor" && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-700">Minor Injury Checklist:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(dispatchData.minorInjuryChecklist).map(([key, value]) => (
                              <label key={key} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={e => setDispatchData(prev => ({
                                    ...prev,
                                    minorInjuryChecklist: {
                                      ...prev.minorInjuryChecklist,
                                      [key]: e.target.checked
                                    }
                                  }))}
                                  className="text-blue-600"
                                />
                                <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Medical Assistance Fields */}
                  {dispatchData.typeOfEmergency === "Medical Assistance" && (
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Medical Assistance Details</h3>
                      
                      <div>
                        <Label htmlFor="chiefComplaint" className="text-sm font-medium text-gray-700">Chief Complaint:</Label>
                        <Input 
                          id="chiefComplaint"
                          value={dispatchData.chiefComplaint}
                          onChange={e => setDispatchData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                          placeholder="Short description"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="diagnosis" className="text-sm font-medium text-gray-700">Diagnosis:</Label>
                        <Input 
                          id="diagnosis"
                          value={dispatchData.diagnosis}
                          onChange={e => setDispatchData(prev => ({ ...prev, diagnosis: e.target.value }))}
                          placeholder="Short description"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Nature of Illness:</Label>
                        <div className="mt-2 space-y-2">
                          {[
                            "Infectious disease",
                            "Lung disease", 
                            "Cancer",
                            "Cardiovascular disease",
                            "Neurological disorder",
                            "Skin disease",
                            "Mental health issues",
                            "Autoimmune disease",
                            "Inflammatory conditions",
                            "Metabolic disorder",
                            "Other"
                          ].map(illness => (
                            <label key={illness} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="natureOfIllness"
                                value={illness}
                                checked={dispatchData.natureOfIllness === illness}
                                onChange={e => setDispatchData(prev => ({ ...prev, natureOfIllness: e.target.value }))}
                                className="text-blue-600"
                              />
                              <span className="text-sm">{illness}</span>
                            </label>
                          ))}
                        </div>
                        
                        {dispatchData.natureOfIllness === "Other" && (
                          <div className="mt-2">
                            <Input 
                              value={dispatchData.otherNatureOfIllness}
                              onChange={e => setDispatchData(prev => ({ ...prev, otherNatureOfIllness: e.target.value }))}
                              placeholder="Please specify"
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setPreviewTab("details")}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      console.log('Saving dispatch form data:', dispatchData);
                      // Add dispatch form save logic here
                    }}>
                      Save Dispatch
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
