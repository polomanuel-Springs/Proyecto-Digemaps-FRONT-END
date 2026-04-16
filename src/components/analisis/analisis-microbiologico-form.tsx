"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Send, Edit, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { registrarAnalisisMicrobiologicoAction } from "@/app/actions/analisis-actions";
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
  resMicroorganismosAerobios: z.string().optional().default(""),
  resRecuentoColiformes: z.string().optional().default(""),
  resColiformesTotales: z.string().optional().default(""),
  resPseudomonasSpp: z.string().optional().default(""),
  resEColi: z.string().optional().default(""),
  resSalmonellaSpp: z.string().optional().default(""),
  resEstafilococosAureus: z.string().optional().default(""),
  resHongos: z.string().optional().default(""),
  resLevaduras: z.string().optional().default(""),
  resEsterilidadComercial: z.string().optional().default(""),
  resListeriaMonocytogenes: z.string().optional().default(""),
  metodologiaReferencia: z.string().optional().default(""),
  equipos: z.string().optional().default(""),
  observaciones: z.string().optional().default(""),
  aptoParaConsumo: z.string().default(""),
  esCopia: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface AnalisisMicrobiologicoFormProps {
  muestraId: number;
}

export function AnalisisMicrobiologicoForm({ muestraId }: AnalisisMicrobiologicoFormProps) {
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
      resMicroorganismosAerobios: "",
      resRecuentoColiformes: "",
      resColiformesTotales: "",
      resPseudomonasSpp: "",
      resEColi: "",
      resSalmonellaSpp: "",
      resEstafilococosAureus: "",
      resHongos: "",
      resLevaduras: "",
      resEsterilidadComercial: "",
      resListeriaMonocytogenes: "",
      metodologiaReferencia: "",
      equipos: "",
      observaciones: "",
      aptoParaConsumo: "",
      esCopia: true,
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
        const response = await fetch(`http://localhost:5088/api/analisis/${muestraId}/microbiologico`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysisId(data.id);
          const mergedData = {
            resMicroorganismosAerobios: data.resMicroorganismosAerobios || "",
            resRecuentoColiformes: data.resRecuentoColiformes || "",
            resColiformesTotales: data.resColiformesTotales || "",
            resPseudomonasSpp: data.resPseudomonasSpp || "",
            resEColi: data.resEColi || "",
            resSalmonellaSpp: data.resSalmonellaSpp || "",
            resEstafilococosAureus: data.resEstafilococosAureus || "",
            resHongos: data.resHongos || "",
            resLevaduras: data.resLevaduras || "",
            resEsterilidadComercial: data.resEsterilidadComercial || "",
            resListeriaMonocytogenes: data.resListeriaMonocytogenes || "",
            metodologiaReferencia: data.metodologiaReferencia || "",
            equipos: data.equipos || "",
            observaciones: data.observaciones || "",
            aptoParaConsumo: data.aptoParaConsumo || "",
            esCopia: data.esCopia ?? true,
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
      const response = await fetch(`http://localhost:5088/api/analisis/microbiologico/${analysisId}`, {
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
        if (analysisId) {
          const updateResponse = await fetch(`http://localhost:5088/api/analisis/microbiologico/${analysisId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(values)
          });

          if (updateResponse.ok) {
            toast({ title: "Éxito", description: "Análisis Microbiológico actualizado correctamente." });
            setIsEditing(false);
            router.push('/dashboard');
          } else {
            const errorData = await updateResponse.json();
            toast({ variant: "destructive", title: "Error al actualizar", description: errorData.message || "Error desconocido" });
          }
        } else {
          const result = await registrarAnalisisMicrobiologicoAction(muestraId, values, token);

          if (result.success) {
            toast({ title: "Éxito", description: "Análisis Microbiológico registrado correctamente." });
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
              <CardTitle>Análisis Microbiológico (Muestra #{muestraId})</CardTitle>
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
                  if (['esCopia'].includes(fieldName)) return null;

                  return (
                    <FormField
                      key={fieldName}
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{fieldName.replace(/([A-Z])/g, ' $1').replace(/^res /, '').replace(/^./, str => str.toUpperCase())}</FormLabel>
                          <FormControl>
                            {['observaciones', 'metodologiaReferencia', 'equipos'].includes(fieldName) ? (
                              <Textarea placeholder={`Ingrese ${fieldName}`} {...field} value={field.value as string} disabled={!!(analysisId && !isEditing)} />
                            ) : (
                              <Input placeholder={`Resultado para ${fieldName}`} {...field} value={field.value as string} disabled={!!(analysisId && !isEditing)} />
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
                  name="esCopia"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!!(analysisId && !isEditing)} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Es Copia</FormLabel>
                      </div>
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
