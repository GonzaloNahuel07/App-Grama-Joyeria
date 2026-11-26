import { ShoppingBag } from 'lucide-react';
import { useApp } from '../../../app/providers/useApp';
import { ModulePlaceholderCard } from '../../../shared/components/ModulePlaceholderCard';

/**
 * Public checkout placeholder previewing WhatsApp seller attribution before Block 3.
 */
export function CheckoutPlaceholderPage() {
  const { activeSeller } = useApp();

  return (
    <div className="space-y-4">
      <ModulePlaceholderCard
        badge="Próximo: Bloque 3"
        title="Armado de pedido y envío a WhatsApp"
        description={
          activeSeller
            ? `Cuando un cliente finalice su pedido desde este enlace, se guardará como Pendiente y abrirá el WhatsApp de ${activeSeller.fullName} (${activeSeller.whatsappNumber || 'sin teléfono cargado'}).`
            : 'Aquí el cliente completará sus datos de entrega y enviará su pedido por WhatsApp al vendedor correspondiente.'
        }
        icon={ShoppingBag}
        items={[
          'Resumen de piezas seleccionadas con cantidades',
          'Formulario corto con nombre, entrega, zona y forma de pago',
          'Registro automático como pedido Pendiente sin descontar stock hasta confirmar',
          'Redirección al WhatsApp personal del socio que compartió el link',
        ]}
      />
    </div>
  );
}
