
import { AnalisisMicrobiologicoForm } from "@/components/analisis/analisis-microbiologico-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Análisis Microbiológico | DIGEMAPS',
    description: 'Formulario para registrar el análisis microbiológico de una muestra.',
};

export default async function AnalisisMicrobiologicoPage({ params }: { params: Promise<{ muestraId: string }> }) {
  const { muestraId: muestraIdStr } = await params;
  const muestraId = parseInt(muestraIdStr, 10);

  if (isNaN(muestraId)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground">ID de muestra inválido.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <AnalisisMicrobiologicoForm muestraId={muestraId} />
      </div>
    </main>
  );
}
