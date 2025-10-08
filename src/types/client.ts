import { z } from "zod";

export const ClientSchema = z.object({
  razonSocial: z.string().min(1, "La razón social es obligatoria"),
  cuit: z.string().min(8).max(13).optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  notas: z.string().optional(),
  activo: z.boolean().default(true),
});

export type ClientInput = z.infer<typeof ClientSchema>;
