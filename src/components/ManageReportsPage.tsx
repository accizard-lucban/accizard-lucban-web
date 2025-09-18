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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const adminOptions = ["Admin 1", "Admin 2", "Admin 3", "Admin 4", "Admin 5"];
  const agencyOptions = ["PNP", "BFP", "MTMO", "BPOC"];
  const emergencyTypeOptions = ["Road Crash", "Medical Assistance", "Medical Emergency"];
  const injuryClassificationOptions = ["Major", "Minor"];
  const majorInjuryTypeOptions = [
    "Airway",
    "Breathing",
    "Circulation",
    "Fractures",
    "Head Injury",
    "Eye Injury",
    "Deep Lacerations",
    "Severe/Extensive Burns",
    "Injuries with Chest Pain, Paralysis, Confusion, Severe Bleeding, Unconsciousness"
  ];
  const minorInjuryTypeOptions = [
    "Shallow Cuts or Abrasions",
    "Sprains and Muscle Strain",
    "Bruises",
    "Minor Burns Covering Small Area of Skin"
  ];
  const majorMedicalSymptomsOptions = [
    "Unconsciousness",
    "Severe Chest Pain",
    "Difficulty Breathing",
    "Severe Bleeding",
    "Cardiac Arrest",
    "Stroke Symptoms",
    "Severe Allergic Reaction",
    "Severe Burns",
    "Multiple Trauma",
    "Severe Head Injury",
    "Airway Obstruction",
    "Severe Dehydration",
    "Severe Abdominal Pain",
    "High Fever with Confusion",
    "Severe Nausea/Vomiting"
  ];
  const minorMedicalSymptomsOptions = [
    "Mild Chest Discomfort",
    "Minor Cuts/Abrasions",
    "Mild Burns",
    "Minor Headache",
    "Mild Nausea",
    "Low-grade Fever",
    "Mild Abdominal Pain",
    "Minor Allergic Reaction",
    "Mild Dehydration",
    "Minor Sprains",
    "Mild Breathing Difficulty",
    "Moderate Bleeding",
    "Moderate Burns",
    "Moderate Head Injury"
  ];
  const natureOfIllnessOptions = [
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
    "Others"
  ];
  const actionsTakenOptions = [
    "Ensured scene safety",
    "Coordinated with on-scene personnel",
    "Coordinated with PNP",
    "Coordinated with BFP",
    "Coordinated with MTMO",
    "Coordinated and Contacted Relative",
    "Primary and Secondary Assessments",
    "First Aid Management Done",
    "Vital Signs Taken (Temperature, pulse rate, respiratory rate, blood pressure)",
    "Interviewed patient or relative/s",
    "Coordinated with RHU",
    "Coordinated with Refer Quezon",
    "Referred to (Short Desc)",
    "Endorsed patient/s to nurse on duty",
    "Assisted patient/s in Response Vehicle",
    "Transport from (Place from) to (Place to)",
    "Others (Short Desc)"
  ];
  const [teamOptions, setTeamOptions] = useState([
    "Alpha Team",
    "Bravo Team", 
    "Charlie Team",
    "Delta Team",
    "Echo Team"
  ]);
  const [driverOptions, setDriverOptions] = useState([
    "John Smith",
    "Jane Doe",
    "Mike Johnson",
    "Sarah Wilson",
    "David Brown"
  ]);
  const [responderOptions, setResponderOptions] = useState([
    "Paramedic",
    "EMT",
    "Nurse",
    "Doctor",
    "Firefighter",
    "Police Officer",
    "Rescue Team Member",
    "Volunteer",
    "Other"
  ]);
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
    injuryClassification: "",
    majorInjuryTypes: [] as string[],
    minorInjuryTypes: [] as string[],
    medicalClassification: "",
    majorMedicalSymptoms: [] as string[],
    minorMedicalSymptoms: [] as string[],
    chiefComplaint: "",
    diagnosis: "",
    natureOfIllness: "",
    natureOfIllnessOthers: "",
    actionsTaken: [] as string[],
    referredTo: "",
    transportFrom: "",
    transportTo: "",
    othersDescription: "",
    vitalSigns: {
      temperature: "",
      pulseRate: "",
      respiratoryRate: "",
      bloodPressure: ""
    },
    responders: [] as Array<{
      id: string;
      team: string;
      driver: string;
      responder: string;
    }>
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
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] bg-white flex flex-col overflow-hidden">
            {/* Header Row: Title, ID, and Action Buttons */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Report Preview</h2>
                <div className="text-sm text-gray-700">{selectedReport?.id && `Report ID: ${selectedReport.id}`}</div>
              </div>
            </div>
            {/* Navigation Tabs */}
            <Tabs value={previewTab} onValueChange={setPreviewTab} className="w-full flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="directions">Directions</TabsTrigger>
                <TabsTrigger value="details">Report Details</TabsTrigger>
                <TabsTrigger value="dispatch">Dispatch Form</TabsTrigger>
              </TabsList>

              <TabsContent value="directions" className="mt-4 flex-1 min-h-0">
                <div className="bg-gray-200 rounded-lg h-full w-full relative" style={{ minHeight: '400px' }}>
                  {selectedReport ? (
                    <div 
                      id="report-map-container"
                      className="w-full h-full rounded-lg overflow-hidden"
                      style={{ minHeight: '400px' }}
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
                  ) : (
                    <div className="text-gray-500 text-center flex items-center justify-center h-full">
                      <div>
                        <MapPin className="h-12 w-12 mx-auto mb-2" />
                        <p>No location data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-4 flex-1 min-h-0 flex flex-col">
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
                <div className="flex-1 overflow-y-auto border rounded-lg min-h-0">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
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

              <TabsContent value="dispatch" className="mt-4 flex-1 min-h-0 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <div className="text-lg font-semibold text-gray-900">Dispatch Form</div>
                  <div className="flex gap-2 flex-wrap">
                    {isPreviewEditMode ? (
                      <Button size="sm" className="bg-[#FF4F0B] text-white hover:bg-[#FF4F0B]/90" onClick={() => {
                        console.log('Saving dispatch form:', dispatchData);
                        // Add save logic here
                        toast.success('Dispatch form saved successfully!');
                      }}>
                        Save
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsPreviewEditMode(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto border rounded-lg min-h-0">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table className="w-full min-w-[600px]">
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Received By</TableCell>
                          <TableCell>
                            {isPreviewEditMode ? (
                              <Select value={dispatchData.receivedBy} onValueChange={v => setDispatchData(d => ({ ...d, receivedBy: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select admin" /></SelectTrigger>
                                <SelectContent>
                                  {adminOptions.map(admin => <SelectItem key={admin} value={admin}>{admin}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              dispatchData.receivedBy || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Responders</TableCell>
                          <TableCell>
                            {isPreviewEditMode ? (
                              <div className="space-y-4">
                                {/* Options Management */}
                                <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                                  <div>
                                    <Label className="text-sm font-medium text-blue-800 mb-2 block">Manage Teams</Label>
                                    <div className="space-y-2">
                                      {teamOptions.map((team, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                          <span className="text-sm flex-1">{team}</span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              const newOptions = teamOptions.filter((_, i) => i !== index);
                                              setTeamOptions(newOptions);
                                            }}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder="Add new team"
                                          className="text-sm"
                                          onKeyPress={e => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                              setTeamOptions([...teamOptions, e.currentTarget.value.trim()]);
                                              e.currentTarget.value = '';
                                            }
                                          }}
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={e => {
                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                            if (input.value.trim()) {
                                              setTeamOptions([...teamOptions, input.value.trim()]);
                                              input.value = '';
                                            }
                                          }}
                                          className="h-8 px-2"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium text-blue-800 mb-2 block">Manage Drivers</Label>
                                    <div className="space-y-2">
                                      {driverOptions.map((driver, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                          <span className="text-sm flex-1">{driver}</span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              const newOptions = driverOptions.filter((_, i) => i !== index);
                                              setDriverOptions(newOptions);
                                            }}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder="Add new driver"
                                          className="text-sm"
                                          onKeyPress={e => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                              setDriverOptions([...driverOptions, e.currentTarget.value.trim()]);
                                              e.currentTarget.value = '';
                                            }
                                          }}
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={e => {
                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                            if (input.value.trim()) {
                                              setDriverOptions([...driverOptions, input.value.trim()]);
                                              input.value = '';
                                            }
                                          }}
                                          className="h-8 px-2"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium text-blue-800 mb-2 block">Manage Responder Types</Label>
                                    <div className="space-y-2">
                                      {responderOptions.map((responder, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                          <span className="text-sm flex-1">{responder}</span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              const newOptions = responderOptions.filter((_, i) => i !== index);
                                              setResponderOptions(newOptions);
                                            }}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder="Add new type"
                                          className="text-sm"
                                          onKeyPress={e => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                              setResponderOptions([...responderOptions, e.currentTarget.value.trim()]);
                                              e.currentTarget.value = '';
                                            }
                                          }}
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={e => {
                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                            if (input.value.trim()) {
                                              setResponderOptions([...responderOptions, input.value.trim()]);
                                              input.value = '';
                                            }
                                          }}
                                          className="h-8 px-2"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Responder Entries */}
                                <div className="space-y-3">
                                  {dispatchData.responders.map((responder, index) => (
                                    <div key={responder.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="flex-1 grid grid-cols-3 gap-2">
                                        <div>
                                          <Label className="text-xs text-gray-600">Team</Label>
                                          <Select
                                            value={responder.team}
                                            onValueChange={v => {
                                              const newResponders = [...dispatchData.responders];
                                              newResponders[index].team = v;
                                              setDispatchData(d => ({ ...d, responders: newResponders }));
                                            }}
                                          >
                                            <SelectTrigger className="text-sm">
                                              <SelectValue placeholder="Select team" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {teamOptions.map(option => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-600">Driver</Label>
                                          <Select
                                            value={responder.driver}
                                            onValueChange={v => {
                                              const newResponders = [...dispatchData.responders];
                                              newResponders[index].driver = v;
                                              setDispatchData(d => ({ ...d, responders: newResponders }));
                                            }}
                                          >
                                            <SelectTrigger className="text-sm">
                                              <SelectValue placeholder="Select driver" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {driverOptions.map(option => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-600">Responder Type</Label>
                                          <Select
                                            value={responder.responder}
                                            onValueChange={v => {
                                              const newResponders = [...dispatchData.responders];
                                              newResponders[index].responder = v;
                                              setDispatchData(d => ({ ...d, responders: newResponders }));
                                            }}
                                          >
                                            <SelectTrigger className="text-sm">
                                              <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {responderOptions.map(option => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const newResponders = dispatchData.responders.filter((_, i) => i !== index);
                                          setDispatchData(d => ({ ...d, responders: newResponders }));
                                        }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const newResponder = {
                                        id: Date.now().toString(),
                                        team: "",
                                        driver: "",
                                        responder: ""
                                      };
                                      setDispatchData(d => ({ ...d, responders: [...d.responders, newResponder] }));
                                    }}
                                    className="w-full"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Responder
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {dispatchData.responders.length > 0 ? (
                                  dispatchData.responders.map((responder, index) => (
                                    <div key={responder.id} className="p-2 bg-gray-50 rounded text-sm">
                                      <div className="font-medium">{responder.team || "No team selected"}</div>
                                      <div className="text-gray-600">
                                        Driver: {responder.driver || "No driver selected"} | 
                                        Type: {responder.responder || "No type selected"}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  "No responders specified"
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Time Call Received</TableCell>
                          <TableCell>
                            {isPreviewEditMode ? (
                              <Input 
                                type="time" 
                                value={dispatchData.timeCallReceived} 
                                onChange={e => setDispatchData(d => ({ ...d, timeCallReceived: e.target.value }))} 
                              />
                            ) : (
                              dispatchData.timeCallReceived || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Time of Dispatch</TableCell>
                          <TableCell>
                            {isPreviewEditMode ? (
                              <Input 
                                type="time" 
                                value={dispatchData.timeOfDispatch} 
                                onChange={e => setDispatchData(d => ({ ...d, timeOfDispatch: e.target.value }))} 
                              />
                            ) : (
                              dispatchData.timeOfDispatch || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Time of Arrival</TableCell>
                          <TableCell>
                            {isPreviewEditMode ? (
                              <Input 
                                type="time" 
                                value={dispatchData.timeOfArrival} 
                                onChange={e => setDispatchData(d => ({ ...d, timeOfArrival: e.target.value }))} 
                              />
                            ) : (
                              dispatchData.timeOfArrival || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Response Time</TableCell>
                          <TableCell>
                            {dispatchData.timeOfDispatch && dispatchData.timeOfArrival ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-blue-600">
                                  {calculateResponseTime(dispatchData.timeOfDispatch, dispatchData.timeOfArrival)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({calculateResponseTimeMinutes(dispatchData.timeOfDispatch, dispatchData.timeOfArrival)} minutes)
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500">Calculate after entering dispatch and arrival times</span>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Hospital Arrival</TableCell>
                          <TableCell>
                            {isPreviewEditMode ? (
                              <Input 
                                type="time" 
                                value={dispatchData.hospitalArrival} 
                                onChange={e => setDispatchData(d => ({ ...d, hospitalArrival: e.target.value }))} 
                              />
                            ) : (
                              dispatchData.hospitalArrival || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Returned to OPCEN</TableCell>
                          <TableCell>
                            {isPreviewEditMode ? (
                              <Input 
                                type="time" 
                                value={dispatchData.returnedToOpcen} 
                                onChange={e => setDispatchData(d => ({ ...d, returnedToOpcen: e.target.value }))} 
                              />
                            ) : (
                              dispatchData.returnedToOpcen || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Disaster Related</TableCell>
                          <TableCell>
                            {isPreviewEditMode ? (
                              <Select value={dispatchData.disasterRelated} onValueChange={v => setDispatchData(d => ({ ...d, disasterRelated: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              dispatchData.disasterRelated ? (
                                <Badge className={dispatchData.disasterRelated === "Yes" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                                  {dispatchData.disasterRelated}
                                </Badge>
                              ) : (
                                "Not specified"
                              )
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Agency Present</TableCell>
                          <TableCell>
                            {isPreviewEditMode ? (
                              <Select value={dispatchData.agencyPresent} onValueChange={v => setDispatchData(d => ({ ...d, agencyPresent: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                                <SelectContent>
                                  {agencyOptions.map(agency => <SelectItem key={agency} value={agency}>{agency}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              dispatchData.agencyPresent ? (
                                <Badge className="bg-blue-100 text-blue-800">
                                  {dispatchData.agencyPresent}
                                </Badge>
                              ) : (
                                "Not specified"
                              )
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Type of Emergency</TableCell>
                          <TableCell>
                            {isPreviewEditMode ? (
                              <Select value={dispatchData.typeOfEmergency} onValueChange={v => setDispatchData(d => ({ 
                                ...d, 
                                typeOfEmergency: v, 
                                injuryClassification: "", 
                                majorInjuryTypes: [], 
                                minorInjuryTypes: [],
                                medicalClassification: "",
                                majorMedicalSymptoms: [],
                                minorMedicalSymptoms: [],
                                chiefComplaint: "",
                                diagnosis: "",
                                natureOfIllness: "",
                                natureOfIllnessOthers: "",
                                actionsTaken: [],
                                referredTo: "",
                                transportFrom: "",
                                transportTo: "",
                                othersDescription: "",
                                vitalSigns: {
                                  temperature: "",
                                  pulseRate: "",
                                  respiratoryRate: "",
                                  bloodPressure: ""
                                },
                                responders: []
                              }))}>
                                <SelectTrigger><SelectValue placeholder="Select emergency type" /></SelectTrigger>
                                <SelectContent>
                                  {emergencyTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              dispatchData.typeOfEmergency ? (
                                <Badge className="bg-orange-100 text-orange-800">
                                  {dispatchData.typeOfEmergency}
                                </Badge>
                              ) : (
                                "Not specified"
                              )
                            )}
                          </TableCell>
                        </TableRow>
                        
                        {/* Road Crash Specific Fields */}
                        {dispatchData.typeOfEmergency === "Road Crash" && (
                          <>
                            <TableRow>
                              <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Classification of Injury</TableCell>
                              <TableCell>
                                {isPreviewEditMode ? (
                                  <Select value={dispatchData.injuryClassification} onValueChange={v => setDispatchData(d => ({ ...d, injuryClassification: v, majorInjuryTypes: [], minorInjuryTypes: [] }))}>
                                    <SelectTrigger><SelectValue placeholder="Select injury classification" /></SelectTrigger>
                                    <SelectContent>
                                      {injuryClassificationOptions.map(classification => <SelectItem key={classification} value={classification}>{classification}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  dispatchData.injuryClassification ? (
                                    <Badge className={dispatchData.injuryClassification === "Major" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                                      {dispatchData.injuryClassification}
                                    </Badge>
                                  ) : (
                                    "Not specified"
                                  )
                                )}
                              </TableCell>
                            </TableRow>
                            
                            {/* Major Injury Types */}
                            {dispatchData.injuryClassification === "Major" && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Major Injury Types</TableCell>
                                <TableCell>
                                  {isPreviewEditMode ? (
                                    <div className="space-y-2">
                                      {majorInjuryTypeOptions.map((injuryType) => (
                                        <div key={injuryType} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`major-${injuryType}`}
                                            checked={dispatchData.majorInjuryTypes.includes(injuryType)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setDispatchData(d => ({
                                                  ...d,
                                                  majorInjuryTypes: [...d.majorInjuryTypes, injuryType]
                                                }));
                                              } else {
                                                setDispatchData(d => ({
                                                  ...d,
                                                  majorInjuryTypes: d.majorInjuryTypes.filter(type => type !== injuryType)
                                                }));
                                              }
                                            }}
                                          />
                                          <Label htmlFor={`major-${injuryType}`} className="text-sm">
                                            {injuryType}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    dispatchData.majorInjuryTypes.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {dispatchData.majorInjuryTypes.map((injuryType, index) => (
                                          <Badge key={index} className="bg-red-100 text-red-800 text-xs">
                                            {injuryType}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      "No major injury types selected"
                                    )
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                            
                            {/* Minor Injury Types */}
                            {dispatchData.injuryClassification === "Minor" && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Minor Injury Types</TableCell>
                                <TableCell>
                                  {isPreviewEditMode ? (
                                    <div className="space-y-2">
                                      {minorInjuryTypeOptions.map((injuryType) => (
                                        <div key={injuryType} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`minor-${injuryType}`}
                                            checked={dispatchData.minorInjuryTypes.includes(injuryType)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setDispatchData(d => ({
                                                  ...d,
                                                  minorInjuryTypes: [...d.minorInjuryTypes, injuryType]
                                                }));
                                              } else {
                                                setDispatchData(d => ({
                                                  ...d,
                                                  minorInjuryTypes: d.minorInjuryTypes.filter(type => type !== injuryType)
                                                }));
                                              }
                                            }}
                                          />
                                          <Label htmlFor={`minor-${injuryType}`} className="text-sm">
                                            {injuryType}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    dispatchData.minorInjuryTypes.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {dispatchData.minorInjuryTypes.map((injuryType, index) => (
                                          <Badge key={index} className="bg-yellow-100 text-yellow-800 text-xs">
                                            {injuryType}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      "No minor injury types selected"
                                    )
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )}
                        
                        {/* Medical Emergency Specific Fields */}
                        {dispatchData.typeOfEmergency === "Medical Emergency" && (
                          <>
                            <TableRow>
                              <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Medical Classification</TableCell>
                              <TableCell>
                                {isPreviewEditMode ? (
                                  <Select value={dispatchData.medicalClassification} onValueChange={v => setDispatchData(d => ({ ...d, medicalClassification: v, majorMedicalSymptoms: [], minorMedicalSymptoms: [] }))}>
                                    <SelectTrigger><SelectValue placeholder="Select medical classification" /></SelectTrigger>
                                    <SelectContent>
                                      {injuryClassificationOptions.map(classification => <SelectItem key={classification} value={classification}>{classification}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  dispatchData.medicalClassification ? (
                                    <Badge className={dispatchData.medicalClassification === "Major" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                                      {dispatchData.medicalClassification}
                                    </Badge>
                                  ) : (
                                    "Not specified"
                                  )
                                )}
                              </TableCell>
                            </TableRow>
                            
                            {/* Major Medical Symptoms */}
                            {dispatchData.medicalClassification === "Major" && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Major Medical Symptoms</TableCell>
                                <TableCell>
                                  {isPreviewEditMode ? (
                                    <div className="space-y-2">
                                      {majorMedicalSymptomsOptions.map((symptom) => (
                                        <div key={symptom} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`major-medical-${symptom}`}
                                            checked={dispatchData.majorMedicalSymptoms.includes(symptom)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setDispatchData(d => ({
                                                  ...d,
                                                  majorMedicalSymptoms: [...d.majorMedicalSymptoms, symptom]
                                                }));
                                              } else {
                                                setDispatchData(d => ({
                                                  ...d,
                                                  majorMedicalSymptoms: d.majorMedicalSymptoms.filter(s => s !== symptom)
                                                }));
                                              }
                                            }}
                                          />
                                          <Label htmlFor={`major-medical-${symptom}`} className="text-sm">
                                            {symptom}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    dispatchData.majorMedicalSymptoms.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {dispatchData.majorMedicalSymptoms.map((symptom, index) => (
                                          <Badge key={index} className="bg-red-100 text-red-800 text-xs">
                                            {symptom}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      "No major medical symptoms selected"
                                    )
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                            
                            {/* Minor Medical Symptoms */}
                            {dispatchData.medicalClassification === "Minor" && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Minor Medical Symptoms</TableCell>
                                <TableCell>
                                  {isPreviewEditMode ? (
                                    <div className="space-y-2">
                                      {minorMedicalSymptomsOptions.map((symptom) => (
                                        <div key={symptom} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`minor-medical-${symptom}`}
                                            checked={dispatchData.minorMedicalSymptoms.includes(symptom)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setDispatchData(d => ({
                                                  ...d,
                                                  minorMedicalSymptoms: [...d.minorMedicalSymptoms, symptom]
                                                }));
                                              } else {
                                                setDispatchData(d => ({
                                                  ...d,
                                                  minorMedicalSymptoms: d.minorMedicalSymptoms.filter(s => s !== symptom)
                                                }));
                                              }
                                            }}
                                          />
                                          <Label htmlFor={`minor-medical-${symptom}`} className="text-sm">
                                            {symptom}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    dispatchData.minorMedicalSymptoms.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {dispatchData.minorMedicalSymptoms.map((symptom, index) => (
                                          <Badge key={index} className="bg-yellow-100 text-yellow-800 text-xs">
                                            {symptom}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      "No minor medical symptoms selected"
                                    )
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )}
                        
                        {/* Medical Assistance Specific Fields */}
                        {dispatchData.typeOfEmergency === "Medical Assistance" && (
                          <>
                            <TableRow>
                              <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Chief Complaint</TableCell>
                              <TableCell>
                                {isPreviewEditMode ? (
                                  <Textarea 
                                    value={dispatchData.chiefComplaint} 
                                    onChange={e => setDispatchData(d => ({ ...d, chiefComplaint: e.target.value }))} 
                                    placeholder="Enter chief complaint (short description)"
                                    className="min-h-[80px]"
                                  />
                                ) : (
                                  dispatchData.chiefComplaint || "Not specified"
                                )}
                              </TableCell>
                            </TableRow>
                            
                            <TableRow>
                              <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Diagnosis</TableCell>
                              <TableCell>
                                {isPreviewEditMode ? (
                                  <Textarea 
                                    value={dispatchData.diagnosis} 
                                    onChange={e => setDispatchData(d => ({ ...d, diagnosis: e.target.value }))} 
                                    placeholder="Enter diagnosis (short description)"
                                    className="min-h-[80px]"
                                  />
                                ) : (
                                  dispatchData.diagnosis || "Not specified"
                                )}
                              </TableCell>
                            </TableRow>
                            
                            <TableRow>
                              <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Nature of Illness</TableCell>
                              <TableCell>
                                {isPreviewEditMode ? (
                                  <div className="space-y-3">
                                    <RadioGroup 
                                      value={dispatchData.natureOfIllness} 
                                      onValueChange={v => setDispatchData(d => ({ ...d, natureOfIllness: v, natureOfIllnessOthers: "" }))}
                                    >
                                      {natureOfIllnessOptions.map((illness) => (
                                        <div key={illness} className="flex items-center space-x-2">
                                          <RadioGroupItem value={illness} id={`illness-${illness}`} />
                                          <Label htmlFor={`illness-${illness}`} className="text-sm">
                                            {illness}
                                          </Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                    
                                    {dispatchData.natureOfIllness === "Others" && (
                                      <div className="mt-2">
                                        <Label htmlFor="nature-of-illness-others" className="text-sm font-medium">
                                          Please specify:
                                        </Label>
                                        <Input 
                                          id="nature-of-illness-others"
                                          value={dispatchData.natureOfIllnessOthers} 
                                          onChange={e => setDispatchData(d => ({ ...d, natureOfIllnessOthers: e.target.value }))} 
                                          placeholder="Enter nature of illness"
                                          className="mt-1"
                                        />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    {dispatchData.natureOfIllness ? (
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-blue-100 text-blue-800">
                                          {dispatchData.natureOfIllness}
                                        </Badge>
                                        {dispatchData.natureOfIllness === "Others" && dispatchData.natureOfIllnessOthers && (
                                          <span className="text-sm text-gray-600">
                                            - {dispatchData.natureOfIllnessOthers}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      "Not specified"
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          </>
                        )}
                        
                        {/* Actions Taken Field - appears for any emergency type */}
                        {dispatchData.typeOfEmergency && (
                          <TableRow>
                            <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Actions Taken</TableCell>
                            <TableCell>
                              {isPreviewEditMode ? (
                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    {actionsTakenOptions.map((action) => (
                                      <div key={action} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`action-${action}`}
                                          checked={dispatchData.actionsTaken.includes(action)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setDispatchData(d => ({
                                                ...d,
                                                actionsTaken: [...d.actionsTaken, action]
                                              }));
                                            } else {
                                              setDispatchData(d => ({
                                                ...d,
                                                actionsTaken: d.actionsTaken.filter(a => a !== action)
                                              }));
                                            }
                                          }}
                                        />
                                        <Label htmlFor={`action-${action}`} className="text-sm">
                                          {action}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Additional input fields for specific actions */}
                                  {dispatchData.actionsTaken.includes("Vital Signs Taken (Temperature, pulse rate, respiratory rate, blood pressure)") && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                      <Label className="text-sm font-medium text-gray-800 mb-3 block">
                                        Vital Signs Details (Optional - fill in available measurements):
                                      </Label>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <Label htmlFor="temperature" className="text-sm text-gray-700">
                                            Temperature (°C):
                                          </Label>
                                          <Input 
                                            id="temperature"
                                            type="number"
                                            step="0.1"
                                            value={dispatchData.vitalSigns.temperature} 
                                            onChange={e => setDispatchData(d => ({ 
                                              ...d, 
                                              vitalSigns: { ...d.vitalSigns, temperature: e.target.value }
                                            }))} 
                                            placeholder="e.g., 37.2"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="pulse-rate" className="text-sm text-gray-700">
                                            Pulse Rate (bpm):
                                          </Label>
                                          <Input 
                                            id="pulse-rate"
                                            type="number"
                                            value={dispatchData.vitalSigns.pulseRate} 
                                            onChange={e => setDispatchData(d => ({ 
                                              ...d, 
                                              vitalSigns: { ...d.vitalSigns, pulseRate: e.target.value }
                                            }))} 
                                            placeholder="e.g., 80"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="respiratory-rate" className="text-sm text-gray-700">
                                            Respiratory Rate (breaths/min):
                                          </Label>
                                          <Input 
                                            id="respiratory-rate"
                                            type="number"
                                            value={dispatchData.vitalSigns.respiratoryRate} 
                                            onChange={e => setDispatchData(d => ({ 
                                              ...d, 
                                              vitalSigns: { ...d.vitalSigns, respiratoryRate: e.target.value }
                                            }))} 
                                            placeholder="e.g., 16"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="blood-pressure" className="text-sm text-gray-700">
                                            Blood Pressure (mmHg):
                                          </Label>
                                          <Input 
                                            id="blood-pressure"
                                            value={dispatchData.vitalSigns.bloodPressure} 
                                            onChange={e => setDispatchData(d => ({ 
                                              ...d, 
                                              vitalSigns: { ...d.vitalSigns, bloodPressure: e.target.value }
                                            }))} 
                                            placeholder="e.g., 120/80"
                                            className="mt-1"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {dispatchData.actionsTaken.includes("Referred to (Short Desc)") && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                      <Label htmlFor="referred-to" className="text-sm font-medium text-gray-800">
                                        Referred to:
                                      </Label>
                                      <Input 
                                        id="referred-to"
                                        value={dispatchData.referredTo} 
                                        onChange={e => setDispatchData(d => ({ ...d, referredTo: e.target.value }))} 
                                        placeholder="Enter who the patient was referred to (e.g., Dr. Smith, General Hospital, Specialist Clinic)"
                                        className="mt-1"
                                      />
                                    </div>
                                  )}
                                  
                                  {dispatchData.actionsTaken.includes("Transport from (Place from) to (Place to)") && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                      <Label className="text-sm font-medium text-gray-800 mb-3 block">
                                        Transport Details:
                                      </Label>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <Label htmlFor="transport-from" className="text-sm text-gray-700">
                                            Transport from:
                                          </Label>
                                          <Input 
                                            id="transport-from"
                                            value={dispatchData.transportFrom} 
                                            onChange={e => setDispatchData(d => ({ ...d, transportFrom: e.target.value }))} 
                                            placeholder="e.g., Scene of accident, Patient's home, Current location"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="transport-to" className="text-sm text-gray-700">
                                            Transport to:
                                          </Label>
                                          <Input 
                                            id="transport-to"
                                            value={dispatchData.transportTo} 
                                            onChange={e => setDispatchData(d => ({ ...d, transportTo: e.target.value }))} 
                                            placeholder="e.g., General Hospital, Emergency Room, Specialist Clinic"
                                            className="mt-1"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {dispatchData.actionsTaken.includes("Others (Short Desc)") && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                      <Label htmlFor="others-description" className="text-sm font-medium text-gray-800">
                                        Others - Please specify:
                                      </Label>
                                      <Input 
                                        id="others-description"
                                        value={dispatchData.othersDescription} 
                                        onChange={e => setDispatchData(d => ({ ...d, othersDescription: e.target.value }))} 
                                        placeholder="Enter other actions taken"
                                        className="mt-1"
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {dispatchData.actionsTaken.length > 0 ? (
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap gap-1">
                                        {dispatchData.actionsTaken.map((action, index) => (
                                          <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                                            {action}
                                          </Badge>
                                        ))}
                                      </div>
                                      
                                      {/* Show additional details for specific actions */}
                                      {dispatchData.actionsTaken.includes("Vital Signs Taken (Temperature, pulse rate, respiratory rate, blood pressure)") && (
                                        dispatchData.vitalSigns.temperature || dispatchData.vitalSigns.pulseRate || dispatchData.vitalSigns.respiratoryRate || dispatchData.vitalSigns.bloodPressure
                                      ) && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                                          <span className="font-medium text-gray-800 block mb-2">Vital Signs:</span>
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            {dispatchData.vitalSigns.temperature && (
                                              <div><span className="font-medium">Temperature:</span> {dispatchData.vitalSigns.temperature}°C</div>
                                            )}
                                            {dispatchData.vitalSigns.pulseRate && (
                                              <div><span className="font-medium">Pulse Rate:</span> {dispatchData.vitalSigns.pulseRate} bpm</div>
                                            )}
                                            {dispatchData.vitalSigns.respiratoryRate && (
                                              <div><span className="font-medium">Respiratory Rate:</span> {dispatchData.vitalSigns.respiratoryRate} breaths/min</div>
                                            )}
                                            {dispatchData.vitalSigns.bloodPressure && (
                                              <div><span className="font-medium">Blood Pressure:</span> {dispatchData.vitalSigns.bloodPressure} mmHg</div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {dispatchData.actionsTaken.includes("Referred to (Short Desc)") && dispatchData.referredTo && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                          <span className="font-medium text-gray-800">Referred to:</span> {dispatchData.referredTo}
                                        </div>
                                      )}
                                      
                                      {dispatchData.actionsTaken.includes("Transport from (Place from) to (Place to)") && (dispatchData.transportFrom || dispatchData.transportTo) && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                          <span className="font-medium text-gray-800">Transport:</span> {dispatchData.transportFrom} to {dispatchData.transportTo}
                                        </div>
                                      )}
                                      
                                      {dispatchData.actionsTaken.includes("Others (Short Desc)") && dispatchData.othersDescription && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                          <span className="font-medium text-gray-800">Others:</span> {dispatchData.othersDescription}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    "No actions taken specified"
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
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
