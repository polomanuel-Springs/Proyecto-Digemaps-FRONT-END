"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ServerCrash, Beaker, TestTube, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/hooks/use-toast";
import { enviarValidacionAction } from "@/app/actions/analisis-actions";

interface Muestra {
  id: number;
  muestraId: number;
  muestraCodigo: string;
  muestraNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  asignadoEn: string;
  tieneFisicoquimico?: boolean;
  tieneMicrobiologico?: boolean;
}

export default function AnalistaDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [muestras, setMuestras] = useState<Muestra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [isDevolucionesDialogOpen, setIsDevolucionesDialogOpen] = useState(false);
  const [devoluciones, setDevoluciones] = useState<any[]>([]);
  const [loadingDevoluciones, setLoadingDevoluciones] = useState(false);
  const [muestraSeleccionada, setMuestraSeleccionada] = useState<Muestra | null>(null);

  const fetchMuestras = async () => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      setError("No se encontró el token de autenticación.");
      setLoading(false);
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);

      // Decodificar el JWT para obtener el userId
      const decoded: any = jwtDecode(token); // Tipado como any para facilitar acceso a claims complejos
      
      // El JWT usa claims de WS-Federation
      const userId = parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);

      const response = await fetch("http://localhost:5088/api/asignaciones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener las asignaciones: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const asignaciones: Muestra[] = await response.json();

      // Agrupar por muestraId y tomar la más reciente globalmente (por asignadoEn, considerando fecha y hora)
      const muestrasMap = new Map<number, any>();
      asignaciones.forEach(asignacion => {
        const existing = muestrasMap.get(asignacion.muestraId);
        if (!existing || new Date(asignacion.asignadoEn).getTime() > new Date(existing.asignadoEn).getTime()) {
          muestrasMap.set(asignacion.muestraId, asignacion);
        }
      });

      // Filtrar solo las muestras donde la asignación más reciente es del analista actual
      const muestrasFiltradas = Array.from(muestrasMap.values()).filter(asignacion => asignacion.usuarioId === userId);

      // Filtrar muestras que tengan estado === 2
      const muestrasConEstado2: Muestra[] = [];
      
      for (const muestra of muestrasFiltradas) {
        try {
          const muestraResponse = await fetch(`http://localhost:5088/api/muestras/${muestra.muestraId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (muestraResponse.ok) {
            const muestraData = await muestraResponse.json();
            
            if (muestraData.estado == "En analisis" || muestraData.estado == 2) {
              let tieneFisicoquimico = false;
              let tieneMicrobiologico = false;

              try {
                const fisicoResponse = await fetch(`http://localhost:5088/api/analisis/${muestra.muestraId}/fisicoquimico`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                tieneFisicoquimico = fisicoResponse.ok;
              } catch (error) {
                console.error(`Error al verificar análisis físico-químico para muestra ${muestra.muestraId}:`, error);
              }

              try {
                const microResponse = await fetch(`http://localhost:5088/api/analisis/${muestra.muestraId}/microbiologico`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                tieneMicrobiologico = microResponse.ok;
              } catch (error) {
                console.error(`Error al verificar análisis microbiológico para muestra ${muestra.muestraId}:`, error);
              }

              muestrasConEstado2.push({
                ...muestra,
                tieneFisicoquimico,
                tieneMicrobiologico,
              });
            }
          } 
        } catch (error) {
          console.error(`Error al obtener estado de muestra ${muestra.muestraId}:`, error);
        }
      }

      setMuestras(muestrasConEstado2);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado al contactar el servidor.");
      console.error("Fetch error details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMuestras();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleEnviarValidacion = (muestraId: number) => {
    setSubmittingId(muestraId);
    startTransition(async () => {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "No se encontró el token de sesión.",
        });
        setSubmittingId(null);
        return;
      }

      const result = await enviarValidacionAction(muestraId, token);

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        });
        window.location.reload(); // Recargar la página completa
      } else {
        toast({
          variant: "destructive",
          title: "Error al enviar",
          description: result.message,
        });
      }
      setSubmittingId(null);
    });
  };

  const handleVerDevoluciones = async (muestra: Muestra) => {
    setMuestraSeleccionada(muestra);
    setLoadingDevoluciones(true);
    setIsDevolucionesDialogOpen(true);

    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "No se encontró el token de sesión.",
        });
        return;
      }

      const response = await fetch("http://localhost:5088/api/devoluciones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const allDevoluciones = await response.json();
        const devolucionesMuestra = allDevoluciones.filter(
          (devolucion: any) => devolucion.muestraId === muestra.muestraId
        );
        setDevoluciones(devolucionesMuestra);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las devoluciones.",
        });
      }
    } catch (error) {
      console.error("Error fetching devoluciones:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al cargar devoluciones.",
      });
    } finally {
      setLoadingDevoluciones(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bandeja de Muestras del Analista</CardTitle>
          <CardDescription>Aquí se listan las muestras asignadas para su análisis.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Cargando muestras...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-destructive">
              <ServerCrash className="h-10 w-10 mb-2" />
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Muestra ID</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario ID</TableHead>
                  <TableHead>Usuario Nombre</TableHead>
                  <TableHead>Fecha Asignación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {muestras.map((muestra) => (
                  <TableRow key={muestra.id}>
                    <TableCell>{muestra.id}</TableCell>
                    <TableCell>{muestra.muestraId}</TableCell>
                    <TableCell>{muestra.muestraCodigo}</TableCell>
                    <TableCell>{muestra.muestraNombre}</TableCell>
                    <TableCell>{muestra.usuarioId}</TableCell>
                    <TableCell>{muestra.usuarioNombre}</TableCell>
                    <TableCell>{formatDate(muestra.asignadoEn)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2">
                        <Button asChild variant={muestra.tieneFisicoquimico ? "default" : "outline"} size="sm">
                          <Link href={`/dashboard/analisis-fisico-quimico/${muestra.muestraId}`}>
                            <Beaker className="mr-2 h-4 w-4" />
                            {muestra.tieneFisicoquimico ? "Ver Físico-Químico" : "Llenar Físico-Químico"}
                          </Link>
                        </Button>
                        <Button asChild variant={muestra.tieneMicrobiologico ? "default" : "outline"} size="sm">
                          <Link href={`/dashboard/analisis-microbiologico/${muestra.muestraId}`}>
                            <TestTube className="mr-2 h-4 w-4" />
                            {muestra.tieneMicrobiologico ? "Ver Microbiológico" : "Llenar Microbiológico"}
                          </Link>
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleVerDevoluciones(muestra)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Devoluciones
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleEnviarValidacion(muestra.muestraId)}
                          disabled={isSubmitting || submittingId === muestra.muestraId}
                        >
                          {isSubmitting && submittingId === muestra.muestraId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                          {isSubmitting && submittingId === muestra.muestraId ? 'Enviando...' : 'Enviar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {muestras.length === 0 && !loading && !error && (
            <div className="text-center py-10 text-muted-foreground">
              <p>No hay muestras en la bandeja.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para mostrar devoluciones */}
      <Dialog open={isDevolucionesDialogOpen} onOpenChange={setIsDevolucionesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Devoluciones de la Muestra</DialogTitle>
            <DialogDescription>
              {muestraSeleccionada ? `Historial de devoluciones para la muestra: ${muestraSeleccionada.muestraNombre} (${muestraSeleccionada.muestraCodigo})` : 'Cargando información de la muestra...'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loadingDevoluciones ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Cargando devoluciones...</p>
              </div>
            ) : devoluciones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay devoluciones registradas para esta muestra.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {devoluciones.map((devolucion, index) => (
                  <div key={devolucion.id} className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Devolución #{index + 1}</h4>
                      <Badge variant="outline">ID: {devolucion.id}</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Muestra:</span> {devolucion.muestraNombre} ({devolucion.muestraCodigo})</p>
                      <p><span className="font-medium">Motivo:</span></p>
                      <div className="mt-2 p-3 bg-background rounded border-l-4 border-destructive/50">
                        {devolucion.motivoDevolucion}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}