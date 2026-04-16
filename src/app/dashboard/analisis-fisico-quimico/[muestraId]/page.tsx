
import { AnalisisFisicoQuimicoForm } from "@/components/analisis/analisis-fisico-quimico-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Análisis Físico-Químico | DIGEMAPS',
    description: 'Formulario para registrar el análisis físico-químico de una muestra.',
};

export default async function AnalisisFisicoQuimicoPage({ params }: { params: Promise<{ muestraId: string }> }) {
  const { muestraId } = await params;
  const muestraIdNumber = parseInt(muestraId, 10);
  
  if (isNaN(muestraIdNumber)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p>ID de muestra inválido</p>
        </div>
      </main>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <AnalisisFisicoQuimicoForm muestraId={muestraIdNumber} />
      </div>
    </main>
  );
}
