-- ============================================================
-- Seed: SwissTaxSearch tax topic taxonomy
-- Run after 001_swisstaxsearch_schema.sql
-- ============================================================

insert into public.tax_topics
  (slug, name, name_de, name_fr, name_it, name_en, description, parent_id, icon, color, sort_order)
values
  ('income-tax', 'Income tax', 'Einkommenssteuer', 'Impot sur le revenu', 'Imposta sul reddito', 'Income tax', 'Federal, cantonal, and municipal income tax rules, rates, and filing guidance.', null, 'solar:wallet-money-bold', '#2563EB', 1),
  ('wealth-tax', 'Wealth tax', 'Vermoegenssteuer', 'Impot sur la fortune', 'Imposta sulla sostanza', 'Wealth tax', 'Cantonal wealth tax rules, declarations, and asset valuation guidance.', null, 'solar:safe-2-bold', '#0891B2', 2),
  ('corporate-tax', 'Corporate tax', 'Gewinnsteuer', 'Impot sur le benefice', 'Imposta sull utile', 'Corporate tax', 'Corporate income tax, capital tax, and company filing obligations.', null, 'solar:buildings-2-bold', '#7C3AED', 3),
  ('vat-mwst', 'VAT / MWST', 'Mehrwertsteuer', 'TVA', 'IVA', 'VAT / MWST', 'Swiss VAT registration, rates, returns, exemptions, and Federal Tax Administration updates.', null, 'solar:bill-list-bold', '#DB2777', 4),
  ('withholding-tax', 'Withholding tax', 'Verrechnungssteuer', 'Impot anticipe', 'Imposta preventiva', 'Withholding tax', 'Swiss withholding tax on income, dividends, refunds, and declarations.', null, 'solar:card-transfer-bold', '#EA580C', 5),
  ('deductions', 'Deductions', 'Abzuege', 'Deductions', 'Deduzioni', 'Deductions', 'Official deduction rules for individuals, families, employees, and self-employed taxpayers.', null, 'solar:checklist-minimalistic-bold', '#16A34A', 6),
  ('property-tax', 'Property and real estate tax', 'Liegenschaftssteuer', 'Impots immobiliers', 'Imposte immobiliari', 'Property and real estate tax', 'Real estate, imputed rental value, property gains, and municipal/cantonal obligations.', null, 'solar:home-bold', '#4F46E5', 7),
  ('inheritance-gift-tax', 'Inheritance and gift tax', 'Erbschafts- und Schenkungssteuer', 'Impots sur les successions et donations', 'Imposte di successione e donazione', 'Inheritance and gift tax', 'Cantonal inheritance and gift tax rules, exemptions, and family relationship treatment.', null, 'solar:gift-bold', '#CA8A04', 8),
  ('deadlines-forms', 'Deadlines and forms', 'Fristen und Formulare', 'Delais et formulaires', 'Scadenze e moduli', 'Deadlines and forms', 'Official filing deadlines, tax forms, online portals, and payment deadlines.', null, 'solar:calendar-mark-bold', '#0F766E', 9),
  ('double-taxation', 'Double taxation', 'Doppelbesteuerung', 'Double imposition', 'Doppia imposizione', 'Double taxation', 'Intercantonal and international double taxation, treaties, and competent authorities.', null, 'solar:global-bold', '#9333EA', 10),
  ('official-tax-news', 'Official tax news', 'Amtliche Steuernews', 'Actualites fiscales officielles', 'Notizie fiscali ufficiali', 'Official tax news', 'Latest official announcements from federal and cantonal tax authorities.', null, 'solar:document-text-bold', '#64748B', 11)
on conflict (slug) do update set
  name = excluded.name,
  name_de = excluded.name_de,
  name_fr = excluded.name_fr,
  name_it = excluded.name_it,
  name_en = excluded.name_en,
  description = excluded.description,
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order,
  is_active = true;