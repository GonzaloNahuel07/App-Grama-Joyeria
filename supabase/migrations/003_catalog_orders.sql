-- RPC pública segura para registrar pedidos desde el catálogo en estado 'pending'
-- Calcula precios, costos y totales del lado del servidor sin exponer costos al cliente.

create or replace function public.create_catalog_order(
  p_seller_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_method text,
  p_delivery_address text,
  p_payment_method text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller public.profiles%rowtype;
  v_default_slug text;
  v_order_id uuid;
  v_order_code text;
  v_total_cents integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'El nombre del cliente es obligatorio.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe contener al menos un accesorio.';
  end if;

  select * into v_seller
  from public.profiles
  where seller_slug = lower(trim(coalesce(p_seller_slug, '')))
    and is_active = true
  limit 1;

  if v_seller.id is null then
    select default_seller_slug into v_default_slug from public.store_settings where id = 1;
    select * into v_seller
    from public.profiles
    where seller_slug = coalesce(v_default_slug, 'nahuel')
      and is_active = true
    limit 1;
  end if;

  if v_seller.id is null then
    select * into v_seller from public.profiles where is_active = true order by created_at asc limit 1;
  end if;

  v_order_code := 'PED-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (
    order_code,
    source,
    seller_slug,
    assigned_profile_id,
    customer_name,
    customer_phone,
    delivery_method,
    delivery_address,
    payment_method,
    notes,
    status,
    total_cents
  ) values (
    v_order_code,
    'catalog',
    coalesce(v_seller.seller_slug, 'nahuel'),
    v_seller.id,
    trim(p_customer_name),
    trim(coalesce(p_customer_phone, '')),
    trim(coalesce(p_delivery_method, '')),
    trim(coalesce(p_delivery_address, '')),
    trim(coalesce(p_payment_method, '')),
    trim(coalesce(p_notes, '')),
    'pending',
    0
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'qty')::integer, 0);
    if v_qty <= 0 then
      raise exception 'Cada cantidad debe ser mayor a cero.';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and is_active = true;

    if v_product.id is null then
      raise exception 'Uno de los accesorios seleccionados ya no está disponible.';
    end if;

    if v_product.stock_qty < v_qty then
      raise exception 'Stock insuficiente para "%". Disponible: %.', v_product.name, v_product.stock_qty;
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      qty,
      unit_price_cents,
      unit_cost_cents
    ) values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_qty,
      v_product.retail_price_cents,
      v_product.cost_cents
    );

    v_total_cents := v_total_cents + (v_product.retail_price_cents * v_qty);
  end loop;

  update public.orders
  set total_cents = v_total_cents
  where id = v_order_id;

  insert into public.activity_logs (
    actor_id,
    actor_name,
    action_type,
    summary,
    entity_type,
    entity_id
  ) values (
    v_seller.id,
    coalesce(v_seller.full_name, 'Catálogo'),
    'catalog_order_created',
    format('Nuevo pedido %s de %s (%s)', v_order_code, trim(p_customer_name), coalesce(v_seller.full_name, 'Catálogo')),
    'order',
    v_order_id::text
  );

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_code', v_order_code,
    'total_cents', v_total_cents,
    'seller_slug', coalesce(v_seller.seller_slug, 'nahuel'),
    'seller_name', coalesce(v_seller.full_name, 'Grama Joyería'),
    'whatsapp_number', coalesce(v_seller.whatsapp_number, '')
  );
end;
$$;

grant execute on function public.create_catalog_order(text, text, text, text, text, text, text, jsonb) to anon, authenticated;
