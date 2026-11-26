import { Receipt } from 'lucide-react';
import { ModulePlaceholderCard } from '../../../shared/components/ModulePlaceholderCard';

/**
 * Placeholder view for orders, manual sales, expenses, and partner activity log (Block 4).
 */
export function AdminOrdersPlaceholderPage() {
  return (
    <ModulePlaceholderCard
      badge="Próximo: Bloque 4"
      title="Pedidos, Ventas, Gastos y Coordinación"
      description="Centraliza los pedidos que llegan del catálogo, las ventas manuales, los gastos de cada reinversión y el historial de actividad entre socios."
      icon={Receipt}
      items={[
        'Bandeja de pedidos pendientes para confirmar en 1 toque y descontar stock',
        'Registro rápido de ventas directas fuera del catálogo',
        'Control de gastos y reinversiones (mercadería, packaging, envíos)',
        'Feed de actividad compartida para evitar ventas duplicadas',
      ]}
    />
  );
}
