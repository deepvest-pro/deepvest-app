# Crowdfunding Feature Implementation Checklist

## Общая информация

**Цель**: Интеграция этапного краудфандинга в платформу DeepVest  
**Статус**: Планирование  
**Приоритет**: Высокий

## Фазы реализации

### 🗄️ Phase 1: Database Schema & Core Infrastructure

**Описание**: Создание базовой инфраструктуры БД и типов

#### 1.1 Database Tables

- [ ] **Создать таблицу `crowdfunding_campaigns`**

  - id (UUID, PK)
  - project_id (UUID, FK to projects, UNIQUE)
  - title, description (TEXT)
  - total_equity_offered_percent (NUMERIC(5,2))
  - min_investment_usd (NUMERIC(10,2), DEFAULT 10.00)
  - status (ENUM: 'draft', 'active', 'successful', 'partially_successful', 'failed', 'cancelled')
  - contract_address (TEXT, NULLABLE) // TODO [CF]: blockchain integration
  - moderator_id (UUID, NULLABLE, FK to auth.users)
  - max_milestones_allowed (INTEGER, DEFAULT 3)
  - created_at, updated_at (TIMESTAMPS)

- [ ] **Создать таблицу `campaign_milestones`**

  - id (UUID, PK)
  - campaign_id (UUID, FK to crowdfunding_campaigns)
  - order_index (INTEGER)
  - name, description (TEXT)
  - min_target_amount_usd, max_target_amount_usd (NUMERIC(12,2))
  - current_amount_usd (NUMERIC(12,2), DEFAULT 0)
  - equity_for_milestone_percent (NUMERIC(5,2))
  - early_bird_multiplier (NUMERIC(3,2), DEFAULT 1.0)
  - early_bird_threshold_percent (NUMERIC(5,2), DEFAULT 30.00)
  - deadline, expected_completion_date (TIMESTAMP)
  - status (ENUM: 'pending', 'active', 'funded', 'failed', 'in_progress', 'review', 'completed', 'cancelled')
  - blockchain_escrow_address (TEXT, NULLABLE) // TODO [CF]: blockchain integration
  - tx_id_funding_release (TEXT, NULLABLE) // TODO [CF]: blockchain integration
  - completed_at, cancelled_at (TIMESTAMP, NULLABLE)
  - cancellation_reason, moderator_notes (TEXT, NULLABLE)
  - created_at, updated_at (TIMESTAMPS)

- [ ] **Создать таблицу `milestone_investments`**

  - id (UUID, PK)
  - campaign_milestone_id (UUID, FK to campaign_milestones)
  - user_id (UUID, FK to auth.users)
  - amount_usd (NUMERIC(12,2))
  - amount_stablecoin (NUMERIC(18,6)) // TODO [CF]: actual blockchain values
  - stablecoin_type (TEXT, DEFAULT 'USDC')
  - calculated_equity_percentage (NUMERIC(10,8))
  - equity_tokens_representation (NUMERIC(18,8), NULLABLE)
  - transaction_hash (TEXT) // TODO [CF]: mock for now
  - status (ENUM: 'pending_payment', 'confirmed', 'failed_payment', 'refund_requested', 'refunded')
  - is_early_bird (BOOLEAN, DEFAULT FALSE)
  - is_public (BOOLEAN, DEFAULT TRUE)
  - public_alias (TEXT, NULLABLE)
  - invested_at (TIMESTAMP, DEFAULT NOW())
  - refund_transaction_hash (TEXT, NULLABLE) // TODO [CF]: blockchain integration
  - created_at, updated_at (TIMESTAMPS)

- [ ] **Создать таблицу `milestone_proofs`**

  - id (UUID, PK)
  - campaign_milestone_id (UUID, FK to campaign_milestones)
  - uploaded_by_user_id (UUID, FK to auth.users)
  - proof_type (ENUM: 'file', 'link', 'text_description')
  - content_url (TEXT, NULLABLE)
  - description (TEXT, NULLABLE)
  - original_file_name, mime_type (TEXT, NULLABLE)
  - created_at (TIMESTAMP, DEFAULT NOW())

- [ ] **Создать таблицу `milestone_verification_requests`**

  - id (UUID, PK)
  - campaign_milestone_id (UUID, FK to campaign_milestones, UNIQUE)
  - requested_by_user_id (UUID, FK to auth.users)
  - status (ENUM: 'pending', 'approved', 'rejected', 'more_info_requested')
  - moderator_id (UUID, NULLABLE, FK to auth.users)
  - moderator_comment (TEXT, NULLABLE)
  - requested_at (TIMESTAMP, DEFAULT NOW())
  - expires_at (TIMESTAMP, NULLABLE)
  - updated_at (TIMESTAMP)

- [ ] **Создать таблицу `platform_fees_collected`**
  - id (UUID, PK)
  - campaign_milestone_id (UUID, FK to campaign_milestones)
  - fee_type (ENUM: 'equity_fee', 'funds_transfer_fee')
  - amount_collected_percent (NUMERIC(5,2), NULLABLE)
  - amount_collected_usd (NUMERIC(12,2), NULLABLE)
  - transaction_hash_related (TEXT, NULLABLE) // TODO [CF]: blockchain integration
  - collected_at (TIMESTAMP, DEFAULT NOW())

#### 1.2 Database Policies & Security

- [ ] **Настроить RLS policies для crowdfunding_campaigns**

  - [ ] Public campaigns viewable by everyone
  - [ ] Campaign owners can view/edit their campaigns
  - [ ] Only owners can create campaigns

- [ ] **Настроить RLS policies для campaign_milestones**

  - [ ] Public milestones viewable by everyone (if campaign is public)
  - [ ] Campaign team can view all milestones
  - [ ] Only editors/admins/owners can modify milestones

- [ ] **Настроить RLS policies для milestone_investments**

  - [ ] Investors can view their own investments
  - [ ] Campaign team can view aggregated investment data
  - [ ] Public investments viewable by everyone (if not anonymous)

- [ ] **Настроить RLS policies для остальных таблиц**
  - [ ] milestone_proofs: только команда проекта
  - [ ] milestone_verification_requests: команда + модераторы
  - [ ] platform_fees_collected: только система + администраторы

#### 1.3 Database Functions & Repository Classes

- [ ] **Создать CrowdfundingRepository extends BaseRepository**

  - [ ] findByProjectId() с типизацией
  - [ ] createCampaign() с валидацией
  - [ ] updateCampaignStatus() с проверками
  - [ ] Использование handleQuery() для error handling

- [ ] **Создать MilestoneRepository extends BaseRepository**

  - [ ] findByCampaignId() с сортировкой по order_index
  - [ ] createMilestone() с валидацией последовательности
  - [ ] updateMilestoneStatus() с проверками
  - [ ] Типизированные запросы PostgrestResponse<T>

- [ ] **Создать InvestmentRepository extends BaseRepository**

  - [ ] findByMilestoneId() с агрегацией
  - [ ] createInvestment() с расчетом equity
  - [ ] calculateEquityShare() helper метод
  - [ ] Типизированные responses

- [ ] **Создать RPC функцию `calculate_investor_equity_share`**

  - [ ] Расчет доли инвестора по формуле из ТЗ
  - [ ] Учет early_bird_multiplier
  - [ ] Возврат calculated_equity_percentage
  - [ ] Input validation через database constraints

- [ ] **Создать RPC функцию `get_campaign_statistics`**

  - [ ] Агрегация данных по кампании
  - [ ] Статистика по этапам
  - [ ] Общий прогресс
  - [ ] Performance optimization с правильными indexes

- [ ] **Создать функцию `check_milestone_funding_completion`**

  - [ ] Проверка достижения min/max target
  - [ ] Автоматическое изменение статуса на 'funded'
  - [ ] Триггер для дальнейших действий

- [ ] **Создать функцию `activate_next_milestone`**

  - [ ] Проверка завершения предыдущего этапа
  - [ ] Активация следующего этапа в порядке order_index
  - [ ] TODO [CF]: Deploy smart contract trigger

- [ ] **Создать функцию `calculate_early_bird_threshold`**

  - [ ] Определение суммы для early bird (30% от max_target)
  - [ ] Проверка превышения порога
  - [ ] Установка is_early_bird флага

- [ ] **Создать функцию `collect_platform_fees`**
  - [ ] Расчет 0.1% от equity_for_milestone_percent
  - [ ] Расчет 1% от current_amount_usd
  - [ ] Запись в platform_fees_collected

### 🎯 Phase 2: TypeScript Types & Validation

**Описание**: Создание типов и схем валидации

#### 2.1 Core Types

- [ ] **Создать `types/crowdfunding.ts`**

  - [ ] `CrowdfundingCampaign` interface
  - [ ] `CampaignMilestone` interface
  - [ ] `MilestoneInvestment` interface
  - [ ] `MilestoneProof` interface
  - [ ] `MilestoneVerificationRequest` interface
  - [ ] `PlatformFeesCollected` interface
  - [ ] Campaign и Milestone status enums
  - [ ] Investment status enum

- [ ] **Создать `types/crowdfunding-forms.ts`**
  - [ ] `CreateCampaignForm` type
  - [ ] `CreateMilestoneForm` type
  - [ ] `InvestmentForm` type
  - [ ] `MilestoneProofForm` type

#### 2.2 Validation Schemas

- [ ] **Создать `lib/validations/crowdfunding.ts`**
  - [ ] `createCampaignSchema` - валидация создания кампании
  - [ ] `createMilestoneSchema` - валидация создания этапа
  - [ ] `investmentSchema` - валидация инвестиции
  - [ ] `milestoneProofSchema` - валидация доказательств
  - [ ] Общие ограничения (min/max суммы, проценты и т.д.)

### 🔌 Phase 3: API Layer

**Описание**: Создание API endpoints для краудфандинга

#### 3.1 Campaign Management APIs

- [ ] **`POST /api/projects/[id]/crowdfunding`** - создание кампании

  - [ ] Валидация прав доступа (только owner)
  - [ ] Валидация данных через схему
  - [ ] Создание кампании в БД
  - [ ] Возврат created campaign

- [ ] **`GET /api/projects/[id]/crowdfunding`** - получение кампании

  - [ ] Проверка прав доступа (public или team member)
  - [ ] Возврат кампании со всеми этапами
  - [ ] Агрегированная статистика

- [ ] **`PUT /api/projects/[id]/crowdfunding`** - обновление кампании

  - [ ] Валидация прав доступа (только owner)
  - [ ] Обновление разрешенных полей
  - [ ] Логирование изменений

- [ ] **`DELETE /api/projects/[id]/crowdfunding`** - отмена кампании
  - [ ] Валидация прав доступа (только owner + moderator)
  - [ ] Проверка возможности отмены (нет активных этапов)
  - [ ] Soft delete с причиной

#### 3.2 Milestone Management APIs

- [ ] **`POST /api/crowdfunding/campaigns/[id]/milestones`** - создание этапа

  - [ ] Использование createAPIHandler с requireAuth
  - [ ] Валидация данных через ValidationSchemas
  - [ ] Проверка разрешений через requireProjectPermission
  - [ ] Валидация последовательности этапов
  - [ ] Проверка суммы equity_for_milestone_percent

- [ ] **`PUT /api/crowdfunding/milestones/[id]`** - обновление этапа

  - [ ] Использование createAPIHandler с requireAuth
  - [ ] Валидация данных через ValidationSchemas
  - [ ] Проверка разрешений через requireProjectPermission
  - [ ] Проверка возможности изменения (статус)
  - [ ] Обновление разрешенных полей

- [ ] **`POST /api/crowdfunding/milestones/[id]/activate`** - активация этапа

  - [ ] Использование createAPIHandler с requireAuth
  - [ ] Проверка разрешений через requireProjectPermission
  - [ ] Проверка завершения предыдущего этапа
  - [ ] Смена статуса на 'active'
  - [ ] TODO [CF]: Deploy smart contract

- [ ] **`POST /api/crowdfunding/milestones/[id]/complete`** - завершение работ

  - [ ] Использование createAPIHandler с requireAuth
  - [ ] Проверка разрешений через requireProjectPermission (только команда)
  - [ ] Смена статуса на 'review'
  - [ ] Уведомление модератора

- [ ] **`POST /api/crowdfunding/milestones/[id]/auto-complete-funding`** - автозавершение сбора
  - [ ] Использование createAPIHandler с requireAuth
  - [ ] Проверка достижения max_target_amount_usd
  - [ ] Автоматическая смена статуса на 'funded'
  - [ ] Триггер для начала работ

#### 3.3 Investment APIs

- [ ] **`POST /api/crowdfunding/milestones/[id]/invest`** - инвестирование

  - [ ] Использование createAPIHandler с requireAuth
  - [ ] Валидация данных через ValidationSchemas.investment
  - [ ] Проверка лимитов этапа
  - [ ] Расчет early bird бонуса
  - [ ] TODO [CF]: Smart contract interaction
  - [ ] Расчет equity доли через calculate_investor_equity_share
  - [ ] Создание записи инвестиции через Repository pattern
  - [ ] Проверка автозавершения этапа

- [ ] **`GET /api/crowdfunding/milestones/[id]/investments`** - список инвестиций

  - [ ] Использование createAPIHandler с requireAuth
  - [ ] Проверка разрешений через requireProjectPermission
  - [ ] Фильтрация по публичности
  - [ ] Агрегированная статистика
  - [ ] Pagination поддержка

- [ ] **`POST /api/crowdfunding/investments/[id]/refund`** - возврат средств
  - [ ] Использование createAPIHandler с requireAuth
  - [ ] Валидация права на возврат (owner инвестиции)
  - [ ] Проверка статуса этапа
  - [ ] TODO [CF]: Smart contract refund call

#### 3.4 Moderation APIs

- [ ] **`GET /api/admin/crowdfunding/verification-requests`** - заявки на проверку

  - [ ] Только для модераторов
  - [ ] Фильтрация по статусу
  - [ ] SLA индикаторы (24 часа)
  - [ ] Pagination

- [ ] **`POST /api/admin/crowdfunding/milestones/[id]/verify`** - модерация этапа
  - [ ] Только для модераторов
  - [ ] Approve/reject с комментарием
  - [ ] Расчет и удержание комиссий платформы (0.1% equity + 1% funds)
  - [ ] TODO [CF]: Release funds if approved
  - [ ] Автоматическая активация следующего этапа

#### 3.5 Public APIs

- [ ] **`GET /api/crowdfunding/campaigns`** - публичные кампании

  - [ ] Только активные публичные кампании
  - [ ] Фильтрация и сортировка
  - [ ] Pagination

- [ ] **`GET /api/crowdfunding/campaigns/[id]`** - детали кампании
  - [ ] Публичная информация о кампании
  - [ ] Статистика инвестиций
  - [ ] Прогресс этапов

#### 3.6 Fee Management APIs

- [ ] **`GET /api/admin/crowdfunding/platform-fees`** - отчет по комиссиям
  - [ ] Только администраторы
  - [ ] Агрегация по кампаниям и этапам
  - [ ] Фильтрация по датам

### 🎨 Phase 4: UI Components

**Описание**: Создание переиспользуемых UI компонентов

#### 4.1 Core Crowdfunding Components

- [ ] **`components/crowdfunding/CampaignCard.tsx`**

  - [ ] Отображение базовой информации о кампании
  - [ ] Прогресс-бар общего сбора
  - [ ] Статус кампании
  - [ ] Ссылка на детали

- [ ] **`components/crowdfunding/MilestoneCard.tsx`**

  - [ ] Информация об этапе
  - [ ] Прогресс сбора (min/max)
  - [ ] Countdown до deadline
  - [ ] Кнопка инвестирования (если активен)
  - [ ] Early bird индикатор

- [ ] **`components/crowdfunding/ProgressBar.tsx`**

  - [ ] Визуализация прогресса сбора
  - [ ] Отображение min/max целей
  - [ ] Early bird зона (первые 30%)
  - [ ] Анимации и интерактивность

- [ ] **`components/crowdfunding/InvestorsList.tsx`**
  - [ ] Список инвесторов этапа
  - [ ] Поддержка анонимности (public_alias)
  - [ ] Early bird индикаторы
  - [ ] Информация о долях

#### 4.2 Form Components

- [ ] **`components/crowdfunding/forms/CreateCampaignForm.tsx`**

  - [ ] Форма создания кампании
  - [ ] Multi-step wizard
  - [ ] Валидация в реальном времени
  - [ ] Проверка суммы equity_for_milestone_percent

- [ ] **`components/crowdfunding/forms/CreateMilestoneForm.tsx`**

  - [ ] Форма создания этапа
  - [ ] Динамическая валидация сумм
  - [ ] Early bird настройки
  - [ ] Preview режим

- [ ] **`components/crowdfunding/forms/InvestmentForm.tsx`**

  - [ ] Форма инвестирования
  - [ ] Расчет equity в реальном времени
  - [ ] Early bird индикатор и расчет бонуса
  - [ ] TODO [CF]: Wallet integration
  - [ ] Confirmation dialog

- [ ] **`components/crowdfunding/forms/ProofUploadForm.tsx`**
  - [ ] Загрузка доказательств выполнения
  - [ ] Поддержка файлов и ссылок
  - [ ] Preview загруженного контента
  - [ ] Multiple file upload

#### 4.3 Dashboard Components

- [ ] **`components/crowdfunding/CampaignDashboard.tsx`**

  - [ ] Общий дашборд кампании для создателя
  - [ ] Статистика по этапам
  - [ ] Управление этапами
  - [ ] Отчет по комиссиям

- [ ] **`components/crowdfunding/MilestoneDashboard.tsx`**

  - [ ] Детальный дашборд этапа
  - [ ] Список инвесторов
  - [ ] Early bird статистика
  - [ ] Управление доказательствами

- [ ] **`components/crowdfunding/InvestorDashboard.tsx`**
  - [ ] Дашборд для инвестора
  - [ ] Его инвестиции и доли
  - [ ] Early bird статус
  - [ ] Возможности возврата

#### 4.4 Moderation Components

- [ ] **`components/crowdfunding/admin/ModerationQueue.tsx`**
  - [ ] Очередь заявок на проверку
  - [ ] SLA индикаторы (24 часа)
  - [ ] Фильтры и сортировка
  - [ ] Bulk operations

### 📱 Phase 5: Pages & Routing

**Описание**: Создание страниц и маршрутизации

#### 5.1 Public Pages

- [ ] **`app/crowdfunding/page.tsx`** - список всех кампаний

  - [ ] Фильтрация и поиск
  - [ ] Категории и сортировка
  - [ ] Early bird кампании
  - [ ] Responsive grid layout

- [ ] **`app/crowdfunding/[campaignId]/page.tsx`** - детали кампании
  - [ ] Полная информация о кампании
  - [ ] Список этапов с прогрессом
  - [ ] Early bird opportunities
  - [ ] Возможность инвестирования
  - [ ] История и обновления

#### 5.2 Project Integration Pages

- [ ] **`app/projects/[id]/crowdfunding/page.tsx`** - кампания проекта

  - [ ] Интеграция с существующей страницей проекта
  - [ ] Переключение между разделами
  - [ ] Управление кампанией (для владельцев)

- [ ] **`app/projects/[id]/crowdfunding/create/page.tsx`** - создание кампании

  - [ ] Wizard создания кампании
  - [ ] Preview режим
  - [ ] Сохранение в draft

- [ ] **`app/projects/[id]/crowdfunding/manage/page.tsx`** - управление кампанией
  - [ ] Дашборд для владельца проекта
  - [ ] Управление этапами
  - [ ] Статистика и аналитика
  - [ ] Fee reporting

#### 5.3 Investment Pages

- [ ] **`app/crowdfunding/[campaignId]/milestones/[milestoneId]/invest/page.tsx`**

  - [ ] Страница инвестирования в этап
  - [ ] Подробная информация об условиях
  - [ ] Early bird статус и бонусы
  - [ ] TODO [CF]: Wallet connection interface

- [ ] **`app/profile/investments/page.tsx`** - инвестиции пользователя
  - [ ] Список всех инвестиций
  - [ ] Early bird статус
  - [ ] Статус и доходность
  - [ ] Возможности управления

#### 5.4 Admin Pages

- [ ] **`app/admin/crowdfunding/page.tsx`** - админ панель
  - [ ] Список всех кампаний
  - [ ] Модерация заявок с SLA индикаторами
  - [ ] Системная статистика
  - [ ] Fee management и reporting

### 🔄 Phase 6: State Management & Hooks

**Описание**: Создание хуков и управления состоянием

#### 6.1 React Query Hooks

- [ ] **`hooks/api/useCrowdfundingCampaigns.ts`**

  - [ ] `useCampaigns()` - список кампаний
  - [ ] `useCampaign(id)` - детали кампании
  - [ ] `useCreateCampaign()` - создание кампании
  - [ ] `useUpdateCampaign()` - обновление кампании

- [ ] **`hooks/api/useMilestones.ts`**

  - [ ] `useMilestones(campaignId)` - этапы кампании
  - [ ] `useMilestone(id)` - детали этапа
  - [ ] `useCreateMilestone()` - создание этапа
  - [ ] `useUpdateMilestone()` - обновление этапа
  - [ ] `useActivateMilestone()` - активация этапа

- [ ] **`hooks/api/useInvestments.ts`**
  - [ ] `useInvestments(milestoneId)` - инвестиции этапа
  - [ ] `useUserInvestments()` - инвестиции пользователя
  - [ ] `useCreateInvestment()` - создание инвестиции
  - [ ] `useRefundInvestment()` - возврат инвестиции

#### 6.2 Business Logic Hooks

- [ ] **`hooks/crowdfunding/useEquityCalculation.ts`**

  - [ ] Расчет equity доли в реальном времени
  - [ ] Учет early bird бонусов
  - [ ] Validation сумм

- [ ] **`hooks/crowdfunding/useMilestoneStatus.ts`**

  - [ ] Отслеживание статуса этапа
  - [ ] Auto-refresh при изменениях
  - [ ] Notifications о важных событиях

- [ ] **`hooks/crowdfunding/useInvestmentPermissions.ts`**

  - [ ] Проверка возможности инвестирования
  - [ ] Лимиты и ограничения
  - [ ] KYC статус (будущее)

- [ ] **`hooks/crowdfunding/useEarlyBirdStatus.ts`**
  - [ ] Отслеживание early bird периода
  - [ ] Расчет оставшейся суммы до порога
  - [ ] Индикаторы для UI

#### 6.3 Form Hooks

- [ ] **`hooks/forms/useCampaignForm.ts`**

  - [ ] Управление состоянием создания кампании
  - [ ] Multi-step validation
  - [ ] Auto-save в localStorage

- [ ] **`hooks/forms/useInvestmentForm.ts`**
  - [ ] Управление формой инвестирования
  - [ ] Real-time equity calculation
  - [ ] Early bird bonus calculation
  - [ ] TODO [CF]: Wallet integration

### 🎯 Phase 7: Integration & Testing

**Описание**: Интеграция с существующими системами

#### 7.1 Project System Integration

- [ ] **Интеграция с существующими проектами**

  - [ ] Добавление crowdfunding section в project layout
  - [ ] Навигация между разделами
  - [ ] Consistent styling

- [ ] **Права доступа**

  - [ ] Использование существующей project_permissions
  - [ ] Валидация ролей для crowdfunding операций
  - [ ] RLS policies alignment

- [ ] **Notifications система** (не делаем)
  - [ ] Уведомления о новых инвестициях
  - [ ] Early bird alerts
  - [ ] Alerts при достижении целей
  - [ ] Модерационные уведомления с SLA
  - [ ] Blockchain event notifications (см. cf-task-onchain.md Phase 4.1)

#### 7.2 Storage Integration

- [ ] **File storage для доказательств**

  - [ ] Использование Supabase Storage
  - [ ] Правильные bucket policies
  - [ ] Оптимизация размеров файлов
  - [ ] Multiple file types support

- [ ] **Backup и restore**
  - [ ] Backup стратегия для crowdfunding данных
  - [ ] Recovery procedures
  - [ ] Data integrity checks

#### 7.3 Fee Management Integration

- [ ] **Automated fee collection**
  - [ ] Автоматический расчет 0.1% от equity
  - [ ] Автоматический расчет 1% от средств
  - [ ] Интеграция с финансовой отчетностью

#### 7.4 Testing (не делаем)

- [ ] **Unit Tests**

  - [ ] Тесты для equity calculation функций
  - [ ] Early bird calculation tests
  - [ ] Validation schemas tests
  - [ ] Business logic hooks tests

- [ ] **Integration Tests**

  - [ ] API endpoints testing
  - [ ] Database operations testing
  - [ ] RLS policies testing
  - [ ] Fee calculation testing

- [ ] **E2E Tests**
  - [ ] Создание кампании flow
  - [ ] Инвестирование flow (regular + early bird)
  - [ ] Модерация flow
  - [ ] Automatic milestone activation flow

### 🚀 Phase 8: Documentation & Launch Preparation (не делаем)

**Описание**: Документация и подготовка к запуску

#### 8.1 Documentation

- [ ] **API Documentation**

  - [ ] OpenAPI spec для всех endpoints
  - [ ] Examples и use cases
  - [ ] Error codes описание
  - [ ] Fee structure documentation

- [ ] **Component Documentation**

  - [ ] Storybook stories для UI компонентов
  - [ ] Props documentation
  - [ ] Usage examples

- [ ] **Business Logic Documentation**

  - [ ] Early bird mechanics
  - [ ] Fee collection process
  - [ ] Milestone activation logic
  - [ ] SLA requirements

- [ ] **User Guide**
  - [ ] Гайд для создателей кампаний
  - [ ] Инструкции для инвесторов
  - [ ] Early bird explanation
  - [ ] FAQ секция

#### 8.2 Performance Optimization

- [ ] **Database Optimization**

  - [ ] Индексы для crowdfunding таблиц
  - [ ] Query optimization
  - [ ] Connection pooling

- [ ] **Frontend Optimization**
  - [ ] Code splitting для crowdfunding модулей
  - [ ] Image optimization
  - [ ] Lazy loading компонентов

#### 8.3 Security Review

- [ ] **Security Audit**

  - [ ] RLS policies проверка
  - [ ] Input validation review
  - [ ] Authentication flows
  - [ ] Fee calculation security

- [ ] **Penetration Testing**
  - [ ] API security testing
  - [ ] SQL injection проверки
  - [ ] XSS protection verification

## Blockchain Integration

### OnChain компоненты

Вся blockchain интеграция подробно описана в **cf-task-onchain.md**:

- **Smart Contracts**: MilestoneEscrow, EquityToken, CampaignFactory
- **Neon EVM Integration**: Development environment, deployment, testing
- **Wallet Integration**: MetaMask connection, USDC management, transaction handling
- **Event Monitoring**: Contract events synchronization с offchain database
- **Security & Auditing**: Access control, testing, formal verification

### Приоритеты для хакатона

- **[alfa]**: Базовый escrow контракт, mock USDC, console демонстрация
- **[beta]**: MetaMask интеграция, event monitoring, API integration
- **[omega]**: Полная equity токенизация, governance, security audit

**Примечание**: Для хакатона onchain часть будет максимально упрощена для демонстрации концепции. Offchain часть служит как architectural reference для будущей интеграции.

## Технические детали реализации

### Ключевая бизнес-логика

#### Early Bird Mechanism

**Описание**: Первые 30% от max_target_amount_usd получают бонус early_bird_multiplier

- **Расчет порога**: `early_bird_amount = max_target_amount_usd * (early_bird_threshold_percent / 100)`
- **Определение статуса**: `is_early_bird = current_milestone_total <= early_bird_amount`
- **Формула equity**: `equity = (investment / total_collected) * milestone_equity_percent * early_bird_multiplier`

#### Automatic Milestone Completion

**Описание**: Этапы автоматически завершаются при достижении max_target_amount_usd

- **Триггер**: После каждой инвестиции проверяется `current_amount_usd >= max_target_amount_usd`
- **Действие**: Статус меняется на 'funded', даже если deadline не наступил
- **Следствие**: Начинается этап работ

#### Sequential Milestone Activation

**Описание**: Следующий этап активируется только после завершения предыдущего

- **Условие**: `previous_milestone.status === 'completed' AND current_milestone.order_index === previous.order_index + 1`
- **Действие**: Статус меняется на 'active', деплоится smart contract (см. cf-task-onchain.md Phase 4.2)
- **Исключение**: Первый этап активируется при публикации кампании

#### Fee Collection (Platform Commissions)

**Описание**: Комиссии взимаются автоматически при успешном завершении этапа

- **Equity Fee**: `0.1% от equity_for_milestone_percent` (отходит платформе)
- **Funds Fee**: `1% от current_amount_usd` (удерживается из перевода стартапу)
- **Момент взимания**: При модерационном подтверждении завершения этапа
- **Запись**: Автоматическая запись в `platform_fees_collected`

#### Moderation SLA

**Описание**: 24 часа на проверку milestone_verification_request

- **Установка**: `expires_at = requested_at + INTERVAL '24 hours'`
- **Мониторинг**: UI индикаторы просроченных заявок
- **Эскалация**: Уведомления при приближении к дедлайну

### Приоритет реализации

1. **High Priority**: Database schema, core APIs, basic UI, fee calculation
2. **Medium Priority**: Advanced UI, dashboard, early bird mechanics, automatic completion
3. **Low Priority**: Admin features, advanced analytics, SLA monitoring

### Dependencies

- Требует завершения основной проектной структуры
- Зависит от user authentication системы
- Интегрируется с существующими project permissions
- Требует Supabase Storage для file uploads

---

## Status Tracking

### Completed ✅

_Пока пусто - начинаем реализацию_

### In Progress 🚧

_Будет обновляться по мере работы_

### Blocked ❌

_Будет заполняться при возникновении блокеров_

---

**Примечание**: Этот план может корректироваться в процессе реализации. Все изменения должны документироваться с обоснованием.
