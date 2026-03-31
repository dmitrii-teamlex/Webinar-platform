# Development Streams

Два разработчика работают параллельно в одном репо. Разделение — по типам артефактов. Каждый владеет полным вертикалом своих артефактов: генератор, промпт, Zod-схема контента, UI-страница, editor-view. Общая инфраструктура (scaffold, DB, ingestion, approval flow, editor-каркас) делится по принципу «кто ближе к своему скоупу».

---

## Phase 0 — Shared Foundation

Делается один раз перед стартом стримов. Оба ревьюят. Мерджится в `main` до начала фичевой работы.

| Что | Файлы | Зачем |
|-----|-------|-------|
| Project init | `package.json`, `tsconfig.json`, `next.config.ts`, `drizzle.config.ts`, `tailwind.config.ts`, `.env.example`, `.gitignore`, `.eslintrc.cjs` | Вся инфра в одном коммите |
| DB schema целиком | `src/lib/db/schema/*.ts` | Оба стрима читают и пишут в эти таблицы — формы согласовать заранее |
| Типы + Zod-схемы | `src/types/webinar.ts`, `src/types/artifact.ts`, `src/types/events.ts` | Контракты, против которых оба пишут код |
| Inngest events | `src/lib/inngest/events.ts`, `src/lib/inngest/client.ts` | Все имена событий + типы payload |
| AI gateway | `src/lib/ai/gateway.ts` | Обёртка над Anthropic/OpenAI. Оба стрима вызывают |
| Context builder interface | `src/lib/ai/context-builder.ts` | Только интерфейс. Dev 2 имплементирует, Dev 1 мокает до мерджа |
| Supabase clients | `src/lib/supabase/client.ts`, `server.ts`, `storage.ts` | Браузерный + серверный клиент, storage-хелперы |
| App shell | Root layout, dashboard layout с sidebar, Inngest serve endpoint | Каркас роутинга |
| Sidebar nav config | `src/config/navigation.ts` | Массив — каждый добавляет свои пункты в конец |
| Общие UI-компоненты | `src/components/ui/` (shadcn), `src/components/features/editor/` (каркас inline-editor) | Переиспользуемые примитивы и скелет редактора контента |
| Fan-out оркестрация | `src/lib/inngest/functions/artifact-generation.ts` | Общий dispatcher, запускающий генераторы параллельно после approval |
| Prompt registry | `src/lib/ai/prompt-registry.ts`, `src/app/api/settings/prompts/` | CRUD промптов — оба стрима используют для своих генераторов |
| Artifact API (общий) | `src/app/api/artifacts/[id]/`, `/regenerate/`, `/versions/`, `/edit/` | Общие роуты для всех типов артефактов (CRUD, regeneration, versioning) |

---

## Developer 1 — Presentation + Landing Page + Thank-You Page

### Артефакты в скоупе

| Артефакт | Что генерируется |
|----------|-----------------|
| **Presentation Brief** | ~90 слайдов: intro (~10), content (~50), sales (~30). Структурированный brief с текстом, заметками спикера, визуальными указаниями |
| **Landing Page Brief** | Headline, subheadline, bullet points, social proof, CTA, speaker bio — на основе шаблона структуры |
| **Thank-You Page** | Текст подтверждения регистрации, next steps, доставка подарка |

### Генераторы (Inngest functions)

```
src/lib/inngest/functions/generators/
  presentation.ts                      # Генерация ~90 слайдов (intro/content/sales)
  landing-page.ts                      # Генерация brief лендинга
  thank-you.ts                         # Генерация thank-you page
```

### Zod-схемы контента (определяются в Phase 0, но Dev 1 — owner формы)

```
# в src/types/artifact.ts

PresentationContentSchema             # { intro: Slide[], content: Slide[], sales: Slide[] }
LandingPageContentSchema              # { headline, subheadline, bullets, socialProof, cta, speakerBio }
ThankYouContentSchema                 # { headline, body, nextSteps, giftDeliveryMessage }
```

### UI-страницы

```
src/app/(dashboard)/webinars/[id]/presentation/page.tsx  # Viewer презентации (три секции)
```

Landing page и thank-you page рендерятся через общий `artifacts/[artifactId]/page.tsx` editor — отдельных страниц не нужно.

### Промпты

Определяет дефолтные system/user prompt для `presentation`, `landing_page`, `thank_you` в seed-данных prompt registry.

---

## Developer 2 — Attendance Chain + Gifts + Ingestion + Theses

### Артефакты в скоупе

| Артефакт | Что генерируется |
|----------|-----------------|
| **Attendance Chain** | Полная цепочка сообщений: подтверждение регистрации (email + messenger), прогрев, день вебинара, во время вебинара, после вебинара |
| **Gift Ideas + Gift Copy** | Идеи подарков, полный текст каждого подарка, визуальное ТЗ для дизайнера |

### Генераторы (Inngest functions)

```
src/lib/inngest/functions/generators/
  attendance-chain.ts                  # Генерация всей цепочки по стадиям
  gift.ts                             # Генерация идей подарков + текст + visual brief
```

### Zod-схемы контента (определяются в Phase 0, но Dev 2 — owner формы)

```
# в src/types/artifact.ts

AttendanceChainContentSchema          # { stages: [{ type, timing, messages: [{ channel, subject?, body }] }] }
GiftContentSchema                     # { gifts: [{ title, concept, fullCopy, visualBrief }] }
```

### Промпты

Определяет дефолтные system/user prompt для `attendance_chain`, `gift` в seed-данных prompt registry.

### Дополнительный скоуп: Ingestion + Theses + Knowledge Base

Помимо своих артефактов, Developer 2 берёт на себя входной pipeline:

**Pages:**
```
src/app/(dashboard)/webinars/page.tsx                    # Список вебинаров
src/app/(dashboard)/webinars/new/page.tsx                # Wizard создания
src/app/(dashboard)/webinars/[id]/page.tsx               # Детальная страница вебинара
src/app/(dashboard)/webinars/[id]/theses/page.tsx        # Ревью тезисов + approve
src/app/(dashboard)/knowledge-base/page.tsx              # Управление knowledge base
```

**Server Logic:**
```
src/lib/ingestion/
  url-parser.ts                        # Perplexity API — парсинг URL
  file-parsers.ts                      # Парсеры PDF, CSV, XLSX, TXT
  chunking.ts                          # Разбивка текста на чанки
  embeddings.ts                        # Генерация эмбеддингов + запись в pgvector

src/lib/ai/context-builder.ts          # RAG — similarity search по pgvector (имплементация)

src/lib/inngest/functions/
  ingestion.ts                         # Workflow ingestion источников
  thesis-generation.ts                 # Workflow генерации тезисов
```

**API Routes:**
```
src/app/api/webinars/                  # CRUD вебинаров
src/app/api/webinars/[id]/sources/     # Добавление и управление источниками
src/app/api/webinars/[id]/theses/      # CRUD тезисов + approve action
src/app/api/knowledge-base/            # Upload файлов + management
```

**DB Tables (primary ownership):** `webinars`, `sources`, `theses`, `embeddings`, `knowledge_base_files`

**Output:** файрит Inngest-событие `webinar/approved` → запускает fan-out генерации всех артефактов (и своих, и Dev 1).

---

## Сводная таблица ownership

| Область | Developer 1 | Developer 2 | Shared (Phase 0) |
|---------|:-----------:|:-----------:|:-----------------:|
| **Scaffold, config, DB schema** | | | ✓ |
| **App shell, layouts, sidebar** | | | ✓ |
| **AI gateway** | | | ✓ |
| **Fan-out orchestration** | | | ✓ |
| **Prompt registry + settings UI** | | | ✓ |
| **Artifact API (CRUD, versions, edit)** | | | ✓ |
| **Inline editor каркас** | | | ✓ |
| Wizard создания вебинара | | ✓ | |
| Ingestion (URL + файлы) | | ✓ | |
| Chunking + embeddings + RAG | | ✓ | |
| Thesis generation + approval | | ✓ | |
| Knowledge base | | ✓ | |
| **Generator: Presentation** | ✓ | | |
| **Generator: Landing Page** | ✓ | | |
| **Generator: Thank-You** | ✓ | | |
| **Presentation viewer page** | ✓ | | |
| **Generator: Attendance Chain** | | ✓ | |
| **Generator: Gift** | | ✓ | |

---

## Точки пересечения

| Шов | Как работает | Риск конфликта |
|-----|-------------|----------------|
| **`webinar/approved` event** | Dev 2 файрит из thesis approval. Fan-out (shared) запускает все генераторы. Каждый генератор — изолированный файл. | Нет |
| **Fan-out dispatcher** | Shared в Phase 0. Список генераторов — массив, каждый добавляет свои в конец. | Тривиальный append |
| **Artifact Zod-схемы** | Discriminated union в `src/types/artifact.ts`. Каждый добавляет свои типы. Финальный union собирается в Phase 0, расширяется через append. | Тривиальный — каждый добавляет свой case |
| **Artifact detail/editor page** | Общий editor рендерит по `artifactType`. Dev 1 добавляет рендер для presentation/landing/thank-you. Dev 2 — для chain/gift. Каждый — в отдельном файле-компоненте. | Нет — разные файлы, switch по типу |
| **Prompt seed data** | Каждый добавляет свои дефолтные промпты в seed-скрипт. | Тривиальный append |
| **Sidebar navigation** | Оба добавляют пункты в `src/config/navigation.ts`. Каждый — в конец. | Тривиальный auto-merge |
| **Inngest serve endpoint** | Оба добавляют функции в массив. Каждый — в конец. | Тривиальный auto-merge |

---

## Branch Strategy

```
main (protected, PR review)
  │
  ├── foundation/scaffold              ← Phase 0, мерджится первым
  │
  ├── dev1/presentation-generator
  ├── dev1/landing-page-generator
  ├── dev1/thank-you-generator
  ├── dev1/presentation-viewer
  │
  ├── dev2/wizard-ingestion
  ├── dev2/thesis-generation
  ├── dev2/attendance-chain-generator
  ├── dev2/gift-generator
  ├── dev2/knowledge-base
  │
  └── integration/full-flow-test       ← Финальный PR
```

**Правила:**
1. Phase 0 мерджится в `main` до любой фичевой работы.
2. Ветки с префиксами `dev1/` и `dev2/`, живут максимум 2-3 дня.
3. Rebase на `main` каждое утро.
4. Никогда не бранчеваться от ветки другого разработчика — только от `main`.
5. Маленькие PR, частый мердж.

---

## Timeline

| Дни | Developer 1 (Presentation + LP + TY) | Developer 2 (Chain + Gifts + Ingestion) |
|-----|---------------------------------------|----------------------------------------|
| 1-2 | Phase 0 вместе | Phase 0 вместе |
| 3-6 | Генератор презентации (самый сложный — ~90 слайдов, 3 секции) | Wizard создания + ingestion pipeline (Perplexity, парсеры, chunking, embeddings) |
| 7-10 | Генератор лендинга + генератор thank-you + presentation viewer | Thesis generation + approval UI + knowledge base |
| 11-14 | Editor-компоненты для presentation/landing/thank-you + дефолтные промпты | Генераторы attendance chain + gift + editor-компоненты для chain/gift + дефолтные промпты |
| 15-16 | Интеграция: full flow test, polish | Интеграция: full flow test, polish |

### Почему Dev 1 начинает с презентации

Презентация — самый сложный генератор (~90 слайдов, три секции с разной логикой). Пока Dev 2 строит входной pipeline (wizard → ingestion → theses → approval), Dev 1 может работать полностью автономно: сидить тестовый вебинар с тезисами в БД и отлаживать генерацию презентации без зависимости от входного pipeline.

### Почему Dev 2 берёт ingestion + theses

Входной pipeline (ingestion, RAG, thesis generation, approval) — это единый поток данных. Разделять его между двумя людьми создаёт больше швов, чем разделение по типам артефактов. Dev 2 строит весь путь от «пользователь ввёл тему» до «тезисы утверждены», а затем переключается на свои генераторы (attendance chain, gifts), которые уже могут работать на реальных данных из его же pipeline..

