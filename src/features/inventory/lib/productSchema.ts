import { z } from 'zod';

export const productFormSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá un nombre de al menos 2 caracteres.'),
  sku: z.string().trim().max(40, 'El SKU es demasiado largo.'),
  categoryId: z.string().trim().nullable(),
  description: z.string().trim().max(1200, 'La descripción supera los 1200 caracteres.'),
  materialDetails: z.string().trim().max(500, 'El detalle técnico supera los 500 caracteres.'),
  costAmount: z.number().finite().min(0, 'El costo no puede ser negativo.'),
  retailPriceAmount: z.number().finite().min(0, 'El precio de venta no puede ser negativo.'),
  wholesalePriceAmount: z
    .number()
    .finite()
    .min(0, 'El precio mayorista no puede ser negativo.')
    .nullable(),
  wholesaleMinQty: z
    .number()
    .int('La cantidad mínima mayorista debe ser un número entero.')
    .min(1, 'La cantidad mínima mayorista debe ser al menos 1.')
    .nullable(),
  stockQty: z.number().int('El stock debe ser entero.').min(0, 'El stock no puede ser negativo.'),
  minStockQty: z
    .number()
    .int('El stock mínimo debe ser entero.')
    .min(0, 'El stock mínimo no puede ser negativo.'),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
