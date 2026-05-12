-- ============================================================
-- Seed: official Swiss tax sources
-- Run after 001_swisstaxsearch_schema.sql and swiss_cantons.sql
-- ============================================================

insert into public.official_sources
  (slug, name, base_url, domain, description, jurisdiction_level, canton_code, source_type, languages, trust_score, is_featured)
values
  ('swiss-confederation', 'Swiss Confederation', 'https://www.admin.ch', 'admin.ch', 'Federal government portal for official Swiss information.', 'federal', null, 'official_portal', '{de,fr,it,en}', 98, true),
  ('federal-tax-administration', 'Federal Tax Administration ESTV/AFC', 'https://www.estv.admin.ch', 'estv.admin.ch', 'Official federal tax authority for VAT, withholding tax, direct federal tax, and tax policy publications.', 'federal', null, 'tax_authority', '{de,fr,it,en}', 100, true),
  ('federal-department-finance', 'Federal Department of Finance', 'https://www.efd.admin.ch', 'efd.admin.ch', 'Official federal finance department announcements and policy information.', 'federal', null, 'official_news', '{de,fr,it,en}', 96, true),
  ('fedlex', 'Fedlex', 'https://www.fedlex.admin.ch', 'fedlex.admin.ch', 'Official publication platform for Swiss federal law.', 'federal', null, 'legal_database', '{de,fr,it,en}', 100, true),
  ('swiss-government-news', 'Swiss Government News', 'https://www.news.admin.ch', 'news.admin.ch', 'Official Swiss government news releases.', 'federal', null, 'official_news', '{de,fr,it,en}', 95, true),
  ('ch-ch', 'ch.ch', 'https://www.ch.ch', 'ch.ch', 'Official federal and cantonal public service guide.', 'federal', null, 'official_portal', '{de,fr,it,en}', 94, true),
  ('ag-tax', 'Canton Aargau tax authority', 'https://www.ag.ch/de/verwaltung/dfr/steuern', 'ag.ch', 'Official tax information for Canton Aargau.', 'canton', 'AG', 'tax_authority', '{de}', 95, false),
  ('ai-tax', 'Canton Appenzell Innerrhoden tax authority', 'https://www.ai.ch/themen/steuern', 'ai.ch', 'Official tax information for Canton Appenzell Innerrhoden.', 'canton', 'AI', 'tax_authority', '{de}', 95, false),
  ('ar-tax', 'Canton Appenzell Ausserrhoden tax authority', 'https://ar.ch/verwaltung/departement-finanzen/steuerverwaltung/', 'ar.ch', 'Official tax information for Canton Appenzell Ausserrhoden.', 'canton', 'AR', 'tax_authority', '{de}', 95, false),
  ('be-tax', 'Canton Bern tax authority', 'https://www.sv.fin.be.ch', 'be.ch', 'Official tax information for Canton Bern.', 'canton', 'BE', 'tax_authority', '{de,fr}', 96, true),
  ('bl-tax', 'Canton Basel-Landschaft tax authority', 'https://www.baselland.ch/politik-und-behorden/direktionen/finanz-und-kirchendirektion/steuerverwaltung', 'bl.ch', 'Official tax information for Canton Basel-Landschaft.', 'canton', 'BL', 'tax_authority', '{de}', 95, false),
  ('bs-tax', 'Canton Basel-Stadt tax authority', 'https://www.steuerverwaltung.bs.ch', 'steuerverwaltung.bs.ch', 'Official tax information for Canton Basel-Stadt.', 'canton', 'BS', 'tax_authority', '{de}', 96, true),
  ('fr-tax', 'Canton Fribourg tax authority', 'https://www.fr.ch/scc', 'fr.ch', 'Official tax information for Canton Fribourg.', 'canton', 'FR', 'tax_authority', '{fr,de}', 95, false),
  ('ge-tax', 'Canton Geneva tax authority', 'https://www.ge.ch/impots', 'ge.ch', 'Official tax information for Canton Geneva.', 'canton', 'GE', 'tax_authority', '{fr}', 96, true),
  ('gl-tax', 'Canton Glarus tax authority', 'https://www.gl.ch/verwaltung/finanzen-und-gesundheit/steuern.html', 'gl.ch', 'Official tax information for Canton Glarus.', 'canton', 'GL', 'tax_authority', '{de}', 95, false),
  ('gr-tax', 'Canton Graubuenden tax authority', 'https://www.gr.ch/DE/institutionen/verwaltung/dfg/stv/Seiten/default.aspx', 'gr.ch', 'Official tax information for Canton Graubuenden.', 'canton', 'GR', 'tax_authority', '{de,it,rm}', 95, false),
  ('ju-tax', 'Canton Jura tax authority', 'https://www.jura.ch/DFI/CTR.html', 'jura.ch', 'Official tax information for Canton Jura.', 'canton', 'JU', 'tax_authority', '{fr}', 95, false),
  ('lu-tax', 'Canton Lucerne tax authority', 'https://steuern.lu.ch', 'steuern.lu.ch', 'Official tax information for Canton Lucerne.', 'canton', 'LU', 'tax_authority', '{de}', 96, true),
  ('ne-tax', 'Canton Neuchatel tax authority', 'https://www.ne.ch/autorites/DFS/SCCO/Pages/accueil.aspx', 'ne.ch', 'Official tax information for Canton Neuchatel.', 'canton', 'NE', 'tax_authority', '{fr}', 95, false),
  ('nw-tax', 'Canton Nidwalden tax authority', 'https://www.nw.ch/steuerverwaltung', 'nw.ch', 'Official tax information for Canton Nidwalden.', 'canton', 'NW', 'tax_authority', '{de}', 95, false),
  ('ow-tax', 'Canton Obwalden tax authority', 'https://www.ow.ch/de/verwaltung/dienstleistungen/?dienst_id=5962', 'ow.ch', 'Official tax information for Canton Obwalden.', 'canton', 'OW', 'tax_authority', '{de}', 95, false),
  ('sg-tax', 'Canton St. Gallen tax authority', 'https://www.sg.ch/steuern-finanzen/steuern.html', 'sg.ch', 'Official tax information for Canton St. Gallen.', 'canton', 'SG', 'tax_authority', '{de}', 95, false),
  ('sh-tax', 'Canton Schaffhausen tax authority', 'https://sh.ch/CMS/Webseite/Kanton-Schaffhausen/Beh-rde/Verwaltung/Finanzdepartement/Steuerverwaltung-3487-DE.html', 'sh.ch', 'Official tax information for Canton Schaffhausen.', 'canton', 'SH', 'tax_authority', '{de}', 95, false),
  ('so-tax', 'Canton Solothurn tax authority', 'https://steueramt.so.ch', 'steueramt.so.ch', 'Official tax information for Canton Solothurn.', 'canton', 'SO', 'tax_authority', '{de}', 96, false),
  ('sz-tax', 'Canton Schwyz tax authority', 'https://www.sz.ch/steuern', 'sz.ch', 'Official tax information for Canton Schwyz.', 'canton', 'SZ', 'tax_authority', '{de}', 95, false),
  ('tg-tax', 'Canton Thurgau tax authority', 'https://steuerverwaltung.tg.ch', 'steuerverwaltung.tg.ch', 'Official tax information for Canton Thurgau.', 'canton', 'TG', 'tax_authority', '{de}', 96, false),
  ('ti-tax', 'Canton Ticino tax authority', 'https://www4.ti.ch/dfe/dc/dichiarazione', 'ti.ch', 'Official tax information for Canton Ticino.', 'canton', 'TI', 'tax_authority', '{it}', 95, false),
  ('ur-tax', 'Canton Uri tax authority', 'https://www.ur.ch/themen/895', 'ur.ch', 'Official tax information for Canton Uri.', 'canton', 'UR', 'tax_authority', '{de}', 95, false),
  ('vd-tax', 'Canton Vaud tax authority', 'https://www.vd.ch/impots', 'vd.ch', 'Official tax information for Canton Vaud.', 'canton', 'VD', 'tax_authority', '{fr}', 96, true),
  ('vs-tax', 'Canton Valais tax authority', 'https://www.vs.ch/web/scc', 'vs.ch', 'Official tax information for Canton Valais.', 'canton', 'VS', 'tax_authority', '{fr,de}', 95, false),
  ('zg-tax', 'Canton Zug tax authority', 'https://www.zg.ch/behoerden/finanzdirektion/steuerverwaltung', 'zg.ch', 'Official tax information for Canton Zug.', 'canton', 'ZG', 'tax_authority', '{de}', 95, false),
  ('zh-tax', 'Canton Zurich tax authority', 'https://www.zh.ch/de/steuern-finanzen/steuern.html', 'zh.ch', 'Official tax information for Canton Zurich.', 'canton', 'ZH', 'tax_authority', '{de}', 96, true)
on conflict (slug) do update set
  name = excluded.name,
  base_url = excluded.base_url,
  domain = excluded.domain,
  description = excluded.description,
  jurisdiction_level = excluded.jurisdiction_level,
  canton_code = excluded.canton_code,
  source_type = excluded.source_type,
  languages = excluded.languages,
  trust_score = excluded.trust_score,
  is_featured = excluded.is_featured,
  is_active = true;