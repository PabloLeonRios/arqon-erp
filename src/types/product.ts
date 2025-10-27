import { z } from "zod";

/**
 * ProductSchema:
 * - nombre: obligatorio
 * - sku / codigoBarras: opcionales
 * - precio: nÃºmero (se acepta string y se convierte)
 * - iva: porcentaje (por defecto 21)
 * - stock: nÃºmero (por defecto 0)
 * - unidad: 'unidad', 'kg', 'lt', etc. (opcional)
 * - categoria: opcional (texto)
 * - activo: boolean por defecto true
 */
export const ProductSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  sku: z.string().trim().optional(),
  codigoBarras: z.string().trim().optional(),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
  iva: z.coerce.number().min(0).max(100).default(21),
  stock: z.coerce.number().min(0).default(0),
  unidad: z.string().trim().optional(),       // ej. 'unidad', 'kg', 'lt'
  categoria: z.string().trim().optional(),
  activo: z.boolean().default(true),
  notas: z.string().optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;
