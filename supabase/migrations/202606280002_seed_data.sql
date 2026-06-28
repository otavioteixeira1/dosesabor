insert into public.categories (name, slug, description, sort_order)
values
  ('Bolos no Pote', 'bolos-no-pote', 'Camadas cremosas e recheios artesanais.', 1),
  ('Tortas e Sobremesas', 'tortas-e-sobremesas', 'Fatias geladas e sobremesas prontas para levar.', 2),
  ('Doces Finos', 'doces-finos', 'Caixinhas, trufas e doces para presentear.', 3)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.products (
  category_id,
  name,
  slug,
  description,
  price,
  image_url,
  stock_quantity,
  display_order
)
values
  ((select id from public.categories where slug = 'bolos-no-pote'), 'Bolo no Pote Red Velvet', 'bolo-no-pote-red-velvet', 'Massa aveludada, creme de baunilha e farofa crocante.', 18.90, null, 18, 1),
  ((select id from public.categories where slug = 'bolos-no-pote'), 'Bolo no Pote Ninho com Morango', 'bolo-no-pote-ninho-com-morango', 'Creme de leite ninho com morangos frescos.', 19.90, null, 16, 2),
  ((select id from public.categories where slug = 'tortas-e-sobremesas'), 'Banoffee da Casa', 'banoffee-da-casa', 'Base crocante, doce de leite, banana e chantilly.', 24.90, null, 10, 1),
  ((select id from public.categories where slug = 'tortas-e-sobremesas'), 'Brownie com Ganache', 'brownie-com-ganache', 'Brownie úmido com cobertura intensa de chocolate.', 16.50, null, 14, 2),
  ((select id from public.categories where slug = 'doces-finos'), 'Caixa com 6 Brigadeiros Gourmet', 'caixa-com-6-brigadeiros-gourmet', 'Sabores variados em caixa para presente.', 28.00, null, 12, 1)
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  image_url = excluded.image_url,
  stock_quantity = excluded.stock_quantity,
  display_order = excluded.display_order;

insert into public.settings (
  id,
  store_name,
  whatsapp_number,
  pix_key,
  delivery_fee,
  minimum_order,
  is_store_open,
  opening_hours,
  kiosk_city,
  delivery_city,
  brand_tagline
)
values (
  1,
  'Doce Sabor Doceria Gourmet',
  '5519999999999',
  'pix@docesabor.com.br',
  7.00,
  20.00,
  true,
  'Seg a Sáb, 10h às 20h',
  'Águas da Prata',
  'Poços de Caldas',
  'Doces artesanais, prontos para retirada ou delivery.'
)
on conflict (id) do update
set
  store_name = excluded.store_name,
  whatsapp_number = excluded.whatsapp_number,
  pix_key = excluded.pix_key,
  delivery_fee = excluded.delivery_fee,
  minimum_order = excluded.minimum_order,
  is_store_open = excluded.is_store_open,
  opening_hours = excluded.opening_hours,
  kiosk_city = excluded.kiosk_city,
  delivery_city = excluded.delivery_city,
  brand_tagline = excluded.brand_tagline;
