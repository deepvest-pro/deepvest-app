# Модуль краудфандинга для DeepVest

## 1. Цели и ценность

- Разрешить стартапам привлекать микро-инвестиции от сообщества до классических раундов.
- Дать инвесторам прозрачные условия и автоматические гарантии возврата средств, если стадия не выполнена.
- Повысить вовлечённость пользователей DeepVest и расширить поток стартапов.

## 2. Общая бизнес-логика

1. Стартап создаёт «Крауд-кампанию» (CrowdCampaign) и определяет N последовательных **микро-раундов / мейлстоуны**.
2. Для каждого мейлстоуна указываются:
   - `amount_target` – сумма, необходимая для открытия стадии (USD экв.)
   - `equity_percent` – процент от общей доли компании, который распределяется между всеми инвесторами, закрывшими именно этот мейлстоун.
   - `deadline` – крайняя дата сбора средств.
3. Сумма `Σ equity_percent = equity_total`, где `equity_total` задаёт стартап (рекомендация ≤ 30 %). Чем раньше стадия → тем выше `equity_percent/amount_target` (большая доля за каждый вложенный доллар).
4. Денежные средства помещаются в **эскроу-смарт-контракт** до момента достижения `amount_target`.
5. После успешного закрытия мейлстоуна средства выводятся основателю, а инвесторы получают **EquityToken** (ERC-20) или NFT-квитанции, отражающие их долю.
6. Если `deadline` истёк и `amount_target` не достигнут — инвесторы могут вызвать `claimRefund()` и получить средства назад.
7. Следующий мейлстоун активируется только после «Success» предыдущего.
8. Стартап вправе **отменить** будущий мейлстоун до начала его сбора (state = `cancelled`) — тогда инвесторы не могут вносить средства, предыдущие стадии не затрагиваются.

## 2.1 Учёт пользовательских ответов

### Инвестиционные правила

- **Частичная инвестиция**: инвестор может вложить любую сумму ≥ `min_investment` (например 10 USDC) и ≤ доступного остатка мейлстоуна.
- Все расчёты ведутся в **стейблкоинах** (USDC) с отображением эквивалента в USD.

### Завершение мейлстоуна

- **Запрос на проверку** инициирует фаундер → создаётся запись `milestone_verification_request`.
- **Модератор DeepVest** просматривает доказательства (репозиторий, демо-сайт) и проставляет `status = successful | failed`.
- Контракт содержит роль `MODERATOR_ROLE` (адрес мультисиг DeepVest) с правом вызвать `setMilestoneStatus`.

### KYC/AML

- Для **фаундера** и **инвестора** обязательна KYC (Civic Pass) до взаимодействия с контрактом.
- UI запрашивает токен Civic перед подписанием транзакций.

### Отмена и возврат средств

- Модератор может вызвать `cancelFunding(milestoneId)` даже в статусе `funding`.
- Контракт помечает `status = cancelled` и открывает `claimRefund()`.

## 3. Формула распределения долей

Пусть:

- `E_total` – совокупная доля, выделенная на крауд (напр. 20 %).
- `A_i` – сумма мейлстоуна i.
- `W_i` – вес риска стадии. По умолчанию предлагается экспоненциальная скидка: `W_i = 1 / (i^α)`, α≈1.2.

Алгоритм:

1. Считаем нормирующий коэффициент `K = Σ (A_i * W_i)`.
2. `equity_percent_i = E_total * (A_i * W_i) / K`.

Таким образом фаундер задаёт только суммы; система автоматически выставляет доли с учётом «чем раньше — тем выгоднее». Пользователь может вручную переопределить `equity_percent_i`, но UI предупреждает о небалансе.

## 4. Модификации базы (Supabase)

### Таблица `crowd_campaigns`

```ts
{id: uuid PK,
 project_id: uuid FK -> projects,
 equity_total: numeric(5,2), -- например 20.00
 status: 'draft' | 'active' | 'completed' | 'cancelled',
 created_at, updated_at,
 min_investment: numeric(10,2) DEFAULT 10.00,
 contract_address: text,
 moderator_id: uuid  -- пользователь-модератор, FK auth.users}
```

### Таблица `crowd_milestones`

```ts
{id: uuid PK,
 campaign_id: uuid FK,
 order_index: int, -- 1,2,3…
 amount_target: numeric(12,2),
 equity_percent: numeric(5,2),
 deadline: timestamp,
 status: 'upcoming' | 'funding' | 'successful' | 'failed' | 'cancelled',
 tx_id_success: text, -- hash вывода средств
 created_at, updated_at}
```

### Таблица `crowd_investments`

```ts
{id: uuid PK,
 milestone_id: uuid FK,
 user_id: uuid FK -> auth.users,
 amount: numeric(12,2),
 tx_hash: text,
 token_amount: numeric(18,8), -- выданные токены
 refunded: boolean,
 is_public boolean DEFAULT true, -- инвестор может скрыть имя
 public_alias text          -- если is_public=false, можем показывать 'Investor #123'
}
```

_Все суммы храним в USD экв., фактический токен/коин хранится в `tx_hash`._

Таблица `milestone_verification_requests`:

```ts
{id uuid PK,
 milestone_id uuid FK,
 requested_by uuid FK -> auth.users,
 created_at timestamp,
 status: 'pending' | 'accepted' | 'rejected',
 comment text,
 expires_at timestamp}
```

## 5. Архитектура смарт-контракта

### Минимальный MVP

- **Neon EVM** — EVM-слой на Solana, низкие комиссии, знакомый Solidity.
- **Chainlink Price Feeds** — конвертация SOL/USDC ↔ USD для lock/refund.
- **Civic Pass** — опциональная KYC-верификация инвесторов (требуется для правовых регионов).

#### Контракт `CrowdCampaign.sol`

1. Структура `Milestone {uint amountTarget; uint deadline; uint equityPercent; uint fundsRaised; Status status;}`.
2. Маппинг `milestoneId => Milestone` + `milestoneId => mapping(address=>uint) contributions`.
3. Функции:
   - `contribute(milestoneId)` — принимает USDC, обновляет `fundsRaised`.
   - `checkSuccess(milestoneId)` — anyone, переводит USDC → founder, меняет статус, минтит EquityToken через `EquityToken.mint(address investor, uint amount)`.
   - `claimRefund(milestoneId)` — если `failed`, возвращает вклад.
   - `cancelUpcoming(uint milestoneId)` — только founder, до начала `funding`.
   - `cancelFunding(uint milestoneId)` с `onlyModerator`.
   - `setMilestoneStatus(uint id, bool success)` с `onlyModerator`.

EquityToken — стандартный ERC-20 с `cap = totalEquityShares * 10^decimals`.

Контракт загружается один раз на кампанию; адрес хранится в таблице `crowd_campaigns.contract_address`.

## 6. Пользовательские сценарии

1. **Создание кампании** (web):
   1. Основатель выбирает «Enable crowdfunding» на странице проекта.
   2. Заполняет форму milestones (wizard) → вызов функции Supabase RPC `create_crowd_campaign` + on-chain деплой через Neon RPC.
2. **Инвестор**:
   1. На странице проекта видит вкладку «Crowdfunding» c текущим мейлстоуном.
   2. Подключает кошелёк (Metamask через Neon) → делает транзакцию `contribute`.
   3. После успеха получает токены, отображаемые в разделе «Portfolio».
3. **Возврат средств** — кнопка активна, если мейлстоун `failed`.

## 7. Реализация за 2 дня (Hackathon Scope)

### День 1

- Базовые таблицы Supabase + RLS «публичный просмотр».
- Скрипт/UI создания кампании с 3 мейлстоунами (фиксированные значения, как в примере).
- Solidity контракт (single-file) + Hardhat + Neon RPC деплой.
- API-route `/api/crowd/webhook` → слушает события `MilestoneSuccessful` / `Refunded` (Simulate: polled by cron).

### День 2

- Интеграция фронтенда: страница «Crowdfunding» в проекте.
- Метамаск → contribute → обновление Supabase через webhook.
- Отрисовка прогресс-баров, таймера до `deadline`, кнопок Claim/Refund.
- Демонстрация токенов в Wallet (объяснить, что это stub-equity).

## 8. Потенциал коммерческого развития

- Перевод EquityToken ↔ каптаб через интеграцию с Carta / Анкоровские SAFEs.
- Вторичный рынок долей на P2P DEX.
- Интеграция Chainlink Proof-of-Reserve для подтверждения собранных средств.
- Мульти-сиг DAO для контроля вывода средств.
- Юридические шаблоны (SAFE, CLA) генерируются автоматически.

## 9. Сильные стороны выбора спонсоров

| Спонсор       | Роль в MVP                       | Почему                                              |
| ------------- | -------------------------------- | --------------------------------------------------- |
| **Neon EVM**  | Хостинг контракта                | EVM-совместимость, быстрый деплой, Solana ecosystem |
| **Chainlink** | Цены USDC↔USD, Proof-of-Reserve | Проверенные оракулы, гранты на DeFi-проекты         |
| **Civic**     | KYC опционально                  | Простая интеграция Civic Pass, также Solana-френдли |

(При желании можно заменить/добавить Polkadot — через Substrate Crowdloan pallets; Oasis — для приватности метрик; iExec — off-chain вычисления.)

## 10. Риски и упрощения

- **Безопасность** контракта минимальная; в проде — аудит.
- **Юридические ограничения** (securities): MVP маркируем как «simulation».
- **Refund gas costs** — покрывает стартап (Contract stores small buffer).
- **Fiat on-ramp** — пока отсутствует.

---

## Вопросы на уточнение v2

1. Какое **значение `min_investment`** установить по умолчанию (10 USDC приемлемо?)
2. Сколько времени даётся модератору на проверку после запроса (SLA)?
3. Нужны ли комиссии платформы DeepVest (процент от сбора) уже в MVP? Если да, размер?
4. Как хранить доказательства выполнения мейлстоуна: загрузка файлов в Supabase Storage или ссылки?
5. Нужно ли показывать публично список инвесторов или только основателю/модератору?

Пожалуйста, ответьте нумерованным списком, чтобы мы продолжили детализацию.

### Дополнения на основании ответов v2

| Параметр                   | Значение                                                          | Реализация                                                                                                                                              |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Минимальная инвестиция** | **10 USDC**                                                       | Поле `minInvestment` в контракте, значение по умолчанию задаётся при деплое; можно менять до начала кампании.                                           |
| **SLA модератора**         | **24 ч** на проверку после запроса                                | В таблице `milestone_verification_requests` храним `expires_at`; крон-функция подсвечивает просроченные заявки.                                         |
| **Комиссия DeepVest**      | `0.1 %` от equity + `1 %` от собранных средств каждого мейлстоуна | В контракте поля `platformEquityFeeBp = 10` и `platformFundsFeeBp = 100`; перевод USDC на `platform_treasury`. Долю в токенах минтим `TreasuryAddress`. |
| **Хранение доказательств** | Картинки / PDF → Supabase Storage, остальное — ссылки             | Таблица `milestone_proofs` описана ниже.                                                                                                                |
| **Публичность инвесторов** | По умолчанию публично; инвестор может скрыть имя                  | Поле `is_public boolean` в `crowd_investments`.                                                                                                         |

#### Таблица `milestone_proofs`

```ts
{id uuid PK,
 milestone_id uuid FK,
 type: 'image' | 'pdf' | 'link',
 url text, -- storage URL или внешняя ссылка
 uploaded_by uuid FK -> auth.users,
 created_at timestamp}
```

#### Изменения `crowd_investments`

Добавить:

```ts
is_public boolean DEFAULT true, -- инвестор может скрыть имя
public_alias text          -- если is_public=false, можем показывать 'Investor #123'
```

#### Апдейт контракта

```solidity
uint16 public constant PLATFORM_EQUITY_FEE_BP = 10;  // 0.1%
uint16 public constant PLATFORM_FUNDS_FEE_BP  = 100; // 1%
address public platformTreasury;
...
function _distributeFunds(uint milestoneId) internal {
    uint gross = milestones[milestoneId].fundsRaised;
    uint fee   = gross * PLATFORM_FUNDS_FEE_BP / 10_000;
    uint net   = gross - fee;
    USDC.transfer(platformTreasury, fee);
    USDC.transfer(founder, net);
}
```

При минте токенов аналогично 0.1 % уходит `platformTreasury`.

---

## Вопросы на уточнение v3

1. Требуется ли модуль напоминаний инвесторам, если истекает deadline и цель не достигнута? (email / push)
2. Нужна ли возможность вторичного рынка токенов внутри DeepVest (P2P-обмен) на этапе MVP?

Ответьте нумерованным списком, пожалуйста.

_Документ создан ChatGPT-ассистентом для начального обсуждения краудфандинг-модуля._

## Итоговые требования MVP (после v3)

- **Модуль напоминаний инвесторам**: не включается в MVP, можно рассмотреть на post-MVP.
- **Вторичный рынок токенов (P2P-обмен)**: не включается в MVP, возможен в дальнейшем через DEX-интеграцию.
