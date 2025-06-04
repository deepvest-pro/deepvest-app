# DeepVest Crowdfunding: Milestone-Based Equity Investment Platform

## 🎯 Основная концепция

Интеграция milestone-based equity crowdfunding в экосистему DeepVest, где стартапы могут привлекать инвестиции поэтапно, а инвесторы получают справедливую долю equity в зависимости от стадии входа. Чем раньше стадия инвестирования, тем больший процент компании получает инвестор за каждый вложенный доллар.

## 🏗️ Техническая архитектура для хакатона

### Выбранные технологии спонсоров

1. **Neon EVM** (основной блокчейн)

   - Ethereum-совместимые смарт-контракты на Solana
   - Низкие комиссии, высокая скорость
   - Привычный Solidity для разработки

2. **Civic** (KYC/верификация)

   - Базовая верификация личности инвесторов
   - Готовые React компоненты
   - Минимальная интеграция для демо

3. **Xsolla** (опционально - если успеем)
   - Прием fiat платежей
   - Конвертация в USDC
   - Расширение аудитории инвесторов

### Базовая блокчейн архитектура

```solidity
contract MilestoneFunding {
    struct Milestone {
        uint256 targetAmount;     // Цель сбора в USDC
        uint256 currentAmount;    // Текущая сумма
        uint256 equityRate;       // Equity за 1 USDC (в базисных пунктах)
        uint256 deadline;         // Дедлайн milestone
        bool isCompleted;         // Выполнен ли milestone
        bool isActive;            // Активен ли сбор
        bool isCancelled;         // Отменен ли milestone (только модератором)
    }

    struct Investment {
        address investor;
        uint256 amount;
        uint256 milestoneIndex;
        uint256 equityTokens;     // Количество equity токенов
        bool isRefunded;          // Возвращены ли средства
    }

    uint256 public constant MINIMUM_INVESTMENT = 10 * 10**6; // $10 USDC
}
```

## 💰 Экономическая модель

### Комиссия DeepVest

- **0.1% от доли компании** в каждом успешном milestone
- **1% от переведенных средств** на любом этапе
- Комиссии взимаются автоматически при успешном завершении milestone

### Формула распределения equity

```typescript
interface MilestoneConfig {
  targetAmount: number; // Цель в USDC
  equityPercentage: number; // % компании за этот milestone
  deadline: Date; // Крайний срок
  earlyBirdMultiplier?: number; // Множитель для первых инвесторов
}

// Базовая формула
function calculateEquityShare(
  investedAmount: number,
  milestone: MilestoneConfig,
  currentRaised: number,
): number {
  const baseRate = milestone.equityPercentage / milestone.targetAmount;

  // Early bird bonus для первых 30% сбора (мотивирует ранние инвестиции)
  const earlyBirdBonus =
    currentRaised < milestone.targetAmount * 0.3 ? milestone.earlyBirdMultiplier || 1.2 : 1;

  return investedAmount * baseRate * earlyBirdBonus;
}

// Расчет комиссии DeepVest
function calculateDeepVestFee(milestone: MilestoneConfig, raisedAmount: number) {
  const equityFee = milestone.equityPercentage * 0.001; // 0.1% от доли
  const transferFee = raisedAmount * 0.01; // 1% от суммы
  return { equityFee, transferFee };
}
```

### Пример распределения

```typescript
const campaignExample = {
  totalEquityForSale: 25, // 25% компании
  milestones: [
    {
      name: 'Идея → Дизайн',
      targetAmount: 5000, // $5k
      equityPercentage: 10, // 10% компании
      deadline: '2024-06-01',
      earlyBirdMultiplier: 1.5, // +50% для первых инвесторов
    },
    {
      name: 'Дизайн → Прототип',
      targetAmount: 20000, // $20k
      equityPercentage: 10, // еще 10%
      deadline: '2024-08-01',
      earlyBirdMultiplier: 1.2,
    },
    {
      name: 'Прототип → MVP',
      targetAmount: 100000, // $100k
      equityPercentage: 5, // еще 5%
      deadline: '2024-12-01',
      earlyBirdMultiplier: 1.1,
    },
  ],
};

// При инвестировании $10 в первый milestone в начале кампании:
// Equity = 10 * (10/5000) * 1.5 = 0.03% компании
// Доступный барьер входа для непрофессиональных инвесторов
```

## 🔄 User Flow

### Для стартапов

1. **Создание кампании**

   - Определение milestones с целями и equity (максимум 5 milestones)
   - Загрузка roadmap и доказательств прогресса
   - Настройка параметров (early bird бонусы)
   - **Обязательство**: После запуска нельзя отменить milestones

2. **Управление кампанией**
   - Мониторинг прогресса каждого milestone
   - Загрузка доказательств выполнения целей (изображения, PDF, ссылки)
   - Запрос на подтверждение завершения milestone у модератора DeepVest

### Для инвесторов

1. **Обнаружение и анализ**

   - Просмотр кампаний в DeepVest (любой проект может создать кампанию)
   - Изучение AI scoring проекта (как справочная информация)
   - Анализ команды и прогресса

2. **Инвестирование**

   - Простая верификация через Civic
   - Выбор milestone для инвестирования
   - Инвестирование от $10 в USDC через MetaMask
   - Опционально: Fiat платежи через Xsolla → USDC

3. **Управление портфелем**
   - Отслеживание статуса milestones
   - Просмотр equity долей (в % и в токенах)
   - Автоматическое получение refund при провале milestone

## 🛠️ Минимальная реализация для хакатона

### База данных (расширение текущей схемы)

```sql
-- Crowdfunding кампании
CREATE TABLE crowdfunding_campaigns (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  total_equity_percentage NUMERIC(5,2), -- Общий % для продажи
  contract_address TEXT,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  cancellation_reason TEXT, -- Причина отмены (только модератором)
  max_milestones INTEGER DEFAULT 5, -- Ограничение на количество milestones
  created_at TIMESTAMP DEFAULT NOW()
);

-- Milestones кампании
CREATE TABLE campaign_milestones (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES crowdfunding_campaigns(id),
  name TEXT NOT NULL,
  target_amount NUMERIC(15,2),
  equity_percentage NUMERIC(5,2),
  deadline TIMESTAMP,
  early_bird_multiplier NUMERIC(3,2) DEFAULT 1.0,
  milestone_order INTEGER,
  status TEXT DEFAULT 'pending', -- pending, active, review, completed, failed, cancelled
  proof_urls TEXT[], -- Доказательства выполнения (изображения, PDF, ссылки)
  proof_descriptions TEXT[], -- Описания к доказательствам
  moderator_notes TEXT, -- Заметки модератора
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  review_requested_at TIMESTAMP -- Когда запрошена проверка
);

-- Инвестиции
CREATE TABLE milestone_investments (
  id UUID PRIMARY KEY,
  milestone_id UUID REFERENCES campaign_milestones(id),
  investor_id UUID REFERENCES auth.users(id),
  amount NUMERIC(15,2),
  equity_percentage NUMERIC(10,6), -- % компании
  equity_tokens NUMERIC(15,8), -- Условные токены для UI
  transaction_hash TEXT,
  is_refunded BOOLEAN DEFAULT FALSE,
  refund_transaction_hash TEXT,
  payment_method TEXT DEFAULT 'crypto', -- crypto, fiat
  created_at TIMESTAMP DEFAULT NOW()
);

-- Комиссии DeepVest
CREATE TABLE deepvest_fees (
  id UUID PRIMARY KEY,
  milestone_id UUID REFERENCES campaign_milestones(id),
  equity_fee_percentage NUMERIC(5,1), -- 0.1% от доли компании
  transfer_fee_amount NUMERIC(15,2), -- 1% от суммы
  total_fee_usdc NUMERIC(15,2),
  collected_at TIMESTAMP DEFAULT NOW()
);
```

### Упрощенный смарт-контракт

```solidity
contract SimpleMilestoneFunding {
    IERC20 public usdc;

    struct Milestone {
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 equityRate; // equity за 1 USDC в wei
        uint256 deadline;
        bool isCompleted;
        bool isActive;
        bool isCancelled; // Только модератор может отменить
        bool isInReview; // Ожидает подтверждения модератора
    }

    mapping(address => mapping(uint256 => uint256)) public investments;
    mapping(address => uint256) public totalEquityTokens;
    mapping(address => mapping(uint256 => bool)) public refundClaimed;

    Milestone[] public milestones;
    address[] public investors;

    address public startup;
    address public moderator; // DeepVest модератор
    address public deepvestTreasury; // Казна DeepVest для комиссий

    uint256 public constant MINIMUM_INVESTMENT = 10 * 10**6; // $10 USDC
    uint256 public constant DEEPVEST_EQUITY_FEE = 10; // 0.1% в базисных пунктах
    uint256 public constant DEEPVEST_TRANSFER_FEE = 100; // 1% в базисных пунктах
    uint256 public constant MAX_MILESTONES = 5; // Максимум 5 milestones

    function investInMilestone(uint256 milestoneIndex, uint256 amount) external {
        require(amount >= MINIMUM_INVESTMENT, "Below minimum investment");
        require(milestones[milestoneIndex].isActive, "Milestone not active");
        require(!milestones[milestoneIndex].isCancelled, "Milestone cancelled");
        require(!milestones[milestoneIndex].isInReview, "Milestone in review");
        require(block.timestamp < milestones[milestoneIndex].deadline, "Deadline passed");

        usdc.transferFrom(msg.sender, address(this), amount);

        // Добавляем в список инвесторов если первая инвестиция
        if (investments[msg.sender][milestoneIndex] == 0) {
            investors.push(msg.sender);
        }

        uint256 equityTokens = amount * milestones[milestoneIndex].equityRate;
        investments[msg.sender][milestoneIndex] += amount;
        totalEquityTokens[msg.sender] += equityTokens;
        milestones[milestoneIndex].currentAmount += amount;

        if (milestones[milestoneIndex].currentAmount >= milestones[milestoneIndex].targetAmount) {
            milestones[milestoneIndex].isActive = false;
            milestones[milestoneIndex].isInReview = true;
            // Ждем подтверждения модератора для завершения
        }
    }

    function completeMilestone(uint256 milestoneIndex) external {
        require(msg.sender == moderator, "Only moderator");
        require(milestones[milestoneIndex].isInReview, "Not in review");
        require(!milestones[milestoneIndex].isCancelled, "Milestone cancelled");

        milestones[milestoneIndex].isCompleted = true;
        milestones[milestoneIndex].isInReview = false;

        uint256 raisedAmount = milestones[milestoneIndex].currentAmount;

        // Расчет комиссии DeepVest (1% от суммы)
        uint256 transferFee = (raisedAmount * DEEPVEST_TRANSFER_FEE) / 10000;
        uint256 startupAmount = raisedAmount - transferFee;

        // Переводим комиссию DeepVest
        usdc.transfer(deepvestTreasury, transferFee);

        // Переводим деньги стартапу
        usdc.transfer(startup, startupAmount);

        // Активируем следующий milestone
        if (milestoneIndex + 1 < milestones.length) {
            milestones[milestoneIndex + 1].isActive = true;
        }
    }

    function cancelMilestone(uint256 milestoneIndex, string memory reason) external {
        require(msg.sender == moderator, "Only moderator");
        require(!milestones[milestoneIndex].isCompleted, "Already completed");

        milestones[milestoneIndex].isCancelled = true;
        milestones[milestoneIndex].isActive = false;
        milestones[milestoneIndex].isInReview = false;

        // Автоматический возврат средств всем инвесторам
        _refundAllInvestors(milestoneIndex);
    }

    function _refundAllInvestors(uint256 milestoneIndex) internal {
        for (uint i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 investment = investments[investor][milestoneIndex];

            if (investment > 0 && !refundClaimed[investor][milestoneIndex]) {
                refundClaimed[investor][milestoneIndex] = true;
                usdc.transfer(investor, investment);

                // Вычитаем equity токены
                uint256 equityToRemove = investment * milestones[milestoneIndex].equityRate;
                totalEquityTokens[investor] -= equityToRemove;
            }
        }
    }

    function failMilestone(uint256 milestoneIndex) external {
        require(msg.sender == moderator, "Only moderator");
        require(block.timestamp > milestones[milestoneIndex].deadline, "Not expired");
        require(!milestones[milestoneIndex].isCompleted, "Already completed");

        milestones[milestoneIndex].isActive = false;
        milestones[milestoneIndex].isInReview = false;

        // Автоматический возврат средств
        _refundAllInvestors(milestoneIndex);
    }
}
```

### API эндпоинты

```typescript
// Создание кампании (любой проект, максимум 5 milestones)
POST /api/projects/[id]/crowdfunding
{
  totalEquityPercentage: 25,
  milestones: [
    {
      name: "Идея → Дизайн",
      targetAmount: 5000,
      equityPercentage: 10,
      deadline: "2024-06-01",
      earlyBirdMultiplier: 1.5
    }
  ]
}

// Инвестирование (минимум $10)
POST /api/crowdfunding/[campaignId]/invest
{
  milestoneIndex: 0,
  amount: 10, // Минимум $10
  paymentMethod: "crypto" // или "fiat"
}

// Модераторские действия
POST /api/crowdfunding/[campaignId]/moderate
{
  action: "complete" | "cancel" | "fail",
  milestoneIndex: 0,
  reason?: "Нарушение правил платформы"
}

// Запрос на проверку milestone стартапом
POST /api/crowdfunding/[campaignId]/request-review
{
  milestoneIndex: 0,
  proofUrls: ["https://...", "..."],
  proofDescriptions: ["Описание файла 1", "Описание файла 2"]
}

// Получение данных кампании
GET /api/crowdfunding/[campaignId]

// Портфель инвестора
GET /api/users/me/investments

// Метрики для модератора
GET /api/admin/crowdfunding/metrics
// Возвращает: общая сумма, количество инвесторов, прогресс по времени
```

## 🎨 UI/UX концепция

### Страница кампании

```
[DeepVest Project Header + AI Score]

💰 Crowdfunding Campaign
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Milestone 1: Идея → Дизайн
🎯 $5,000 / $5,000 ✅ COMPLETED
📊 Equity: 10% | Early Bird: +50%
⏰ Completed on May 15, 2024

Milestone 2: Дизайн → Прототип  [IN REVIEW]
🎯 $20,000 / $20,000 (100%)
📊 Equity: 10% | Awaiting moderation
⏰ Target reached, pending approval
[████████████████████] 100%

Milestone 3: Прототип → MVP  [PENDING]
🎯 $0 / $100,000 (0%)
📊 Equity: 5% | Early Bird: +10%
⏰ Starts after Milestone 2 approval
[░░░░░░░░░░░░░░░░░░░░] 0%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Investors (234) | 💎 Your equity: 2.4% (4,800 tokens)
⚠️ Минимальная инвестиция: $10 USDC
```

### Модал инвестирования

```
💸 Invest in [ProjectName] - Milestone 3

Amount: [_____] USDC (min $10)
Current rate: 1 USDC = 0.05% equity (100 tokens)
Early bird bonus: +10% equity (до $30k raised)
Your equity: 0.055% per USDC (110 tokens)

Payment method:
○ Crypto (USDC) - Direct
○ Fiat → USDC (via Xsolla) [если успеем]

⚠️ Minimum: $10 USDC
⚠️ Your wallet: $5,000 USDC

[Basic KYC via Civic] [Invest Now]
```

### Админ панель модератора

```
🛠️ Milestone Management Dashboard

Campaign: AI-Powered Analytics Platform
Milestone 2: Дизайн → Прототип [REVIEW REQUESTED]

📊 Metrics:
- Total raised: $20,000 / $20,000 (100%)
- Investors: 87 people
- Time progress: 45 days / 60 days (75%)
- Average investment: $230

📎 Proof submitted:
- design_mockups.pdf (uploaded 2h ago)
- prototype_demo_video_link.txt (uploaded 1h ago)
- "Завершили все дизайн-макеты и начали разработку"

[Approve Milestone] [Request More Info] [Reject & Refund]
```

## 🔐 Безопасность и правила

### Правила для стартапов

- **Нельзя отменить milestone** после запуска кампании
- **Обязательство довести до конца** все заявленные milestones
- **Предоставление доказательств** выполнения каждого milestone
- **Максимум 5 milestones** в одной кампании

### Правила для модераторов DeepVest

- **Могут отменить milestone** по объективным причинам:
  - Нарушение правил платформы
  - Мошенничество или обман инвесторов
  - Взаимная договоренность сторон
  - Технические проблемы
- **При отмене**: автоматический возврат всех средств инвесторам

### Безопасность для хакатона

- Простая KYC через Civic (базовая верификация)
- Модерация выполнения milestones вручную
- Использование тестнетов
- Простые смарт-контракты с базовой защитой

## 🚀 План разработки на хакатон

### День 1 (Backend + Blockchain)

- Расширение базы данных для crowdfunding
- Разработка смарт-контрактов на Neon EVM
- API эндпоинты для кампаний и инвестиций
- Простая интеграция с Civic для KYC

### День 2 (Frontend + Demo)

- UI для создания кампаний
- Интерфейс инвестирования с MetaMask
- Панель модератора для управления milestones
- Демо-сценарий с фейковым проектом для показа инвестиций

## 📊 Демо сценарий

### Подготовка демо

- Несколько реальных проектов DeepVest (без реальных инвестиций)
- Один фейковый проект специально для демонстрации инвестиций
- Тестовые USDC токены для демонстрации
- Предварительно настроенные milestones в разных статусах

### Демо флоу (3 минуты)

1. **Проблема**: "Стартапам нужны деньги поэтапно, инвесторы хотят справедливых условий"
2. **Решение**: "Milestone-based equity crowdfunding на DeepVest"
3. **Демо**:
   - Обзор кампании проекта (разные статусы milestones)
   - Инвестирование $10 через MetaMask
   - Показ equity в портфеле (% и токены)
   - Модераторская панель (завершение milestone)
4. **Потенциал**: "Доступные инвестиции для всех, справедливое ценообразование"

## 💡 Уникальная ценность

1. **Для стартапов**: Поэтапное финансирование снижает риски и давление
2. **Для инвесторов**: Доступный вход от $10, справедливое ценообразование equity
3. **Для DeepVest**: Новый источник дохода (0.1% equity + 1% transfer fee)
4. **Для экосистемы**: Прозрачность и автоматизация через блокчейн

### Ключевые преимущества

- **Низкий барьер входа**: Минимум $10 для непрофессиональных инвесторов
- **Автоматическая защита**: Refund при провале milestone
- **Справедливая модерация**: DeepVest как надежный арбитр
- **Простота использования**: Интеграция с существующим DeepVest UX
