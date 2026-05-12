-- ============================================================
-- Seed: Swiss cantons
-- Run after 001_swisstaxsearch_schema.sql
-- ============================================================

insert into public.swiss_cantons
  (code, name_de, name_fr, name_it, name_en, official_domain, tax_office_url, languages)
values
  ('AG', 'Aargau', 'Argovie', 'Argovia', 'Aargau', 'ag.ch', 'https://www.ag.ch/de/verwaltung/dfr/steuern', '{de}'),
  ('AI', 'Appenzell Innerrhoden', 'Appenzell Rhodes-Interieures', 'Appenzello Interno', 'Appenzell Innerrhoden', 'ai.ch', 'https://www.ai.ch/themen/steuern', '{de}'),
  ('AR', 'Appenzell Ausserrhoden', 'Appenzell Rhodes-Exterieures', 'Appenzello Esterno', 'Appenzell Ausserrhoden', 'ar.ch', 'https://ar.ch/verwaltung/departement-finanzen/steuerverwaltung/', '{de}'),
  ('BE', 'Bern', 'Berne', 'Berna', 'Bern', 'be.ch', 'https://www.sv.fin.be.ch', '{de,fr}'),
  ('BL', 'Basel-Landschaft', 'Bale-Campagne', 'Basilea Campagna', 'Basel-Landschaft', 'bl.ch', 'https://www.baselland.ch/politik-und-behorden/direktionen/finanz-und-kirchendirektion/steuerverwaltung', '{de}'),
  ('BS', 'Basel-Stadt', 'Bale-Ville', 'Basilea Citta', 'Basel-Stadt', 'bs.ch', 'https://www.steuerverwaltung.bs.ch', '{de}'),
  ('FR', 'Freiburg', 'Fribourg', 'Friburgo', 'Fribourg', 'fr.ch', 'https://www.fr.ch/scc', '{fr,de}'),
  ('GE', 'Genf', 'Geneve', 'Ginevra', 'Geneva', 'ge.ch', 'https://www.ge.ch/impots', '{fr}'),
  ('GL', 'Glarus', 'Glaris', 'Glarona', 'Glarus', 'gl.ch', 'https://www.gl.ch/verwaltung/finanzen-und-gesundheit/steuern.html', '{de}'),
  ('GR', 'Graubuenden', 'Grisons', 'Grigioni', 'Graubuenden', 'gr.ch', 'https://www.gr.ch/DE/institutionen/verwaltung/dfg/stv/Seiten/default.aspx', '{de,it,rm}'),
  ('JU', 'Jura', 'Jura', 'Giura', 'Jura', 'jura.ch', 'https://www.jura.ch/DFI/CTR.html', '{fr}'),
  ('LU', 'Luzern', 'Lucerne', 'Lucerna', 'Lucerne', 'lu.ch', 'https://steuern.lu.ch', '{de}'),
  ('NE', 'Neuenburg', 'Neuchatel', 'Neuchatel', 'Neuchatel', 'ne.ch', 'https://www.ne.ch/autorites/DFS/SCCO/Pages/accueil.aspx', '{fr}'),
  ('NW', 'Nidwalden', 'Nidwald', 'Nidvaldo', 'Nidwalden', 'nw.ch', 'https://www.nw.ch/steuerverwaltung', '{de}'),
  ('OW', 'Obwalden', 'Obwald', 'Obvaldo', 'Obwalden', 'ow.ch', 'https://www.ow.ch/de/verwaltung/dienstleistungen/?dienst_id=5962', '{de}'),
  ('SG', 'St. Gallen', 'Saint-Gall', 'San Gallo', 'St. Gallen', 'sg.ch', 'https://www.sg.ch/steuern-finanzen/steuern.html', '{de}'),
  ('SH', 'Schaffhausen', 'Schaffhouse', 'Sciaffusa', 'Schaffhausen', 'sh.ch', 'https://sh.ch/CMS/Webseite/Kanton-Schaffhausen/Beh-rde/Verwaltung/Finanzdepartement/Steuerverwaltung-3487-DE.html', '{de}'),
  ('SO', 'Solothurn', 'Soleure', 'Soletta', 'Solothurn', 'so.ch', 'https://steueramt.so.ch', '{de}'),
  ('SZ', 'Schwyz', 'Schwytz', 'Svitto', 'Schwyz', 'sz.ch', 'https://www.sz.ch/steuern', '{de}'),
  ('TG', 'Thurgau', 'Thurgovie', 'Turgovia', 'Thurgau', 'tg.ch', 'https://steuerverwaltung.tg.ch', '{de}'),
  ('TI', 'Tessin', 'Tessin', 'Ticino', 'Ticino', 'ti.ch', 'https://www4.ti.ch/dfe/dc/dichiarazione', '{it}'),
  ('UR', 'Uri', 'Uri', 'Uri', 'Uri', 'ur.ch', 'https://www.ur.ch/themen/895', '{de}'),
  ('VD', 'Waadt', 'Vaud', 'Vaud', 'Vaud', 'vd.ch', 'https://www.vd.ch/impots', '{fr}'),
  ('VS', 'Wallis', 'Valais', 'Vallese', 'Valais', 'vs.ch', 'https://www.vs.ch/web/scc', '{fr,de}'),
  ('ZG', 'Zug', 'Zoug', 'Zugo', 'Zug', 'zg.ch', 'https://www.zg.ch/behoerden/finanzdirektion/steuerverwaltung', '{de}'),
  ('ZH', 'Zuerich', 'Zurich', 'Zurigo', 'Zurich', 'zh.ch', 'https://www.zh.ch/de/steuern-finanzen/steuern.html', '{de}')
on conflict (code) do update set
  name_de = excluded.name_de,
  name_fr = excluded.name_fr,
  name_it = excluded.name_it,
  name_en = excluded.name_en,
  official_domain = excluded.official_domain,
  tax_office_url = excluded.tax_office_url,
  languages = excluded.languages;