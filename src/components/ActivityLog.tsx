
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isWithinInterval } from "date-fns";

interface Activity {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  type: "info" | "warning" | "error" | "success";
  details: string;
}

// Sample activity data
const sampleActivities: Activity[] = [
  {
    id: "1",
    timestamp: new Date("2024-05-24T10:30:00"),
    user: "John Doe",
    action: "Report Generated",
    resource: "Financial Report Q1",
    type: "success",
    details: "Successfully generated quarterly financial report"
  },
  {
    id: "2",
    timestamp: new Date("2024-05-24T09:15:00"),
    user: "Jane Smith",
    action: "User Login",
    resource: "System Access",
    type: "info",
    details: "User successfully logged into the system"
  },
  {
    id: "3",
    timestamp: new Date("2024-05-24T08:45:00"),
    user: "Mike Johnson",
    action: "Data Export",
    resource: "Customer Database",
    type: "warning",
    details: "Large data export operation initiated"
  },
  {
    id: "4",
    timestamp: new Date("2024-05-23T16:20:00"),
    user: "Sarah Wilson",
    action: "Failed Login",
    resource: "System Access",
    type: "error",
    details: "Multiple failed login attempts detected"
  },
  {
    id: "5",
    timestamp: new Date("2024-05-23T14:10:00"),
    user: "Admin",
    action: "System Backup",
    resource: "Database",
    type: "success",
    details: "Automated daily backup completed successfully"
  },
  {
    id: "6",
    timestamp: new Date("2024-05-23T11:30:00"),
    user: "Tom Brown",
    action: "Report Modified",
    resource: "Risk Assessment Report",
    type: "info",
    details: "Updated risk parameters and recalculated scores"
  },
  {
    id: "7",
    timestamp: new Date("2024-05-22T15:45:00"),
    user: "Lisa Davis",
    action: "User Created",
    resource: "User Management",
    type: "success",
    details: "New user account created and activated"
  },
  {
    id: "8",
    timestamp: new Date("2024-05-22T13:20:00"),
    user: "Chris Lee",
    action: "System Error",
    resource: "Report Engine",
    type: "error",
    details: "Report generation failed due to data inconsistency"
  }
];

interface ActivityLogProps {
  searchTerm: string;
  dateRange: { from: Date | null; to: Date | null };
}

export function ActivityLog({ searchTerm, dateRange }: ActivityLogProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredActivities = useMemo(() => {
    return sampleActivities.filter((activity) => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.details.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by date range
      const matchesDate = !dateRange.from || !dateRange.to || 
        isWithinInterval(activity.timestamp, { 
          start: dateRange.from, 
          end: dateRange.to 
        });

      return matchesSearch && matchesDate;
    });
  }, [searchTerm, dateRange]);

  const totalPages = Math.ceil(filteredActivities.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + rowsPerPage);

  const getTypeColor = (type: Activity["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedActivities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(activity.timestamp, "MMM dd, yyyy HH:mm")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {activity.user}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activity.action}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activity.resource}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getTypeColor(activity.type)}>
                    {activity.type}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {activity.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Rows per page:</span>
            <Select value={rowsPerPage.toString()} onValueChange={(value) => {
              setRowsPerPage(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-700">
            {startIndex + 1} - {Math.min(startIndex + rowsPerPage, filteredActivities.length)} of {filteredActivities.length}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-gray-500">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
