// src/types/invoice.ts
import { z } from "zod";

export const InvoiceItemSchema = z.object({
  // si tenÃ©s producto en catÃ¡logo:
  productoId: z.string().optional(),
  desc: z.string().min(1, "DescripciÃ³n obligatoria"),
  qty: z.coerce.number().min(0.0001, "Cantidad invÃ¡lida"),
  price: z.coerce.number().min(0, "Precio invÃ¡lido"),
  bonifPct: z.coerce.number().min(0).max(100).default(0), // bonificaciÃ³n libre %
});

export const InvoiceSchema = z.object({
  clienteId: z.string().min(1, "Cliente obligatorio"),
  clienteNombre: z.string().min(1, "Nombre de cliente obligatorio"),
  formaPago: z.enum(["contado", "cta_cte"]),
  items: z.array(InvoiceItemSchema).min(1, "CargÃ¡ al menos un Ã­tem"),
  notas: z.string().optional(),
  // opcional, por si querÃ©s forzar control de stock ahora (default false)
  restarStock: z.boolean().optional().default(false),
});

export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>;
export type InvoiceInput = z.infer<typeof InvoiceSchema>;
