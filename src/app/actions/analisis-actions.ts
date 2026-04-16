"use server";

interface FisicoQuimicoData {
  fechaEntrega: string;
  fechaVencimiento: string;
  acidez: number;
  cloroResidual: number;
  cenizas: number;
  cumarina: number;
  colorante: string;
  densidad: number;
  dureza: number;
  extractoSeco: number;
  fecula: number;
  gradoAlcoholico: number;
  humedad: number;
  indiceRefraccion: number;
  indiceAcidez: number;
  indiceRancidez: number;
  materiaGrasaCualitativa: string;
  materiaGrasaCuantitativa: number;
  ph: number;
  pruebaEbar: string;
  solidosTotales: number;
  tiempoCoccion: string;
  otrasDeterminaciones: string;
  referencia: string;
  observaciones: string;
  aptoConsumoHumano: string;
}

interface MicrobiologicoData {
  resMicroorganismosAerobios: string;
  resRecuentoColiformes: string;
  resColiformesTotales: string;
  resPseudomonasSpp: string;
  resEColi: string;
  resSalmonellaSpp: string;
  resEstafilococosAureus: string;
  resHongos: string;
  resLevaduras: string;
  resEsterilidadComercial: string;
  resListeriaMonocytogenes: string;
  metodologiaReferencia: string;
  equipos: string;
  observaciones: string;
  aptoParaConsumo: string;
  esCopia: boolean;
}


export async function registrarAnalisisFisicoQuimicoAction(muestraId: number, data: FisicoQuimicoData, token: string): Promise<{ success: boolean; message?: string; }> {
  try {
    const response = await fetch(`http://localhost:5088/api/analisis/${muestraId}/fisicoquimico`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: errorText || "Error al registrar el análisis físico-químico." };
    }

    return { success: true, message: "Análisis físico-químico registrado exitosamente." };
  } catch (error) {
    console.error("Error registering physico-chemical analysis:", error);
    return { success: false, message: "Ocurrió un error inesperado al registrar el análisis." };
  }
}

export async function registrarAnalisisMicrobiologicoAction(muestraId: number, data: MicrobiologicoData, token: string): Promise<{ success: boolean; message?: string; }> {
  try {
    const response = await fetch(`http://localhost:5088/api/analisis/${muestraId}/microbiologico`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: errorText || "Error al registrar el análisis microbiológico." };
    }

    return { success: true, message: "Análisis microbiológico registrado exitosamente." };
  } catch (error) {
    console.error("Error registering microbiological analysis:", error);
    return { success: false, message: "Ocurrió un error inesperado al registrar el análisis." };
  }
}

export async function enviarValidacionAction(muestraId: number, token: string): Promise<{ success: boolean; message?: string; }> {
  try {
    const response = await fetch(`http://localhost:5088/api/muestras/${muestraId}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        estado: "3"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: errorText || "Error al actualizar el estado de la muestra." };
    }

    return { success: true, message: "Estado de la muestra actualizado exitosamente." };
  } catch (error) {
    console.error("Error updating sample status:", error);
    return { success: false, message: "Ocurrió un error inesperado al actualizar el estado." };
  }
}
