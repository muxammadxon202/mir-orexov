# Graph Report - .  (2026-06-28)

## Corpus Check
- Large corpus: 101 files · ~726,636 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 215 nodes · 214 edges · 37 communities (16 shown, 21 thin omitted)
- Extraction: 63% EXTRACTED · 35% INFERRED · 3% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Фото товаров (каталог)|Фото товаров (каталог)]]
- [[_COMMUNITY_PDF-каталог разделы и сертификаты|PDF-каталог: разделы и сертификаты]]
- [[_COMMUNITY_Бренд SAMBOX и категории сайта|Бренд SAMBOX и категории сайта]]
- [[_COMMUNITY_Свежие фрукты и овощи (PDF)|Свежие фрукты и овощи (PDF)]]
- [[_COMMUNITY_Миндаль и грецкий орех|Миндаль и грецкий орех]]
- [[_COMMUNITY_Изюм (сорта)|Изюм (сорта)]]
- [[_COMMUNITY_Иконки сертификатов|Иконки сертификатов]]
- [[_COMMUNITY_Сухофрукты Китай|Сухофрукты Китай]]
- [[_COMMUNITY_catalog.js (рендер каталога)|catalog.js (рендер каталога)]]
- [[_COMMUNITY_Бобовые|Бобовые]]
- [[_COMMUNITY_Картинки категорий (catalog)|Картинки категорий (catalog/)]]
- [[_COMMUNITY_Арахис|Арахис]]
- [[_COMMUNITY_i18n.js (мультиязычность)|i18n.js (мультиязычность)]]
- [[_COMMUNITY_Фото фисташки жареные|Фото: фисташки жареные]]
- [[_COMMUNITY_Фото групповое (su-image)|Фото: групповое (su-image)]]
- [[_COMMUNITY_Фото IMG_0074|Фото: IMG_0074]]
- [[_COMMUNITY_Фото изюм золотой|Фото: изюм золотой]]
- [[_COMMUNITY_Фото миндаль в скорлупе|Фото: миндаль в скорлупе]]
- [[_COMMUNITY_Фото тыквенные семечки|Фото: тыквенные семечки]]
- [[_COMMUNITY_Анимация жумбо|Анимация: жумбо]]
- [[_COMMUNITY_Анимация изюм жавз|Анимация: изюм жавз]]
- [[_COMMUNITY_Анимация изюм сойаги|Анимация: изюм сойаги]]
- [[_COMMUNITY_Анимация кешью|Анимация: кешью]]
- [[_COMMUNITY_Анимация курага|Анимация: курага]]
- [[_COMMUNITY_Анимация миндаль|Анимация: миндаль]]
- [[_COMMUNITY_Анимация орех|Анимация: орех]]
- [[_COMMUNITY_Анимация туршак|Анимация: туршак]]
- [[_COMMUNITY_Анимация тыквенная семечка|Анимация: тыквенная семечка]]
- [[_COMMUNITY_Анимация фисташка|Анимация: фисташка]]
- [[_COMMUNITY_Анимация чернослив|Анимация: чернослив]]
- [[_COMMUNITY_Фото слива|Фото: слива]]
- [[_COMMUNITY_Фото урюк|Фото: урюк]]
- [[_COMMUNITY_PDF-страница (page_005)|PDF-страница (page_005)]]

## God Nodes (most connected - your core abstractions)
1. `products` - 58 edges
2. `Каталог PDF (продуктовый каталог)` - 24 edges
3. `Свежие фрукты / Fresh Fruits` - 14 edges
4. `Главная (index.html)` - 13 edges
5. `Каталог (catalog.html)` - 8 edges
6. `Контакты (contact.html)` - 8 edges
7. `Изюм / Raisins` - 8 edges
8. `ООО "Raise Production business"` - 7 edges
9. `Форма заявки (Request Form)` - 7 edges
10. `Сухофрукты / Dried Fruits (China)` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Каталог (catalog.html)` --CONTAINS--> `Овощи и фрукты / Vegetables & Fruits`  [AMBIGUOUS]
  catalog.html → index.html
- `Каталог (catalog.html)` --CONTAINS--> `Семена и бобовые / Seeds & Legumes`  [AMBIGUOUS]
  catalog.html → index.html
- `О нас (about.html)` --MENTIONS--> `SAMBOX (упаковочная фабрика)`  [EXTRACTED]
  about.html → каталог PDF .pdf
- `Каталог (catalog.html)` --CONTAINS--> `Сухофрукты / Dried Fruits`  [AMBIGUOUS]
  catalog.html → index.html
- `Каталог (catalog.html)` --CONTAINS--> `Орехи / Nuts`  [AMBIGUOUS]
  catalog.html → index.html

## Import Cycles
- None detected.

## Communities (37 total, 21 thin omitted)

### Community 0 - "Фото товаров (каталог)"
Cohesion: 0.03
Nodes (59): products, almond-inshell, almond, almond-unpeeled, apricot, apricot-kernels, candied-fruit, cashew (+51 more)

### Community 1 - "PDF-каталог: разделы и сертификаты"
Cohesion: 0.08
Nodes (29): Сушеные абрикосы / Dried Apricots, Орехи / Nuts (PDF section - pistachio, cashew, hazelnut, macadamia), Чернослив, унаби / Prunes, Jujube, Семена / Seeds (PDF section), GlobalG.A.P., HACCP, HALAL, ISO 22000 (+21 more)

### Community 2 - "Бренд SAMBOX и категории сайта"
Cohesion: 0.16
Nodes (24): SAMBOX (упаковочная фабрика), Сухофрукты / Dried Fruits, Овощи и фрукты / Vegetables & Fruits, Семена и бобовые / Seeds & Legumes, Орехи / Nuts, ISO сертификат (упомянут на сайте), Mir Orexov Samarkand, Компания полного цикла (от поля до контейнера) (+16 more)

### Community 3 - "Свежие фрукты и овощи (PDF)"
Cohesion: 0.14
Nodes (14): Свежие фрукты / Fresh Fruits, Apple (яблоко), Apricot (абрикос), Cherry (черешня), Cucumber (огурец), Figs (инжир, fresh), Grape (виноград), Lemon (лимон) (+6 more)

### Community 4 - "Миндаль и грецкий орех"
Cohesion: 0.19
Nodes (9): Миндаль / Almond, Грецкий орех / Walnuts (PDF section), Almonds (in shell), Almonds Kernel, Apricot Kernels, Walnut Kernel Pieces (четвертинка), Walnuts Chopped, Walnuts (in shell) (+1 more)

### Community 5 - "Изюм (сорта)"
Cohesion: 0.25
Nodes (8): Изюм / Raisins, Black Raisins (Gibrid), Black Raisins (Gigant), Golden Raisins (Gibrid), Golden Raisins (Kalifar), Red Shigani Raisins, Red Tompson Raisins, Sultana Raisins

### Community 6 - "Иконки сертификатов"
Cohesion: 0.29
Nodes (7): certs, globalgap, haccp, halal, halal, iso22000, organic

### Community 7 - "Сухофрукты Китай"
Cohesion: 0.29
Nodes (7): Сухофрукты / Dried Fruits (China), Dried Banana (суш. банан), Dried Candied Fruit (цукаты), Dried Kiwi (суш. киви), Dried Mango (суш. манго), Dried Peach (суш. персик), Dried Pineapple (суш. ананас)

### Community 8 - "catalog.js (рендер каталога)"
Cohesion: 0.38
Nodes (3): nodeAtPath(), pathFromHash(), render()

### Community 9 - "Бобовые"
Cohesion: 0.33
Nodes (6): Бобовые / Legumes (PDF section), Beans (фасоль, black-eyed), Beans (фасоль, white), Chickpea Roasted (горох жареный), Mung Bean (маш), Red Beans (красный фасоль)

### Community 10 - "Картинки категорий (catalog/)"
Cohesion: 0.40
Nodes (5): catalog, бобовые, орехи, сухофрукты, фрукты

### Community 11 - "Арахис"
Cohesion: 0.40
Nodes (5): Арахис / Peanuts, Blanched Peanuts, Chopped Peanuts, Peanuts in Shell, Peeled Peanuts

## Ambiguous Edges - Review These
- `Каталог (catalog.html)` → `Сухофрукты / Dried Fruits`  [AMBIGUOUS]
  catalog.html · relation: CONTAINS
- `Каталог (catalog.html)` → `Овощи и фрукты / Vegetables & Fruits`  [AMBIGUOUS]
  catalog.html · relation: CONTAINS
- `Каталог (catalog.html)` → `Семена и бобовые / Seeds & Legumes`  [AMBIGUOUS]
  catalog.html · relation: CONTAINS
- `Каталог (catalog.html)` → `Орехи / Nuts`  [AMBIGUOUS]
  catalog.html · relation: CONTAINS
- `Mir Orexov Samarkand` → `ISO сертификат (упомянут на сайте)`  [AMBIGUOUS]
  index.html · relation: OFFERS
- `ООО "Raise Production business"` → `SAMBOX (упаковочная фабрика)`  [AMBIGUOUS]
  каталог PDF .pdf · relation: MENTIONS

## Knowledge Gaps
- **150 isolated node(s):** `Instagram @mirorexov`, `Email mir_orexov@mail.ru`, `Phone +998 91 543 55 55`, `Phone +998 91 708 00 00`, `Website mirorexov.com` (+145 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Каталог (catalog.html)` and `Сухофрукты / Dried Fruits`?**
  _Edge tagged AMBIGUOUS (relation: CONTAINS) - confidence is low._
- **What is the exact relationship between `Каталог (catalog.html)` and `Овощи и фрукты / Vegetables & Fruits`?**
  _Edge tagged AMBIGUOUS (relation: CONTAINS) - confidence is low._
- **What is the exact relationship between `Каталог (catalog.html)` and `Семена и бобовые / Seeds & Legumes`?**
  _Edge tagged AMBIGUOUS (relation: CONTAINS) - confidence is low._
- **What is the exact relationship between `Каталог (catalog.html)` and `Орехи / Nuts`?**
  _Edge tagged AMBIGUOUS (relation: CONTAINS) - confidence is low._
- **What is the exact relationship between `Mir Orexov Samarkand` and `ISO сертификат (упомянут на сайте)`?**
  _Edge tagged AMBIGUOUS (relation: OFFERS) - confidence is low._
- **What is the exact relationship between `ООО "Raise Production business"` and `SAMBOX (упаковочная фабрика)`?**
  _Edge tagged AMBIGUOUS (relation: MENTIONS) - confidence is low._
- **Why does `Каталог PDF (продуктовый каталог)` connect `PDF-каталог: разделы и сертификаты` to `Бренд SAMBOX и категории сайта`, `Свежие фрукты и овощи (PDF)`, `Миндаль и грецкий орех`, `Изюм (сорта)`, `Сухофрукты Китай`, `Бобовые`, `Арахис`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._