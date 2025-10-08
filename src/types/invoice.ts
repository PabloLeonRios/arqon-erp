// src/types/invoice.ts
import { z } from "zod";

export const InvoiceItemSchema = z.object({
  // si tenés producto en catálogo:
  productoId: z.string().optional(),
  desc: z.string().min(1, "Descripción obligatoria"),
  qty: z.coerce.number().min(0.0001, "Cantidad inválida"),
  price: z.coerce.number().min(0, "Precio inválido"),
  bonifPct: z.coerce.number().min(0).max(100).default(0), // bonificación libre %
});

export const InvoiceSchema = z.object({
  clienteId: z.string().min(1, "Cliente obligatorio"),
  clienteNombre: z.string().min(1, "Nombre de cliente obligatorio"),
  formaPago: z.enum(["contado", "cta_cte"]),
  items: z.array(InvoiceItemSchema).min(1, "Cargá al menos un ítem"),
  notas: z.string().optional(),
  // opcional, por si querés forzar control de stock ahora (default false)
  restarStock: z.boolean().optional().default(false),
});

export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>;
export type InvoiceInput = z.infer<typeof InvoiceSchema>;
