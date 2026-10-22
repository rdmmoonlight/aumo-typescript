"use client";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { baseApi } from "@/lib/apiClient";
import { store } from "@/lib/store";
import { authApi, UserProfileData } from "@/lib/store/auth/authApi";
import {
  BookOpen,
  Bot,
  Calendar,
  ChevronsUpDown,
  FileBarChart,
  FileSpreadsheet,
  Home,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Settings,
  User,
  Wrench,
} from "lucide-react";

import * as React from "react";
import Link from "next/link";

export function DashboardSidebarCollapse() {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={toggleSidebar}
    >
      {isCollapsed ? (
        <PanelLeft className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </Button>
  );
}

const navigation = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Periods", url: "/periods", icon: Calendar },
  { title: "Chart of Accounts", url: "/chart-of-accounts", icon: BookOpen },
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "Journal Entry", url: "/journal-entry", icon: FileSpreadsheet },
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "Tools", url: "/tools", icon: Wrench },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isMounted, setIsMounted] = React.useState(false);
  const [user, setUser] = React.useState<UserProfileData | null>(null);
  const [isUserLoading, setIsUserLoading] = React.useState(true);

  React.useEffect(() => {
    setIsMounted(true);

    async function fetchUser() {
      try {
        setIsUserLoading(true);
        const result = await store.dispatch(
          authApi.endpoints.getProfile.initiate(),
        );

        if (result.isSuccess && result.data) {
          const profileData = (result.data as any).data || result.data;
          setUser(profileData);
        }
      } catch (error) {
        console.error("Gagal mengambil data profil:", error);
      } finally {
        setIsUserLoading(false);
      }
    }

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await store.dispatch(authApi.endpoints.logout.initiate());
    } catch (e) {
      console.error(e);
    } finally {
      store.dispatch(baseApi.util.resetApiState());
      document.cookie =
        "AumoFinance.Session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.replace("/");
    }
  };

  const ICON_CLASS = "h-4 w-4 shrink-0";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r h-screen sticky top-0 flex flex-col justify-between"
      style={
        {
          "--sidebar-width": "255px",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <SidebarHeader
        className={`border-b shrink-0 flex items-center gap-2 ${
          isCollapsed
            ? "flex-col justify-center p-2.5 gap-3"
            : "flex-row justify-between p-3.5"
        }`}
      >
        {isCollapsed ? (
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
            <img
              src="/favicon.ico"
              alt="Aumo"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </div>
        ) : (
          <h2 className="text-xl font-bold tracking-tight truncate">
            Aumo Finance
          </h2>
        )}
        <DashboardSidebarCollapse />
      </SidebarHeader>

      <SidebarContent className="p-2.5 flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-widest text-muted-foreground mb-2 px-2 group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/home" && pathname.startsWith(item.url + "/"));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="text-sm h-8 font-normal px-2"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-2.5"
                      >
                        <Icon className={ICON_CLASS} />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className={`border-t shrink-0 ${
          isCollapsed ? "p-2 flex justify-center" : "p-2.5"
        }`}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {isCollapsed ? (
                  <SidebarMenuButton
                    tooltip={user?.fullName || user?.userName || "Account"}
                    className="mx-auto flex size-9 items-center justify-center rounded-full p-0 hover:bg-accent"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.avatarUrl || undefined}
                        alt={user?.fullName || "User"}
                      />
                      <AvatarFallback className="bg-muted text-xs">
                        {user?.fullName ? (
                          user.fullName.slice(0, 2).toUpperCase()
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton className="h-auto w-full justify-between px-2 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5 text-left">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage
                          src={user?.avatarUrl || undefined}
                          alt={user?.fullName || "User"}
                        />
                        <AvatarFallback className="bg-muted text-xs">
                          {user?.fullName ? (
                            user.fullName.slice(0, 2).toUpperCase()
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col truncate">
                        <span className="truncate text-sm font-medium leading-tight">
                          {!isMounted || isUserLoading
                            ? "Memuat..."
                            : user?.fullName || user?.userName || "Guest"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {!isMounted || isUserLoading
                            ? "..."
                            : user?.email || "Tidak ada email"}
                        </span>
                      </div>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </SidebarMenuButton>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side={isCollapsed ? "right" : "top"}
                sideOffset={8}
                className="w-56"
              >
                <DropdownMenuItem asChild className="text-sm">
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-sm text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
