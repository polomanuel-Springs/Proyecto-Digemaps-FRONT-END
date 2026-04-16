"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, PlusCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const solicitanteSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido." }),
  direccion: z.string().min(1, { message: "La dirección es requerida." }),
  contacto: z.string().min(1, { message: "El contacto es requerido." }),
});

type SolicitanteFormData = z.infer<typeof solicitanteSchema>;

export default function RegistroDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SolicitanteFormData>({
    resolver: zodResolver(solicitanteSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      contacto: "",
    },
  });

  useEffect(() => {
    const name = localStorage.getItem("userName");
    setUserName(name);
  }, []);

  const onSubmitSolicitante = async (values: SolicitanteFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('jwt');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró el token de autenticación.",
        });
        return;
      }

      const response = await fetch("http://localhost:5088/api/catalogos/solicitantes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Solicitante agregado exitosamente.",
        });
        form.reset();
        setIsDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.message || "Error al agregar el solicitante.",
        });
      }
    } catch (error) {
      console.error("Error adding solicitante:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al agregar el solicitante.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("jwt");
    localStorage.removeItem("userRole");
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background animate-in fade-in duration-500">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">
            Welcome to DIGEMAPS
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <p className="text-center text-muted-foreground">
            Welcome back, <span className="font-semibold text-primary">{userName || 'user'}</span>!
          </p>
          <div className="flex flex-col items-center gap-4">
            <p>Your role is: <span className="font-bold">Registro</span></p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button asChild className="w-full">
                <Link href="/dashboard/registrar-muestra">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar Muestra
                </Link>
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Agregar Solicitante
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Solicitante</DialogTitle>
                    <DialogDescription>
                      Complete el formulario para agregar un nuevo solicitante al sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitSolicitante)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Ingrese el nombre completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="direccion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <Input placeholder="Ingrese la dirección" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contacto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contacto</FormLabel>
                            <FormControl>
                              <Input placeholder="Ingrese el contacto" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {isSubmitting ? "Agregando..." : "Agregar Solicitante"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Button onClick={handleLogout} className="w-full max-w-xs" variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
