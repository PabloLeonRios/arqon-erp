// src/types/ctacte.ts
import { z } from "zod";

export const PagoCtacteSchema = z.object({
  clienteId: z.string().min(1, "Cliente requerido"),
  clienteNombre: z.string().min(1, "Nombre cliente requerido"),
  monto: z.coerce.number().min(0.01, "Monto inválido"),
  medio: z.string().min(1, "Medio requerido"),
  descripcion: z.string().default("Pago en cuenta corriente"),
  facturaId: z.string().optional(), // si el pago se asocia a una factura en particular
});

export type PagoCtacteInput = z.infer<typeof PagoCtacteSchema>;
