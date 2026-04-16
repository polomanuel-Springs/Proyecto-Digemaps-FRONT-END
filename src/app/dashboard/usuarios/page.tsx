"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, User, PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

const formSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido." }),
  correo: z.string().email({ message: "Ingrese un correo electrónico válido." }),
  contrasena: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  rol: z.string().min(1, { message: "El rol es requerido." }),
});

const roles = ["Administrador", "Registro", "Validador", "Analista"];

export default function UsuariosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"id" | "nombre" | "correo" | "rol" | "todos">("todos");
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      correo: "",
      contrasena: "",
      rol: "",
    },
  });

  const fetchUsuarios = async () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('jwt');

    if (isLoggedIn !== 'true' || userRole !== 'Administrador') {
      router.replace('/login');
      return;
    }

    if (!token) {
      setError("No se encontró el token de autenticación.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5088/api/auth/users", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`Error al obtener los usuarios: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data: Usuario[] = await response.json();
      setUsuarios(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado al contactar el servidor.");
      console.error("Fetch error details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [router]);

  useEffect(() => {
    if (searchType === "todos" || searchTerm.trim() === "") {
      setFilteredUsuarios(usuarios);
    } else {
      const filtered = usuarios.filter((usuario) => {
        if (searchType === "id") {
          return usuario.id.toString().includes(searchTerm);
        } else if (searchType === "nombre") {
          return usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (searchType === "correo") {
          return usuario.correo.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (searchType === "rol") {
          return usuario.rol.toLowerCase() === searchTerm.toLowerCase();
        }
        return true;
      });
      setFilteredUsuarios(filtered);
    }
  }, [searchTerm, searchType, usuarios]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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

      if (isEditMode && editingUser) {
        const userDataToSend = {
          nombre: values.nombre,
          correo: values.correo,
          rol: values.rol,
        };

        const userResponse = await fetch(`http://localhost:5088/api/auth/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userDataToSend),
        });

        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          toast({
            variant: "destructive",
            title: "Error",
            description: errorData.message || "Error al actualizar el usuario.",
          });
          setIsSubmitting(false);
          return;
        }

        if (values.contrasena) {
          const passwordResponse = await fetch(`http://localhost:5088/api/auth/users/${editingUser.id}/password`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ contrasena: values.contrasena }),
          });

          if (!passwordResponse.ok) {
            const errorData = await passwordResponse.json();
            toast({
              variant: "destructive",
              title: "Error",
              description: errorData.message || "Error al cambiar la contraseña.",
            });
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        const registerResponse = await fetch("http://localhost:5088/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(values),
        });

        if (!registerResponse.ok) {
          const errorData = await registerResponse.json();
          toast({
            variant: "destructive",
            title: "Error",
            description: errorData.message || "Error al registrar el usuario.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      toast({
        title: "Éxito",
        description: isEditMode ? "Usuario actualizado exitosamente." : "Usuario registrado exitosamente.",
      });
      form.reset();
      setIsFormOpen(false);
      setIsEditMode(false);
      setEditingUser(null);
      fetchUsuarios(); // Refresh the list
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (usuario: Usuario) => {
    setIsEditMode(true);
    setEditingUser(usuario);
    form.reset({
      nombre: usuario.nombre,
      correo: usuario.correo,
      contrasena: "",
      rol: usuario.rol,
    });
    setIsFormOpen(true);
  };

  const closeEditDialog = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setEditingUser(null);
    form.reset();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

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

      const response = await fetch(`http://localhost:5088/api/auth/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Usuario eliminado exitosamente.",
        });
        setUserToDelete(null);
        fetchUsuarios(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.message || "Error al eliminar el usuario.",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al eliminar el usuario.",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Administrador":
        return "destructive";
      case "Registro":
        return "default";
      case "Validador":
        return "secondary";
      case "Analista":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-destructive">
        <ServerCrash className="h-10 w-10 mb-2" />
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) closeEditDialog();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Editar Usuario" : "Registrar Nuevo Usuario"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Actualice la información del usuario en el sistema."
                  : "Complete el formulario para registrar un nuevo usuario en el sistema."
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="correo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contrasena"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={isEditMode ? "Dejar en blanco para mantener la actual" : "Mínimo 6 caracteres"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((rol) => (
                            <SelectItem key={rol} value={rol}>
                              {rol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeEditDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? (isEditMode ? "Actualizando..." : "Registrando...") : (isEditMode ? "Actualizar Usuario" : "Registrar Usuario")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>Aquí se listan todos los usuarios registrados en el sistema.</CardDescription>
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
              <Select value={searchType} onValueChange={(value: any) => {
                setSearchType(value);
                setSearchTerm("");
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Seleccionar campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Sin filtro</SelectItem>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="correo">Correo</SelectItem>
                  <SelectItem value="rol">Rol</SelectItem>
                </SelectContent>
              </Select>
              
              {searchType === "rol" ? (
                <Select value={searchTerm} onValueChange={setSearchTerm}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol} value={rol}>
                        {rol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : searchType !== "todos" ? (
                <Input
                  placeholder={`Buscar por ${searchType}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-56"
                />
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {searchTerm.trim() !== "" ? "No se encontraron usuarios que coincidan con tu búsqueda" : "No hay usuarios registrados"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.id}</TableCell>
                    <TableCell>{usuario.nombre}</TableCell>
                    <TableCell>{usuario.correo}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(usuario.rol)}>
                        {usuario.rol}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(usuario)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setUserToDelete(usuario)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar a {userToDelete?.nombre}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
