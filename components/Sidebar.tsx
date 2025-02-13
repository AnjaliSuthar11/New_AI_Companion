"use client";
import React from "react";
import { Home, Plus, Settings, createLucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const routes = [
    {
      icon: Home,
      href: "/dashboard",
      label: "Home",
      pro: false,
    },
    {
      icon: Plus,
      href: "/dashboard/companion/new",
      label: "Create",
      pro: false,
    },
    {
      icon: Settings,
      href: "/settings",
      label: "Settings",
      pro: false,
    },
  ];

  const onNavigate = (url: string, pro: boolean) => {
    return router.push(url);
  };

  return (
    <div className="space-y-4 flex flex-col h-full text-primary bg-secondary w-full">
      <div className="p-3 flex flex-1 justify-center w-full">
        <div className="space-y-2 w-full">
          {routes.map((route) => (
            <div
              onClick={() => onNavigate(route.href, route.pro)}
              key={route.href}
              className={cn(
                "text-muted-foreground text-xs group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition mt-10 md:mt-0",
                pathname === route.href && "bg-primary/10 text-primary"
              )}
            >
              <div className="flex flex-row md:flex-col gap-y-2 items-center flex-1 gap-5 w-full">
                <route.icon className="h-5 w-5" />
                {route.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
