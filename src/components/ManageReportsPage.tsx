import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Edit, Trash2, Plus, FileText, Calendar, Clock, MapPin, Upload, FileIcon, Image, Printer, Download, X, Search } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapboxMap } from "./MapboxMap";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, getDocs, getDoc, where, updateDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { toast } from "@/components/ui/sonner";

export function ManageReportsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [viewedReports, setViewedReports] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Fetch current user information
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
        
        if (adminLoggedIn) {
          // Admin user - fetch from admins collection using username
          const username = localStorage.getItem("adminUsername");
          if (username) {
            const q = query(collection(db, "admins"), where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const data = querySnapshot.docs[0].data();
              setCurrentUser({
                id: querySnapshot.docs[0].id,
                username: data.username || username,
                name: data.name || data.fullName || username,
                userType: "admin"
              });
              return;
            }
          }
        } else {
          // Super admin user - fetch from superAdmin collection using email
          const authUser = getAuth().currentUser;
          if (authUser && authUser.email) {
            const q = query(collection(db, "superAdmin"), where("email", "==", authUser.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const data = querySnapshot.docs[0].data();
              setCurrentUser({
                id: querySnapshot.docs[0].id,
                username: data.username || authUser.email?.split("@")[0] || "Super Admin",
                name: data.fullName || data.name || "Super Admin",
                userType: "superadmin"
              });
              return;
            }
            // Fallback for super admin not found in collection
            setCurrentUser({
              id: authUser.uid,
              username: authUser.email?.split("@")[0] || "Super Admin",
              name: authUser.displayName || authUser.email?.split("@")[0] || "Super Admin",
              userType: "superadmin"
            });
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    }
    fetchCurrentUser();
  }, []);
  
  // Fetch reports from Firestore in real-time
  useEffect(() => {
    try {
      const reportsQuery = query(collection(db, "reports"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        console.log("Snapshot received:", snapshot.docs.length, "documents");
        
        const fetched = snapshot.docs.map((doc, index) => {
          const data: any = doc.data() || {};
          
          // Map timestamp to dateSubmitted and timeSubmitted
          let dateSubmitted = "";
          let timeSubmitted = "";
          try {
            const timestamp: any = data.timestamp;
            if (timestamp) {
              let d;
              if (typeof timestamp.toDate === "function") {
                d = timestamp.toDate();
              } else if (timestamp instanceof Date) {
                d = timestamp;
              } else if (typeof timestamp === "number") {
                d = new Date(timestamp);
              } else if (typeof timestamp === "string") {
                d = new Date(timestamp);
              }
              
              if (d && !isNaN(d.getTime())) {
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
            }
          } catch (error) {
            console.log("Error parsing timestamp:", error);
          }

          // Map imageUrls to attachedMedia (from mobile users)
          const mobileMedia = Array.isArray(data.imageUrls) ? data.imageUrls : [];
          
          // Get admin-added media from the report data
          const adminMedia = Array.isArray(data.adminMedia) ? data.adminMedia : [];

          // Use default coordinates if Firebase data doesn't have separate lat/lng fields
          const defaultLatitude = 14.1139;  // Lucban, Quezon
          const defaultLongitude = 121.5556; // Lucban, Quezon

          return {
            id: data.reportId || doc.id,
            firestoreId: doc.id, // Store the actual Firestore document ID for deletion
            userId: data.userId || "",
            type: data.reportType || "", // Map from Firestore reportType field
            reportedBy: data.reporterName || "", // Map from Firestore reporterName field
            barangay: "", // Not in your schema, will show empty
            description: data.description || "",
            responders: "", // Not in your schema, will show empty
            location: data.locationName || data.location || "", // Use locationName from Firestore, fallback to location
            dateSubmitted,
            timeSubmitted,
            status: data.status || "Pending",
            mobileMedia,
            adminMedia,
            attachedDocument: "", // Not in your schema, will show empty
            mobileNumber: data.reporterMobile || "", // Map from Firestore reporterMobile field
            timeOfDispatch: "", // Not in your schema, will show empty
            timeOfArrival: "", // Not in your schema, will show empty
            // Use separate latitude and longitude fields from Firestore
            latitude: data.latitude || defaultLatitude,
            longitude: data.longitude || defaultLongitude,
            // Keep coordinates for backward compatibility (formatted as string)
            coordinates: data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : `${defaultLatitude}, ${defaultLongitude}`
          };
        });
        
        console.log("Processed reports:", fetched.length, "reports");
        console.log("Report IDs:", fetched.map(r => r.id));
        
        // Check for new reports and trigger alert (only if count increased)
        if (previousReportCount > 0 && fetched.length > previousReportCount) {
          const newReports = fetched.slice(0, fetched.length - previousReportCount);
          if (newReports.length > 0) {
            const latestNewReport = newReports[0];
            console.log("New report detected:", latestNewReport);
            
            // Set alert data and show modal
            setNewReportData(latestNewReport);
            setShowNewReportAlert(true);
            
            // Play alarm sound
            playAlarmSound();
            
            // Auto-hide alert after 10 seconds
            setTimeout(() => {
              setShowNewReportAlert(false);
            }, 10000);
          }
        }
        
        // Always update the reports state (this handles deletions automatically)
        setPreviousReportCount(fetched.length);
        setReports(fetched);
        
        console.log("Reports state updated with", fetched.length, "reports");
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Error subscribing to reports:", err);
    }
  }, []);

  // Fetch team members from database
  useEffect(() => {
    fetchTeamMembers();
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
  const handleDeleteReport = (reportId: string) => {
    setReportToDelete(reportId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteReport = async () => {
    if (!reportToDelete) {
      console.error("No report ID to delete");
      return;
    }

    console.log("Attempting to delete report:", reportToDelete);

    try {
      // Delete the report from Firestore
      await deleteDoc(doc(db, "reports", reportToDelete));
      console.log("Successfully deleted report from Firestore:", reportToDelete);
      
      // Remove from viewed reports if it exists
      setViewedReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportToDelete);
        console.log("Removed from viewed reports:", reportToDelete);
        return newSet;
      });
      
      // Remove from selected reports if it exists
      setSelectedReports(prev => {
        const filtered = prev.filter(id => id !== reportToDelete);
        console.log("Removed from selected reports:", reportToDelete);
        return filtered;
      });
      
      toast.success("Report deleted successfully");
      setShowDeleteDialog(false);
      setReportToDelete(null);
      
      // Force a small delay to ensure Firestore listener has processed the change
      setTimeout(() => {
        console.log("Delete operation completed");
      }, 100);
      
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report. Please try again.");
    }
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
  const barangayOptions = [
    "Abang", "Aliliw", "Atulinao", "Ayuti", 
    "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5", 
    "Barangay 6", "Barangay 7", "Barangay 8", "Barangay 9", "Barangay 10", 
    "Igang", "Kabatete", "Kakawit", "Kalangay", "Kalyaat", "Kilib", 
    "Kulapi", "Mahabang Parang", "Malupak", "Manasa", "May-it", 
    "Nagsinamo", "Nalunao", "Palola", "Piis", "Samil", "Tiawe", "Tinamnan"
  ];
  const [adminOptions, setAdminOptions] = useState(["Admin 1", "Admin 2", "Admin 3", "Admin 4", "Admin 5"]);
  const [agencyOptions, setAgencyOptions] = useState(["PNP", "BFP", "MTMO", "BPOC"]);
  const emergencyTypeOptions = ["Road Crash", "Medical Assistance", "Medical Emergency"];
  const vehicleInvolvedOptions = [
    "MV to MV",
    "MV to Object on the road",
    "MV loss of control",
    "Pedestrian Struck",
    "Bicycle Struck"
  ];
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
  // Team definitions for automatic assignment - now dynamic from database
  const [teamAlpha, setTeamAlpha] = useState<string[]>([]);
  const [teamSulu, setTeamSulu] = useState<string[]>([]);
  
  // Team management state
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [selectedTeamForManagement, setSelectedTeamForManagement] = useState<"Team Alpha" | "Team Sulu">("Team Alpha");

  const [driverOptions, setDriverOptions] = useState([
    "John Smith",
    "Jane Doe",
    "Mike Johnson",
    "Sarah Wilson",
    "David Brown"
  ]);
  const [responderOptions, setResponderOptions] = useState([
    "John Smith",
    "Jane Doe",
    "Mike Johnson",
    "Sarah Wilson",
    "David Brown",
    "Lisa Garcia",
    "Robert Martinez",
    "Emily Davis",
    "Michael Rodriguez"
  ]);
  const truncateLocation = (location: string, maxLength: number = 30) => {
    return location.length > maxLength ? `${location.substring(0, maxLength)}...` : location;
  };
  
  // Filter and paginate reports
  const filteredReports = reports.filter(report => {
    // Search filter
    const searchMatch = searchTerm === "" || 
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter - convert kebab-case to Title Case for matching
    const typeMatch = typeFilter === "all" || 
      report.type === typeFilter || 
      report.type?.toLowerCase().replace(/ /g, '-') === typeFilter.toLowerCase();
    
    // Status filter - convert kebab-case to Title Case for matching
    const statusMatch = statusFilter === "all" || 
      report.status === statusFilter ||
      report.status?.toLowerCase().replace(/ /g, '-') === statusFilter.toLowerCase();
    
    // Date filter
    let dateMatch = true;
    if (date?.from) {
      try {
        const [month, day, year] = report.dateSubmitted.split('/');
        const fullYear = 2000 + parseInt(year);
        const reportDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        
        if (date.from) {
          dateMatch = reportDate >= date.from;
        }
        if (date.to && dateMatch) {
          dateMatch = reportDate <= date.to;
        }
      } catch (error) {
        dateMatch = true;
      }
    }
    
    return searchMatch && typeMatch && statusMatch && dateMatch;
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, date]);
  
  // Calculate dynamic statistics
  const totalReports = reports.length;
  
  const reportsThisWeek = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return reports.filter(report => {
      try {
        if (!report.dateSubmitted || !report.timeSubmitted) return false;
        
        // Parse MM/DD/YY format
        const [month, day, year] = report.dateSubmitted.split('/');
        const fullYear = 2000 + parseInt(year);
        
        // Parse HH:MM AM/PM format
        const timeMatch = report.timeSubmitted.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) return false;
        
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        const reportDate = new Date(fullYear, parseInt(month) - 1, parseInt(day), hours, minutes);
        
        return reportDate >= oneWeekAgo && reportDate <= now;
      } catch (error) {
        console.error('Error parsing report date:', error);
        return false;
      }
    }).length;
  }, [reports]);
  
  const pendingReports = reports.filter(report => report.status === 'Pending').length;
  
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handleBatchStatusUpdate = (newStatus: string) => {
    console.log(`Updating status to ${newStatus} for reports:`, selectedReports);
    // Implement the actual status update logic here
  };
  const handleBatchDelete = () => {
    setShowBatchDeleteDialog(true);
  };

  const confirmBatchDelete = async () => {
    if (!selectedReports || selectedReports.length === 0) {
      console.error("No reports selected for deletion");
      return;
    }

    console.log("Attempting to delete reports:", selectedReports);

    try {
      // Delete all selected reports from Firestore
      const deletePromises = selectedReports.map(reportId => {
        console.log("Deleting report:", reportId);
        return deleteDoc(doc(db, "reports", reportId));
      });
      
      await Promise.all(deletePromises);
      console.log("Successfully deleted all reports from Firestore");
      
      // Remove from viewed reports
      setViewedReports(prev => {
        const newSet = new Set(prev);
        selectedReports.forEach(id => {
          newSet.delete(id);
          console.log("Removed from viewed reports:", id);
        });
        return newSet;
      });
      
      // Clear selected reports
      setSelectedReports([]);
      
      toast.success(`Successfully deleted ${selectedReports.length} report(s)`);
      setShowBatchDeleteDialog(false);
      
      // Force a small delay to ensure Firestore listener has processed the changes
      setTimeout(() => {
        console.log("Batch delete operation completed");
      }, 100);
      
    } catch (error) {
      console.error("Error deleting reports:", error);
      toast.error("Failed to delete some reports. Please try again.");
    }
  };
  const handleCheckboxChange = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Add all reports on current page to selection
      const pageReportIds = paginatedReports.map(report => report.firestoreId);
      setSelectedReports(prev => [...new Set([...prev, ...pageReportIds])]);
    } else {
      // Remove all reports on current page from selection
      const pageReportIds = paginatedReports.map(report => report.firestoreId);
      setSelectedReports(prev => prev.filter(id => !pageReportIds.includes(id)));
    }
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

  // Function to determine if a report is "new" (within last 24 hours and not viewed)
  const isNewReport = (report: any) => {
    try {
      // Check if report has already been viewed
      if (viewedReports.has(report.id)) {
        return false;
      }

      // Parse the date and time from the report
      const [datePart, timePart] = [report.dateSubmitted, report.timeSubmitted];
      if (!datePart || !timePart) return false;
      
      // Parse MM/DD/YY format
      const [month, day, year] = datePart.split('/');
      const fullYear = 2000 + parseInt(year);
      
      // Parse HH:MM AM/PM format
      const timeMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return false;
      
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3].toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      // Create the report timestamp
      const reportDate = new Date(fullYear, parseInt(month) - 1, parseInt(day), hours, minutes);
      const now = new Date();
      const diffInHours = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60);
      
      // Consider "new" if within last 24 hours and not viewed
      return diffInHours <= 24 && diffInHours >= 0;
    } catch (error) {
      console.error('Error checking if report is new:', error);
      return false;
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
  const [isDispatchEditMode, setIsDispatchEditMode] = useState(false);
  const [isPatientEditMode, setIsPatientEditMode] = useState(false);
  const [previewEditData, setPreviewEditData] = useState<any>(null);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [newLocation, setNewLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; name: string; userType: string } | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [previewImageName, setPreviewImageName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // New report alert state
  const [showNewReportAlert, setShowNewReportAlert] = useState(false);
  const [newReportData, setNewReportData] = useState<any>(null);
  const [previousReportCount, setPreviousReportCount] = useState(0);

  // Helper function to get current time in HH:MM AM/PM format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert to 12-hour format
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Helper function to get current time in HH:MM (24-hour) format for time inputs
  const getCurrentTime24Hour = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Function to play alarming sound for new reports
  const playAlarmSound = () => {
    try {
      // Play the custom alarm sound from the uploaded MP3 file
      const audio = new Audio('/accizard-uploads/alarmsoundfx.mp3');
      audio.volume = 0.7; // Adjust volume as needed (0.0 to 1.0)
      
      // Set a timeout to fall back to Web Audio API if MP3 fails to load
      const fallbackTimeout = setTimeout(() => {
        console.log("MP3 loading too slow, falling back to Web Audio API");
        playWebAudioAlarm();
      }, 2000); // 2 second timeout
      
      audio.addEventListener('canplaythrough', () => {
        clearTimeout(fallbackTimeout); // Cancel fallback if MP3 loads successfully
        audio.play().catch((error) => {
          console.log("MP3 playback failed, using fallback:", error);
          playWebAudioAlarm();
        });
      });
      
      audio.addEventListener('error', () => {
        clearTimeout(fallbackTimeout);
        console.log("MP3 file error, using fallback");
        playWebAudioAlarm();
      });
      
      // Start loading the audio
      audio.load();
      
    } catch (error) {
      console.log("Error initializing MP3 alarm, using fallback:", error);
      playWebAudioAlarm();
    }
  };

  // Fallback function using Web Audio API
  const playWebAudioAlarm = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // More attention-grabbing alarm pattern
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.4);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.6);
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.0);
    } catch (error) {
      console.log("Web Audio API also failed:", error);
      // Final fallback: try to play a simple beep using a data URL
      try {
        const fallbackAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        fallbackAudio.volume = 0.3;
        fallbackAudio.play().catch(() => console.log("Final fallback audio also failed"));
      } catch (finalError) {
        console.log("All audio playback methods failed:", finalError);
      }
    }
  };

  // Function to automatically assign responders based on alternating teams starting from October 1, 2025
  const getAutoAssignedResponders = () => {
    const today = new Date();
    const referenceDate = new Date('2025-10-01'); // October 1, 2025 - Team Alpha starts
    
    // Calculate days since reference date
    const timeDiff = today.getTime() - referenceDate.getTime();
    const daysSinceReference = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to make Oct 1 = Day 1
    
    // Odd days = Team Alpha, Even days = Team Sulu
    const isOddDay = daysSinceReference % 2 === 1;
    const assignedTeam = isOddDay ? teamAlpha : teamSulu;
    const teamName = isOddDay ? "Team Alpha" : "Team Sulu";
    
    return {
      team: teamName,
      members: assignedTeam,
      dayOfMonth: daysSinceReference
    };
  };

  // Function to save dispatch data to database
  const saveDispatchDataToDatabase = async (firestoreId: string, dispatchData: any) => {
    try {
      // Use the Firestore document ID directly
      const docRef = doc(db, "reports", firestoreId);
      
      // Get existing data
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        
        // Merge with existing dispatchInfo if it exists
        const mergedDispatchInfo = {
          ...currentData.dispatchInfo,
          ...dispatchData
        };
        
        await updateDoc(docRef, {
          dispatchInfo: mergedDispatchInfo,
          updatedAt: serverTimestamp(),
          lastModifiedBy: currentUser?.id
        });
        toast.success("Dispatch data saved successfully!");
      }
    } catch (error) {
      console.error("Error saving dispatch data:", error);
      toast.error("Failed to save dispatch data");
    }
  };

  // Function to load existing dispatch data from database
  const loadDispatchDataFromDatabase = async (firestoreId: string) => {
    try {
      // Use the Firestore document ID directly
      const docRef = doc(db, "reports", firestoreId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.dispatchInfo) {
          setDispatchData(data.dispatchInfo);
          return data.dispatchInfo;
        }
      }
    } catch (error) {
      console.error("Error loading dispatch data:", error);
    }
    return null;
  };

  // Function to save patient data to database
  const savePatientDataToDatabase = async (firestoreId: string, patientData: any) => {
    try {
      // Use the Firestore document ID directly
      const docRef = doc(db, "reports", firestoreId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        
        // Merge with existing patientInfo if it exists
        const mergedPatientInfo = {
          ...currentData.patientInfo,
          patients: patientData.patients || patientData
        };
        
        await updateDoc(docRef, {
          patientInfo: mergedPatientInfo,
          updatedAt: serverTimestamp(),
          lastModifiedBy: currentUser?.id
        });
        toast.success("Patient information saved successfully!");
      }
    } catch (error) {
      console.error("Error saving patient data:", error);
      toast.error("Failed to save patient information");
    }
  };

  // Function to load existing patient data from database
  const loadPatientDataFromDatabase = async (firestoreId: string) => {
    try {
      // Use the Firestore document ID directly
      const docRef = doc(db, "reports", firestoreId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.patientInfo && data.patientInfo.patients) {
          setPatients(data.patientInfo.patients);
          return data.patientInfo;
        }
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
    }
    return null;
  };

  // Team management functions
  const fetchTeamMembers = async () => {
    try {
      // Fetch Team Alpha members
      const alphaDoc = await getDocs(query(collection(db, "teamMembers"), where("team", "==", "Team Alpha")));
      if (!alphaDoc.empty) {
        const alphaData = alphaDoc.docs[0].data();
        setTeamAlpha(alphaData.members || []);
      }

      // Fetch Team Sulu members
      const suluDoc = await getDocs(query(collection(db, "teamMembers"), where("team", "==", "Team Sulu")));
      if (!suluDoc.empty) {
        const suluData = suluDoc.docs[0].data();
        setTeamSulu(suluData.members || []);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      // Fallback to empty arrays if database fails
      setTeamAlpha([]);
      setTeamSulu([]);
    }
  };

  const addTeamMember = async (teamName: string, memberName: string) => {
    try {
      const teamRef = collection(db, "teamMembers");
      const teamQuery = query(teamRef, where("team", "==", teamName));
      const teamSnapshot = await getDocs(teamQuery);
      
      if (teamSnapshot.empty) {
        // Create new team document
        await updateDoc(doc(db, "teamMembers", `${teamName.toLowerCase().replace(" ", "_")}`), {
          team: teamName,
          members: [memberName],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing team document
        const teamData = teamSnapshot.docs[0].data();
        const updatedMembers = [...(teamData.members || []), memberName];
        await updateDoc(doc(db, "teamMembers", teamSnapshot.docs[0].id), {
          members: updatedMembers,
          updatedAt: serverTimestamp()
        });
      }
      
      // Refresh team data
      await fetchTeamMembers();
      toast.success(`Added ${memberName} to ${teamName}`);
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member");
    }
  };

  const removeTeamMember = async (teamName: string, memberName: string) => {
    try {
      const teamQuery = query(collection(db, "teamMembers"), where("team", "==", teamName));
      const teamSnapshot = await getDocs(teamQuery);
      
      if (!teamSnapshot.empty) {
        const teamData = teamSnapshot.docs[0].data();
        const updatedMembers = (teamData.members || []).filter((member: string) => member !== memberName);
        await updateDoc(doc(db, "teamMembers", teamSnapshot.docs[0].id), {
          members: updatedMembers,
          updatedAt: serverTimestamp()
        });
        
        // Refresh team data
        await fetchTeamMembers();
        toast.success(`Removed ${memberName} from ${teamName}`);
      }
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    }
  };

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
    vehicleInvolved: "",
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
      drivers: string[];
      responders: string[]; 
    }>
  });

  const [patients, setPatients] = useState([
    {
      id: 1,
      name: "",
      contactNumber: "",
      address: "",
      religion: "",
      birthday: "",
      bloodType: "",
      civilStatus: "",
      age: "",
      pwd: "",
      ageGroup: "",
      gender: "",
      companionName: "",
      companionContact: "",
      gcs: {
        eyes: "",
        verbal: "",
        motor: ""
      },
      pupil: "",
      lungSounds: "",
      perfusion: {
        skin: "",
        pulse: ""
      },
      vitalSigns: {
        timeTaken: "",
        temperature: "",
        pulseRate: "",
        respiratoryRate: "",
        bloodPressure: "",
        spo2: "",
        spo2WithO2Support: false,
        randomBloodSugar: "",
        painScale: ""
      }
    }
  ]);
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);

  // Helper functions for patient management
  const addNewPatient = () => {
    const newPatient = {
      id: Math.max(...patients.map(p => p.id), 0) + 1,
      name: "",
      contactNumber: "",
      address: "",
      religion: "",
      birthday: "",
      bloodType: "",
      civilStatus: "",
      age: "",
      pwd: "",
      ageGroup: "",
      gender: "",
      companionName: "",
      companionContact: "",
      gcs: {
        eyes: "",
        verbal: "",
        motor: ""
      },
      pupil: "",
      lungSounds: "",
      perfusion: {
        skin: "",
        pulse: ""
      },
      vitalSigns: {
        timeTaken: "",
        temperature: "",
        pulseRate: "",
        respiratoryRate: "",
        bloodPressure: "",
        spo2: "",
        spo2WithO2Support: false,
        randomBloodSugar: "",
        painScale: ""
      }
    };
    setPatients([...patients, newPatient]);
    setCurrentPatientIndex(patients.length);
  };

  const removePatient = (patientIndex: number) => {
    if (patients.length <= 1) return; // Don't allow removing the last patient
    const newPatients = patients.filter((_, index) => index !== patientIndex);
    setPatients(newPatients);
    if (currentPatientIndex >= newPatients.length) {
      setCurrentPatientIndex(newPatients.length - 1);
    }
  };

  const updateCurrentPatient = (updates: any) => {
    setPatients(prev => prev.map((patient, index) => 
      index === currentPatientIndex ? { ...patient, ...updates } : patient
    ));
  };

  const currentPatient = patients[currentPatientIndex] || patients[0];

  // Function to upload media files to Firebase Storage
  const handleMediaUpload = async (files?: File[]) => {
    const filesToUpload = files || selectedFiles;
    if (!filesToUpload || filesToUpload.length === 0) {
      toast.error('No files selected for upload');
      return;
    }

    if (!selectedReport?.id) {
      toast.error('No report selected for upload');
      return;
    }
    
    setUploadingMedia(true);
    const uploadedUrls: string[] = [];
    
    try {
      console.log('Starting upload process...');
      console.log('Files to upload:', filesToUpload.length);
      console.log('Report ID:', selectedReport.id);
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        console.log(`Uploading file ${i + 1}/${filesToUpload.length}:`, file.name, file.type, file.size);
        
        // Create unique filename with timestamp and random suffix
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split('.').pop() || '';
        const fileName = `media_${timestamp}_${randomSuffix}.${fileExtension}`;
        
        // Create storage reference using the same structure as mobile app
        // Structure: report_images/{userId}/{reportId}/admin/{fileName}
        const storageRef = ref(storage, `report_images/${selectedReport.userId}/${selectedReport.id}/admin/${fileName}`);
        console.log('Storage path:', `report_images/${selectedReport.userId}/${selectedReport.id}/admin/${fileName}`);
        
        // Upload file
        console.log('Uploading bytes...');
        const uploadResult = await uploadBytes(storageRef, file);
        console.log('Upload bytes result:', uploadResult);
        
        // Get download URL
        console.log('Getting download URL...');
        const downloadURL = await getDownloadURL(storageRef);
        console.log('Download URL:', downloadURL);
        
        uploadedUrls.push(downloadURL);
        console.log(`File ${i + 1} uploaded successfully`);
      }
      
      // Update the preview data with new URLs (save as admin media)
      setPreviewEditData((d: any) => ({
        ...d,
        adminMedia: [...(d.adminMedia || []), ...uploadedUrls]
      }));
      
      // Clear selected files after successful upload
      setSelectedFiles([]);
      
      console.log('All files uploaded successfully:', uploadedUrls);
      toast.success(`${filesToUpload.length} file(s) uploaded successfully!`);
    } catch (error: any) {
      console.error('Error uploading media files:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to upload media files. Please try again.';
      
      // Provide more specific error messages
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'You are not authorized to upload files. Please check your permissions.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled.';
      } else if (error.code === 'storage/unknown') {
        errorMessage = 'An unknown error occurred during upload.';
      } else if (error.code === 'storage/invalid-format') {
        errorMessage = 'Invalid file format. Please check the file type.';
      } else if (error.code === 'storage/object-not-found') {
        errorMessage = 'Storage object not found.';
      } else if (error.code === 'storage/bucket-not-found') {
        errorMessage = 'Storage bucket not found. Please check your Firebase configuration.';
      } else if (error.code === 'storage/project-not-found') {
        errorMessage = 'Firebase project not found. Please check your configuration.';
      }
      
      toast.error(errorMessage);
    } finally {
      setUploadingMedia(false);
    }
  };

  // Function to handle file selection
  const handleFileSelection = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...fileArray]);
  };

  // Function to remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev[index];
      // Clean up object URL for the removed file
      if (fileToRemove && fileToRemove.type.startsWith('image/')) {
        URL.revokeObjectURL(URL.createObjectURL(fileToRemove));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Function to clear all selected files
  const clearSelectedFiles = () => {
    // Clean up object URLs to prevent memory leaks
    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        URL.revokeObjectURL(URL.createObjectURL(file));
      }
    });
    setSelectedFiles([]);
  };

  // Function to upload document to Firebase Storage
  const handleDocumentUpload = async (file: File) => {
    if (!file) return;
    
    if (!selectedReport?.id) {
      toast.error('No report selected for upload');
      return;
    }
    
    setUploadingDocument(true);
    
    try {
      console.log('Uploading document:', file.name, file.type, file.size);
      
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `document_${timestamp}_${randomSuffix}.${fileExtension}`;
      
      const storageRef = ref(storage, `reports/${selectedReport.id}/documents/${fileName}`);
      console.log('Document storage path:', `reports/${selectedReport.id}/documents/${fileName}`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Document download URL:', downloadURL);
      
      // Update the preview data with new URL
      setPreviewEditData((d: any) => ({
        ...d,
        attachedDocument: downloadURL
      }));
      
      toast.success('Document uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading document:', error);
      console.error('Document upload error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to upload document. Please try again.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'You are not authorized to upload files. Please check your permissions.';
      } else if (error.code === 'storage/bucket-not-found') {
        errorMessage = 'Storage bucket not found. Please check your Firebase configuration.';
      }
      
      toast.error(errorMessage);
    } finally {
      setUploadingDocument(false);
    }
  };

  // Function to open image preview
  const handleImagePreview = (imageUrl: string, imageName: string) => {
    console.log('Setting image preview:', imageUrl, imageName);
    setPreviewImageUrl(imageUrl);
    setPreviewImageName(imageName);
    setShowImagePreview(true);
  };

  // Function to download image
  const handleDownloadImage = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = imageName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image. Please try again.');
    }
  };

  // Function to delete image from report
  const handleDeleteImage = async (imageUrl: string, imageIndex: number) => {
    try {
      // Remove from preview data (mobile media)
      setPreviewEditData((d: any) => ({
        ...d,
        mobileMedia: d.mobileMedia.filter((_: any, index: number) => index !== imageIndex)
      }));
      
      // Close preview if this image was being previewed
      if (previewImageUrl === imageUrl) {
        setShowImagePreview(false);
      }
      
      toast.success('Mobile image removed successfully!');
    } catch (error) {
      console.error('Error deleting mobile image:', error);
      toast.error('Failed to delete mobile image. Please try again.');
    }
  };

  // Function to delete admin-added image from report
  const handleDeleteAdminImage = async (imageUrl: string, imageIndex: number) => {
    try {
      // Remove from preview data (admin media)
      setPreviewEditData((d: any) => ({
        ...d,
        adminMedia: d.adminMedia.filter((_: any, index: number) => index !== imageIndex)
      }));
      
      // Close preview if this image was being previewed
      if (previewImageUrl === imageUrl) {
        setShowImagePreview(false);
      }
      
      toast.success('Admin image removed successfully!');
    } catch (error) {
      console.error('Error deleting admin image:', error);
      toast.error('Failed to delete admin image. Please try again.');
    }
  };

  // Function to reverse geocode coordinates to get address
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error('Mapbox access token not available');
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&types=address,poi,place,locality,neighborhood`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return feature.place_name || feature.text || 'Unknown Location';
      } else {
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Unknown Location';
    }
  };

  // Function to handle map click for location selection
  const handleMapClick = async (lngLat: { lng: number; lat: number }) => {
    try {
      const address = await reverseGeocode(lngLat.lat, lngLat.lng);
      setNewLocation({
        lat: lngLat.lat,
        lng: lngLat.lng,
        address: address
      });
    } catch (error) {
      console.error('Error getting address for clicked location:', error);
      toast.error('Failed to get address for selected location');
    }
  };

  // Function to save new location
  const handleSaveLocation = async () => {
    if (newLocation && selectedReport) {
      try {
        // Update the database using the Firestore document ID
        await updateDoc(doc(db, "reports", selectedReport.firestoreId), {
          location: newLocation.address,
          coordinates: `${newLocation.lat}, ${newLocation.lng}`,
          updatedAt: serverTimestamp(),
          lastModifiedBy: currentUser?.id
        });

        // Update the local state
        setPreviewEditData((d: any) => ({
          ...d,
          location: newLocation.address,
          coordinates: `${newLocation.lat}, ${newLocation.lng}`
        }));

        // Update the selectedReport state to reflect the change
        setSelectedReport((prev: any) => ({
          ...prev,
          location: newLocation.address,
          coordinates: `${newLocation.lat}, ${newLocation.lng}`
        }));

        setShowLocationMap(false);
        setNewLocation(null);
        toast.success('Location updated successfully!');
      } catch (error) {
        console.error('Error updating location:', error);
        toast.error('Failed to update location. Please try again.');
      }
    }
  };

  return (
    <Layout>
      <TooltipProvider>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6 bg-gradient-to-br from-amber-500 to-orange-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total Reports</p>
                  <p className="text-2xl font-bold text-white">{totalReports}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6 bg-gradient-to-br  from-amber-500 to-orange-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Reports This Week</p>
                  <p className="text-2xl font-bold text-white">{reportsThisWeek}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6 bg-gradient-to-br from-amber-500 to-orange-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Pending Reports</p>
                  <p className="text-2xl font-bold text-white">{pendingReports}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-orange-500 text-white">
            <CardTitle className="text-white">Search and Filter</CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-orange-50 to-red-50 pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="w-full relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input 
                  placeholder="Search reports..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full pl-10 bg-white border-gray-300 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-400 transition-colors" 
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <Label className="text-sm font-medium text-gray-800">Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors",
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
                  <Label className="text-sm font-medium text-gray-800">Report Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-white border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="road-crash">Road Crash</SelectItem>
                      <SelectItem value="medical-emergency">Medical Emergency</SelectItem>
                      <SelectItem value="flooding">Flooding</SelectItem>
                      <SelectItem value="volcanic-activity">Volcanic Activity</SelectItem>
                      <SelectItem value="landslide">Landslide</SelectItem>
                      <SelectItem value="earthquake">Earthquake</SelectItem>
                      <SelectItem value="civil-disturbance">Civil Disturbance</SelectItem>
                      <SelectItem value="armed-conflict">Armed Conflict</SelectItem>
                      <SelectItem value="infectious-disease">Infectious Disease</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-800">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors">
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

        <div className="flex items-end gap-4 mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setShowAddModal(true)} className="bg-brand-orange hover:bg-brand-orange-400 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add New Report
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a new emergency report manually</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handlePrintTable} className="bg-brand-orange hover:bg-brand-orange-400 text-white">
                <Printer className="h-4 w-4 mr-2" />
                Print Table
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Print the reports table</p>
            </TooltipContent>
          </Tooltip>
          
          {selectedReports.length > 0 && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleBatchDelete} variant="destructive" className="bg-brand-red hover:bg-brand-red-700 text-white ml-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete {selectedReports.length} selected report(s)</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Reports Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0 bg-gradient-to-br from-orange-50 via-white to-red-50">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-orange-500">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-12 text-white">
                      <Checkbox
                        checked={paginatedReports.length > 0 && paginatedReports.every(report => selectedReports.includes(report.firestoreId))}
                        onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                        className="border-white data-[state=checked]:bg-white data-[state=checked]:text-orange-500 hover:border-orange-200"
                      />
                    </TableHead>
                    <TableHead className="text-white font-semibold">Report ID</TableHead>
                    <TableHead className="text-white font-semibold">Type</TableHead>
                    <TableHead className="text-white font-semibold">Reported By</TableHead>
                    <TableHead className="text-white font-semibold">Date Submitted</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                    <TableHead className="text-white font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <FileText className="h-12 w-12 mb-2 text-gray-400" />
                          <p className="text-lg font-medium">No reports found</p>
                          <p className="text-sm">Try adjusting your filters or search terms</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedReports.map(report => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedReports.includes(report.firestoreId)}
                          onCheckedChange={() => handleCheckboxChange(report.firestoreId)}
                          className="border-gray-400 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white data-[state=checked]:border-orange-500 hover:border-orange-500"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{report.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            report.type === 'Road Crash' ? 'bg-red-100 text-red-800 hover:bg-red-50' :
                            report.type === 'Medical Emergency' ? 'bg-green-100 text-green-800 hover:bg-green-50' :
                            report.type === 'Flooding' ? 'bg-blue-100 text-blue-800 hover:bg-blue-50' :
                            report.type === 'Volcanic Activity' ? 'bg-orange-100 text-orange-800 hover:bg-orange-50' :
                            report.type === 'Landslide' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-50' :
                            report.type === 'Earthquake' ? 'bg-purple-100 text-purple-800 hover:bg-purple-50' :
                            report.type === 'Civil Disturbance' ? 'bg-pink-100 text-pink-800 hover:bg-pink-50' :
                            report.type === 'Armed Conflict' ? 'bg-red-100 text-red-800 hover:bg-red-50' :
                            report.type === 'Infectious Disease' ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-50' :
                            'bg-gray-100 text-gray-800 hover:bg-gray-50'
                          }>
                            {report.type}
                          </Badge>
                          {isNewReport(report) && (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-50 font-semibold animate-pulse">
                              NEW
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.reportedBy ? (
                          <button
                            type="button"
                            className="text-brand-orange hover:underline focus:outline-none"
                            onClick={() => navigate("/manage-users", { state: { tab: "residents", search: report.reportedBy } })}
                            title="View Resident Account"
                          >
                            {report.reportedBy}
                          </button>
                        ) : (
                          <span className="text-gray-400 italic">Not specified</span>
                        )}
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    console.log("Opening report preview for:", report);
                                    setSelectedReport(report);
                                    setShowPreviewModal(true);
                                    setPreviewTab("details"); // Reset to details tab
                                    
                                    // Mark report as viewed
                                    setViewedReports(prev => new Set(prev).add(report.id));
                                    
                                    // Load existing dispatch data from database using Firestore document ID
                                    const existingDispatchData = await loadDispatchDataFromDatabase(report.firestoreId);
                                    
                                    // Load existing patient data from database using Firestore document ID
                                    await loadPatientDataFromDatabase(report.firestoreId);
                                    
                                    // Only auto-populate if no existing dispatch data AND no receivedBy/timeCallReceived
                                    if (!existingDispatchData || (!existingDispatchData.receivedBy && !existingDispatchData.timeCallReceived)) {
                                      if (currentUser) {
                                        const newDispatchData = {
                                          receivedBy: currentUser.name,
                                          timeCallReceived: getCurrentTime()
                                        };
                                        
                                        // Set the data in state
                                        setDispatchData(prev => ({
                                          ...prev,
                                          ...newDispatchData
                                        }));
                                        
                                        // Immediately save to database to prevent other users from overwriting using Firestore document ID
                                        await saveDispatchDataToDatabase(report.firestoreId, {
                                          ...existingDispatchData,
                                          ...newDispatchData
                                        });
                                      }
                                    }
                                  } catch (error) {
                                    console.error("Error opening report preview:", error);
                                    toast.error("Failed to open report preview");
                                  }
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View report details</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePinOnMap(report)}
                              >
                                <MapPin className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View location on map</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteReport(report.firestoreId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete report</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            <div className="border-t border-orange-200/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-800 font-medium">
                  Showing {filteredReports.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-800 font-medium">Rows per page:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[70px] bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="bg-white border-gray-300"
                >
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={currentPage === pageNum ? "bg-orange-500 hover:bg-orange-400 text-white" : "bg-white border-gray-300"}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-700">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        className="bg-white border-gray-300"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="bg-white border-gray-300"
                >
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
                      <SelectItem value="road-crash">Road Crash</SelectItem>
                      <SelectItem value="medical-emergency">Medical Emergency</SelectItem>
                      <SelectItem value="flooding">Flooding</SelectItem>
                      <SelectItem value="volcanic-activity">Volcanic Activity</SelectItem>
                      <SelectItem value="landslide">Landslide</SelectItem>
                      <SelectItem value="earthquake">Earthquake</SelectItem>
                      <SelectItem value="civil-disturbance">Civil Disturbance</SelectItem>
                      <SelectItem value="armed-conflict">Armed Conflict</SelectItem>
                      <SelectItem value="infectious-disease">Infectious Disease</SelectItem>
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


        {/* Preview Report Modal */}
        <Dialog open={showPreviewModal} onOpenChange={(open) => {
          console.log("Preview modal state change:", open, "selectedReport:", selectedReport);
          setShowPreviewModal(open);
          if (!open) {
            // Reset all states when modal is closed
            setSelectedReport(null);
            setPreviewTab("details");
            setIsPreviewEditMode(false);
            setIsDispatchEditMode(false);
            setIsPatientEditMode(false);
            setPreviewEditData(null);
            // Reset dispatch data when modal is closed
            setDispatchData({
              receivedBy: "",
              timeCallReceived: "",
              timeOfDispatch: "",
              timeOfArrival: "",
              hospitalArrival: "",
              returnedToOpcen: "",
              disasterRelated: "",
              agencyPresent: "",
              typeOfEmergency: "",
              vehicleInvolved: "",
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
            });
            // Reset patient data when modal is closed
            setPatients([{
              id: 1,
              name: "",
              contactNumber: "",
              address: "",
              religion: "",
              birthday: "",
              bloodType: "",
              civilStatus: "",
              age: "",
              pwd: "",
              ageGroup: "",
              gender: "",
              companionName: "",
              companionContact: "",
              gcs: {
                eyes: "",
                verbal: "",
                motor: ""
              },
              pupil: "",
              lungSounds: "",
              perfusion: {
                skin: "",
                pulse: ""
              },
              vitalSigns: {
                timeTaken: "",
                temperature: "",
                pulseRate: "",
                respiratoryRate: "",
                bloodPressure: "",
                spo2: "",
                spo2WithO2Support: false,
                randomBloodSugar: "",
                painScale: ""
              }
            }]);
            setCurrentPatientIndex(0);
          }
        }}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] bg-white flex flex-col overflow-hidden">
            {selectedReport ? (
              <>
                {/* Header Row: Title, ID, and Action Buttons */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Report Preview</h2>
                    <div className="text-sm text-gray-700">Report ID: {selectedReport.id}</div>
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={handlePrintPreview}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Print report</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download report</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                {/* Navigation Tabs */}
                <Tabs value={previewTab} onValueChange={setPreviewTab} className="w-full flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="directions">Directions</TabsTrigger>
                <TabsTrigger value="details">Report Details</TabsTrigger>
                <TabsTrigger value="dispatch">Dispatch Form</TabsTrigger>
                <TabsTrigger value="patient">Patient Information</TabsTrigger>
              </TabsList>

              <TabsContent value="directions" className="mt-4 flex-1 min-h-0 flex flex-col">
                <div className="flex-1 w-full relative" style={{ minHeight: '800px', maxHeight: 'calc(90vh - 200px)' }}>
                  {selectedReport ? (
                    <div 
                      id="report-map-container"
                      className="w-full h-full rounded-lg overflow-hidden"
                    >
                      <MapboxMap 
                        center={selectedReport.latitude && selectedReport.longitude ? 
                          [selectedReport.longitude, selectedReport.latitude] as [number, number] : 
                          [121.5556, 14.1139] as [number, number]}
                        zoom={14}
                        singleMarker={selectedReport.latitude && selectedReport.longitude ? 
                          {
                            id: selectedReport.id || 'report-marker',
                            type: selectedReport.type || 'Emergency',
                            title: selectedReport.location || 'Report Location',
                            description: selectedReport.description || 'Emergency report location',
                            reportId: selectedReport.id,
                            coordinates: [selectedReport.longitude, selectedReport.latitude] as [number, number],
                            status: selectedReport.status,
                            locationName: selectedReport.location,
                            latitude: selectedReport.latitude,
                            longitude: selectedReport.longitude
                          } : 
                          undefined}
                      />
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center flex items-center justify-center h-full">
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
                  <div className="text-lg font-semibold text-gray-800">Report Details</div>
                  <div className="flex gap-2 flex-wrap">
                    {isPreviewEditMode ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" className="bg-brand-red hover:bg-brand-red-700 text-white" onClick={() => {
                            console.log('Saving changes:', previewEditData);
                            setSelectedReport(previewEditData);
                            setIsPreviewEditMode(false);
                            setSelectedFiles([]); // Clear selected files when saving
                          }}>
                            Save
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save changes to report details</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" className="border-gray-300 text-gray-800 hover:bg-gray-50" onClick={() => {
                            setIsPreviewEditMode(true);
                            setPreviewEditData({ ...selectedReport });
                            setSelectedFiles([]); // Clear any previously selected files
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit report details</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto border rounded-lg min-h-0">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table className="w-full min-w-[600px]">
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Date & Time Submitted</TableCell>
                        <TableCell>
                          {selectedReport?.dateSubmitted && selectedReport?.timeSubmitted ? (
                            <div>
                              {selectedReport.dateSubmitted}
                              <br />
                              <span className="text-xs text-gray-600">{selectedReport.timeSubmitted}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not available</span>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Status</TableCell>
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
                        <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Report Type</TableCell>
                      <TableCell>
                        {isPreviewEditMode ? (
                          <Select value={previewEditData?.type} onValueChange={v => setPreviewEditData((d: any) => ({ ...d, type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Road Crash">Road Crash</SelectItem>
                              <SelectItem value="Medical Emergency">Medical Emergency</SelectItem>
                              <SelectItem value="Flooding">Flooding</SelectItem>
                              <SelectItem value="Volcanic Activity">Volcanic Activity</SelectItem>
                              <SelectItem value="Landslide">Landslide</SelectItem>
                              <SelectItem value="Earthquake">Earthquake</SelectItem>
                              <SelectItem value="Civil Disturbance">Civil Disturbance</SelectItem>
                              <SelectItem value="Armed Conflict">Armed Conflict</SelectItem>
                              <SelectItem value="Infectious Disease">Infectious Disease</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={
                            selectedReport?.type === 'Road Crash' ? 'bg-red-100 text-red-800 hover:bg-red-50' :
                            selectedReport?.type === 'Medical Emergency' ? 'bg-green-100 text-green-800 hover:bg-green-50' :
                            selectedReport?.type === 'Flooding' ? 'bg-blue-100 text-blue-800 hover:bg-blue-50' :
                            selectedReport?.type === 'Volcanic Activity' ? 'bg-orange-100 text-orange-800 hover:bg-orange-50' :
                            selectedReport?.type === 'Landslide' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-50' :
                            selectedReport?.type === 'Earthquake' ? 'bg-purple-100 text-purple-800 hover:bg-purple-50' :
                            selectedReport?.type === 'Civil Disturbance' ? 'bg-pink-100 text-pink-800 hover:bg-pink-50' :
                            selectedReport?.type === 'Armed Conflict' ? 'bg-red-100 text-red-800 hover:bg-red-50' :
                            selectedReport?.type === 'Infectious Disease' ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-50' :
                            'bg-gray-100 text-gray-800 hover:bg-gray-50'
                          }>
                            {selectedReport?.type}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Reported By</TableCell>
                      <TableCell>
                        {isPreviewEditMode ? (
                          <Input value={previewEditData?.reportedBy} onChange={e => setPreviewEditData((d: any) => ({ ...d, reportedBy: e.target.value }))} />
                        ) : (
                          selectedReport?.reportedBy ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-brand-red hover:text-brand-red-700"
                              onClick={() => navigate("/manage-users", { state: { tab: "residents", search: selectedReport?.reportedBy } })}
                              title="View Resident Account"
                            >
                              {selectedReport?.reportedBy}
                            </Button>
                          ) : (
                            <span className="text-gray-400 italic">Not specified</span>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Mobile Number</TableCell>
                      <TableCell>
                        {isPreviewEditMode ? (
                          <Input value={previewEditData?.mobileNumber} onChange={e => setPreviewEditData((d: any) => ({ ...d, mobileNumber: e.target.value }))} />
                        ) : (
                          selectedReport?.mobileNumber || <span className="text-gray-400 italic">Not specified</span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Barangay</TableCell>
                      <TableCell>
                        {isPreviewEditMode ? (
                          <Select value={previewEditData?.barangay} onValueChange={v => setPreviewEditData((d: any) => ({ ...d, barangay: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {barangayOptions.map(barangay => <SelectItem key={barangay} value={barangay}>{barangay}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          selectedReport?.barangay || <span className="text-gray-400 italic">Edit to add Barangay</span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Description</TableCell>
                      <TableCell>
                        {isPreviewEditMode ? (
                          <Textarea value={previewEditData?.description} onChange={e => setPreviewEditData((d: any) => ({ ...d, description: e.target.value }))} />
                        ) : (
                          selectedReport?.description
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Location</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="text-gray-800">{previewEditData?.location || selectedReport?.location}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {previewEditData?.latitude && previewEditData?.longitude 
                                ? `${previewEditData.latitude}, ${previewEditData.longitude}`
                                : selectedReport?.latitude && selectedReport?.longitude 
                                ? `${selectedReport.latitude}, ${selectedReport.longitude}`
                                : '14.1139, 121.5556'}
                            </div>
                          </div>
                          {isPreviewEditMode && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowLocationMap(true)}
                                  className="flex items-center gap-1"
                                >
                                  <MapPin className="h-4 w-4" />
                                  Pin Location
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Select location on map</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Attached Media</TableCell>
                      <TableCell>
                        <div className="space-y-4">
                          {/* Mobile User Media Section */}
                          <div>
                            <div className="mb-2">
                              <h4 className="text-sm font-medium text-gray-800">Mobile User Media</h4>
                            </div>
                        <div className="flex flex-wrap gap-3 mb-2">
                              {(() => {
                                const mobileMediaArray = isPreviewEditMode ? previewEditData?.mobileMedia : selectedReport?.mobileMedia;
                                console.log('Mobile media array:', mobileMediaArray);
                                
                                if (!mobileMediaArray || mobileMediaArray.length === 0) {
                                  return (
                                    <div className="text-gray-400 text-sm italic">
                                      No mobile attachments
                                    </div>
                                  );
                                }
                                
                                return mobileMediaArray.map((media: string, index: number) => {
                            // Better image detection - check URL path and query parameters
                            const urlPath = media.split('?')[0]; // Remove query parameters
                            const fileExtension = urlPath.split('.').pop()?.toLowerCase();
                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '') || 
                                          media.includes('image') || 
                                          media.includes('photo') ||
                                          media.includes('img');
                            const fileName = urlPath.split('/').pop() || media;
                            
                            return (
                              <div 
                                key={index} 
                                className="relative group"
                              >
                                {isImage ? (
                                  <div 
                                    className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 cursor-pointer transition-all duration-200 hover:shadow-md"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('Opening image preview:', media, fileName);
                                      handleImagePreview(media, fileName);
                                    }}
                                    title={`Click to preview: ${fileName}`}
                                  >
                                    <img 
                                      src={media} 
                                      alt={fileName}
                                      className="w-full h-full object-cover"
                                      onLoad={() => console.log('Image loaded successfully:', media)}
                                      onError={(e) => {
                                        console.log('Image failed to load:', media);
                                        // Fallback to icon if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `
                                            <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                              </svg>
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div 
                                    className="w-20 h-20 rounded-lg border-2 border-gray-200 hover:border-gray-400 cursor-pointer transition-all duration-200 hover:shadow-md flex items-center justify-center bg-gray-50"
                                    onClick={() => window.open(media, '_blank')}
                                    title={`Click to open: ${fileName}`}
                                  >
                                    <FileIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                
                                {/* Image filename overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="truncate">{fileName}</div>
                                </div>
                                
                                {/* Delete button for edit mode */}
                                {isPreviewEditMode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteImage(media, index);
                                    }}
                                    className="absolute -top-2 -right-2 bg-brand-red hover:bg-brand-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    title="Delete image"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            );
                            });
                          })()}
                        </div>
                          </div>

                          {/* Admin Added Media Section */}
                          <div className="border-t border-gray-200 pt-4">
                            <div className="mb-2">
                              <h4 className="text-sm font-medium text-gray-800">Admin Added Media</h4>
                            </div>
                            <div className="flex flex-wrap gap-3 mb-2">
                              {(() => {
                                const adminMediaArray = isPreviewEditMode ? previewEditData?.adminMedia : selectedReport?.adminMedia;
                                console.log('Admin media array:', adminMediaArray);
                                
                                if (!adminMediaArray || adminMediaArray.length === 0) {
                                  return (
                                    <div className="text-gray-400 text-sm italic">
                                      No admin attachments
                                    </div>
                                  );
                                }
                                
                                return adminMediaArray.map((media: string, index: number) => {
                            // Better image detection - check URL path and query parameters
                            const urlPath = media.split('?')[0]; // Remove query parameters
                            const fileExtension = urlPath.split('.').pop()?.toLowerCase();
                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '') || 
                                          media.includes('image') || 
                                          media.includes('photo') ||
                                          media.includes('img');
                            const fileName = urlPath.split('/').pop() || media;
                            
                            return (
                              <div 
                                key={index} 
                                className="relative group"
                              >
                                {isImage ? (
                                  <div 
                                    className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 cursor-pointer transition-all duration-200 hover:shadow-md"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('Opening admin image preview:', media, fileName);
                                      handleImagePreview(media, fileName);
                                    }}
                                    title={`Click to preview: ${fileName} (Admin Added)`}
                                  >
                                    <img 
                                      src={media} 
                                      alt={fileName}
                                      className="w-full h-full object-cover"
                                      onLoad={() => console.log('Admin image loaded successfully:', media)}
                                      onError={(e) => {
                                        console.log('Admin image failed to load:', media);
                                        // Fallback to icon if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `
                                            <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                              </svg>
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div 
                                    className="w-20 h-20 rounded-lg border-2 border-gray-200 hover:border-gray-400 cursor-pointer transition-all duration-200 hover:shadow-md flex items-center justify-center bg-gray-50"
                                    onClick={() => window.open(media, '_blank')}
                                    title={`Click to open: ${fileName} (Admin Added)`}
                                  >
                                    <FileIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                
                                
                                {/* Image filename overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="truncate">{fileName}</div>
                                </div>
                                
                                {/* Delete button for edit mode */}
                         {isPreviewEditMode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAdminImage(media, index);
                                    }}
                                    className="absolute -top-2 -right-2 bg-brand-red hover:bg-brand-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    title="Delete admin image"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            );
                          });
                          })()}
                            </div>
                          </div>
                        </div>
                         {isPreviewEditMode && (
                           <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-2 bg-gray-50">
                             <div className="text-center mb-4">
                               <div className="flex items-center justify-center gap-2 mb-2">
                                 <Upload className="h-6 w-6 text-gray-600" />
                               </div>
                               <p className="text-sm text-gray-700 mb-2">Add additional photos or videos as admin</p>
                             <Input 
                               type="file" 
                               multiple 
                               accept="image/*,video/*" 
                                 onChange={e => handleFileSelection(e.target.files)}
                               className="w-full"
                               disabled={uploadingMedia}
                             />
                               </div>
                             
                             {/* Selected Files Preview */}
                             {selectedFiles.length > 0 && (
                               <div className="mb-4">
                                 <div className="flex items-center justify-between mb-2">
                                   <h4 className="text-sm font-medium text-gray-700">
                                     Selected Files ({selectedFiles.length})
                                   </h4>
                                   <Button
                                     type="button"
                                     variant="ghost"
                                     size="sm"
                                     onClick={clearSelectedFiles}
                                     className="text-brand-red hover:text-brand-red-700 hover:bg-red-50"
                                   >
                                     Clear All
                                   </Button>
                                 </div>
                                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                   {selectedFiles.map((file, index) => (
                                     <div key={index} className="relative group">
                                       <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                                         {file.type.startsWith('image/') ? (
                                           <img 
                                             src={URL.createObjectURL(file)} 
                                             alt={file.name}
                                             className="w-full h-full object-cover"
                                           />
                                         ) : (
                                           <FileIcon className="h-6 w-6 text-gray-400" />
                                         )}
                                       </div>
                                       <div className="absolute -top-1 -right-1 bg-brand-red hover:bg-brand-red-700 text-white rounded-full p-1 cursor-pointer"
                                            onClick={() => removeSelectedFile(index)}
                                            title="Remove file">
                                         <X className="h-3 w-3" />
                                       </div>
                                       <div className="mt-1 text-xs text-gray-600 truncate" title={file.name}>
                                         {file.name}
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                             
                             {/* Upload Button */}
                             {selectedFiles.length > 0 && (
                               <div className="flex gap-2 justify-center">
                                 <Button
                                   type="button"
                                   onClick={() => handleMediaUpload()}
                                   disabled={uploadingMedia}
                                   className="bg-brand-orange hover:bg-brand-orange-400 text-white"
                                 >
                                   {uploadingMedia ? (
                                     <>
                                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                       Uploading...
                                     </>
                                   ) : (
                                     <>
                                       <Upload className="h-4 w-4 mr-2" />
                                       Add {selectedFiles.length} Admin File{selectedFiles.length > 1 ? 's' : ''}
                                     </>
                                   )}
                                 </Button>
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
                    {isDispatchEditMode ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" className="bg-brand-orange hover:bg-brand-orange-400 text-white" onClick={async () => {
                            console.log('Saving dispatch form:', dispatchData);
                            await saveDispatchDataToDatabase(selectedReport.firestoreId, dispatchData);
                            setIsDispatchEditMode(false);
                          }}>
                            Save
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save dispatch form data</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => {
                            setIsDispatchEditMode(true);
                            // Automatically assign responders when entering edit mode
                            const autoAssigned = getAutoAssignedResponders();
                            setDispatchData(d => ({
                              ...d,
                              responders: [{
                                id: `auto-${Date.now()}`,
                                team: autoAssigned.team,
                                drivers: [],
                                responders: autoAssigned.members
                              }]
                            }));
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit dispatch form</p>
                        </TooltipContent>
                      </Tooltip>
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
                            {dispatchData.receivedBy || (currentUser ? `${currentUser.name}` : "Not specified")}
                          </TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Responders</TableCell>
                          <TableCell>
                            {isDispatchEditMode ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowTeamManagement(true)}
                                        className="border-gray-300 text-gray-800 hover:bg-gray-50"
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Manage Teams
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add or remove team members</p>
                                    </TooltipContent>
                                  </Tooltip>
                                 
                                </div>
                                {dispatchData.responders && dispatchData.responders.length > 0 ? (
                                  <div className="space-y-1">
                                    {dispatchData.responders.map((responder: any, index: number) => (
                                      <div key={responder.id || index} className="text-sm text-gray-800">
                                        <span className="font-medium text-gray-800">{responder.team}:</span> <span className="text-gray-600">{responder.responders ? responder.responders.join(", ") : "No members"}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-gray-600 text-sm py-2">No responders assigned</div>
                                )}
                              </div>
                            ) : (
                              dispatchData.responders && dispatchData.responders.length > 0 ? (
                                <div className="space-y-1">
                                  {dispatchData.responders.map((responder: any, index: number) => (
                                    <div key={responder.id || index} className="text-sm text-gray-800">
                                      <span className="font-medium text-gray-800">{responder.team}:</span> <span className="text-gray-600">{responder.responders ? responder.responders.join(", ") : "No members"}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-800">
                                  <span className="font-medium text-gray-800">{(() => {
                                    const autoAssigned = getAutoAssignedResponders();
                                    return autoAssigned.team;
                                  })()}:</span> <span className="text-gray-600">{(() => {
                                    const autoAssigned = getAutoAssignedResponders();
                                    return autoAssigned.members.join(", ");
                                  })()}</span>
                                </div>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Time Call Received</TableCell>
                          <TableCell>
                            {dispatchData.timeCallReceived || getCurrentTime()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Time of Dispatch</TableCell>
                          <TableCell>
                            {isDispatchEditMode ? (
                              <div className="flex items-center gap-2">
                              <Input 
                                type="time" 
                                value={dispatchData.timeOfDispatch} 
                                onChange={e => setDispatchData(d => ({ ...d, timeOfDispatch: e.target.value }))} 
                                  className="flex-1"
                                />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDispatchData(d => ({ ...d, timeOfDispatch: getCurrentTime24Hour() }))}
                                      className="px-3"
                                    >
                                      <Clock className="h-4 w-4 mr-1" />
                                      Now
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Set to current time</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              dispatchData.timeOfDispatch || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Time of Arrival</TableCell>
                          <TableCell>
                            {isDispatchEditMode ? (
                              <div className="flex items-center gap-2">
                              <Input 
                                type="time" 
                                value={dispatchData.timeOfArrival} 
                                onChange={e => setDispatchData(d => ({ ...d, timeOfArrival: e.target.value }))} 
                                  className="flex-1"
                                />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDispatchData(d => ({ ...d, timeOfArrival: getCurrentTime24Hour() }))}
                                      className="px-3"
                                    >
                                      <Clock className="h-4 w-4 mr-1" />
                                      Now
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Set to current time</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
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
                                <span className="font-medium text-brand-orange">
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
                            {isDispatchEditMode ? (
                              <div className="flex items-center gap-2">
                              <Input 
                                type="time" 
                                value={dispatchData.hospitalArrival} 
                                onChange={e => setDispatchData(d => ({ ...d, hospitalArrival: e.target.value }))} 
                                  className="flex-1"
                                />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDispatchData(d => ({ ...d, hospitalArrival: getCurrentTime24Hour() }))}
                                      className="px-3"
                                    >
                                      <Clock className="h-4 w-4 mr-1" />
                                      Now
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Set to current time</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              dispatchData.hospitalArrival || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Returned to OPCEN</TableCell>
                          <TableCell>
                            {isDispatchEditMode ? (
                              <div className="flex items-center gap-2">
                              <Input 
                                type="time" 
                                value={dispatchData.returnedToOpcen} 
                                onChange={e => setDispatchData(d => ({ ...d, returnedToOpcen: e.target.value }))} 
                                  className="flex-1"
                                />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDispatchData(d => ({ ...d, returnedToOpcen: getCurrentTime24Hour() }))}
                                      className="px-3"
                                    >
                                      <Clock className="h-4 w-4 mr-1" />
                                      Now
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Set to current time</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              dispatchData.returnedToOpcen || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Disaster Related</TableCell>
                          <TableCell>
                            {isDispatchEditMode ? (
                              <Select value={dispatchData.disasterRelated} onValueChange={v => setDispatchData(d => ({ ...d, disasterRelated: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              dispatchData.disasterRelated ? (
                                <Badge className={dispatchData.disasterRelated === "Yes" ? "bg-red-100 text-red-800 hover:bg-red-50" : "bg-green-100 text-green-800 hover:bg-green-50"}>
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
                            {isDispatchEditMode ? (
                              <Select value={dispatchData.agencyPresent} onValueChange={v => setDispatchData(d => ({ ...d, agencyPresent: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                                <SelectContent>
                                  {agencyOptions.map((agency, index) => (
                                    <div key={agency} className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100">
                                      <SelectItem value={agency} className="flex-1">{agency}</SelectItem>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setAgencyOptions(agencyOptions.filter((_, i) => i !== index));
                                        }}
                                        className="h-6 w-6 p-0 text-brand-red hover:text-brand-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  <div className="border-t border-gray-200 p-2">
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Add new agency"
                                        className="text-sm"
                                        onKeyPress={e => {
                                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            setAgencyOptions([...agencyOptions, e.currentTarget.value.trim()]);
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
                                            setAgencyOptions([...agencyOptions, input.value.trim()]);
                                            input.value = '';
                                          }
                                        }}
                                        className="h-8 px-2"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </SelectContent>
                              </Select>
                            ) : (
                              dispatchData.agencyPresent ? (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-50">
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
                            {isDispatchEditMode ? (
                              <Select value={dispatchData.typeOfEmergency} onValueChange={v => setDispatchData(d => ({ 
                                ...d, 
                                typeOfEmergency: v, 
                                vehicleInvolved: "",
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
                                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-50">
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
                              <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Vehicle Involved</TableCell>
                              <TableCell>
                                {isDispatchEditMode ? (
                                  <Select value={dispatchData.vehicleInvolved} onValueChange={v => setDispatchData(d => ({ ...d, vehicleInvolved: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select vehicle involved" /></SelectTrigger>
                                    <SelectContent>
                                      {vehicleInvolvedOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  dispatchData.vehicleInvolved || "Not specified"
                                )}
                              </TableCell>
                            </TableRow>
                            
                            <TableRow>
                              <TableCell className="font-medium text-gray-700 align-top w-1/3 min-w-[150px]">Classification of Injury</TableCell>
                              <TableCell>
                                {isDispatchEditMode ? (
                                  <Select value={dispatchData.injuryClassification} onValueChange={v => setDispatchData(d => ({ ...d, injuryClassification: v, majorInjuryTypes: [], minorInjuryTypes: [] }))}>
                                    <SelectTrigger><SelectValue placeholder="Select injury classification" /></SelectTrigger>
                                    <SelectContent>
                                      {injuryClassificationOptions.map(classification => <SelectItem key={classification} value={classification}>{classification}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  dispatchData.injuryClassification ? (
                                    <Badge className={dispatchData.injuryClassification === "Major" ? "bg-red-100 text-red-800 hover:bg-red-50" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-50"}>
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
                                  {isDispatchEditMode ? (
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
                                          <Badge key={index} className="bg-red-100 text-red-800 hover:bg-red-50 text-xs">
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
                                  {isDispatchEditMode ? (
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
                                          <Badge key={index} className="bg-yellow-100 text-yellow-800 hover:bg-yellow-50 text-xs">
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
                                {isDispatchEditMode ? (
                                  <Select value={dispatchData.medicalClassification} onValueChange={v => setDispatchData(d => ({ ...d, medicalClassification: v, majorMedicalSymptoms: [], minorMedicalSymptoms: [] }))}>
                                    <SelectTrigger><SelectValue placeholder="Select medical classification" /></SelectTrigger>
                                    <SelectContent>
                                      {injuryClassificationOptions.map(classification => <SelectItem key={classification} value={classification}>{classification}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  dispatchData.medicalClassification ? (
                                    <Badge className={dispatchData.medicalClassification === "Major" ? "bg-red-100 text-red-800 hover:bg-red-50" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-50"}>
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
                                  {isDispatchEditMode ? (
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
                                          <Badge key={index} className="bg-red-100 text-red-800 hover:bg-red-50 text-xs">
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
                                  {isDispatchEditMode ? (
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
                                          <Badge key={index} className="bg-yellow-100 text-yellow-800 hover:bg-yellow-50 text-xs">
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
                                {isDispatchEditMode ? (
                                  <Textarea 
                                    value={dispatchData.chiefComplaint} 
                                    onChange={e => setDispatchData(d => ({ ...d, chiefComplaint: e.target.value }))} 
                                    placeholder="Enter chief complaint (Short Description)"
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
                                {isDispatchEditMode ? (
                                  <Textarea 
                                    value={dispatchData.diagnosis} 
                                    onChange={e => setDispatchData(d => ({ ...d, diagnosis: e.target.value }))} 
                                      placeholder="Enter diagnosis (Short Description)"
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
                                {isDispatchEditMode ? (
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
                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-50">
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
                              {isDispatchEditMode ? (
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
                                          <Badge key={index} className="bg-blue-100 text-blue-800 hover:bg-blue-50 text-xs">
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

              <TabsContent value="patient" className="mt-4 flex-1 min-h-0 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <div className="text-lg font-semibold text-gray-800">Patient Information</div>
                  <div className="flex gap-2 flex-wrap">
                    {isPatientEditMode ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" className="bg-brand-red hover:bg-brand-red-700 text-white" onClick={async () => {
                            console.log('Saving patient information:', patients);
                            await savePatientDataToDatabase(selectedReport.firestoreId, patients);
                            setIsPatientEditMode(false);
                          }}>
                            Save
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save patient information</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" className="border-gray-300 text-gray-800 hover:bg-gray-50" onClick={() => {
                            setIsPatientEditMode(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit patient information</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto border rounded-lg min-h-0 max-h-[400px]">
                  <div className="p-4 space-y-6 pb-8">
                    {/* Patient Management Header */}
                    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Patient Management</h3>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={addNewPatient} className="bg-brand-red hover:bg-brand-red-700 text-white">
                              <Plus className="h-4 w-4 mr-2" />
                              Add New Patient
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add another patient to this report</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {patients.length > 1 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-800">Select Patient:</Label>
                          <div className="flex flex-wrap gap-2">
                            {patients.map((patient, index) => (
                              <div key={patient.id} className="flex items-center gap-2">
                                <Button
                                  variant={currentPatientIndex === index ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPatientIndex(index)}
                                  className={`text-xs ${currentPatientIndex === index ? 'bg-brand-red hover:bg-brand-red-700 text-white' : 'border-gray-300 text-gray-800 hover:bg-gray-50'}`}
                                >
                                  Patient {index + 1}
                                  {patient.name && ` - ${patient.name}`}
                                </Button>
                                {patients.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removePatient(index)}
                                    className="text-brand-red hover:text-brand-red-700 hover:bg-red-50 p-1 h-6 w-6"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {patients.length === 1 && (
                        <div className="text-sm text-gray-600">
                          Click "Add New Patient" to add additional patients.
                        </div>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <Table className="w-full min-w-[600px]">
                        <TableBody>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Name</TableCell>
                          <TableCell>
                              {isPatientEditMode ? (
                                <Input 
                                  value={currentPatient.name} 
                                  onChange={e => updateCurrentPatient({ name: e.target.value })} 
                                  placeholder="Enter patient's full name"
                                  className="border-gray-300 focus:ring-brand-red focus:border-brand-red"
                                />
                              ) : (
                                <span className="text-gray-800">{currentPatient.name || <span className="text-gray-400 italic">Not specified</span>}</span>
                              )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Contact Number</TableCell>
                          <TableCell>
                              {isPatientEditMode ? (
                                <Input 
                                  value={currentPatient.contactNumber} 
                                  onChange={e => updateCurrentPatient({ contactNumber: e.target.value })} 
                                  placeholder="Enter contact number"
                                  className="border-gray-300 focus:ring-brand-red focus:border-brand-red"
                                />
                              ) : (
                                <span className="text-gray-800">{currentPatient.contactNumber || <span className="text-gray-400 italic">Not specified</span>}</span>
                              )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Address</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Textarea 
                                value={currentPatient.address} 
                                onChange={e => updateCurrentPatient(d => ({ ...d, address: e.target.value }))} 
                                placeholder="Enter complete address"
                                className="min-h-[80px] border-gray-300 focus:ring-brand-red focus:border-brand-red"
                              />
                            ) : (
                              <span className="text-gray-800">{currentPatient.address || <span className="text-gray-400 italic">Not specified</span>}</span>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Religion</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Select value={currentPatient.religion} onValueChange={v => updateCurrentPatient(d => ({ ...d, religion: v }))}>
                                <SelectTrigger className="border-gray-300 focus:ring-brand-red focus:border-brand-red"><SelectValue placeholder="Select religion" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Catholic">Catholic</SelectItem>
                                  <SelectItem value="Protestant">Protestant</SelectItem>
                                  <SelectItem value="Islam">Islam</SelectItem>
                                  <SelectItem value="Buddhism">Buddhism</SelectItem>
                                  <SelectItem value="Hinduism">Hinduism</SelectItem>
                                  <SelectItem value="Judaism">Judaism</SelectItem>
                                  <SelectItem value="Atheist">Atheist</SelectItem>
                                  <SelectItem value="Agnostic">Agnostic</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              currentPatient.religion ? (
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-50">
                                  {currentPatient.religion}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 italic">Not specified</span>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Birthday</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Input 
                                type="date" 
                                value={currentPatient.birthday} 
                                onChange={e => updateCurrentPatient(d => ({ ...d, birthday: e.target.value }))} 
                                className="border-gray-300 focus:ring-brand-red focus:border-brand-red"
                              />
                            ) : (
                              <span className="text-gray-800">{currentPatient.birthday ? new Date(currentPatient.birthday).toLocaleDateString() : <span className="text-gray-400 italic">Not specified</span>}</span>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Blood Type</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Select value={currentPatient.bloodType} onValueChange={v => updateCurrentPatient(d => ({ ...d, bloodType: v }))}>
                                <SelectTrigger className="border-gray-300 focus:ring-brand-red focus:border-brand-red"><SelectValue placeholder="Select blood type" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A+">A+</SelectItem>
                                  <SelectItem value="A-">A-</SelectItem>
                                  <SelectItem value="B+">B+</SelectItem>
                                  <SelectItem value="B-">B-</SelectItem>
                                  <SelectItem value="AB+">AB+</SelectItem>
                                  <SelectItem value="AB-">AB-</SelectItem>
                                  <SelectItem value="O+">O+</SelectItem>
                                  <SelectItem value="O-">O-</SelectItem>
                                  <SelectItem value="Unknown">Unknown</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              currentPatient.bloodType ? (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-50">
                                  {currentPatient.bloodType}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 italic">Not specified</span>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Civil Status</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Select value={currentPatient.civilStatus} onValueChange={v => updateCurrentPatient(d => ({ ...d, civilStatus: v }))}>
                                <SelectTrigger className="border-gray-300 focus:ring-brand-red focus:border-brand-red"><SelectValue placeholder="Select civil status" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Single">Single</SelectItem>
                                  <SelectItem value="Married">Married</SelectItem>
                                  <SelectItem value="Widowed">Widowed</SelectItem>
                                  <SelectItem value="Divorced">Divorced</SelectItem>
                                  <SelectItem value="Separated">Separated</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              currentPatient.civilStatus ? (
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-50">
                                  {currentPatient.civilStatus}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 italic">Not specified</span>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Age</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Input 
                                type="number" 
                                value={currentPatient.age} 
                                onChange={e => updateCurrentPatient(d => ({ ...d, age: e.target.value }))} 
                                placeholder="Enter age"
                                min="0"
                                max="150"
                                className="border-gray-300 focus:ring-brand-red focus:border-brand-red"
                              />
                            ) : (
                              <span className="text-gray-800">{currentPatient.age ? `${currentPatient.age} years old` : <span className="text-gray-400 italic">Not specified</span>}</span>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">PWD (Person with Disability)</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Select value={currentPatient.pwd} onValueChange={v => updateCurrentPatient(d => ({ ...d, pwd: v }))}>
                                <SelectTrigger className="border-gray-300 focus:ring-brand-red focus:border-brand-red"><SelectValue placeholder="Select PWD status" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              currentPatient.pwd ? (
                                <Badge className={currentPatient.pwd === "Yes" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-50" : "bg-green-100 text-green-800 hover:bg-green-50"}>
                                  {currentPatient.pwd}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 italic">Not specified</span>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Age Group</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Select value={currentPatient.ageGroup} onValueChange={v => updateCurrentPatient(d => ({ ...d, ageGroup: v }))}>
                                <SelectTrigger className="border-gray-300 focus:ring-brand-red focus:border-brand-red"><SelectValue placeholder="Select age group" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Infant">Infant (0-2 years)</SelectItem>
                                  <SelectItem value="Child">Child (3-12 years)</SelectItem>
                                  <SelectItem value="Adolescent">Adolescent (13-17 years)</SelectItem>
                                  <SelectItem value="Adult">Adult (18-59 years)</SelectItem>
                                  <SelectItem value="Senior Citizen">Senior Citizen (60+ years)</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              currentPatient.ageGroup ? (
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-50">
                                  {currentPatient.ageGroup}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 italic">Not specified</span>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Gender</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Select value={currentPatient.gender} onValueChange={v => updateCurrentPatient(d => ({ ...d, gender: v }))}>
                                <SelectTrigger className="border-gray-300 focus:ring-brand-red focus:border-brand-red"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              currentPatient.gender ? (
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-50">
                                  {currentPatient.gender}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 italic">Not specified</span>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Name of Companion/Relative</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Input 
                                value={currentPatient.companionName} 
                                onChange={e => updateCurrentPatient(d => ({ ...d, companionName: e.target.value }))} 
                                placeholder="Enter companion/relative name"
                              />
                            ) : (
                              currentPatient.companionName || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm font-medium text-gray-800 align-top w-1/3 min-w-[150px]">Companion Contact Number</TableCell>
                          <TableCell>
                            {isPatientEditMode ? (
                              <Input 
                                value={currentPatient.companionContact} 
                                onChange={e => updateCurrentPatient(d => ({ ...d, companionContact: e.target.value }))} 
                                placeholder="Enter companion contact number"
                              />
                            ) : (
                              currentPatient.companionContact || "Not specified"
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    
                    {/* Glasgow Coma Scale Section */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Glasgow Coma Scale (GCS)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Eyes Response */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 mb-3">Eyes Response</h4>
                          <div className="space-y-2">
                            {isPatientEditMode ? (
                              <RadioGroup value={currentPatient.gcs.eyes} onValueChange={v => updateCurrentPatient({ gcs: { ...currentPatient.gcs, eyes: v } })}>
                                {[
                                  { value: "4", label: "4 - Spontaneous" },
                                  { value: "3", label: "3 - To sound" },
                                  { value: "2", label: "2 - To Pain" },
                                  { value: "1", label: "1 - None" }
                                ].map((option) => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.value} id={`eyes-${option.value}`} />
                                    <Label htmlFor={`eyes-${option.value}`} className="text-sm">
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            ) : (
                              <div className="space-y-1">
                                {currentPatient.gcs.eyes ? (
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-50">
                                    {[
                                      { value: "4", label: "4 - Spontaneous" },
                                      { value: "3", label: "3 - To sound" },
                                      { value: "2", label: "2 - To Pain" },
                                      { value: "1", label: "1 - None" }
                                    ].find(opt => opt.value === currentPatient.gcs.eyes)?.label || currentPatient.gcs.eyes}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500">Not assessed</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Verbal Response */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 mb-3">Verbal Response</h4>
                          <div className="space-y-2">
                            {isPatientEditMode ? (
                              <RadioGroup value={currentPatient.gcs.verbal} onValueChange={v => updateCurrentPatient({ gcs: { ...currentPatient.gcs, verbal: v } })}>
                                {[
                                  { value: "5", label: "5 - Oriented" },
                                  { value: "4", label: "4 - Confused" },
                                  { value: "3", label: "3 - Words" },
                                  { value: "2", label: "2 - Sounds" },
                                  { value: "1", label: "1 - None" }
                                ].map((option) => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.value} id={`verbal-${option.value}`} />
                                    <Label htmlFor={`verbal-${option.value}`} className="text-sm">
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            ) : (
                              <div className="space-y-1">
                                {currentPatient.gcs.verbal ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-50">
                                    {[
                                      { value: "5", label: "5 - Oriented" },
                                      { value: "4", label: "4 - Confused" },
                                      { value: "3", label: "3 - Words" },
                                      { value: "2", label: "2 - Sounds" },
                                      { value: "1", label: "1 - None" }
                                    ].find(opt => opt.value === currentPatient.gcs.verbal)?.label || currentPatient.gcs.verbal}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500">Not assessed</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Motor Response */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 mb-3">Motor Response</h4>
                          <div className="space-y-2">
                            {isPatientEditMode ? (
                              <RadioGroup value={currentPatient.gcs.motor} onValueChange={v => updateCurrentPatient({ gcs: { ...currentPatient.gcs, motor: v } })}>
                                {[
                                  { value: "6", label: "6 - Obey Commands" },
                                  { value: "5", label: "5 - Localizing" },
                                  { value: "4", label: "4 - Withdrawn" },
                                  { value: "3", label: "3 - Flexion" },
                                  { value: "2", label: "2 - Extension" },
                                  { value: "1", label: "1 - None" }
                                ].map((option) => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.value} id={`motor-${option.value}`} />
                                    <Label htmlFor={`motor-${option.value}`} className="text-sm">
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            ) : (
                              <div className="space-y-1">
                                {currentPatient.gcs.motor ? (
                                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-50">
                                    {[
                                      { value: "6", label: "6 - Obey Commands" },
                                      { value: "5", label: "5 - Localizing" },
                                      { value: "4", label: "4 - Withdrawn" },
                                      { value: "3", label: "3 - Flexion" },
                                      { value: "2", label: "2 - Extension" },
                                      { value: "1", label: "1 - None" }
                                    ].find(opt => opt.value === currentPatient.gcs.motor)?.label || currentPatient.gcs.motor}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500">Not assessed</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* GCS Total Score Display */}
                      <div className="mt-4 p-3 bg-white rounded border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">GCS Total Score:</span>
                          <span className="text-2xl font-bold text-brand-orange">
                            {(() => {
                              const eyesScore = currentPatient.gcs.eyes ? parseInt(currentPatient.gcs.eyes) : 0;
                              const verbalScore = currentPatient.gcs.verbal ? parseInt(currentPatient.gcs.verbal) : 0;
                              const motorScore = currentPatient.gcs.motor ? parseInt(currentPatient.gcs.motor) : 0;
                              const total = eyesScore + verbalScore + motorScore;
                              return total > 0 ? total : "Not assessed";
                            })()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {(() => {
                            const eyesScore = currentPatient.gcs.eyes ? parseInt(currentPatient.gcs.eyes) : 0;
                            const verbalScore = currentPatient.gcs.verbal ? parseInt(currentPatient.gcs.verbal) : 0;
                            const motorScore = currentPatient.gcs.motor ? parseInt(currentPatient.gcs.motor) : 0;
                            const total = eyesScore + verbalScore + motorScore;
                            
                            if (total === 0) return "Complete assessment required";
                            if (total >= 13) return "Minor (13-14)";
                            if (total >= 9) return "Moderate (9-12)";
                            if (total >= 3) return "Severe (< 8)";
                            return "Critical condition";
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Pupil Assessment Section */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Pupil Assessment</h3>
                      <div className="max-w-md">
                        {isPatientEditMode ? (
                          <RadioGroup value={currentPatient.pupil} onValueChange={v => updateCurrentPatient({ pupil: v })}>
                            {[
                              { value: "PERRLA", label: "PERRLA" },
                              { value: "Constricted", label: "Constricted" },
                              { value: "Dilated", label: "Dilated" }
                            ].map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={`pupil-${option.value}`} />
                                <Label htmlFor={`pupil-${option.value}`} className="text-sm">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : (
                          <div>
                            {currentPatient.pupil ? (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-50">
                                {currentPatient.pupil}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">Not assessed</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lung Sounds Section */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Lung Sounds</h3>
                      <div className="max-w-md">
                        {isPatientEditMode ? (
                          <RadioGroup value={currentPatient.lungSounds} onValueChange={v => updateCurrentPatient({ lungSounds: v })}>
                            {[
                              { value: "Clear", label: "Clear" },
                              { value: "Absent", label: "Absent" },
                              { value: "Decreased", label: "Decreased" },
                              { value: "Rales", label: "Rales" },
                              { value: "Wheezes", label: "Wheezes" },
                              { value: "Stridor", label: "Stridor" }
                            ].map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={`lung-${option.value}`} />
                                <Label htmlFor={`lung-${option.value}`} className="text-sm">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : (
                          <div>
                            {currentPatient.lungSounds ? (
                              <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-50">
                                {currentPatient.lungSounds}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">Not assessed</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Perfusion Section */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Perfusion Assessment</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Skin Assessment */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 mb-3">Skin</h4>
                          <div className="space-y-2">
                            {isPatientEditMode ? (
                              <RadioGroup value={currentPatient.perfusion.skin} onValueChange={v => updateCurrentPatient({ perfusion: { ...currentPatient.perfusion, skin: v } })}>
                                {[
                                  { value: "Normal", label: "Normal" },
                                  { value: "Warm", label: "Warm" },
                                  { value: "Dry", label: "Dry" },
                                  { value: "Moist", label: "Moist" },
                                  { value: "Cool", label: "Cool" },
                                  { value: "Pale", label: "Pale" },
                                  { value: "Cyanotic", label: "Cyanotic" },
                                  { value: "Flushed", label: "Flushed" },
                                  { value: "Jaundice", label: "Jaundice" }
                                ].map((option) => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.value} id={`skin-${option.value}`} />
                                    <Label htmlFor={`skin-${option.value}`} className="text-sm">
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            ) : (
                              <div>
                                {currentPatient.perfusion.skin ? (
                                  <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-50">
                                    {currentPatient.perfusion.skin}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500">Not assessed</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Pulse Assessment */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 mb-3">Pulse</h4>
                          <div className="space-y-2">
                            {isPatientEditMode ? (
                              <RadioGroup value={currentPatient.perfusion.pulse} onValueChange={v => updateCurrentPatient({ perfusion: { ...currentPatient.perfusion, pulse: v } })}>
                                {[
                                  { value: "Regular", label: "Regular" },
                                  { value: "Strong", label: "Strong" },
                                  { value: "Irregular", label: "Irregular" },
                                  { value: "Weak", label: "Weak" },
                                  { value: "Absent", label: "Absent" }
                                ].map((option) => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.value} id={`pulse-${option.value}`} />
                                    <Label htmlFor={`pulse-${option.value}`} className="text-sm">
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            ) : (
                              <div>
                                {currentPatient.perfusion.pulse ? (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-50">
                                    {currentPatient.perfusion.pulse}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500">Not assessed</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Vital Signs Section */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vital Signs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Time Taken */}
                        <div>
                          <Label className="text-sm font-medium text-gray-800">Time Taken</Label>
                          {isPatientEditMode ? (
                            <Input 
                              type="time" 
                              value={currentPatient.vitalSigns.timeTaken} 
                              onChange={e => updateCurrentPatient({ vitalSigns: { ...currentPatient.vitalSigns, timeTaken: e.target.value } })} 
                              className="mt-1"
                            />
                          ) : (
                            <div className="mt-1">
                              {currentPatient.vitalSigns.timeTaken ? (
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-50">
                                  {currentPatient.vitalSigns.timeTaken}
                                </Badge>
                              ) : (
                                <span className="text-gray-500">Not recorded</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Temperature */}
                        <div>
                          <Label className="text-sm font-medium text-gray-800">Temperature (°C)</Label>
                          {isPatientEditMode ? (
                            <Input 
                              type="number" 
                              step="0.1"
                              value={currentPatient.vitalSigns.temperature} 
                              onChange={e => updateCurrentPatient({ vitalSigns: { ...currentPatient.vitalSigns, temperature: e.target.value } })} 
                              placeholder="36.5"
                              className="mt-1"
                            />
                          ) : (
                            <div className="mt-1">
                              {currentPatient.vitalSigns.temperature ? (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-50">
                                  {currentPatient.vitalSigns.temperature}°C
                                </Badge>
                              ) : (
                                <span className="text-gray-500">Not recorded</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Pulse Rate */}
                        <div>
                          <Label className="text-sm font-medium text-gray-800">Pulse Rate (bpm)</Label>
                          {isPatientEditMode ? (
                            <Input 
                              type="number" 
                              value={currentPatient.vitalSigns.pulseRate} 
                              onChange={e => updateCurrentPatient({ vitalSigns: { ...currentPatient.vitalSigns, pulseRate: e.target.value } })} 
                              placeholder="80"
                              className="mt-1"
                            />
                          ) : (
                            <div className="mt-1">
                              {currentPatient.vitalSigns.pulseRate ? (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-50">
                                  {currentPatient.vitalSigns.pulseRate} bpm
                                </Badge>
                              ) : (
                                <span className="text-gray-500">Not recorded</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Respiratory Rate */}
                        <div>
                          <Label className="text-sm font-medium text-gray-800">Respiratory Rate (breaths/min)</Label>
                          {isPatientEditMode ? (
                            <Input 
                              type="number" 
                              value={currentPatient.vitalSigns.respiratoryRate} 
                              onChange={e => updateCurrentPatient({ vitalSigns: { ...currentPatient.vitalSigns, respiratoryRate: e.target.value } })} 
                              placeholder="16"
                              className="mt-1"
                            />
                          ) : (
                            <div className="mt-1">
                              {currentPatient.vitalSigns.respiratoryRate ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-50">
                                  {currentPatient.vitalSigns.respiratoryRate} breaths/min
                                </Badge>
                              ) : (
                                <span className="text-gray-500">Not recorded</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Blood Pressure */}
                        <div>
                          <Label className="text-sm font-medium text-gray-800">Blood Pressure (mmHg)</Label>
                          {isPatientEditMode ? (
                            <Input 
                              value={currentPatient.vitalSigns.bloodPressure} 
                              onChange={e => updateCurrentPatient({ vitalSigns: { ...currentPatient.vitalSigns, bloodPressure: e.target.value } })} 
                              placeholder="120/80"
                              className="mt-1"
                            />
                          ) : (
                            <div className="mt-1">
                              {currentPatient.vitalSigns.bloodPressure ? (
                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-50">
                                  {currentPatient.vitalSigns.bloodPressure} mmHg
                                </Badge>
                              ) : (
                                <span className="text-gray-500">Not recorded</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* SPO2 */}
                        <div>
                          <Label className="text-sm font-medium text-gray-800">SPO2 (%)</Label>
                          {isPatientEditMode ? (
                            <div className="mt-1 space-y-2">
                              <Input 
                                type="number" 
                                value={currentPatient.vitalSigns.spo2} 
                                onChange={e => updateCurrentPatient({ vitalSigns: { ...currentPatient.vitalSigns, spo2: e.target.value } })} 
                                placeholder="98"
                                className="w-full"
                              />
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="spo2-o2-support"
                                  checked={currentPatient.vitalSigns.spo2WithO2Support}
                                  onCheckedChange={(checked) => updateCurrentPatient({ vitalSigns: { ...currentPatient.vitalSigns, spo2WithO2Support: checked as boolean } })}
                                />
                                <Label htmlFor="spo2-o2-support" className="text-sm text-gray-600">
                                  With O2 Support
                                </Label>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1">
                              {currentPatient.vitalSigns.spo2 ? (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-50">
                                    {currentPatient.vitalSigns.spo2}%
                                  </Badge>
                                  {currentPatient.vitalSigns.spo2WithO2Support && (
                                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-50 text-xs">
                                      O2 Support
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">Not recorded</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Random Blood Sugar */}
                        <div>
                          <Label className="text-sm font-medium text-gray-800">Random Blood Sugar (mg/dL)</Label>
                          {isPatientEditMode ? (
                            <Input 
                              type="number" 
                              value={currentPatient.vitalSigns.randomBloodSugar} 
                              onChange={e => updateCurrentPatient({ vitalSigns: { ...currentPatient.vitalSigns, randomBloodSugar: e.target.value } })} 
                              placeholder="100"
                              className="mt-1"
                            />
                          ) : (
                            <div className="mt-1">
                              {currentPatient.vitalSigns.randomBloodSugar ? (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-50">
                                  {currentPatient.vitalSigns.randomBloodSugar} mg/dL
                                </Badge>
                              ) : (
                                <span className="text-gray-500">Not recorded</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Pain Scale */}
                        <div>
                          <Label className="text-sm font-medium text-gray-800">Pain Scale (0-10)</Label>
                          {isPatientEditMode ? (
                            <Select value={currentPatient.vitalSigns.painScale} onValueChange={v => updateCurrentPatient({ vitalSigns: { ...currentPatient.vitalSigns, painScale: v } })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select pain level" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 11 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {i} - {i === 0 ? "No pain" : i <= 3 ? "Mild" : i <= 6 ? "Moderate" : i <= 8 ? "Severe" : "Unbearable"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1">
                              {currentPatient.vitalSigns.painScale ? (
                                <Badge className={
                                  parseInt(currentPatient.vitalSigns.painScale) <= 3 ? "bg-green-100 text-green-800 hover:bg-green-50" :
                                  parseInt(currentPatient.vitalSigns.painScale) <= 6 ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-50" :
                                  parseInt(currentPatient.vitalSigns.painScale) <= 8 ? "bg-orange-100 text-orange-800 hover:bg-orange-50" :
                                  "bg-red-100 text-red-800 hover:bg-red-50"
                                }>
                                  {currentPatient.vitalSigns.painScale} - {
                                    parseInt(currentPatient.vitalSigns.painScale) === 0 ? "No pain" :
                                    parseInt(currentPatient.vitalSigns.painScale) <= 3 ? "Mild" :
                                    parseInt(currentPatient.vitalSigns.painScale) <= 6 ? "Moderate" :
                                    parseInt(currentPatient.vitalSigns.painScale) <= 8 ? "Severe" :
                                    "Unbearable"
                                  }
                                </Badge>
                              ) : (
                                <span className="text-gray-500">Not assessed</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </TabsContent>

            </Tabs>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-500 text-lg">Loading report preview...</div>
                  <div className="text-sm text-gray-400 mt-2">selectedReport: {selectedReport ? 'exists' : 'null'}</div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Preview Modal */}
        <Dialog open={showImagePreview} onOpenChange={(open) => {
          console.log('Image preview modal state change:', open);
          setShowImagePreview(open);
        }}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-white flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-brand-orange" />
                Image Preview
                {(() => {
                  const isAdminMedia = (isPreviewEditMode ? previewEditData?.adminMedia : selectedReport?.adminMedia)?.includes(previewImageUrl);
                  const isMobileMedia = (isPreviewEditMode ? previewEditData?.mobileMedia : selectedReport?.mobileMedia)?.includes(previewImageUrl);
                  
                  if (isAdminMedia) {
                    return <Badge variant="outline" className="border-gray-500 text-gray-800 text-xs">Admin Added</Badge>;
                  } else if (isMobileMedia) {
                    return <Badge variant="secondary" className="text-xs">Mobile User</Badge>;
                  }
                  return null;
                })()}
              </DialogTitle>
              <DialogDescription>
                {previewImageName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
              <div className="relative max-w-full max-h-full">
                <img 
                  src={previewImageUrl} 
                  alt={previewImageName}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-64 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
                          <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <p class="text-gray-500 text-center">Failed to load image</p>
                          <p class="text-sm text-gray-400 text-center mt-1">${previewImageName}</p>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleDownloadImage(previewImageUrl, previewImageName)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              {isPreviewEditMode && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    const imageIndex = (isPreviewEditMode ? previewEditData?.attachedMedia : selectedReport?.attachedMedia)?.findIndex((url: string) => url === previewImageUrl);
                    if (imageIndex !== undefined && imageIndex >= 0) {
                      handleDeleteImage(previewImageUrl, imageIndex);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Location Map Modal */}
        <Dialog open={showLocationMap} onOpenChange={setShowLocationMap}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-white flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-orange" />
                Select New Location
              </DialogTitle>
              <DialogDescription>
                Click on the map to select a new location for this report. The address will be automatically updated.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 border rounded-lg">
                <MapboxMap 
                  onMapClick={handleMapClick}
                  showOnlyCurrentLocation={true}
                  clickedLocation={newLocation}
                  showGeocoder={true}
                  onGeocoderResult={handleMapClick}
                  singleMarker={selectedReport?.latitude && selectedReport?.longitude ? 
                    {
                      id: selectedReport.id || 'report-marker',
                      type: selectedReport.type || 'Emergency',
                      title: selectedReport.location || 'Report Location',
                      description: selectedReport.description || 'Emergency report location',
                      reportId: selectedReport.id,
                      coordinates: [selectedReport.longitude, selectedReport.latitude] as [number, number],
                      status: selectedReport.status,
                      locationName: selectedReport.location,
                      latitude: selectedReport.latitude,
                      longitude: selectedReport.longitude
                    } : 
                    undefined}
                  center={selectedReport?.latitude && selectedReport?.longitude ? 
                    [selectedReport.longitude, selectedReport.latitude] as [number, number] : 
                    [121.5556, 14.1139] as [number, number]} // Center on Lucban, Quezon
                  zoom={14}
                />
              </div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setShowLocationMap(false);
                setNewLocation(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveLocation}
                disabled={!newLocation}
                className="bg-brand-orange hover:bg-brand-orange-400 text-white"
              >
                Save Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team Management Modal */}
        <Dialog open={showTeamManagement} onOpenChange={setShowTeamManagement}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Team Members</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Team Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Team</label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedTeamForManagement === "Team Alpha" ? "default" : "outline"}
                    onClick={() => setSelectedTeamForManagement("Team Alpha")}
                  >
                    Team Alpha
                  </Button>
                  <Button
                    variant={selectedTeamForManagement === "Team Sulu" ? "default" : "outline"}
                    onClick={() => setSelectedTeamForManagement("Team Sulu")}
                  >
                    Team Sulu
                  </Button>
                </div>
              </div>

              {/* Add New Member */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Add New Member</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter member name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      if (newMemberName.trim()) {
                        addTeamMember(selectedTeamForManagement, newMemberName.trim());
                        setNewMemberName("");
                      }
                    }}
                    disabled={!newMemberName.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Current Members */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Members</label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {selectedTeamForManagement === "Team Alpha" ? (
                    teamAlpha.length > 0 ? (
                      <div className="space-y-2">
                        {teamAlpha.map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{member}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeTeamMember("Team Alpha", member)}
                              className="text-brand-red hover:text-brand-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">No members in Team Alpha</div>
                    )
                  ) : (
                    teamSulu.length > 0 ? (
                      <div className="space-y-2">
                        {teamSulu.map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{member}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeTeamMember("Team Sulu", member)}
                              className="text-brand-red hover:text-brand-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">No members in Team Sulu</div>
                    )
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowTeamManagement(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Report Alert Modal */}
        <Dialog open={showNewReportAlert} onOpenChange={setShowNewReportAlert}>
          <DialogContent className="max-w-md border-brand-red bg-red-50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-brand-red flex items-center gap-2">
                <div className="w-3 h-3 bg-brand-red rounded-full animate-pulse"></div>
                🚨 NEW EMERGENCY REPORT
              </DialogTitle>
            </DialogHeader>
            {newReportData && (
              <div className="space-y-4 py-4">
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">Report ID: {newReportData.id}</h4>
                        <p className="text-sm text-gray-600">Type: {newReportData.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">{newReportData.dateSubmitted}</p>
                        <p className="text-sm text-gray-600">{newReportData.timeSubmitted}</p>
                      </div>
                    </div>
                    
                    {newReportData.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Description:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {newReportData.description.length > 100 
                            ? `${newReportData.description.substring(0, 100)}...` 
                            : newReportData.description}
                        </p>
                      </div>
                    )}
                    
                    {newReportData.location && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Location:</p>
                        <p className="text-sm text-gray-600">{newReportData.location}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setShowNewReportAlert(false);
                      // You can add navigation to the specific report here
                    }}
                    className="flex-1 bg-brand-red hover:bg-brand-red-700 text-white"
                  >
                    View Report
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewReportAlert(false)}
                    className="flex-1 border-red-300 text-brand-red hover:bg-red-100"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Report</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this report? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={confirmDeleteReport}>
                Delete Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Batch Delete Confirmation Dialog */}
        <Dialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Selected Reports</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedReports.length} selected report(s)? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={confirmBatchDelete}>
                Delete {selectedReports.length} Report(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </Layout>
  );
}
