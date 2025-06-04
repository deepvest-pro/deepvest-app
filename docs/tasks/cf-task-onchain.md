# Crowdfunding OnChain Implementation Plan

## Общая информация

**Цель**: Блокчейн интеграция этапного краудфандинга для платформы DeepVest  
**Статус**: Планирование  
**Приоритет**: Высокий  
**Blockchain**: Neon EVM (Solidity на Solana)

## Приоритеты реализации

- **[alfa]** - стараемся сделать на хакатоне (демонстрация в консоли/tools)
- **[beta]** - возможно сделаем на хакатоне, если не успеем - после хакатона
- **[omega]** - точно после хакатона, после завершения beta

---

## 🔗 Phase 1: Smart Contract Architecture

### 1.1 Core Escrow Contract **[alfa]**

- [ ] **`MilestoneEscrow.sol` - базовый эскроу контракт**

  **Приоритет**: [alfa] - упрощенная версия для демонстрации

  **Основные переменные состояния**:

  - `address public startupWallet` - кошелек стартапа
  - `address public moderatorWallet` - кошелек модератора DeepVest
  - `address public platformTreasury` - казна платформы для комиссий
  - `IERC20 public usdcToken` - контракт USDC токена
  - `uint256 public minTargetAmount` - минимальная цель сбора
  - `uint256 public maxTargetAmount` - максимальная цель сбора
  - `uint256 public collectedAmount` - текущая собранная сумма
  - `uint256 public deadline` - дедлайн сбора средств
  - `enum Status { Active, Funded, Completed, Failed, Cancelled }` - статус
  - `mapping(address => uint256) public investments` - инвестиции пользователей
  - `uint16 public constant PLATFORM_FEE_BP = 100` // 1% комиссия

- [ ] **Основные функции контракта**

  **[alfa] Функции для хакатона**:

  - `constructor()` - инициализация с базовыми параметрами
  - `invest(uint256 amount)` - инвестирование USDC
  - `checkFundingStatus()` - проверка статуса сбора (view функция)
  - `getInvestorInfo(address investor)` - информация об инвесторе (view)
  - `getTotalStats()` - общая статистика контракта (view)

  **[beta] Расширенные функции**:

  - `confirmWorkCompletion()` - подтверждение выполнения работ (moderator only)
  - `releaseFunds()` - перевод средств стартапу с удержанием комиссии
  - `claimRefund()` - возврат средств при неудаче
  - `emergencyPause()` - экстренная остановка (moderator only)

- [ ] **События (Events)**

  **[alfa] Базовые события**:

  ```solidity
  event InvestmentMade(address indexed investor, uint256 amount, uint256 totalCollected);
  event FundingCompleted(uint256 totalAmount, uint256 timestamp);
  event StatusChanged(Status oldStatus, Status newStatus);
  ```

  **[beta] Расширенные события**:

  ```solidity
  event WorkCompletionRequested(uint256 timestamp);
  event WorkApproved(address indexed moderator, uint256 timestamp);
  event FundsReleased(uint256 amountToStartup, uint256 platformFee);
  event RefundClaimed(address indexed investor, uint256 amount);
  event EmergencyPaused(address indexed moderator, string reason);
  ```

### 1.2 Equity Token Management **[omega]**

- [ ] **`EquityToken.sol` - ERC-20 токен для представления долей**

  **Приоритет**: [omega] - полноценная токенизация после хакатона

  - Mint токенов пропорционально инвестициям
  - Burn механизм для возврата долей
  - Governance права для токен-холдеров
  - Интеграция с OpenZeppelin стандартами
  - Возможность торговли на DEX (опционально)

- [ ] **`EquityManager.sol` - управление распределением equity**

  - Расчет долей с учетом early bird бонусов
  - Batch minting для экономии газа
  - Vesting механизмы (опционально)
  - Integration с milestone completions

### 1.3 Campaign Factory **[beta]**

- [ ] **`CampaignFactory.sol` - фабрика для создания кампаний**

  **Приоритет**: [beta] - автоматизация деплоя

  **Основные функции**:

  - `createMilestoneCampaign()` - создание новой кампании
  - `getMilestoneContract(campaignId, milestoneIndex)` - получение адреса контракта
  - `updateModerator()` - обновление модератора (admin only)
  - `pauseFactory()` - остановка создания новых кампаний

  **События**:

  ```solidity
  event CampaignCreated(
    bytes32 indexed campaignId,
    address indexed creator,
    address milestoneContract,
    uint256 milestoneIndex
  );
  ```

---

## 🛠️ Phase 2: Development Environment Setup

### 2.1 Development Tools **[alfa]**

- [ ] **Hardhat configuration для Neon EVM**

  ```javascript
  // hardhat.config.js
  module.exports = {
    solidity: '0.8.19',
    networks: {
      neonDevnet: {
        url: 'https://devnet.neonevm.org',
        accounts: [process.env.PRIVATE_KEY],
        chainId: 245022926,
      },
    },
  };
  ```

- [ ] **Environment setup**

  - [ ] Node.js проект с TypeScript
  - [ ] OpenZeppelin contracts integration
  - [ ] Ethers.js для взаимодействия с контрактами
  - [ ] Dotenv для environment переменных

- [ ] **Testing framework**
  - [ ] Hardhat test suite
  - [ ] Mock USDC контракт для тестирования
  - [ ] Test helpers для общих операций

### 2.2 Contract Compilation & Testing **[alfa]**

- [ ] **Compilation scripts**

  ```bash
  npm run compile     # Компиляция контрактов
  npm run test        # Запуск тестов
  npm run coverage    # Coverage отчет
  ```

- [ ] **Unit тесты для MilestoneEscrow**

  - [ ] Тест инвестирования
  - [ ] Тест достижения минимального порога
  - [ ] Тест автозавершения при достижении максимума
  - [ ] Тест статусов контракта
  - [ ] Тест view функций

- [ ] **Integration тесты**
  - [ ] Полный цикл milestone: invest → fund → complete → release
  - [ ] Тест сценария неудачи с возвратом средств
  - [ ] Тест экстренных ситуаций

---

## 🌐 Phase 3: Neon EVM Integration

### 3.1 Network Configuration **[alfa]**

- [ ] **Neon Devnet setup**

  - [ ] Получение SOL для gas fees
  - [ ] Конвертация SOL в Neon ETH
  - [ ] Настройка RPC endpoints
  - [ ] Faucet для тестовых токенов

- [ ] **Mock USDC деплой**

  ```solidity
  // MockUSDC.sol для тестирования
  contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
      _mint(msg.sender, 1000000 * 10**6); // 1M USDC
    }

    function mint(address to, uint256 amount) external {
      _mint(to, amount); // Для тестирования
    }
  }
  ```

### 3.2 Deployment Scripts **[alfa]**

- [ ] **Deploy script для контрактов**

  ```typescript
  // scripts/deploy.ts
  async function main() {
    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory('MockUSDC');
    const usdc = await MockUSDC.deploy();

    // Deploy MilestoneEscrow
    const MilestoneEscrow = await ethers.getContractFactory('MilestoneEscrow');
    const escrow = await MilestoneEscrow.deploy(
      startupWallet,
      moderatorWallet,
      platformTreasury,
      usdc.address,
      minTarget,
      maxTarget,
      deadline,
    );

    console.log('USDC deployed to:', usdc.address);
    console.log('Escrow deployed to:', escrow.address);
  }
  ```

- [ ] **Contract verification**
  - [ ] Автоматическая верификация контрактов на Neon block explorer
  - [ ] ABI export для frontend интеграции
  - [ ] Address registry для deployed контрактов

### 3.3 Contract Interaction Tools **[alfa]**

- [ ] **Console interaction scripts**

  ```typescript
  // scripts/interact.ts - для демонстрации на хакатоне
  async function demonstrateCrowdfunding() {
    const escrow = await ethers.getContractAt('MilestoneEscrow', contractAddress);

    // Показать начальное состояние
    console.log('Initial status:', await escrow.getTotalStats());

    // Симуляция инвестиций
    await escrow.invest(ethers.utils.parseUnits('100', 6)); // 100 USDC
    console.log('After investment:', await escrow.getTotalStats());

    // Проверка статуса
    await escrow.checkFundingStatus();
  }
  ```

- [ ] **Admin tools**
  - [ ] Scripts для модераторских функций
  - [ ] Emergency pause/unpause utilities
  - [ ] Fund release automation tools

---

## 🔌 Phase 4: Backend Integration

### 4.1 Contract Event Monitoring **[beta]**

- [ ] **Event listener service**

  ```typescript
  // lib/blockchain/eventListener.ts
  class ContractEventMonitor {
    async startMonitoring(contractAddress: string) {
      const contract = new ethers.Contract(contractAddress, ABI, provider);

      contract.on('InvestmentMade', (investor, amount, total) => {
        // Update database with new investment
        this.updateInvestmentInDB(investor, amount, total);
      });

      contract.on('FundingCompleted', (totalAmount, timestamp) => {
        // Update milestone status to 'funded'
        this.updateMilestoneStatus('funded');
      });
    }
  }
  ```

- [ ] **Database synchronization**
  - [ ] Sync blockchain events с milestone_investments таблицей
  - [ ] Update campaign_milestones статусы
  - [ ] Error handling для failed transactions

### 4.2 Contract Deployment Automation **[beta]**

- [ ] **API endpoint для создания новых escrow контрактов**

  ```typescript
  // api/blockchain/deploy-escrow.ts
  export const POST = createAPIHandler(async request => {
    const user = await requireAuth(request);
    const { campaignId, milestoneId, parameters } = await request.json();

    // Deploy new escrow contract
    const contractAddress = await deployMilestoneEscrow(parameters);

    // Update database with contract address
    await updateMilestoneContract(milestoneId, contractAddress);

    return { contractAddress, transactionHash };
  });
  ```

- [ ] **Automated contract management**
  - [ ] Queue system для деплоя контрактов
  - [ ] Gas price optimization
  - [ ] Transaction retry logic

### 4.3 Transaction Management **[beta]**

- [ ] **Transaction status tracking**

  ```typescript
  // lib/blockchain/transactionTracker.ts
  interface TransactionStatus {
    hash: string;
    status: 'pending' | 'confirmed' | 'failed';
    confirmations: number;
    gasUsed?: number;
  }

  class TransactionTracker {
    async trackTransaction(hash: string): Promise<TransactionStatus> {
      // Monitor transaction until confirmation
    }
  }
  ```

- [ ] **Error recovery mechanisms**
  - [ ] Automatic retry для failed transactions
  - [ ] Manual intervention tools
  - [ ] Transaction replacement (higher gas)

---

## 💼 Phase 5: Wallet Integration

### 5.1 MetaMask Integration **[beta]**

- [ ] **Wallet connection component**

  ```typescript
  // components/blockchain/WalletConnector.tsx
  const WalletConnector = () => {
    const [account, setAccount] = useState<string | null>(null);

    const connectWallet = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);

        // Switch to Neon network if needed
        await switchToNeonNetwork();
      }
    };

    const switchToNeonNetwork = async () => {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0xE9AC0CE',
            chainName: 'Neon EVM DevNet',
            nativeCurrency: {
              name: 'NEON',
              symbol: 'NEON',
              decimals: 18,
            },
            rpcUrls: ['https://devnet.neonevm.org'],
          },
        ],
      });
    };
  };
  ```

- [ ] **Transaction signing**
  - [ ] Investment transaction signing
  - [ ] USDC approval transactions
  - [ ] Gas estimation и optimization

### 5.2 USDC Integration **[beta]**

- [ ] **USDC balance management**

  ```typescript
  // hooks/blockchain/useUSDC.ts
  const useUSDC = () => {
    const getBalance = async (address: string) => {
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
      return await usdcContract.balanceOf(address);
    };

    const approveEscrow = async (escrowAddress: string, amount: string) => {
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      return await usdcContract.approve(escrowAddress, amount);
    };
  };
  ```

- [ ] **Investment flow UI**
  - [ ] USDC balance display
  - [ ] Approval step для escrow контракта
  - [ ] Investment confirmation dialog
  - [ ] Transaction status tracking в UI

### 5.3 Transaction Feedback **[beta]**

- [ ] **Real-time status updates**

  - [ ] Pending transaction indicators
  - [ ] Confirmation progress bars
  - [ ] Success/failure notifications
  - [ ] Transaction hash links to explorer

- [ ] **Error handling UI**
  - [ ] Insufficient balance warnings
  - [ ] Network switching prompts
  - [ ] Gas estimation failures
  - [ ] Transaction rejection handling

---

## 🔄 Phase 6: Advanced Features

### 6.1 Early Bird Mechanism **[omega]**

- [ ] **Smart contract early bird logic**

  ```solidity
  // MilestoneEscrow.sol дополнения
  uint256 public earlyBirdThreshold; // 30% от maxTargetAmount
  uint256 public earlyBirdMultiplier; // например, 1.2x
  mapping(address => bool) public isEarlyBird;

  function invest(uint256 amount) external {
    require(collectedAmount + amount <= maxTargetAmount, "Exceeds max");

    // Определение early bird статуса
    if (collectedAmount < earlyBirdThreshold) {
      isEarlyBird[msg.sender] = true;
    }

    investments[msg.sender] += amount;
    collectedAmount += amount;
  }

  function calculateEquityShare(address investor) external view returns (uint256) {
    uint256 baseShare = (investments[investor] * EQUITY_PERCENT) / collectedAmount;

    if (isEarlyBird[investor]) {
      return (baseShare * earlyBirdMultiplier) / 100;
    }

    return baseShare;
  }
  ```

### 6.2 Multi-Milestone Campaign **[omega]**

- [ ] **Campaign orchestration contract**

  ```solidity
  contract CampaignOrchestrator {
    struct Campaign {
      bytes32 id;
      address[] milestoneContracts;
      uint8 currentMilestone;
      bool isActive;
    }

    mapping(bytes32 => Campaign) public campaigns;

    function createCampaign(
      bytes32 campaignId,
      MilestoneParams[] calldata milestones
    ) external {
      // Deploy escrow contracts for each milestone
      // Setup milestone dependencies
    }

    function activateNextMilestone(bytes32 campaignId) external {
      // Verify previous milestone completion
      // Activate next milestone contract
    }
  }
  ```

### 6.3 Governance Integration **[omega]**

- [ ] **Token-based voting system**

  - [ ] Voting on milestone completion disputes
  - [ ] Platform parameter governance
  - [ ] Fee structure adjustments
  - [ ] Emergency response decisions

- [ ] **Snapshot integration**
  - [ ] Off-chain voting для gas efficiency
  - [ ] Proposal creation и execution
  - [ ] Vote delegation mechanisms

---

## 🔒 Phase 7: Security & Auditing

### 7.1 Security Measures **[omega]**

- [ ] **Access control**

  - [ ] Role-based permissions (OpenZeppelin AccessControl)
  - [ ] Multi-signature requirements для critical functions
  - [ ] Time locks для sensitive operations
  - [ ] Emergency pause mechanisms

- [ ] **Reentrancy protection**
  - [ ] ReentrancyGuard для all state-changing functions
  - [ ] Checks-Effects-Interactions pattern
  - [ ] Safe math operations (Solidity 0.8+)

### 7.2 Testing & Validation **[alfa для базовых тестов, omega для полных]**

- [ ] **[alfa] Базовые unit tests**

  - [ ] Investment scenarios
  - [ ] Status transitions
  - [ ] View function correctness
  - [ ] Basic error cases

- [ ] **[omega] Comprehensive test suite**

  - [ ] Edge case scenarios
  - [ ] Attack vector testing
  - [ ] Gas optimization tests
  - [ ] Integration test с full workflow

- [ ] **[omega] Formal verification**
  - [ ] Mathematical proof of contract correctness
  - [ ] Property-based testing
  - [ ] Automated security scanning

### 7.3 External Audits **[omega]**

- [ ] **Smart contract audit**
  - [ ] Third-party security review
  - [ ] Vulnerability assessment
  - [ ] Gas optimization review
  - [ ] Best practices compliance

---

## 📊 Phase 8: Monitoring & Analytics

### 8.1 On-chain Analytics **[omega]**

- [ ] **Investment tracking**

  - [ ] Real-time investment flows
  - [ ] Investor behavior analytics
  - [ ] Success rate tracking по milestones
  - [ ] Platform fee collection monitoring

- [ ] **Performance metrics**
  - [ ] Average time до funding completion
  - [ ] Gas usage optimization tracking
  - [ ] Transaction failure rate analysis

### 8.2 Alerting System **[omega]**

- [ ] **Critical event monitoring**
  - [ ] Large investment alerts
  - [ ] Funding completion notifications
  - [ ] Emergency pause triggers
  - [ ] Suspicious activity detection

---

## 🚀 Phase 9: Production Deployment

### 9.1 Mainnet Preparation **[omega]**

- [ ] **Neon EVM Mainnet deployment**
  - [ ] Production contract deployment
  - [ ] Verify contracts on mainnet explorer
  - [ ] Setup production monitoring
  - [ ] Configure backup systems

### 9.2 Integration с DeepVest Platform **[beta]**

- [ ] **API integration points**
  - [ ] Contract deployment endpoints
  - [ ] Investment status synchronization
  - [ ] Event monitoring integration
  - [ ] Transaction management

---

## 📋 Implementation Timeline для Хакатона

### Day 1: Foundation **[alfa]**

- [ ] Environment setup (Hardhat + Neon EVM)
- [ ] Basic MilestoneEscrow contract
- [ ] Mock USDC deployment
- [ ] Unit tests для core functions
- [ ] Console interaction scripts

### Day 2: Integration & Demo **[alfa + частично beta]**

- [ ] Contract deployment на Neon Devnet
- [ ] Event monitoring basics
- [ ] MetaMask integration (если успеем)
- [ ] Demonstration scripts
- [ ] Documentation для demo

### Post-Hackathon: **[beta + omega]**

- Backend integration
- Full UI integration
- Security audit
- Production deployment

---

## 🛠️ Technical Stack

### Development

- **Solidity 0.8.19** - контракты
- **Hardhat** - development environment
- **TypeScript** - scripting и integration
- **Ethers.js** - blockchain interaction
- **OpenZeppelin** - security standards

### Infrastructure

- **Neon EVM** - execution environment
- **MetaMask** - wallet integration
- **USDC** - stable coin для investments
- **Supabase** - off-chain data storage

### Testing

- **Mocha/Chai** - testing framework
- **Waffle** - Ethereum testing utilities
- **Solidity Coverage** - код coverage
- **Mythril/Slither** - security analysis (omega)

---

## Dependencies

### External Services

- Neon EVM devnet access
- USDC contract on Neon (или mock версия)
- MetaMask wallet support
- Суpabase для off-chain synchronization

### Internal Dependencies

- DeepVest authentication system
- Project permissions framework
- Campaign management API (из cf-task-offchain.md)

---

**Примечание**: Этот план фокусируется на максимально простой реализации для хакатона с возможностью расширения в будущем. Приоритет [alfa] включает только самое необходимое для демонстрации концепции.
