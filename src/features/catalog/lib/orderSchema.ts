import { z } from 'zod';

export const catalogOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'Ingresá tu nombre para registrar el pedido.'),
  customerPhone: z
    .string()
    .trim()
    .min(6, 'Ingresá un teléfono o WhatsApp para poder responderte rápido.'),
  deliveryMethod: z.string().trim().min(1, 'Seleccioná una modalidad de entrega.'),
  deliveryAddress: z.string().trim().max(250, 'La dirección es demasiado larga.'),
  paymentMethod: z.string().trim().min(1, 'Elegí una forma de pago estimada.'),
  notes: z.string().trim().max(400, 'Las notas no pueden superar los 400 caracteres.'),
});

export type CatalogOrderFormValues = z.infer<typeof catalogOrderSchema>;
