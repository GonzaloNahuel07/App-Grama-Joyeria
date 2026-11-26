-- Categorías iniciales para el catálogo de Grama Joyería
insert into public.categories (name, slug, sort_order, is_active)
values
  ('Anillos', 'anillos', 1, true),
  ('Aros', 'aros', 2, true),
  ('Cadenas', 'cadenas', 3, true),
  ('Pulseras', 'pulseras', 4, true),
  ('Conjuntos', 'conjuntos', 5, true)
on conflict (slug) do nothing;
