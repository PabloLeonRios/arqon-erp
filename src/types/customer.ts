// src/types/customer.ts
import { z } from "zod";

/**
 * Reglas:
 * - doc = CUIT/CUIL/DNI (string). Si viene, se usa como clave principal de upsert.
 * - Si no hay doc pero hay email, se usa email como clave de upsert.
 * - bonifPct = bonificación libre (0..100). Se aplica en venta, no en importación.
 * - condIva: "RI" | "Monotributo" | "CF" | "Exento" | "No Responsable"
 */
export const CustomerSchema = z.object({
  doc: z.string().trim().optional(),            // CUIT/CUIL/DNI
  nombre: z.string().trim().min(1, "Nombre/Razón social requerido"),
  fantasia: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  telefono: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  localidad: z.string().trim().optional(),
  provincia: z.string().trim().optional(),
  condIva: z.enum(["RI", "Monotributo", "CF", "Exento", "No Responsable"]).optional(),
  bonifPct: z.coerce.number().min(0).max(100).default(0),
  notas: z.string().trim().optional(),
  activo: z.boolean().default(true),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;
