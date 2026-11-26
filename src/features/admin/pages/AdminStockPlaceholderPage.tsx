import { Package } from 'lucide-react';
import { ModulePlaceholderCard } from '../../../shared/components/ModulePlaceholderCard';

/**
 * Placeholder view for inventory and minimum-stock replenishment module (Block 2).
 */
export function AdminStockPlaceholderPage() {
  return (
    <ModulePlaceholderCard
      badge="Próximo: Bloque 2"
      title="Control de Stock, Catálogo y Reposición"
      description="Aquí van a cargar y editar los accesorios con fotos, costo real, precio de venta, stock disponible y mínimo para alertas de reposición."
      icon={Package}
      items={[
        'Alta y edición de joyas con múltiples fotos desde celular o PC',
        'Definición de stock mínimo por artículo con bandeja de faltantes',
        'Control de visibilidad (activo / oculto / sin stock)',
        'Trazabilidad automática de quién cargó o actualizó cada pieza',
      ]}
    />
  );
}
