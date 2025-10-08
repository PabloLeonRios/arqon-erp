// src/types/treasury.ts
import { z } from "zod";

export const CajaMovimientoSchema = z.object({
  tipo: z.enum(["ingreso", "egreso"]),
  monto: z.coerce.number().min(0.01, "Monto inválido"),
  medio: z.string().min(1, "Medio requerido"), // efectivo, transferencia, etc.
  descripcion: z.string().min(1, "Descripción requerida"),
  ref: z.object({
    facturaId: z.string().optional(),
    reciboId: z.string().optional(),
  }).optional(),
});

export type CajaMovimientoInput = z.infer<typeof CajaMovimientoSchema>;
