"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { devolverMuestraAction } from "@/app/actions/muestras-actions";
import { Loader2, ArrowLeftRight } from "lucide-react";

interface DevolverMuestraDialogProps {
  muestraId: number;
  token: string;
  onMuestraDevuelta: () => void;
}

export function DevolverMuestraDialog({
  muestraId,
  token,
  onMuestraDevuelta,
}: DevolverMuestraDialogProps) {
  const [motivo, setMotivo] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor, ingrese un motivo para la devolución.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await devolverMuestraAction(muestraId, motivo, token);

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        });
        onMuestraDevuelta();
        setIsOpen(false);
        setMotivo(""); 
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
            <ArrowLeftRight className="mr-2 h-4 w-4"/>
            Retornar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Devolver Muestra al Analista</DialogTitle>
          <DialogDescription>
            Ingrese el motivo por el cual se devuelve la muestra. Este motivo será visible para el analista.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="motivo">Motivo de Devolución</Label>
            <Textarea
              id="motivo"
              placeholder="Escriba aquí el motivo..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="col-span-3"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Enviando..." : "Confirmar Devolución"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
