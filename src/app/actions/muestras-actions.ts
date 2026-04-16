interface Analyst {
  usuId: number;
  usuNombre: string;
  usuRol: string; // Added usuRol to the interface
}

interface AssignAnalystData {
  analistaId: number;
}

interface RegisterMuestraData {
  // Define the structure of your sample registration data here
  // For example:
  codigo: string;
  nombre: string;
  descripcion?: string;
  // Add other fields relevant to a sample
}

export async function fetchAnalistas(token: string): Promise<{
  success: boolean;
  analistas?: Analyst[];
  message?: string;
}> {
  try {
    const response = await fetch("/api/usuarios?rol=Analista", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || "Error al obtener la lista de analistas." };
    }

    const data: Analyst[] = await response.json();
    // Client-side filter to ensure only 'Analista' roles are shown, in case the backend filter isn't strict
    const filteredAnalysts = data.filter(analyst => analyst.usuRol.toLowerCase() === 'analista');
    
    return { success: true, analistas: filteredAnalysts };
  } catch (error) {
    console.error("Error fetching analysts:", error);
    return { success: false, message: "Ocurrió un error inesperado al obtener los analistas." };
  }
}

export async function asignarAnalistaAction(muestraId: number, data: AssignAnalystData, token: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    // Updated the endpoint path from /asignarAnalista to /asignar
    const response = await fetch(`/api/muestras/${muestraId}/asignar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || `Error al asignar analista a la muestra ${muestraId}.` };
    }

    return { success: true, message: `Analista asignado a la muestra ${muestraId} exitosamente.` };
  } catch (error) {
    console.error("Error assigning analyst:", error);
    return { success: false, message: "Ocurrió un error inesperado al asignar el analista." };
  }
}

export async function registrarMuestraAction(data: RegisterMuestraData, token: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    // This is a placeholder for the actual API call to register a sample.
    // You'll need to replace this with your actual API endpoint and request logic.
    const response = await fetch("/api/muestras", { // Assuming /api/muestras is the endpoint for new samples
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || "Error al registrar la muestra." };
    }

    return { success: true, message: "Muestra registrada exitosamente." };
  } catch (error) {
    console.error("Error registering sample:", error);
    return { success: false, message: "Ocurrió un error inesperado al registrar la muestra." };
  }
}

export async function enviarValidacionAction(muestraId: number, token: string): Promise<{ success: boolean; message: string; }> {
  try {
    const response = await fetch(`/api/muestras/${muestraId}/enviar-validacion`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
       try {
        const errorData = JSON.parse(responseText);
        return { success: false, message: errorData.message || `Error al enviar la muestra ${muestraId} a validación.` };
       } catch (e) {
         return { success: false, message: `Error del servidor: ${response.statusText}` };
       }
    }
    
    try {
      const responseData = JSON.parse(responseText);
      return { success: true, message: responseData.message || `Muestra ${muestraId} enviada a validación exitosamente.` };
    } catch (e) {
      return { success: true, message: `Muestra ${muestraId} enviada a validación exitosamente.` };
    }

  } catch (error) {
    console.error("Error sending sample for validation:", error);
    return { success: false, message: "Ocurrió un error inesperado al enviar la muestra a validación." };
  }
}

export async function aprobarMuestraAction(muestraId: number, token: string): Promise<{ success: boolean; message: string; }> {
  try {
    const response = await fetch(`/api/muestras/${muestraId}/aprobar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        return { success: false, message: errorData.message || `Error al aprobar la muestra ${muestraId}.` };
      } catch (e) {
        return { success: false, message: `Error del servidor: ${response.statusText}` };
      }
    }

    return { success: true, message: `Muestra ${muestraId} aprobada exitosamente.` };
  } catch (error) {
    console.error("Error approving sample:", error);
    return { success: false, message: "Ocurrió un error inesperado al aprobar la muestra." };
  }
}

export async function devolverMuestraAction(muestraId: number, motivo: string, token: string): Promise<{ success: boolean; message: string; }> {
  try {
    const response = await fetch(`/api/muestras/${muestraId}/devolver-analista`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ motivo }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        return { success: false, message: errorData.message || `Error al devolver la muestra ${muestraId}.` };
      } catch (e) {
        return { success: false, message: `Error del servidor: ${response.statusText}` };
      }
    }

    return { success: true, message: `Muestra ${muestraId} devuelta al analista exitosamente.` };
  } catch (error) {
    console.error("Error returning sample:", error);
    return { success: false, message: "Ocurrió un error inesperado al devolver la muestra." };
  }
}

export async function devolverAnalistaAction(muestraId: number, motivo: string, token: string): Promise<{ success: boolean; message: string; }> {
  try {
    const response = await fetch(`https://retodigemapsapi-d9h3fwg4avh8fch6.canadacentral-01.azurewebsites.net/api/muestras/${muestraId}/devolver-analista`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ motivo }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || 'Error al devolver la muestra al analista.' };
    }

    return { success: true, message: 'Muestra devuelta al analista exitosamente.' };
  } catch (error) {
    console.error('Error in devolverAnalistaAction:', error);
    return { success: false, message: 'Ocurrió un error inesperado al devolver la muestra.' };
  }
}
