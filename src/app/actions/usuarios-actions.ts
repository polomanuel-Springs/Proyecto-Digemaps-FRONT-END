import { redirect } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface RegisterUserData {
  usuNombre: string;
  usuCorreo: string;
  usuContrasena: string;
  usuRol: string;
}

export async function registrarUsuarioAction(data: RegisterUserData, token: string) {
  try {
    const response = await fetch("/api/usuarios", { // Changed to relative path
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || "Error al registrar usuario." };
    }

    return { success: true, message: "Usuario registrado exitosamente." };
  } catch (error) {
    console.error("Error registering user:", error);
    return { success: false, message: "Ocurrió un error inesperado al registrar el usuario." };
  }
}