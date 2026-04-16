"use server";

import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function loginAction(values: z.infer<typeof loginSchema>) {
  // 1. Validate form data with Zod
  const validatedFields = loginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: "Invalid input." };
  }
  
  const { email, password } = validatedFields.data;

  try {
    const response = await fetch("http://localhost:5088/api/auth/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo: email, contrasena: password }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: "Login successful!", token: data.token, nombre: data.nombre, rol: data.rol };
    } else {
      const errorData = await response.json();
      return { success: false, message: errorData.message || "Invalid email or password." };
    }
  } catch (error) {
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}
