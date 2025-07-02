import { Avatar } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon
}: PageHeaderProps) {
  // TODO: Replace with actual user data from your auth context
  const user = {
    name: "John Doe",
    role: "Admin",
    avatarUrl: "/path/to/avatar.jpg"
  };

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {icon && <div className="w-8 h-8 flex items-center justify-center text-orange-600">
            {icon}
          </div>}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
            <Avatar className="h-8 w-8">
              <img src={user.avatarUrl} alt={user.name} onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
              }} />
            </Avatar>
            <div className="text-sm text-right">
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-gray-500">{user.role}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}