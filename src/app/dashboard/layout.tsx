"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Beaker, Users } from "lucide-react";
import Link from "next/link";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("userRole");
    
    if (isLoggedIn !== "true") {
      router.replace("/login");
      return;
    }

    setUserRole(role);

    const name = localStorage.getItem("userName");
    setUserName(name);
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("jwt");
    localStorage.removeItem("userRole");
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  // Render different sidebars based on user role
  if (userRole === "Validador") {
    return (
      <SidebarProvider>
        <div className="flex w-full min-h-screen bg-background">
          <Sidebar>
            <SidebarContent className="p-2">
              <div className="mb-4 flex items-center gap-2 p-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <h2 className="text-xl font-bold text-primary">DIGEMAPS</h2>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/muestras">
                      <Beaker />
                      Muestras
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <div className="flex-1 flex flex-col">
            <header className="flex h-14 items-center justify-between border-b bg-card lg:justify-end">
               <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-4 px-4">
                <p className="text-sm text-muted-foreground">
                  Welcome, <span className="font-semibold text-primary">{userName || 'user'}</span>!
                </p>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </header>
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  } else if (userRole === "Administrador") {
    return (
      <SidebarProvider>
        <div className="flex w-full min-h-screen bg-background">
          <Sidebar>
            <SidebarContent className="p-2">
              <div className="mb-4 flex items-center gap-2 p-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <h2 className="text-xl font-bold text-primary">DIGEMAPS</h2>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/usuarios">
                      <Users />
                      Usuarios
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <div className="flex-1 flex flex-col">
            <header className="flex h-14 items-center justify-between border-b bg-card lg:justify-end">
               <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-4 px-4">
                <p className="text-sm text-muted-foreground">
                  Welcome, <span className="font-semibold text-primary">{userName || 'user'}</span>!
                </p>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </header>
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  } else {
    return (
      <div className="flex-1 flex flex-col">
          <header className="flex h-14 items-center justify-between border-b bg-card lg:justify-end">
            <div className="flex items-center gap-4 px-4">
              <p className="text-sm text-muted-foreground">
                Welcome, <span className="font-semibold text-primary">{userName || 'user'}</span>!
              </p>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
    )
  }
}
