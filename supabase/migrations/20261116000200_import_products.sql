-- Initial catalogue; applied once by the migration history, including on GitHub deployment.
insert into public.products (slug, name, price, image_url, description, category, in_stock, badge, display_order) values
  ('lampe-aria', 'Lampe Aria', 129, '/lampe.webp', 'Une lumière douce, un pied sculptural en céramique.', 'Lumière', true, 'Coup de cœur', 0),
  ('vase-sillage', 'Vase Sillage', 58, '/canape.webp', 'Grès façonné à la main, chaque pièce est unique.', 'Décoration', true, 'Fait main', 1),
  ('tasse-atelier', 'Tasse Atelier', 24, '/tasse.webp', 'Une anse généreuse et un émail vert profond.', 'Art de la table', true, null, 2),
  ('plaid-nuage', 'Plaid Nuage', 89, '/sejour.webp', 'Coton recyclé tissé dans les Hauts-de-France.', 'Textile', true, null, 3),
  ('plateau-ligne', 'Plateau Ligne', 46, '/sejour2.webp', 'Du chêne certifié, des lignes simples et durables.', 'Accessoires', true, 'Nouveau', 4),
  ('bougie-empreinte', 'Bougie Empreinte', 32, '/bougie.webp', 'Cire végétale, parfum de figuier et de bois blond.', 'Parfum', false, null, 5);
