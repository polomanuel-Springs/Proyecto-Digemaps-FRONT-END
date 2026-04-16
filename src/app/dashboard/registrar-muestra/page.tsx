"use client";

import { RegistrarMuestraForm } from "@/components/muestras/registrar-muestra-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegistrarMuestraPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);

    if (role !== "Registro") {
      router.push("/dashboard");
    }
  }, [router]);

  if (userRole !== "Registro") {
    return null; // or a loading/error message
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <RegistrarMuestraForm />
      </div>
    </main>
  );
}
