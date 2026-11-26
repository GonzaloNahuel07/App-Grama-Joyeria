import { Check, Copy, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { useApp } from '../../../app/providers/useApp';
import { storeService } from '../../../services';
import type {
  PartnerProfile,
  ShippingMethodInfo,
  StoreSettings,
} from '../../../shared/types/domain';
import { buildShareableCatalogUrl, normalizeSellerSlug } from '../../catalog/lib/sellerContext';

const partnerSchema = z.object({
  fullName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  sellerSlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-]+$/,
      'El identificador solo puede usar letras minúsculas, números y guiones.',
    ),
  whatsappNumber: z
    .string()
    .trim()
    .min(6, 'Ingresá un número de WhatsApp válido (con código de país, ej. 54911...).'),
  isActive: z.boolean(),
});

const settingsSchema = z.object({
  businessName: z.string().trim().min(2, 'El nombre del negocio no puede estar vacío.'),
  instagramHandle: z.string().trim(),
  contactEmail: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || z.string().email().safeParse(v).success,
      'Ingresá un correo válido.',
    ),
  defaultSellerSlug: z.string().trim().min(1),
});

/**
 * Partner profile, WhatsApp routing link, and store/shipping settings configuration view.
 */
export function AdminSettingsPage() {
  const { publicMeta, refreshPublicMeta, refreshSession, updateLocalSettingsCache } = useApp();

  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(publicMeta.settings);
  const [isLoading, setIsLoading] = useState(true);
  const [savingPartnerId, setSavingPartnerId] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([storeService.getPartners(), storeService.getStoreSettings()])
      .then(([loadedPartners, loadedSettings]) => {
        if (!active) return;
        setPartners(loadedPartners);
        setSettings(loadedSettings);
      })
      .catch((error) => {
        if (!active) return;
        setFeedback({
          type: 'err',
          text: error instanceof Error ? error.message : 'No pudimos cargar la configuración.',
        });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function updatePartnerField(
    id: string,
    field: keyof Pick<PartnerProfile, 'fullName' | 'sellerSlug' | 'whatsappNumber' | 'isActive'>,
    value: string | boolean,
  ) {
    setPartners((prev) =>
      prev.map((partner) => (partner.id === id ? { ...partner, [field]: value } : partner)),
    );
  }

  async function handleSavePartner(partner: PartnerProfile) {
    setFeedback(null);
    const parsed = partnerSchema.safeParse({
      fullName: partner.fullName,
      sellerSlug: partner.sellerSlug,
      whatsappNumber: partner.whatsappNumber,
      isActive: partner.isActive,
    });

    if (!parsed.success) {
      setFeedback({
        type: 'err',
        text: parsed.error.issues[0]?.message ?? 'Datos del socio inválidos.',
      });
      return;
    }

    setSavingPartnerId(partner.id);
    try {
      const updated = await storeService.updatePartner(partner.id, parsed.data);
      setPartners((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      await Promise.all([refreshPublicMeta(), refreshSession()]);
      setFeedback({
        type: 'ok',
        text: `Datos de ${updated.fullName} actualizados correctamente.`,
      });
    } catch (error) {
      setFeedback({
        type: 'err',
        text: error instanceof Error ? error.message : 'Error al guardar el socio.',
      });
    } finally {
      setSavingPartnerId(null);
    }
  }

  async function handleCopyPartnerLink(slug: string) {
    const url = buildShareableCatalogUrl(window.location.origin, slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      window.setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      // Clipboard access unavailable in restricted contexts.
    }
  }

  function updateShippingField(id: string, field: keyof ShippingMethodInfo, value: string) {
    setSettings((prev) => ({
      ...prev,
      shippingMethods: prev.shippingMethods.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function handleAddShippingMethod() {
    setSettings((prev) => ({
      ...prev,
      shippingMethods: [
        ...prev.shippingMethods,
        {
          id: `method-${Date.now()}`,
          title: 'Nueva modalidad de entrega',
          description: 'Detallá plazos, zonas o costos.',
        },
      ],
    }));
  }

  function handleRemoveShippingMethod(id: string) {
    setSettings((prev) => ({
      ...prev,
      shippingMethods: prev.shippingMethods.filter((item) => item.id !== id),
    }));
  }

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);

    const parsed = settingsSchema.safeParse({
      businessName: settings.businessName,
      instagramHandle: settings.instagramHandle,
      contactEmail: settings.contactEmail,
      defaultSellerSlug:
        normalizeSellerSlug(settings.defaultSellerSlug) ?? partners[0]?.sellerSlug ?? 'gonzalo',
    });

    if (!parsed.success) {
      setFeedback({
        type: 'err',
        text: parsed.error.issues[0]?.message ?? 'Revisá los datos generales del negocio.',
      });
      return;
    }

    const cleanedShipping = settings.shippingMethods
      .map((item) => ({
        id: item.id,
        title: item.title.trim(),
        description: item.description.trim(),
      }))
      .filter((item) => item.title.length > 0);

    setIsSavingSettings(true);
    try {
      const saved = await storeService.updateStoreSettings({
        ...settings,
        ...parsed.data,
        shippingMethods: cleanedShipping,
      });
      setSettings(saved);
      updateLocalSettingsCache(saved);
      setFeedback({
        type: 'ok',
        text: 'Información del negocio y modalidades de envío guardadas.',
      });
    } catch (error) {
      setFeedback({
        type: 'err',
        text: error instanceof Error ? error.message : 'No pudimos guardar la configuración.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Cargando configuración...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Socios, WhatsApp y Tienda</h1>
        <p className="text-sm text-muted">
          Configurá los links personalizados de cada socio y la información visible en el catálogo.
        </p>
      </div>

      {feedback ? (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
            feedback.type === 'ok'
              ? 'border-ok/30 bg-ok-soft text-ok'
              : 'border-danger/30 bg-danger-soft text-danger'
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      {/* Partners and WhatsApp numbers */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold">Vendedores y redirección a WhatsApp</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {partners.map((partner) => {
            const shareUrl = buildShareableCatalogUrl(window.location.origin, partner.sellerSlug);
            const isSaving = savingPartnerId === partner.id;

            return (
              <div
                key={partner.id}
                className="rounded-2xl border border-line bg-card p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{partner.fullName || 'Socio'}</span>
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={partner.isActive}
                      onChange={(e) => updatePartnerField(partner.id, 'isActive', e.target.checked)}
                      className="rounded border-line"
                    />
                    Activo
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold">Nombre visible</label>
                    <input
                      type="text"
                      value={partner.fullName}
                      onChange={(e) => updatePartnerField(partner.id, 'fullName', e.target.value)}
                      className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-brand"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold">Identificador (?v=...)</label>
                    <input
                      type="text"
                      value={partner.sellerSlug}
                      onChange={(e) => updatePartnerField(partner.id, 'sellerSlug', e.target.value)}
                      className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs font-mono outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold">
                    WhatsApp personal (ej. 5491155551111)
                  </label>
                  <input
                    type="tel"
                    value={partner.whatsappNumber}
                    onChange={(e) =>
                      updatePartnerField(partner.id, 'whatsappNumber', e.target.value)
                    }
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-brand"
                  />
                </div>

                <div className="rounded-xl border border-line bg-surface p-2.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-mono text-muted" title={shareUrl}>
                    {shareUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopyPartnerLink(partner.sellerSlug)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-semibold hover:bg-line/40 cursor-pointer"
                  >
                    {copiedSlug === partner.sellerSlug ? (
                      <Check className="h-3.5 w-3.5 text-ok" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedSlug === partner.sellerSlug ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleSavePartner(partner)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-brand-ink hover:opacity-90 disabled:opacity-60 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  {isSaving ? 'Guardando...' : 'Guardar socio'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Store details and shipping methods */}
      <form
        onSubmit={handleSaveSettings}
        className="rounded-2xl border border-line bg-card p-5 space-y-5"
      >
        <h2 className="text-sm font-bold">Datos del negocio y modalidades de envío</h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="business-name" className="block text-xs font-semibold">
              Nombre del catálogo
            </label>
            <input
              id="business-name"
              type="text"
              value={settings.businessName}
              onChange={(e) => setSettings((s) => ({ ...s, businessName: e.target.value }))}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="instagram-handle" className="block text-xs font-semibold">
              Instagram
            </label>
            <input
              id="instagram-handle"
              type="text"
              value={settings.instagramHandle}
              onChange={(e) => setSettings((s) => ({ ...s, instagramHandle: e.target.value }))}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="contact-email" className="block text-xs font-semibold">
              Email de contacto
            </label>
            <input
              id="contact-email"
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings((s) => ({ ...s, contactEmail: e.target.value }))}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="default-seller" className="block text-xs font-semibold">
              Vendedor por defecto (sin ?v=)
            </label>
            <select
              id="default-seller"
              value={settings.defaultSellerSlug}
              onChange={(e) => setSettings((s) => ({ ...s, defaultSellerSlug: e.target.value }))}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-brand"
            >
              {partners
                .filter((partner) => partner.isActive)
                .map((partner) => (
                  <option key={partner.id} value={partner.sellerSlug}>
                    {partner.fullName} (?v={partner.sellerSlug})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold">Modalidades de entrega visibles al cliente</span>
            <button
              type="button"
              onClick={handleAddShippingMethod}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold hover:bg-line/40 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Agregar modalidad
            </button>
          </div>

          <div className="space-y-2.5">
            {settings.shippingMethods.map((method) => (
              <div
                key={method.id}
                className="grid gap-2 rounded-xl border border-line bg-surface p-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-start"
              >
                <input
                  type="text"
                  value={method.title}
                  placeholder="Título (ej. Retiro en punto)"
                  onChange={(e) => updateShippingField(method.id, 'title', e.target.value)}
                  className="rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold outline-none focus:border-brand"
                />
                <input
                  type="text"
                  value={method.description}
                  placeholder="Descripción de zonas, tiempos o costos"
                  onChange={(e) => updateShippingField(method.id, 'description', e.target.value)}
                  className="rounded-lg border border-line bg-card px-3 py-2 text-xs outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveShippingMethod(method.id)}
                  className="inline-flex items-center justify-center rounded-lg border border-line bg-card p-2 text-muted hover:text-danger cursor-pointer"
                  aria-label="Eliminar modalidad de envío"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSavingSettings}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-brand-ink hover:opacity-90 disabled:opacity-60 cursor-pointer"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSavingSettings ? 'Guardando...' : 'Guardar configuración de tienda'}
        </button>
      </form>
    </div>
  );
}
