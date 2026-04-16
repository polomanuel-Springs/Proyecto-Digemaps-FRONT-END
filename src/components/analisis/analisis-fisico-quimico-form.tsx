"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Send, Edit, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { registrarAnalisisFisicoQuimicoAction } from "@/app/actions/analisis-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  fechaEntrega: z.string().min(1, "Fecha de entrega es requerida."),
  fechaVencimiento: z.string().min(1, "Fecha de vencimiento es requerida."),
  acidez: z.coerce.number().optional().default(0),
  cloroResidual: z.coerce.number().optional().default(0),
  cenizas: z.coerce.number().optional().default(0),
  cumarina: z.coerce.number().optional().default(0),
  colorante: z.string().optional().default(""),
  densidad: z.coerce.number().optional().default(0),
  dureza: z.coerce.number().optional().default(0),
  extractoSeco: z.coerce.number().optional().default(0),
  fecula: z.coerce.number().optional().default(0),
  gradoAlcoholico: z.coerce.number().optional().default(0),
  humedad: z.coerce.number().optional().default(0),
  indiceRefraccion: z.coerce.number().optional().default(0),
  indiceAcidez: z.coerce.number().optional().default(0),
  indiceRancidez: z.coerce.number().optional().default(0),
  materiaGrasaCualitativa: z.string().optional().default(""),
  materiaGrasaCuantitativa: z.coerce.number().optional().default(0),
  ph: z.coerce.number().optional().default(0),
  pruebaEbar: z.string().optional().default(""),
  solidosTotales: z.coerce.number().optional().default(0),
  tiempoCoccion: z.string().optional().default(""),
  otrasDeterminaciones: z.string().optional().default(""),
  referencia: z.string().optional().default(""),
  observaciones: z.string().optional().default(""),
  aptoConsumoHumano: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;

interface AnalisisFisicoQuimicoFormProps {
  muestraId: number;
}

export function AnalisisFisicoQuimicoForm({ muestraId }: AnalisisFisicoQuimicoFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fechaEntrega: new Date().toISOString().split('T')[0],
      fechaVencimiento: new Date().toISOString().split('T')[0],
      acidez: 0,
      cloroResidual: 0,
      cenizas: 0,
      cumarina: 0,
      colorante: "",
      densidad: 0,
      dureza: 0,
      extractoSeco: 0,
      fecula: 0,
      gradoAlcoholico: 0,
      humedad: 0,
      indiceRefraccion: 0,
      indiceAcidez: 0,
      indiceRancidez: 0,
      materiaGrasaCualitativa: "",
      materiaGrasaCuantitativa: 0,
      ph: 0,
      pruebaEbar: "",
      solidosTotales: 0,
      tiempoCoccion: "",
      otrasDeterminaciones: "",
      referencia: "",
      observaciones: "",
      aptoConsumoHumano: "",
    },
  });

  useEffect(() => {
    const loadAnalysis = async () => {
      const token = localStorage.getItem("jwt");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5088/api/analisis/${muestraId}/fisicoquimico`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysisId(data.id);
          const mergedData = {
            fechaEntrega: data.fechaEntrega || new Date().toISOString().split('T')[0],
            fechaVencimiento: data.fechaVencimiento || new Date().toISOString().split('T')[0],
            acidez: data.acidez ?? 0,
            cloroResidual: data.cloroResidual ?? 0,
            cenizas: data.cenizas ?? 0,
            cumarina: data.cumarina ?? 0,
            colorante: data.colorante || "",
            densidad: data.densidad ?? 0,
            dureza: data.dureza ?? 0,
            extractoSeco: data.extractoSeco ?? 0,
            fecula: data.fecula ?? 0,
            gradoAlcoholico: data.gradoAlcoholico ?? 0,
            humedad: data.humedad ?? 0,
            indiceRefraccion: data.indiceRefraccion ?? 0,
            indiceAcidez: data.indiceAcidez ?? 0,
            indiceRancidez: data.indiceRancidez ?? 0,
            materiaGrasaCualitativa: data.materiaGrasaCualitativa || "",
            materiaGrasaCuantitativa: data.materiaGrasaCuantitativa ?? 0,
            ph: data.ph ?? 0,
            pruebaEbar: data.pruebaEbar || "",
            solidosTotales: data.solidosTotales ?? 0,
            tiempoCoccion: data.tiempoCoccion || "",
            otrasDeterminaciones: data.otrasDeterminaciones || "",
            referencia: data.referencia || "",
            observaciones: data.observaciones || "",
            aptoConsumoHumano: data.aptoConsumoHumano || "",
          };
          form.reset(mergedData);
        }
      } catch (error) {
        console.error("Error loading analysis:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysis();
  }, [muestraId, form]);

  const handleDelete = async () => {
    if (!analysisId) return;

    const token = localStorage.getItem("jwt");
    if (!token) {
      toast({ variant: "destructive", title: "Error de autenticación", description: "No se encontró el token de sesión." });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:5088/api/analisis/fisicoquimico/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({ title: "Éxito", description: "Análisis eliminado correctamente." });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el análisis." });
      }
    } catch (error) {
      console.error("Error deleting analysis:", error);
      toast({ variant: "destructive", title: "Error", description: "Error de conexión." });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({ variant: "destructive", title: "Error de autenticación", description: "No se encontró el token de sesión." });
        return;
      }

      try {
        const dataToSend = {
          ...values,
          fechaEntrega: values.fechaEntrega,
          fechaVencimiento: values.fechaVencimiento,
          aptoConsumoHumano: values.aptoConsumoHumano ? "Sí" : "No",
        };

        if (analysisId) {
          const updateResponse = await fetch(`http://localhost:5088/api/analisis/fisicoquimico/${analysisId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dataToSend)
          });

          if (updateResponse.ok) {
            toast({ title: "Éxito", description: "Análisis Físico-Químico actualizado correctamente." });
            setIsEditing(false);
            router.push('/dashboard');
          } else {
            const errorData = await updateResponse.json();
            toast({ variant: "destructive", title: "Error al actualizar", description: errorData.message || "Error desconocido" });
          }
        } else {
          const result = await registrarAnalisisFisicoQuimicoAction(muestraId, dataToSend, token);

          if (result.success) {
            toast({ title: "Éxito", description: "Análisis Físico-Químico registrado correctamente." });
            router.push('/dashboard');
          } else {
            toast({ variant: "destructive", title: "Error al registrar", description: result.message });
          }
        }
      } catch (error) {
        console.error("Error in analysis submission:", error);
        toast({ variant: "destructive", title: "Error", description: "Error de conexión." });
      }
    });
  }

  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Análisis Físico-Químico (Muestra #{muestraId})</CardTitle>
              <CardDescription>{isEditing ? "Editar análisis" : analysisId ? "Ver análisis" : "Complete el formulario para registrar el análisis."}</CardDescription>
            </div>
          </div>
          {analysisId && !isEditing && (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando análisis...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(form.getValues()).map((key) => {
                  const fieldName = key as keyof FormValues;
                  const fieldType = typeof form.getValues()[fieldName];
                  
                  if (fieldName === 'aptoConsumoHumano') return null;

                  let inputType = "text";
                  if (fieldType === 'number') inputType = 'number';
                  if (fieldName.toLowerCase().includes('fecha')) inputType = 'date';
                  
                  return (
                    <FormField
                      key={fieldName}
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</FormLabel>
                          <FormControl>
                            {['observaciones', 'otrasDeterminaciones', 'referencia', 'colorante', 'pruebaEbar', 'tiempoCoccion', 'materiaGrasaCualitativa'].includes(fieldName) ? (
                              <Textarea placeholder={`Ingrese ${fieldName}`} {...field} value={field.value as string} disabled={!!(analysisId && !isEditing)} />
                            ) : (
                              <Input placeholder={`Ingrese ${fieldName}`} type={inputType} {...field} value={field.value as string | number} disabled={!!(analysisId && !isEditing)} />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )
                })}
                <FormField
                  control={form.control}
                  name="aptoConsumoHumano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apto Consumo Humano</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!!(analysisId && !isEditing)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sí">Sí</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                {analysisId && isEditing && (
                  <Button onClick={() => setIsEditing(false)} variant="outline" type="button">
                    Cancelar
                  </Button>
                )}
                {(!analysisId || isEditing) && (
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {isPending ? "Enviando..." : "Enviar Análisis"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        )}
      </CardContent>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar análisis?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, eliminar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
