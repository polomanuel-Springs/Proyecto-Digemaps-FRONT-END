
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const formSchema = z.object({
  muestraNombre: z.string().min(1, "Nombre de muestra es requerido."),
  tipoMuestraId: z.coerce.number().min(1, "Tipo de muestra es requerido."),
  solicitanteId: z.coerce.number().min(1, "Solicitante es requerido."),
  numOficio: z.string().min(1, "Número de oficio es requerido."),
  numLote: z.string().min(1, "Número de lote es requerido."),
  condicionesRecepcion: z.string().min(1, "Condiciones son requeridas."),
  motivoSolicitud: z.string().min(1, "Motivo es requerido."),
  color: z.string().min(1, "Color es requerido."),
  olor: z.string().min(1, "Olor es requerido."),
  sabor: z.string().min(1, "Sabor es requerido."),
  aspecto: z.string().min(1, "Aspecto es requerido."),
  textura: z.string().min(1, "Textura es requerida."),
  pesoNeto: z.coerce.number().min(0, "Peso neto debe ser un número positivo."),
  regionSalud: z.coerce.number().min(1, "Región de salud es requerida."),
  dpsArea: z.string().min(1, "Área DPS es requerida."),
  tomadaPor: z.string().min(1, "El campo 'Tomada por' es requerido."),
  enviadaPor: z.string().min(1, "El campo 'Enviada por' es requerido."),
  direccionToma: z.string().min(1, "Dirección de toma es requerida."),
  fechaRecepcion: z.string().min(1, "Fecha de recepción es requerida."),
  fechaToma: z.string().min(1, "Fecha de toma es requerida."),
});

type RegistrarMuestraFormValues = z.infer<typeof formSchema>;

export function RegistrarMuestraForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [tipos, setTipos] = useState<{id: number, tipo: string}[]>([]);
  const [solicitantes, setSolicitantes] = useState<{id: number, nombre: string, direccion: string, contacto: string}[]>([]);
  const [regiones, setRegiones] = useState<{id: number, region: string}[]>([]);
  const [isLoadingTipos, setIsLoadingTipos] = useState(true);
  const [isLoadingSolicitantes, setIsLoadingSolicitantes] = useState(true);
  const [isLoadingRegiones, setIsLoadingRegiones] = useState(true);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const token = localStorage.getItem("jwt");
        if (!token) {
          console.error("No JWT token found");
          setIsLoadingTipos(false);
          return;
        }

        console.log("Fetching tipos from: http://localhost:5088/api/catalogos/tipos");
        const response = await fetch("http://localhost:5088/api/catalogos/tipos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Tipos response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Tipos data received:", data);
          setTipos(data);
        } else {
          console.error("Error response for tipos:", response.status, response.statusText);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar los tipos de muestra.",
          });
        }
      } catch (error) {
        console.error("Error fetching tipos:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error de conexión al cargar tipos de muestra.",
        });
      } finally {
        setIsLoadingTipos(false);
      }
    };

    const fetchSolicitantes = async () => {
      try {
        const token = localStorage.getItem("jwt");
        if (!token) {
          console.error("No JWT token found");
          setIsLoadingSolicitantes(false);
          return;
        }

        console.log("Fetching solicitantes from: http://localhost:5088/api/catalogos/solicitantes");
        const response = await fetch("http://localhost:5088/api/catalogos/solicitantes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Solicitantes response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Solicitantes data received:", data);
          setSolicitantes(data);
        } else {
          console.error("Error response for solicitantes:", response.status, response.statusText);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar los solicitantes.",
          });
        }
      } catch (error) {
        console.error("Error fetching solicitantes:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error de conexión al cargar solicitantes.",
        });
      } finally {
        setIsLoadingSolicitantes(false);
      }
    };

    fetchTipos();
    fetchSolicitantes();
    fetchRegiones();
  }, [toast]);

  const fetchRegiones = async () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) return;

      console.log("Fetching regiones from: http://localhost:5088/api/catalogos/regiones");
      const response = await fetch("http://localhost:5088/api/catalogos/regiones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Regiones response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Regiones data received:", data);
        setRegiones(data);
      } else {
        console.error("Error response for regiones:", response.status, response.statusText);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las regiones de salud.",
        });
      }
    } catch (error) {
      console.error("Error fetching regiones:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al cargar regiones.",
      });
    } finally {
      setIsLoadingRegiones(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * 40) + 1; // Random length between 1 and 40
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const form = useForm<RegistrarMuestraFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      muestraNombre: "",
      tipoMuestraId: 0,
      solicitanteId: 0,
      numOficio: "",
      numLote: "",
      condicionesRecepcion: "",
      motivoSolicitud: "",
      color: "",
      olor: "",
      sabor: "",
      aspecto: "",
      textura: "",
      pesoNeto: 0,
      regionSalud: 0,
      dpsArea: "",
      tomadaPor: "",
      enviadaPor: "",
      direccionToma: "",
      fechaRecepcion: "",
      fechaToma: "",
    },
  });

  function onSubmit(values: RegistrarMuestraFormValues) {
    startTransition(async () => {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "No se encontró el token de sesión.",
        });
        return;
      }

      const payload = {
        codigoUnico: generateRandomCode(),
        nombre: values.muestraNombre,
        tipoMuestraId: values.tipoMuestraId,
        solicitanteId: values.solicitanteId,
        regionId: values.regionSalud,
        estadoMuestraId: 1, // TODO: Default state
        numOficio: values.numOficio,
        numLote: values.numLote,
        fechaRecepcion: values.fechaRecepcion,
        condicionesRecepcion: values.condicionesRecepcion,
        motivoSolicitud: values.motivoSolicitud,
        color: values.color,
        olor: values.olor,
        sabor: values.sabor,
        aspecto: values.aspecto,
        textura: values.textura,
        pesoNeto: values.pesoNeto,
        dpsArea: values.dpsArea,
        tomadaPor: values.tomadaPor,
        enviadaPor: values.enviadaPor,
        direccionToma: values.direccionToma,
        fechaToma: values.fechaToma,
      };

      try {
        const response = await fetch("http://localhost:5088/api/muestras", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast({
            title: "Éxito",
            description: "Muestra registrada correctamente.",
          });
          form.reset();
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        } else {
          const errorData = await response.json();
          toast({
            variant: "destructive",
            title: "Error al registrar",
            description: errorData.message || "Error al registrar la muestra.",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Ocurrió un error inesperado al registrar la muestra.",
        });
      }
    });
  }

  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <CardTitle>Registrar Nueva Muestra</CardTitle>
              <CardDescription>
                Complete el formulario para registrar una nueva muestra.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="muestraNombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Muestra</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Agua Purificada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipoMuestraId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Muestra</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingTipos ? "Cargando tipos..." : "Seleccione un tipo"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipos.length === 0 && !isLoadingTipos ? (
                          <SelectItem value="" disabled>
                            No hay tipos disponibles
                          </SelectItem>
                        ) : (
                          tipos.map((tipo) => (
                            <SelectItem key={tipo.id} value={tipo.id.toString()}>
                              {tipo.tipo}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numOficio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Oficio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 2023-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numLote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Lote</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: LOTE-A45" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaRecepcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Recepción</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaToma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Toma</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="solicitanteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solicitante</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingSolicitantes ? "Cargando solicitantes..." : "Seleccione un solicitante"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {solicitantes.length === 0 && !isLoadingSolicitantes ? (
                          <SelectItem value="" disabled>
                            No hay solicitantes disponibles
                          </SelectItem>
                        ) : (
                          solicitantes.map((solicitante) => (
                            <SelectItem key={solicitante.id} value={solicitante.id.toString()}>
                              {solicitante.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Transparente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="olor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Olor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Inodoro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="sabor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sabor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Insípido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="aspecto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aspecto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Líquido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="textura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Textura</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Acuosa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="pesoNeto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Neto</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="regionSalud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Región de Salud</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una región" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regiones.map((region) => (
                          <SelectItem key={region.id} value={region.id.toString()}>
                            {region.region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="dpsArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área DPS</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Área IV" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="tomadaPor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tomada por</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Inspector 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="enviadaPor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enviada por</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Laboratorio Central" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="direccionToma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección de Toma</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dirección completa de la toma"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                 <FormField
                  control={form.control}
                  name="condicionesRecepcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condiciones de Recepción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describa las condiciones en que se recibió la muestra"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="md:col-span-3">
                  <FormField
                    control={form.control}
                    name="motivoSolicitud"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo de la Solicitud</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describa el motivo de la solicitud de análisis"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isPending ? "Enviando..." : "Enviar Muestra"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
