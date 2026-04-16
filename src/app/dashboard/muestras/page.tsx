"use client";

import { useEffect, useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, CheckCircle, Download, TestTube, Beaker, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { fetchAnalistas, asignarAnalistaAction, aprobarMuestraAction } from '@/app/actions/muestras-actions';
import { DevolverMuestraDialog } from '@/components/muestras/devolver-muestra-dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Muestra {
  muestraId: number;
  muestraCodigoUnico: string;
  muestraNombre: string;
  muestraTipo: string;
  muestraEstado: string;
  fechaRecepcion: string;
  solicitanteNombre: string;
}

interface Analyst {
  usuId: number;
  usuNombre: string;
}

const assignAnalystFormSchema = z.object({
  analistaId: z.string().min(1, { message: "Debe seleccionar un analista." }),
});

export default function MuestrasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [muestrasBandeja, setMuestrasBandeja] = useState<Muestra[]>([]);
  const [loadingBandeja, setLoadingBandeja] = useState(true);
  const [errorBandeja, setErrorBandeja] = useState<string | null>(null);

  const [allMuestras, setAllMuestras] = useState<Muestra[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorAll, setErrorAll] = useState<string | null>(null);

  const [isAssignAnalystDialogOpen, setIsAssignAnalystDialogOpen] = useState(false);
  const [selectedMuestraId, setSelectedMuestraId] = useState<number | null>(null);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [fetchingAnalysts, setFetchingAnalysts] = useState(true);
  const [analystsError, setAnalystsError] = useState<string | null>(null);

  const [isProcessing, startTransition] = useTransition();

  const [pdfLoadingKey, setPdfLoadingKey] = useState<string | null>(null);
  const [expandedMuestraId, setExpandedMuestraId] = useState<number | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<number | null>(null);

  const assignAnalystForm = useForm<z.infer<typeof assignAnalystFormSchema>>({
    resolver: zodResolver(assignAnalystFormSchema),
    defaultValues: {
      analistaId: "",
    },
  });

  const fetchMuestrasBandeja = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      setErrorBandeja("No se encontró el token de autenticación.");
      setLoadingBandeja(false);
      return;
    }

    try {
      setLoadingBandeja(true);
      const response = await fetch("/api/muestras/bandeja", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener las muestras de la bandeja: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      setMuestrasBandeja(data);
      setErrorBandeja(null);
    } catch (err: any) {
      setErrorBandeja(err.message || "Ocurrió un error inesperado al contactar el servidor.");
    } finally {
      setLoadingBandeja(false);
    }
  };

  const fetchAllMuestras = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      setErrorAll("No se encontró el token de autenticación.");
      setLoadingAll(false);
      return;
    }

    try {
      setLoadingAll(true);
      const response = await fetch("/api/muestras/todas", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener todas las muestras: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      setAllMuestras(data);
      setErrorAll(null);
    } catch (err: any) {
      setErrorAll(err.message || "Ocurrió un error inesperado al contactar el servidor.");
    } finally {
      setLoadingAll(false);
    }
  };

  const refreshAllData = () => {
    fetchMuestrasBandeja();
    fetchAllMuestras();
  }

  const loadAnalysts = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      setAnalystsError("No se encontró el token de autenticación para cargar analistas.");
      setFetchingAnalysts(false);
      return;
    }
    setFetchingAnalysts(true);
    const result = await fetchAnalistas(token);
    if (result.success && result.analistas) {
      setAnalysts(result.analistas);
      setAnalystsError(null);
    } else {
      setAnalystsError(result.message || "Error desconocido al cargar analistas.");
    }
    setFetchingAnalysts(false);
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    if (isLoggedIn !== 'true' || userRole !== 'Validador') {
      router.replace('/login');
      return;
    }
    refreshAllData();
    loadAnalysts();
  }, [router]);

  const muestrasPendientesValidacion = useMemo(() => {
    return allMuestras.filter(m => m.muestraEstado.toLowerCase() === 'pendiente de validacion');
  }, [allMuestras]);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'recibida':
        return 'secondary';
      case 'en análisis':
        return 'default';
      case 'completada':
      case 'en validación':
      case 'aprobada':
      case 'pendiente de validacion':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const handleAsignarAnalista = (muestraId: number) => {
    setSelectedMuestraId(muestraId);
    setIsAssignAnalystDialogOpen(true);
  };

  const handleValidationAction = (action: 'aprobar', muestraId: number) => {
    startTransition(async () => {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({ variant: "destructive", title: "Error de autenticación", description: "No se encontró el token de sesión." });
        return;
      }

      const result = await aprobarMuestraAction(muestraId, token);

      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        refreshAllData();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  }

  async function onAssignAnalystSubmit(values: z.infer<typeof assignAnalystFormSchema>) {
    if (selectedMuestraId === null) return;

    const token = localStorage.getItem('jwt');
    if (!token) {
      toast({
        title: "Error de autenticación",
        description: "No se encontró el token de seguridad. Inicie sesión nuevamente.",
        variant: "destructive",
      });
      router.replace("/login");
      return;
    }

    startTransition(async () => {
      const result = await asignarAnalistaAction(selectedMuestraId, { analistaId: parseInt(values.analistaId) }, token);

      if (result.success) {
        toast({
          title: "Analista Asignado",
          description: result.message,
        });
        assignAnalystForm.reset();
        setIsAssignAnalystDialogOpen(false);
        refreshAllData();
      } else {
        toast({
          title: "Error al asignar analista",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  }

  // ============================================================
  // TU FUNCIÓN EXISTENTE (NO TOCADA)
  // ============================================================
  const handleDownloadReport = async (muestraId: number, tipo: 'fisicoquimico' | 'microbiologico') => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se encontró token de autenticación.' });
      return;
    }

    let url = '';
    if (tipo === 'fisicoquimico') {
      url = `/api/informes/resultados/${muestraId}/pdf`;
    } else {
      url = `/api/informes/${muestraId}/informe-registro/pdf`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error al descargar el reporte: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `reporte_${tipo}_${muestraId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast({ title: 'Éxito', description: 'La descarga del reporte ha comenzado.' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error de descarga', description: error.message });
    }
  };

  // ============================================================
  // ✅ NUEVO: Generación PDF con jsPDF + html2canvas
  // ============================================================
  const getValidadorNombre = () => {
    return (
      localStorage.getItem('userName') ||
      localStorage.getItem('usuarioNombre') ||
      localStorage.getItem('nombreUsuario') ||
      'Validador'
    );
  };

  const getAnalistaNombre = (muestraData: any, analisisData: any) => {
    return (
      analisisData?.analistaNombre ||
      analisisData?.analista?.usuNombre ||
      analisisData?.analista?.nombre ||
      muestraData?.analistaNombre ||
      muestraData?.analista?.usuNombre ||
      muestraData?.analista?.nombre ||
      'Analista'
    );
  };

  const renderKeyValueRows = (obj: any, options?: { excludeKeys?: string[] }) => {
    if (!obj || typeof obj !== 'object') return '';

    const exclude = new Set((options?.excludeKeys || []).map(k => k.toLowerCase()));

    const entries = Object.entries(obj)
      .filter(([k]) => !exclude.has(String(k).toLowerCase()));

    const compactValue = (v: any) => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'string') {
        const s = v.trim();
        return s.length > 120 ? s.slice(0, 120) + '…' : s;
      }
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);

      try {
        const json = JSON.stringify(v);
        return json.length > 120 ? json.slice(0, 120) + '…' : json;
      } catch {
        const s = String(v);
        return s.length > 120 ? s.slice(0, 120) + '…' : s;
      }
    };

    const sliced = entries;

    return sliced
      .map(([k, v]) => {
        const value = compactValue(v);

        return `
        <tr>
          <td style="padding:6px;border:1px solid #e5e7eb;font-weight:600;width:35%;vertical-align:top;">
            ${k}
          </td>
          <td style="padding:6px;border:1px solid #e5e7eb;vertical-align:top;white-space:pre-wrap;">
            ${value}
          </td>
        </tr>
      `;
      })
      .join('');
  };



  const handleGeneratePdfHtmlCanvas = async (muestraId: number, tipo: 'fisicoquimico' | 'microbiologico') => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se encontró token de autenticación.' });
      return;
    }

    const key = `${muestraId}_${tipo}`;
    setPdfLoadingKey(key);

    try {
      const [muestraRes, analisisRes] = await Promise.all([
        fetch(`/api/muestras/${muestraId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/analisis/${muestraId}/${tipo}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!muestraRes.ok) {
        const txt = await muestraRes.text();
        throw new Error(`Error al obtener muestra: ${muestraRes.status} ${muestraRes.statusText}. ${txt}`);
      }
      if (!analisisRes.ok) {
        const txt = await analisisRes.text();
        throw new Error(`Error al obtener análisis ${tipo}: ${analisisRes.status} ${analisisRes.statusText}. ${txt}`);
      }

      const muestraData = await muestraRes.json();
      const analisisData = await analisisRes.json();

      const fechaHoy = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      const validadorNombre = getValidadorNombre();
      const analistaNombre = getAnalistaNombre(muestraData, analisisData);

      

      // Crear contenedor oculto (template) - MISMO LOOK, pero compacto para 1 página
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-99999px';
      container.style.top = '0';
      container.style.width = '794px'; // ~A4 a 96dpi
      container.style.background = 'white';
      container.style.padding = '18px 18px 0 18px'; // sin padding abajo
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.color = '#111827';

      container.innerHTML = `
      <div style="border-bottom:2px solid #111827;padding-bottom:10px;margin-bottom:12px;">
        <div style="font-size:20px;font-weight:800;">DIGEMAPS</div>
        <div style="margin-top:6px;font-size:11px;color:#374151;line-height:1.4;">
          <div><b>Fecha:</b> ${fechaHoy}</div>
          <div><b>Validador:</b> ${validadorNombre}</div>
          <div><b>Analista:</b> ${analistaNombre}</div>
        </div>
        <div style="margin-top:8px;font-size:13px;font-weight:700;">
          Reporte ${tipo === 'fisicoquimico' ? 'Físico-Químico' : 'Microbiológico'}
        </div>
      </div>

      <div style="display:flex; gap:12px;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:13px;font-weight:800;margin-bottom:6px;">Información general de la muestra</div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            ${renderKeyValueRows(muestraData)}
          </table>
        </div>

        <div style="flex:1; min-width:0;">
          <div style="font-size:13px;font-weight:800;margin-bottom:6px;">Resultados del análisis</div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            ${renderKeyValueRows(analisisData, {
        excludeKeys: [
          'muestraCodigoUnico',
          'muestraCodigo',
          'codigoMuestra',
          'codigo',
          'muestra_id',
          'muestraId',
          'muestra_id_fk',
          'muestraCodigo'
        ]
      })}
          </table>
        </div>
      </div>

            <div style="
        position:absolute;
        bottom:6px;
        left:18px;
        right:18px;
        border-top:1px solid #e5e7eb;
        padding-top:6px;
        font-size:10px;
        color:#6b7280;
      ">
        Documento generado por DIGEMAPS.
      </div>
    `;

      document.body.appendChild(container);

      // HTML -> Canvas (sin cambiar colores)
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');

      // PDF 1 sola página A4: auto-fit por ancho y alto
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = 210;
      const pageH = 297;
      const margin = 12;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;

      const imgProps = pdf.getImageProperties(imgData);
      const imgW = imgProps.width;
      const imgH = imgProps.height;

      // Escala para encajar COMPLETO en 1 sola página
      const ratio = Math.min(maxW / imgW, maxH / imgH);

      const renderW = imgW * ratio;
      const renderH = imgH * ratio;

      const x = (pageW - renderW) / 2;
      const y = (pageH - renderH) / 2;

      pdf.addImage(imgData, 'PNG', x, y, renderW, renderH);
      pdf.save(`DIGEMAPS_${tipo}_${muestraId}.pdf`);

      document.body.removeChild(container);

      toast({ title: 'Éxito', description: 'El PDF se generó y se descargó en una sola página.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setPdfLoadingKey(null);
    }
  };



  const renderTable = (title: string, description: string, muestras: Muestra[], loading: boolean, error: string | null, actionsConfig?: { type: 'asignar' } | { type: 'validar' } | { type: 'descargar' }) => {
    if (actionsConfig?.type === 'descargar') {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
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
            ) : muestras.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No hay muestras para mostrar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {muestras.map((muestra) => (
                  <div key={muestra.muestraId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{muestra.muestraNombre}</h3>
                        <p className="text-sm text-muted-foreground">Código: {muestra.muestraCodigoUnico}</p>
                        <p className="text-sm text-muted-foreground">Tipo: {muestra.muestraTipo}</p>
                        <p className="text-sm text-muted-foreground">Solicitante: {muestra.solicitanteNombre}</p>
                        <p className="text-sm text-muted-foreground">Fecha Recepción: {formatDate(muestra.fechaRecepcion)}</p>
                        <Badge variant={getStatusVariant(muestra.muestraEstado)} className="mt-2">
                          {muestra.muestraEstado}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedMuestraId(expandedMuestraId === muestra.muestraId ? null : muestra.muestraId)}
                      >
                        {expandedMuestraId === muestra.muestraId ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {expandedMuestraId === muestra.muestraId && (
                      <div className="border-t pt-4 mt-4 space-y-3">
                        <div className="bg-muted/30 p-4 rounded">
                          <h4 className="font-semibold text-sm mb-3">PDF Fisico Quimico</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGeneratePdfHtmlCanvas(muestra.muestraId, 'fisicoquimico')}
                            disabled={generatingPdfId === muestra.muestraId}
                          >
                            {generatingPdfId === muestra.muestraId ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                            ) : (
                              <><Beaker className="mr-2 h-4 w-4" /> Descargar Fisico Quimico</>
                            )}
                          </Button>
                        </div>
                        <div className="bg-muted/30 p-4 rounded">
                          <h4 className="font-semibold text-sm mb-3">PDF Microbiologico</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGeneratePdfHtmlCanvas(muestra.muestraId, 'microbiologico')}
                            disabled={generatingPdfId === muestra.muestraId}
                          >
                            {generatingPdfId === muestra.muestraId ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                            ) : (
                              <><TestTube className="mr-2 h-4 w-4" /> Descargar Microbiologico</>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
                  <TableHead className="hidden lg:table-cell">Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Solicitante</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha Recepción</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  {(actionsConfig?.type === 'asignar' || actionsConfig?.type === 'validar') && <TableHead className="text-center">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {muestras.map((muestra) => (
                  <TableRow key={muestra.muestraId}>
                    <TableCell className="font-medium hidden lg:table-cell">{muestra.muestraCodigoUnico}</TableCell>
                    <TableCell>{muestra.muestraNombre}</TableCell>
                    <TableCell className="hidden md:table-cell">{muestra.muestraTipo}</TableCell>
                    <TableCell className="hidden lg:table-cell">{muestra.solicitanteNombre}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(muestra.fechaRecepcion)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusVariant(muestra.muestraEstado)}>
                        {muestra.muestraEstado}
                      </Badge>
                    </TableCell>
                    {(actionsConfig?.type === 'asignar' || actionsConfig?.type === 'validar') && (
                      <TableCell className="text-center space-x-2">
                        {actionsConfig.type === 'asignar' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAsignarAnalista(muestra.muestraId)}
                            disabled={isProcessing}
                          >
                            Asignar Analista
                          </Button>
                        )}
                        {actionsConfig.type === 'validar' && (
                          <>
                            <DevolverMuestraDialog
                              muestraId={muestra.muestraId}
                              token={localStorage.getItem('jwt') || ''}
                              onMuestraDevuelta={refreshAllData}
                            />
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleValidationAction('aprobar', muestra.muestraId)}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Validar
                            </Button>
                          </>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {muestras.length === 0 && !loading && !error && (
            <div className="text-center py-10 text-muted-foreground">
              <p>No hay muestras para mostrar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {renderTable(
        "Bandeja de Muestras",
        "Aquí se listan todas las muestras recibidas pendientes de asignación.",
        muestrasBandeja,
        loadingBandeja,
        errorBandeja,
        { type: 'asignar' }
      )}

      {renderTable(
        "Muestras Pendientes de Validación",
        "Muestras que han completado el análisis y esperan aprobación.",
        muestrasPendientesValidacion,
        loadingAll,
        errorAll,
        { type: 'validar' }
      )}

      {renderTable(
        "Todas las Muestras",
        "Aquí se listan todas las muestras registradas en el sistema.",
        allMuestras,
        loadingAll,
        errorAll,
        { type: 'descargar' }
      )}

      <Dialog open={isAssignAnalystDialogOpen} onOpenChange={setIsAssignAnalystDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Asignar Analista</DialogTitle>
            <DialogDescription>
              Seleccione un analista para la muestra {selectedMuestraId}.
            </DialogDescription>
          </DialogHeader>
          <Form {...assignAnalystForm}>
            <form onSubmit={assignAnalystForm.handleSubmit(onAssignAnalystSubmit)} className="grid gap-4 py-4">
              <FormField
                control={assignAnalystForm.control}
                name="analistaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analista</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={fetchingAnalysts}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un analista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fetchingAnalysts ? (
                          <div className="flex items-center p-2 text-muted-foreground">Cargando analistas...</div>
                        ) : analystsError ? (
                          <div className="flex items-center p-2 text-destructive">{analystsError}</div>
                        ) : analysts.length === 0 ? (
                          <div className="flex items-center p-2 text-muted-foreground">No hay analistas disponibles</div>
                        ) : (
                          analysts.map((analyst) => (
                            <SelectItem key={analyst.usuId} value={analyst.usuId.toString()}>
                              {analyst.usuNombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isProcessing || fetchingAnalysts}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Asignando...
                  </>
                ) : (
                  "Asignar"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
