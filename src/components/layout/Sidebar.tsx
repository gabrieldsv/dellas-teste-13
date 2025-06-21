
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings,
  DollarSign,
  Home
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      color: "text-sky-500"
    },
    {
      label: "Agenda",
      icon: Calendar,
      href: "/agenda", 
      color: "text-violet-500"
    },
    {
      label: "Clientes",
      icon: Users,
      href: "/clientes",
      color: "text-pink-700"
    },
    {
      label: "Pagamentos",
      icon: CreditCard,
      href: "/pagamentos",
      color: "text-orange-700"
    },
    {
      label: "Gerenciar Serviços",
      icon: Settings,
      href: "/services-management",
      color: "text-green-700"
    }
  ];

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Beleza Agendada
          </h2>
          <div className="space-y-1">
            {routes.map((route) => (
              <Button
                key={route.href}
                variant={location.pathname === route.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link to={route.href}>
                  <route.icon className={cn("mr-2 h-4 w-4", route.color)} />
                  {route.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
