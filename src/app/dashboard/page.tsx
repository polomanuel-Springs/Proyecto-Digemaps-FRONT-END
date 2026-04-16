"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ShieldCheck } from "lucide-react";
import AnalistaDashboard from "@/components/dashboards/analista-dashboard"; 
import RegistroDashboard from "@/components/dashboards/registro-dashboard";
import ValidadorDashboard from "@/components/dashboards/validador-dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn !== "true") {
      router.replace("/login");
      return;
    }

    const role = localStorage.getItem("userRole");
    setUserRole(role);
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("jwt");
    localStorage.removeItem("userRole");
    router.replace("/login");
  };
  
  const renderDefaultDashboard = () => (
     <div className="flex min-h-screen items-center justify-center bg-background animate-in fade-in duration-500">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">
            Welcome to DIGEMAPS
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 p-8">
           <p className="text-center text-muted-foreground">
            You have successfully logged in. This is your main dashboard.
          </p>
          {userRole && (
            <div className="flex items-center gap-2 rounded-md bg-secondary p-3 text-secondary-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="font-medium">
                Your role is: <span className="font-bold text-primary">{userRole}</span>
              </p>
            </div>
          )}
          <Button onClick={handleLogout} className="w-full max-w-xs" variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  switch (userRole) {
    case 'Registro':
      return <RegistroDashboard />;
    case 'Validador':
      return <ValidadorDashboard />;
    case 'Analista': 
      return <AnalistaDashboard />;
    default:
      return renderDefaultDashboard();
  }
}
