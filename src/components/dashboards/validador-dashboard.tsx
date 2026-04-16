"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, TestTube, Beaker, Loader2, Ban, Download, ChevronDown, ChevronUp } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Muestra {
  id: number;
  codigoUnico: string;
  nombre: string;
  tipoMuestra: number; // Será un ID numérico
  solicitante: string;
  region: string;
  estado: string;
  numOficio: string;
  numLote: string;
  fechaRecepcion: string;
  fechaToma: string;
  tipoMuestraNombre?: string; // Nombre del tipo que obtendremos por separado
}

interface TipoMuestra {
  id: number;
  tipo: string;
}

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

interface Asignacion {
  id: number;
  muestraId: number;
  muestraCodigo: string;
  muestraNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  asignadoEn: string;
}

interface AnalisisFisicoQuimico {
  id: number;
  muestraId: number;
  muestraCodigo: string;
  fechaEntrega: string;
  fechaVencimiento: string;
  acidez: number;
  cloroResidual: number;
  ph: number;
  humedad: number;
  cenizas: number;
  densidad: number;
  aptoConsumoHumano: string;
}

interface AnalisisMicrobiologico {
  id: number;
  muestraId: number;
  muestraCodigo: string;
  resMicroorganismosAerobios: string;
  resEColi: string;
  resSalmonellaSpp: string;
  aptoParaConsumo: string;
  esCopia: boolean;
}

export default function ValidadorDashboard() {
  const { toast } = useToast();
  const [muestras, setMuestras] = useState<Muestra[]>([]);
  const [tiposMuestra, setTiposMuestra] = useState<Record<number, string>>({});
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);
  const [selectedMuestra, setSelectedMuestra] = useState<Muestra | null>(null);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Estados para análisis
  const [analisisFisicoQuimico, setAnalisisFisicoQuimico] = useState<AnalisisFisicoQuimico | null>(null);
  const [analisisMicrobiologico, setAnalisisMicrobiologico] = useState<AnalisisMicrobiologico | null>(null);
  const [isAnalisisFisicoDialogOpen, setIsAnalisisFisicoDialogOpen] = useState(false);
  const [isAnalisisMicroDialogOpen, setIsAnalisisMicroDialogOpen] = useState(false);
  const [isLoadingAnalisis, setIsLoadingAnalisis] = useState(false);
  
  // Estados para devolución de muestras
  const [isDevolucionDialogOpen, setIsDevolucionDialogOpen] = useState(false);
  const [muestraADevolver, setMuestraADevolver] = useState<Muestra | null>(null);
  const [motivoDevolucion, setMotivoDevolucion] = useState("");
  const [isSubmittingDevolucion, setIsSubmittingDevolucion] = useState(false);
  const [selectedDevolucionUsuarioId, setSelectedDevolucionUsuarioId] = useState<string>("");
  
  // Estados para rechazo de muestras
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [muestraAReject, setMuestraAReject] = useState<Muestra | null>(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  
  // Estados para PDF
  const [expandedMuestraId, setExpandedMuestraId] = useState<number | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const [analisisDisponibles, setAnalisisDisponibles] = useState<Record<number, { fisicoquimico: boolean; microbiologico: boolean }>>({});

  useEffect(() => {
    fetchMuestras();
    fetchTiposMuestra();
  }, []);

  // Función para renderizar dinámicamente todos los campos de un objeto en los Modales
  const renderDynamicData = (data: any) => {
    if (!data) return null;
    
    // Filtramos campos internos que no queremos mostrar
    const keysToExclude = ['id', 'muestraId', 'muestra_Id', 'analisisId'];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
        {Object.entries(data).map(([key, value]) => {
          if (keysToExclude.includes(key)) return null;
          
          // Formatear nombre de la llave (ej: "cloroResidual" -> "Cloro Residual")
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          
          // Formatear valor
          let displayValue = String(value);
          if (value === null || value === undefined || value === "") displayValue = "—";
          if (typeof value === 'boolean') displayValue = value ? "Sí" : "No";

          return (
            <div key={key} className="flex flex-col space-y-1 border rounded p-2 bg-gray-50">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {label}
              </label>
              <p className="text-sm font-medium text-gray-900 break-words">
                {displayValue}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const checkAnalisisDisponibilidad = async (muestras: Muestra[]) => {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    const disponibilidad: Record<number, { fisicoquimico: boolean; microbiologico: boolean }> = {};

    const muestrasPendientes = muestras.filter(m => m.estado === "Pendiente de Validacion");

    for (const muestra of muestrasPendientes) {
      try {
        const fisicoResponse = await fetch(`http://localhost:5088/api/analisis/${muestra.id}/fisicoquimico`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const microResponse = await fetch(`http://localhost:5088/api/analisis/${muestra.id}/microbiologico`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        disponibilidad[muestra.id] = {
          fisicoquimico: fisicoResponse.ok,
          microbiologico: microResponse.ok,
        };
      } catch (error) {
        console.error(`Error checking análisis for muestra ${muestra.id}:`, error);
        disponibilidad[muestra.id] = {
          fisicoquimico: false,
          microbiologico: false,
        };
      }
    }

    setAnalisisDisponibles(disponibilidad);
  };

  const fetchUsuarios = async () => {
    setIsLoadingUsuarios(true);
    try {
      const token = localStorage.getItem("jwt");
      if (!token) return;

      const response = await fetch("http://localhost:5088/api/auth/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: Usuario[] = await response.json();
        // Filtrar solo usuarios con rol "Analista"
        const usuariosAnalista = data.filter(user => user.rol === "Analista");
        setUsuarios(usuariosAnalista);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los usuarios.",
        });
      }
    } catch (error) {
      console.error("Error fetching usuarios:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al cargar los usuarios.",
      });
    } finally {
      setIsLoadingUsuarios(false);
    }
  };

  const fetchMuestras = async () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró el token de autenticación.",
        });
        return;
      }

      

      const response = await fetch("http://localhost:5088/api/muestras", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: Muestra[] = await response.json();
        setMuestras(data);
        // Verificar disponibilidad de análisis después de cargar las muestras
        checkAnalisisDisponibilidad(data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las muestras.",
        });
      }
    } catch (error) {
      console.error("Error fetching muestras:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al cargar las muestras.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTiposMuestra = async () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) return;

      // Primero obtenemos todos los tipos
      const tiposResponse = await fetch("http://localhost:5088/api/catalogos/tipos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (tiposResponse.ok) {
        const tipos: TipoMuestra[] = await tiposResponse.json();
        const tiposMap: Record<number, string> = {};
        tipos.forEach(tipo => {
          tiposMap[tipo.id] = tipo.tipo;
        });
        setTiposMuestra(tiposMap);
      }
    } catch (error) {
      console.error("Error fetching tipos muestra:", error);
    }
  };

  const getTipoMuestraNombre = (tipoId: number): string => {
    return tiposMuestra[tipoId] || `Tipo ${tipoId}`;
  };

  const handleAsignarClick = (muestra: Muestra) => {
    setSelectedMuestra(muestra);
    setSelectedUsuarioId("");
    setIsDialogOpen(true);
    fetchUsuarios();
  };

  const handleAsignarConfirmar = async () => {
    if (!selectedMuestra || !selectedUsuarioId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar un usuario.",
      });
      return;
    }

    const selectedUsuario = usuarios.find(u => u.id.toString() === selectedUsuarioId);
    if (!selectedUsuario) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Usuario no encontrado.",
      });
      return;
    }

    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró el token de autenticación.",
        });
        return;
      }

      console.log("Muestra seleccionada:", selectedMuestra);

      // 1. Crear la asignación con POST
      const asignacionData = {
        muestraId: selectedMuestra.id,
        usuarioId: selectedUsuario.id,
      };

      console.log("Enviando asignación:", asignacionData);
      console.log("URL de asignaciones:", "http://localhost:5088/api/asignaciones");

      const asignacionResponse = await fetch("http://localhost:5088/api/asignaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(asignacionData),
      });

      console.log("Respuesta de asignaciones - Status:", asignacionResponse.status);
      console.log("Respuesta de asignaciones - StatusText:", asignacionResponse.statusText);

      if (!asignacionResponse.ok) {
        const errorText = await asignacionResponse.text();
        console.error("Error en asignaciones - Response body:", errorText);
        throw new Error(`Error al crear la asignación: ${asignacionResponse.status} ${asignacionResponse.statusText}`);
      }

      let asignacionResult = null;
      try {
        const responseText = await asignacionResponse.text();
        if (responseText.trim()) {
          asignacionResult = JSON.parse(responseText);
        }
      } catch (e) {
        console.warn("Respuesta de asignación no contiene JSON válido");
      }
      console.log("Asignación creada exitosamente:", asignacionResult);

      // 2. Actualizar el estado de la muestra con PUT
      const muestraUpdate = {
        estado: 2,
      };

      console.log("Actualizando muestra:", muestraUpdate);
      console.log("URL de muestra:", `http://localhost:5088/api/muestras/${selectedMuestra.id}/estado`);

      const muestraResponse = await fetch(`http://localhost:5088/api/muestras/${selectedMuestra.id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(muestraUpdate),
      });

      console.log("Respuesta de muestra - Status:", muestraResponse.status);
      console.log("Respuesta de muestra - StatusText:", muestraResponse.statusText);

      if (!muestraResponse.ok) {
        const errorText = await muestraResponse.text();
        console.error("Error en muestra - Response body:", errorText);
        throw new Error(`Error al actualizar la muestra: ${muestraResponse.status} ${muestraResponse.statusText}`);
      }

      let muestraResult = null;
      try {
        const responseText = await muestraResponse.text();
        if (responseText.trim()) {
          muestraResult = JSON.parse(responseText);
        }
      } catch (e) {
        console.warn("Respuesta de muestra no contiene JSON válido");
      }
      console.log("Muestra actualizada exitosamente:", muestraResult);

      // 3. Actualizar el estado local
      setMuestras(prev => prev.map(m => 
        m.id === selectedMuestra.id 
          ? { ...m, estado: "Asignada" } // Cambiar el estado localmente
          : m
      ));

      toast({
        title: "Éxito",
        description: `Muestra asignada exitosamente a ${selectedUsuario.nombre}`,
      });

      // Recargar la página
      window.location.reload();

    } catch (error) {
      console.error("Error en asignación:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al asignar la muestra.",
      });
    }
  };

  // Funciones para análisis
  const handleVerAnalisisFisicoQuimico = async (muestra: Muestra) => {
    setIsLoadingAnalisis(true);
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró el token de autenticación.",
        });
        return;
      }

      const response = await fetch(`http://localhost:5088/api/analisis/${muestra.id}/fisicoquimico`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: AnalisisFisicoQuimico = await response.json();
        setAnalisisFisicoQuimico(data);
        setIsAnalisisFisicoDialogOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos del análisis físico-químico.",
        });
      }
    } catch (error) {
      console.error("Error fetching análisis físico-químico:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al cargar el análisis físico-químico.",
      });
    } finally {
      setIsLoadingAnalisis(false);
    }
  };

  const handleVerAnalisisMicrobiologico = async (muestra: Muestra) => {
    setIsLoadingAnalisis(true);
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró el token de autenticación.",
        });
        return;
      }

      const response = await fetch(`http://localhost:5088/api/analisis/${muestra.id}/microbiologico`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: AnalisisMicrobiologico = await response.json();
        setAnalisisMicrobiologico(data);
        setIsAnalisisMicroDialogOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos del análisis microbiológico.",
        });
      }
    } catch (error) {
      console.error("Error fetching análisis microbiológico:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al cargar el análisis microbiológico.",
      });
    } finally {
      setIsLoadingAnalisis(false);
    }
  };

  const handleDevolverMuestra = (muestra: Muestra) => {
    setMuestraADevolver(muestra);
    setMotivoDevolucion("");
    setSelectedDevolucionUsuarioId("");
    // Cargar la lista de analistas al abrir el diálogo de devolución
    fetchUsuarios();
    setIsDevolucionDialogOpen(true);
  };

  const handleConfirmarDevolucion = async () => {
    if (!muestraADevolver || !motivoDevolucion.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe especificar un motivo para la devolución.",
      });
      return;
    }

    if (!selectedDevolucionUsuarioId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar un analista para asignar la muestra.",
      });
      return;
    }

    setIsSubmittingDevolucion(true);
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró el token de autenticación.",
        });
        return;
      }

      // Crear la asignación al analista seleccionado antes de devolver la muestra
      try {
        const asignacionData = {
          muestraId: muestraADevolver.id,
          usuarioId: parseInt(selectedDevolucionUsuarioId, 10),
        };

        const asignacionResponse = await fetch("http://localhost:5088/api/asignaciones", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(asignacionData),
        });

        if (!asignacionResponse.ok) {
          const errorText = await asignacionResponse.text().catch(() => null);
          console.error("Error creando asignación:", asignacionResponse.status, errorText);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error al asignar la muestra al analista seleccionado.",
          });
          setIsSubmittingDevolucion(false);
          return;
        }
      } catch (err) {
        console.error("Error en POST /asignaciones:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : "Error al asignar la muestra.",
        });
        setIsSubmittingDevolucion(false);
        return;
      }

      const response = await fetch(`http://localhost:5088/api/devoluciones/muestras/${muestraADevolver.id}/devolver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          motivo: motivoDevolucion.trim()
        }),
      });

      if (response.ok) {
        // Después de registrar la devolución, cambiar el estado de la muestra
        const estadoResponse = await fetch(`http://localhost:5088/api/muestras/${muestraADevolver.id}/estado`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado: "2"
          }),
        });

        if (estadoResponse.ok) {
          toast({
            title: "Éxito",
            description: "Muestra devuelta exitosamente.",
          });
          setIsDevolucionDialogOpen(false);
          setMuestraADevolver(null);
          setMotivoDevolucion("");
          // Recargar la página para actualizar los datos
          window.location.reload();
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Devolución registrada, pero error al cambiar el estado de la muestra.",
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.message || "Error al devolver la muestra.",
        });
      }
    } catch (error) {
      console.error("Error devolviendo muestra:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al devolver la muestra.",
      });
    } finally {
      setIsSubmittingDevolucion(false);
    }
  };

  const handleValidarMuestra = async (muestra: Muestra) => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró el token de autenticación.",
        });
        return;
      }

      const response = await fetch(`http://localhost:5088/api/muestras/${muestra.id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado: "4"
        }),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Muestra validada exitosamente.",
          variant: "default",
        });
        // Recargar la página para actualizar los datos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al validar la muestra.",
        });
      }
    } catch (error) {
      console.error("Error validando muestra:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al validar la muestra.",
      });
    }
  };

  const handleRechazarMuestra = (muestra: Muestra) => {
    setMuestraAReject(muestra);
    setIsRejectDialogOpen(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!muestraAReject) return;

    setIsSubmittingReject(true);
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró el token de autenticación.",
        });
        setIsSubmittingReject(false);
        return;
      }

      const response = await fetch(`http://localhost:5088/api/muestras/${muestraAReject.id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado: "5"
        }),
      });
      console.log("Rechazo de muestra ID:", muestraAReject.id);
      console.log("Respuesta de rechazo - Status:", response.status);
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Muestra rechazada exitosamente.",
        });
        setIsRejectDialogOpen(false);
        setMuestraAReject(null);
        // Recargar la página para actualizar los datos
        window.location.reload();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al rechazar la muestra.",
        });
      }
    } catch (error) {
      console.error("Error rechazando muestra:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al rechazar la muestra.",
      });
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const muestrasRecibidas = muestras.filter(m => m.estado === "Recibida");
  const muestrasPendientesValidacion = muestras.filter(m => m.estado === "Pendiente de Validacion");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getValidadorNombre = () => {
    const nombreUsuario = localStorage.getItem("userName") || 
                          localStorage.getItem("usuarioNombre") || 
                          localStorage.getItem("nombreUsuario") || 
                          "Validador";
    return nombreUsuario;
  };

  const renderKeyValueRows = (obj: Record<string, any>) => {
    let html = "";
    
    // Campos a excluir (campos internos que no necesitan mostrarse)
    const fieldsToExclude = ["id", "muestraId", "esCopia"];
    
    // Iterar sobre TODOS los campos del objeto
    const allKeys = Object.keys(obj).sort(); // Ordenar alfabéticamente para consistencia
    
    for (const key of allKeys) {
      const value = obj[key];
      
      // Excluir solo ciertos campos internos
      if (fieldsToExclude.includes(key)) {
        continue;
      }
      
      // Mostrar TODOS los campos excepto los excluidos
      // Formatear el nombre de la clave: camelCase a "Camel Case"
      const formattedKey = key
        .replace(/([A-Z])/g, " $1") // Agregar espacio antes de mayúsculas
        .replace(/^./, str => str.toUpperCase()) // Capitalizar primera letra
        .trim();
      
      // Formatear el valor
      let formattedValue = "";
      if (value === null || value === undefined) {
        formattedValue = "—"; // Guión para valores vacíos
      } else if (typeof value === "boolean") {
        formattedValue = value ? "Sí" : "No";
      } else if (typeof value === "object") {
        formattedValue = JSON.stringify(value, null, 2);
      } else if (value === "") {
        formattedValue = "—"; // Guión para strings vacíos
      } else {
        formattedValue = String(value);
      }
      
      // Mostrar el campo
      html += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;"><strong>${formattedKey}</strong></td><td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; white-space: normal; word-wrap: break-word; word-break: break-word;">${formattedValue}</td></tr>`;
    }
    
    return html;
  };

  const handleGeneratePdf = async (muestraId: number) => {
    setGeneratingPdfId(muestraId);
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Token no encontrado. Por favor, inicie sesión nuevamente.",
        });
        return;
      }

      // Fetch muestra data
      const muestraRes = await fetch(`http://localhost:5088/api/muestras/${muestraId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!muestraRes.ok) {
        throw new Error("Error al obtener datos de la muestra");
      }

      const muestraData = await muestraRes.json();

      // Fetch análisis fisicoquímico
      const fisicoRes = await fetch(`http://localhost:5088/api/analisis/${muestraId}/fisicoquimico`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fisicoData = fisicoRes.ok ? await fisicoRes.json() : null;

      // Fetch análisis microbiológico
      const microRes = await fetch(`http://localhost:5088/api/analisis/${muestraId}/microbiologico`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const microData = microRes.ok ? await microRes.json() : null;

      // Obtener nombres de analistas
      const getAnalistaInfo = () => {
        const analistas = new Set<string>();
        if (fisicoData?.analistaNombre) analistas.add(fisicoData.analistaNombre);
        if (fisicoData?.analistaId) analistas.add(`Analista ${fisicoData.analistaId}`);
        if (microData?.analistaNombre) analistas.add(microData.analistaNombre);
        if (microData?.analistaId) analistas.add(`Analista ${microData.analistaId}`);
        return analistas.size > 0 ? Array.from(analistas).join(", ") : "No disponible";
      };

      // Fecha de generación
      const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Build HTML template - Ahora permite múltiples páginas según necesidad
      const htmlContent = `
        <html>
          <head>
            <style>
* { margin: 0; padding: 0; box-sizing: border-box; }
              html, body { font-family: 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.5; background: white; }
              .page { width: 794px; min-height: 1123px; padding: 25px; background: white; page-break-after: always; position: relative; display: flex; flex-direction: column; }
              .page:last-child { page-break-after: avoid; }
              .page-content { flex: 1; display: flex; flex-direction: column; }
              .header { border-bottom: 3px solid #0066cc; padding-bottom: 10px; margin-bottom: 15px; }
              .logo { font-size: 22px; font-weight: 800; color: #0066cc; margin-bottom: 8px; }
              .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 9px; color: #6b7280; }
              .section { margin-bottom: 12px; }
              .section-title { font-size: 12px; font-weight: 700; color: #ffffff; background: #0066cc; padding: 6px 10px; margin-bottom: 8px; border-radius: 3px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9px; table-layout: fixed; }
              td { padding: 5px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; word-wrap: break-word; }
              td:first-child { font-weight: 600; color: #374151; background: #f9fafb; width: 30%; } /* Ajustado ancho */
              .personnel-section { background: #f3f4f6; border-left: 4px solid #0066cc; padding: 8px 10px; margin-bottom: 12px; font-size: 9px; }
              .personnel-item { display: flex; gap: 12px; }
              .personnel-label { font-weight: 600; color: #374151; min-width: 60px; }
              .footer { margin-top: auto; border-top: 2px solid #e5e7eb; padding-top: 8px; }
              .footer-content { display: flex; justify-content: space-between; align-items: center; }
              .footer-text { font-size: 8px; color: #9ca3af; }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="page-content">
                <div class="header">
                  <div class="logo">DIGEMAPS</div>
                  <div class="header-grid">
                    <div class="header-column">
                      <div><span class="header-label">Muestra:</span> <span class="header-value">${muestraData.codigoUnico || 'N/A'}</span></div>
                      <div><span class="header-label">Validador:</span> <span class="header-value">${getValidadorNombre()}</span></div>
                    </div>
                    <div class="header-column" style="text-align: right;">
                      <div><span class="header-label">Generado:</span> <span class="header-value">${fechaGeneracion}</span></div>
                    </div>
                  </div>
                </div>

                ${fisicoData?.analistaNombre || microData?.analistaNombre ? `
                  <div class="personnel-section">
                    <div class="personnel-item">
                      <span class="personnel-label">Analista(s):</span>
                      <span class="personnel-value">${getAnalistaInfo()}</span>
                    </div>
                  </div>
                ` : ""}

                <div class="section">
                  <div class="section-title">Información de la Muestra</div>
                  <table>
                    ${renderKeyValueRows(muestraData)}
                  </table>
                </div>

                ${microData ? `
                  <div class="section">
                    <div class="section-title">Análisis Microbiológico</div>
                    <table>
                      ${renderKeyValueRows(microData)}
                    </table>
                  </div>
                ` : ""}
              </div>

              <div class="footer">
                <div class="footer-content">
                  <span class="footer-text">Sistema de Gestión DIGEMAPS</span>
                  <span class="footer-text">Página 1</span>
                </div>
              </div>
            </div>

            ${fisicoData ? `
              <div class="page">
                <div class="page-content">
                  <div class="header">
                    <div class="logo">DIGEMAPS</div>
                    <div class="header-grid">
                      <div class="header-column">
                        <div><span class="header-label">Muestra:</span> <span class="header-value">${muestraData.codigoUnico || 'N/A'}</span></div>
                      </div>
                      <div class="header-column" style="text-align: right;">
                        <div><span class="header-label">Generado:</span> <span class="header-value">${fechaGeneracion}</span></div>
                      </div>
                    </div>
                  </div>

                  <div class="section">
                    <div class="section-title">Análisis Fisicoquímico</div>
                    <table>
                      ${renderKeyValueRows(fisicoData)}
                    </table>
                  </div>
                </div>

                <div class="footer">
                  <div class="footer-content">
                    <span class="footer-text">Sistema de Gestión DIGEMAPS</span>
                    <span class="footer-text">Página 2</span>
                  </div>
                </div>
              </div>
            ` : ""}
          </body>
        </html>
      `;

      // Create a temporary container for rendering
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = "fixed";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "794px"; // Ancho exacto de página A4 en px (210mm * 3.779)
      tempDiv.style.background = "white";
      tempDiv.style.zIndex = "-9999";
      document.body.appendChild(tempDiv);

      // Obtener todas las páginas
      const pages = tempDiv.querySelectorAll(".page");
      
      // Generate PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Procesar cada página por separado
      let isFirstPage = true;
      
      for (const pageElement of pages) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Convertir cada página a canvas
        const canvas = await html2canvas(pageElement as HTMLElement, { 
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          allowTaint: true,
          logging: false,
          width: 794,
          height: 1123,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgProps = pdf.getImageProperties(imgData);
        
        // Calcular proporciones para que ocupe toda la página
        const pdfWidth = 210; // mm
        const pdfHeight = 297; // mm
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`DIGEMAPS_${muestraData.codigoUnico}_${new Date().getTime()}.pdf`);

      // Clean up
      document.body.removeChild(tempDiv);

      toast({
        title: "Éxito",
        description: "PDF generado y descargado correctamente.",
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al generar el PDF.",
      });
    } finally {
      setGeneratingPdfId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Cargando muestras...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Validador</h1>
      </div>

      {/* Bandeja de muestras - Estado: Recibida */}
      <Card>
        <CardHeader>
          <CardTitle>Bandeja de Muestras</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código Único</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Región</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>N° Oficio</TableHead>
                <TableHead>N° Lote</TableHead>
                <TableHead>Fecha Recepción</TableHead>
                <TableHead>Fecha Toma</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {muestrasRecibidas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    No hay muestras recibidas
                  </TableCell>
                </TableRow>
              ) : (
                muestrasRecibidas.map((muestra) => (
                  <TableRow key={muestra.id}>
                    <TableCell>{muestra.codigoUnico}</TableCell>
                    <TableCell>{muestra.nombre}</TableCell>
                    <TableCell>{getTipoMuestraNombre(muestra.tipoMuestra)}</TableCell>
                    <TableCell>{muestra.solicitante}</TableCell>
                    <TableCell>{muestra.region}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{muestra.estado}</Badge>
                    </TableCell>
                    <TableCell>{muestra.numOficio}</TableCell>
                    <TableCell>{muestra.numLote}</TableCell>
                    <TableCell>{formatDate(muestra.fechaRecepcion)}</TableCell>
                    <TableCell>{formatDate(muestra.fechaToma)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAsignarClick(muestra)}
                          className="flex items-center gap-2"
                        >
                          <UserCheck className="h-4 w-4" />
                          Asignar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRechazarMuestra(muestra)}
                          className="flex items-center gap-2"
                        >
                          <Ban className="h-4 w-4" />
                          Rechazar
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

      {/* Muestras pendientes de validación */}
      <Card>
        <CardHeader>
          <CardTitle>Muestras Pendientes de Validación</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código Único</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Región</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>N° Oficio</TableHead>
                <TableHead>N° Lote</TableHead>
                <TableHead>Fecha Recepción</TableHead>
                <TableHead>Fecha Toma</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {muestrasPendientesValidacion.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    No hay muestras pendientes de validación
                  </TableCell>
                </TableRow>
              ) : (
                muestrasPendientesValidacion.map((muestra) => (
                  <TableRow key={muestra.id}>
                    <TableCell>{muestra.codigoUnico}</TableCell>
                    <TableCell>{muestra.nombre}</TableCell>
                    <TableCell>{getTipoMuestraNombre(muestra.tipoMuestra)}</TableCell>
                    <TableCell>{muestra.solicitante}</TableCell>
                    <TableCell>{muestra.region}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{muestra.estado}</Badge>
                    </TableCell>
                    <TableCell>{muestra.numOficio}</TableCell>
                    <TableCell>{muestra.numLote}</TableCell>
                    <TableCell>{formatDate(muestra.fechaRecepcion)}</TableCell>
                    <TableCell>{formatDate(muestra.fechaToma)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerAnalisisFisicoQuimico(muestra)}
                          disabled={isLoadingAnalisis || !analisisDisponibles[muestra.id]?.fisicoquimico}
                        >
                          <TestTube className="h-4 w-4 mr-1" />
                          Físico-Químico
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerAnalisisMicrobiologico(muestra)}
                          disabled={isLoadingAnalisis || !analisisDisponibles[muestra.id]?.microbiologico}
                        >
                          <Beaker className="h-4 w-4 mr-1" />
                          Microbiológico
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDevolverMuestra(muestra)}
                        >
                          Devolver
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleValidarMuestra(muestra)}
                        >
                          Validar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRechazarMuestra(muestra)}
                        >
                          Rechazar
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

      {/* Todas las muestras - Con opción de descargar PDF */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Muestras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {muestras.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay muestras disponibles</p>
          ) : (
            muestras.map((muestra) => (
              <div key={muestra.id} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" 
                     onClick={() => setExpandedMuestraId(expandedMuestraId === muestra.id ? null : muestra.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{muestra.codigoUnico} - {muestra.nombre}</p>
                        <p className="text-sm text-gray-500">{getTipoMuestraNombre(muestra.tipoMuestra)} | {muestra.solicitante}</p>
                      </div>
                      <Badge
                        variant={
                          muestra.estado === "Recibida" ? "secondary" :
                          muestra.estado === "Pendiente de Validacion" ? "outline" :
                          muestra.estado === "En analisis" ? "default" :
                          muestra.estado === "Rechazada" ? "destructive" :
                          "secondary"
                        }
                        className={
                          muestra.estado === "Completada" ? "bg-green-100 text-green-800" : ""
                        }
                      >
                        {muestra.estado}
                      </Badge>
                    </div>
                  </div>
                  {expandedMuestraId === muestra.id ? (
                    <ChevronUp className="h-5 w-5 ml-2" />
                  ) : (
                    <ChevronDown className="h-5 w-5 ml-2" />
                  )}
                </div>

                {expandedMuestraId === muestra.id && (
                  <div className="border-t bg-gray-50 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Solicitante</p>
                        <p className="font-semibold">{muestra.solicitante}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Región</p>
                        <p className="font-semibold">{muestra.region}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">N° Oficio</p>
                        <p className="font-semibold">{muestra.numOficio}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">N° Lote</p>
                        <p className="font-semibold">{muestra.numLote}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fecha Recepción</p>
                        <p className="font-semibold">{formatDate(muestra.fechaRecepcion)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fecha Toma</p>
                        <p className="font-semibold">{formatDate(muestra.fechaToma)}</p>
                      </div>
                    </div>

                    {(muestra.estado.toLowerCase() === "rechazada" || 
                      muestra.estado.toLowerCase() === "completada" || 
                      muestra.estado.toLowerCase() === "aprobada" ||
                      muestra.estado.toLowerCase().includes("validada")) && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-sm mb-3">Descargar Análisis</h4>
                        <Button
                          onClick={() => handleGeneratePdf(muestra.id)}
                          disabled={generatingPdfId === muestra.id}
                          className="w-full"
                          variant="outline"
                        >
                          {generatingPdfId === muestra.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generando PDF...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Descargar PDF
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

{/* Modal de análisis físico-químico */}
      <Dialog open={isAnalisisFisicoDialogOpen} onOpenChange={setIsAnalisisFisicoDialogOpen}>
        <DialogContent className="max-w-3xl"> {/* Aumenté el ancho a max-w-3xl */}
          <DialogHeader>
            <DialogTitle>Detalle Análisis Físico-Químico</DialogTitle>
          </DialogHeader>
          
          {/* USAMOS LA FUNCIÓN DINÁMICA AQUÍ */}
          {analisisFisicoQuimico ? (
             renderDynamicData(analisisFisicoQuimico)
          ) : (
             <p>Cargando datos...</p>
          )}

        </DialogContent>
      </Dialog>

{/* Modal de análisis microbiológico */}
      <Dialog open={isAnalisisMicroDialogOpen} onOpenChange={setIsAnalisisMicroDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle Análisis Microbiológico</DialogTitle>
          </DialogHeader>
          
          {/* USAMOS LA FUNCIÓN DINÁMICA AQUÍ */}
          {analisisMicrobiologico ? (
             renderDynamicData(analisisMicrobiologico)
          ) : (
             <p>Cargando datos...</p>
          )}

        </DialogContent>
      </Dialog>

      {/* Modal de asignación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Muestra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMuestra && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Muestra seleccionada:</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedMuestra.nombre} - {selectedMuestra.codigoUnico}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar Usuario (Analista):</label>
              <Select value={selectedUsuarioId} onValueChange={setSelectedUsuarioId}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingUsuarios ? "Cargando usuarios..." : "Seleccionar usuario"} />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nombre} ({usuario.correo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAsignarConfirmar} disabled={!selectedUsuarioId}>
                Aceptar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para devolución de muestra */}
      <Dialog open={isDevolucionDialogOpen} onOpenChange={setIsDevolucionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver Muestra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {muestraADevolver && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Muestra a devolver:</h4>
                <p className="text-sm text-muted-foreground">
                  {muestraADevolver.nombre} - {muestraADevolver.codigoUnico}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo de devolución:</label>
              <Textarea
                value={motivoDevolucion}
                onChange={(e) => setMotivoDevolucion(e.target.value)}
                placeholder="Explique el motivo de la devolución..."
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Asignar a Analista:</label>
              <Select value={selectedDevolucionUsuarioId} onValueChange={setSelectedDevolucionUsuarioId}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingUsuarios ? "Cargando usuarios..." : "Seleccionar usuario"} />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nombre} ({usuario.correo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDevolucionDialogOpen(false);
                  setMuestraADevolver(null);
                  setMotivoDevolucion("");
                  setSelectedDevolucionUsuarioId("");
                }}
                disabled={isSubmittingDevolucion}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmarDevolucion}
                disabled={isSubmittingDevolucion || !motivoDevolucion.trim() || !selectedDevolucionUsuarioId}
              >
                {isSubmittingDevolucion ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Devolviendo...
                  </>
                ) : (
                  "Devolver"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para rechazo de muestra */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Rechazar muestra?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectDialogOpen(false);
                setMuestraAReject(null);
              }}
              disabled={isSubmittingReject}
            >
              No
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmarRechazo}
              disabled={isSubmittingReject}
            >
              {isSubmittingReject ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rechazando...
                </>
              ) : (
                "Sí, rechazar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}