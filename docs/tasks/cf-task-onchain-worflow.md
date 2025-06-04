# Краудфандинг: Архитектура блокчейн-интеграции

## 🎯 Область применения

Данный документ описывает архитектуру интеграции краудфандинговой системы DeepVest с блокчейном, включая взаимодействие между компонентами, обработку состояний и техническую реализацию для продакшн-окружения.

---

## 🏗️ Архитектурные решения

### Hybrid Architecture

Система использует гибридную архитектуру:

- **On-chain**: Управление финансовыми потоками через смарт-контракты
- **Off-chain**: Бизнес-логика, модерация, пользовательские данные в Supabase
- **Event-driven**: Синхронизация состояний через события блокчейна

### Технологический стек

- **Blockchain**: Neon EVM (Solana-based EVM-совместимый слой)
- **Smart Contracts**: Solidity ^0.8.19
- **Development**: Hardhat, OpenZeppelin
- **Frontend Integration**: ethers.js v6, wagmi v2
- **Backend Integration**: Supabase Edge Functions + ethers.js

### Принципы проектирования

1. **Immutable Financial Logic**: Вся логика движения средств в смарт-контрактах
2. **Upgradeable Business Logic**: Модерация и расчеты в backend с возможностью обновления
3. **Event Sourcing**: Blockchain events как источник истины для финансовых операций
4. **Fail-Safe Mechanisms**: Автоматические refund при сбоях

---

## 💰 Компоненты системы

### 1. Smart Contract Layer

#### `MilestoneEscrow.sol` - Core Contract

```solidity
contract MilestoneEscrow {
    enum Status {
        Funding,        // Активный сбор средств
        Funded,         // Цель достигнута, ожидание выполнения работ
        WorkCompleted,  // Работы выполнены, ожидание модерации
        FundsReleased,  // Средства переданы стартапу
        Failed,         // Сбор провален
        Refunding       // Возврат средств активен
    }

    struct Investment {
        uint256 amount;
        uint256 timestamp;
        bool isEarlyBird;
        bool refundClaimed;
    }

    mapping(address => Investment) public investments;
    mapping(address => bool) public hasClaimedRefund;

    address[] public investors;
    uint256 public totalCollected;
    Status public currentStatus;

    // Events для синхронизации с backend
    event InvestmentMade(address indexed investor, uint256 amount, bool isEarlyBird);
    event StatusChanged(Status oldStatus, Status newStatus);
    event FundsReleased(uint256 amountToStartup, uint256 platformFee);
    event RefundClaimed(address indexed investor, uint256 amount);
}
```

#### Key Functions

**Investment Flow:**

- `invest(uint256 amount)` - Прием инвестиций с валидацией лимитов
- `checkAutomaticFunding()` - Проверка достижения целей

**Moderation Flow:**

- `confirmWorkCompletion()` - Подтверждение выполнения работ (только модератор)
- `releaseFunds()` - Перевод средств с расчетом комиссий

**Recovery Flow:**

- `emergencyPause()` - Аварийная остановка (upgradeable proxy)
- `claimRefund()` - Возврат средств инвестору

### 2. Backend Integration Layer

#### Event Monitoring Service

```typescript
// lib/blockchain/eventMonitor.ts
class EventMonitor {
  private contract: ethers.Contract;
  private supabase: SupabaseClient;

  async monitorInvestments() {
    this.contract.on('InvestmentMade', async (investor, amount, isEarlyBird, event) => {
      await this.syncInvestmentToDatabase({
        contractAddress: event.address,
        investor,
        amount: ethers.formatUnits(amount, 6), // USDC decimals
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        isEarlyBird,
      });
    });
  }

  async syncInvestmentToDatabase(data: InvestmentEvent) {
    const { error } = await this.supabase.from('milestone_investments').insert({
      campaign_milestone_id: await this.getMilestoneId(data.contractAddress),
      user_id: await this.getUserByWallet(data.investor),
      amount_usd: data.amount,
      transaction_hash: data.transactionHash,
      is_early_bird: data.isEarlyBird,
      status: 'confirmed',
    });
  }
}
```

#### Contract Deployment Service

```typescript
// lib/blockchain/contractFactory.ts
class ContractFactory {
  async deployMilestoneContract(milestone: CampaignMilestone): Promise<string> {
    const factory = new ethers.ContractFactory(
      MilestoneEscrowABI,
      MilestoneEscrowBytecode,
      this.wallet,
    );

    const contract = await factory.deploy(
      milestone.startupWallet,
      process.env.DEEPVEST_MODERATOR_ADDRESS,
      process.env.DEEPVEST_TREASURY_ADDRESS,
      process.env.USDC_CONTRACT_ADDRESS,
      ethers.parseUnits(milestone.min_target_amount_usd.toString(), 6),
      ethers.parseUnits(milestone.max_target_amount_usd.toString(), 6),
      Math.floor(new Date(milestone.deadline).getTime() / 1000),
    );

    await contract.waitForDeployment();
    return await contract.getAddress();
  }
}
```

### 3. Frontend Integration

#### Wallet Connection & State Management

```typescript
// hooks/useContractInteraction.ts
export function useContractInteraction(contractAddress: string) {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const investMutation = useMutation({
    mutationFn: async ({ amount }: { amount: string }) => {
      if (!walletClient || !address) throw new Error('Wallet not connected');

      const contract = new ethers.Contract(contractAddress, MilestoneEscrowABI, walletClient);

      // Approve USDC spending first
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, walletClient);
      const approvalTx = await usdcContract.approve(contractAddress, ethers.parseUnits(amount, 6));
      await approvalTx.wait();

      // Make investment
      const investTx = await contract.invest(ethers.parseUnits(amount, 6));
      return await investTx.wait();
    },
    onSuccess: receipt => {
      // Update UI optimistically
      queryClient.invalidateQueries(['milestone', contractAddress]);

      // Backend will sync automatically via event monitoring
    },
  });

  return { investMutation };
}
```

---

## 🔄 Workflow сценарии

### Сценарий 1: Campaign Deployment **[alfa]**

#### Backend Flow:

1. Стартап создает milestone через DeepVest UI
2. `POST /api/campaigns/milestones` → Supabase insert
3. Supabase trigger вызывает Edge Function
4. Edge Function деплоит `MilestoneEscrow` contract
5. Contract address сохраняется в `campaign_milestones.blockchain_escrow_address`

#### Technical Implementation:

```typescript
// app/api/campaigns/milestones/route.ts
export const POST = createAPIHandler(async request => {
  const milestone = await request.json();

  // Save to database first
  const { data, error } = await supabase
    .from('campaign_milestones')
    .insert(milestone)
    .select()
    .single();

  // Deploy contract asynchronously
  const contractAddress = await contractFactory.deployMilestoneContract(data);

  // Update with contract address
  await supabase
    .from('campaign_milestones')
    .update({ blockchain_escrow_address: contractAddress })
    .eq('id', data.id);

  return { success: true, data: { ...data, contractAddress } };
});
```

### Сценарий 2: Investment Process **[alfa/beta]**

#### **[alfa] Manual Investment (Console Demo):**

```bash
# Investor uses MetaMask/wallet directly
# Contract: 0x1234...
# Function: invest(amount)
# Amount: 100000000 (100 USDC in wei)
```

#### **[beta] Integrated UI Flow:**

**Frontend:**

1. User clicks "Invest $100"
2. Wallet prompts USDC approval transaction
3. User confirms approval
4. Wallet prompts investment transaction
5. User confirms investment
6. Transaction submitted to blockchain

**Backend Event Processing:**

```typescript
// Automatic sync via event monitoring
contract.on('InvestmentMade', async (investor, amount, isEarlyBird, event) => {
  // Calculate equity percentage based on current totals
  const equityPercent = calculateEquityShare(milestone, ethers.formatUnits(amount, 6), isEarlyBird);

  await supabase.from('milestone_investments').insert({
    campaign_milestone_id: milestone.id,
    user_id: await getUserByWallet(investor),
    amount_usd: ethers.formatUnits(amount, 6),
    calculated_equity_percentage: equityPercent,
    transaction_hash: event.transactionHash,
    is_early_bird: isEarlyBird,
    status: 'confirmed',
  });

  // Update milestone current_amount_usd
  await updateMilestoneProgress(milestone.id);
});
```

### Сценарий 3: Milestone Completion **[alfa/beta]**

#### Work Verification:

1. Startup uploads proofs via DeepVest UI
2. Creates `milestone_verification_request`
3. Moderator reviews within SLA (24h)
4. Moderator approves/rejects via admin panel

#### **[alfa] Manual Fund Release:**

```typescript
// Admin panel action
async function approveMilestone(milestoneId: string) {
  const milestone = await getMilestone(milestoneId);

  // Update database status first
  await supabase
    .from('campaign_milestones')
    .update({ status: 'completed_work' })
    .eq('id', milestoneId);

  // Call smart contract (manual for alfa)
  const contract = new ethers.Contract(
    milestone.blockchain_escrow_address,
    MilestoneEscrowABI,
    moderatorWallet,
  );

  const tx = await contract.confirmWorkCompletion(true);
  await tx.wait();
}
```

#### **[beta] Automated Fund Release:**

```typescript
// Edge Function triggered by moderator approval
export default async function handler(req: Request) {
  const { milestoneId, approved } = await req.json();

  const milestone = await getMilestone(milestoneId);
  const contract = getContract(milestone.blockchain_escrow_address);

  try {
    const tx = await contract.confirmWorkCompletion(approved);
    const receipt = await tx.wait();

    // Parse events for fund transfer amounts
    const releaseEvent = receipt.events?.find(e => e.event === 'FundsReleased');
    if (releaseEvent) {
      await recordPlatformFees(milestoneId, releaseEvent.args);
    }

    return { success: true, txHash: receipt.transactionHash };
  } catch (error) {
    await revertMilestoneStatus(milestoneId);
    throw error;
  }
}
```

### Сценарий 4: Failed Milestone / Refunds **[beta]**

#### Automatic Failure Detection:

```typescript
// Scheduled job checking deadlines
async function checkMilestoneDeadlines() {
  const expiredMilestones = await supabase
    .from('campaign_milestones')
    .select('*')
    .eq('status', 'active')
    .lt('deadline', new Date().toISOString());

  for (const milestone of expiredMilestones) {
    const contract = getContract(milestone.blockchain_escrow_address);
    const currentAmount = await contract.totalCollected();
    const minTarget = ethers.parseUnits(milestone.min_target_amount_usd.toString(), 6);

    if (currentAmount < minTarget) {
      // Trigger automatic failure
      await contract.handleFailedFunding();
      await updateMilestoneStatus(milestone.id, 'failed_to_fund');
    }
  }
}
```

#### Refund Process:

```typescript
// Frontend refund claim
async function claimRefund(contractAddress: string) {
  const contract = new ethers.Contract(contractAddress, ABI, walletClient);

  // Check if eligible for refund
  const investment = await contract.investments(userAddress);
  if (investment.amount === 0 || investment.refundClaimed) {
    throw new Error('No refund available');
  }

  const tx = await contract.claimRefund();
  return await tx.wait();
}
```

---

## 🔧 Implementation Details

### Neon EVM Specific Considerations

#### Oracle Integration Challenges

Согласно официальной документации Neon EVM:

- Частые oracle updates могут вызывать transaction restarts
- Прямое чтение из Pyth контракта добавляет 20+ Solana accounts в transactions
- Рекомендуется использовать caching механизмы для oracle данных

```solidity
// Рекомендуемый подход для oracle integration
contract MilestoneEscrow {
    uint256 public lastPriceUpdate;
    uint256 public cachedUSDCPrice;
    uint256 public constant PRICE_STALENESS_THRESHOLD = 3600; // 1 hour

    function getCachedPrice() internal view returns (uint256) {
        require(
            block.timestamp - lastPriceUpdate < PRICE_STALENESS_THRESHOLD,
            "Price data stale"
        );
        return cachedUSDCPrice;
    }
}
```

### Contract Security Patterns

#### ReentrancyGuard

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MilestoneEscrow is ReentrancyGuard {
    function invest(uint256 amount) external nonReentrant {
        // Investment logic
    }
}
```

#### AccessControl для модерации

```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MilestoneEscrow is AccessControl {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Not authorized");
        _;
    }

    function confirmWorkCompletion(bool approved) external onlyModerator {
        // Moderation logic
    }
}
```

### Error Handling & Recovery

#### Circuit Breaker Pattern

```solidity
contract MilestoneEscrow is Pausable {
    function emergencyPause() external onlyOwner {
        _pause();
    }

    function invest(uint256 amount) external whenNotPaused {
        // Investment logic
    }
}
```

#### Graceful Degradation

```typescript
// Frontend fallback для blockchain issues
export function useInvestmentFlow() {
  const [fallbackMode, setFallbackMode] = useState(false);

  const invest = async (amount: string) => {
    try {
      return await blockchainInvest(amount);
    } catch (error) {
      if (isNetworkError(error)) {
        setFallbackMode(true);
        // Show manual instructions to user
        return showManualInvestmentInstructions(contractAddress, amount);
      }
      throw error;
    }
  };
}
```

### Gas Optimization

#### Batch Operations **[omega]**

```solidity
// Multiple investments in single transaction
function batchInvest(
    address[] calldata investors,
    uint256[] calldata amounts
) external {
    require(investors.length == amounts.length, "Length mismatch");

    for (uint i = 0; i < investors.length; i++) {
        _processInvestment(investors[i], amounts[i]);
    }
}
```

#### Events vs Storage Trade-offs

```solidity
// Store minimal data on-chain, emit detailed events
event InvestmentMade(
    address indexed investor,
    uint256 amount,
    uint256 timestamp,
    bool isEarlyBird,
    uint256 cumulativeAmount
);

// Backend reconstructs state from events
```

---

## 📊 Monitoring & Analytics

### On-chain Data Tracking

#### Investment Analytics

```typescript
class InvestmentAnalytics {
  async getInvestmentMetrics(contractAddress: string) {
    const contract = getContract(contractAddress);

    const investmentEvents = await contract.queryFilter(
      contract.filters.InvestmentMade(),
      0,
      'latest',
    );

    return {
      totalInvestors: new Set(investmentEvents.map(e => e.args.investor)).size,
      averageInvestment: this.calculateAverage(investmentEvents),
      investmentTimeline: this.groupByTimeframe(investmentEvents),
      earlyBirdUtilization: this.calculateEarlyBirdMetrics(investmentEvents),
    };
  }
}
```

#### Financial Reconciliation

```typescript
// Daily reconciliation job
async function reconcileFinancials() {
  const milestones = await getActiveMilestones();

  for (const milestone of milestones) {
    const onChainTotal = await getContractBalance(milestone.blockchain_escrow_address);
    const offChainTotal = await getDbInvestmentSum(milestone.id);

    if (Math.abs(onChainTotal - offChainTotal) > TOLERANCE) {
      await flagDiscrepancy(milestone.id, { onChainTotal, offChainTotal });
    }
  }
}
```

### Error Monitoring

#### Transaction Failure Tracking

```typescript
contract.on('error', (error, receipt) => {
  logger.error('Contract interaction failed', {
    contractAddress: contract.address,
    transactionHash: receipt?.transactionHash,
    error: error.message,
    gasUsed: receipt?.gasUsed?.toString(),
  });

  // Alert if critical function fails
  if (error.message.includes('invest') || error.message.includes('claimRefund')) {
    await alertOpsTeam(error);
  }
});
```

---

## 🚀 Deployment Strategy

### Development Environment Setup

```bash
# Local blockchain setup
npm install -g hardhat
npx hardhat node --hostname 0.0.0.0 --port 8545

# Deploy contracts to local network
npx hardhat run scripts/deploy-milestone.ts --network localhost

# Start event monitoring
npm run blockchain:monitor:dev
```

### Testnet Deployment **[alfa]**

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
  networks: {
    neonDevnet: {
      url: 'https://devnet.neonevm.org',
      chainId: 245022926,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 21, // Neon EVM gas price
  },
};
```

### Production Considerations **[omega]**

- **Multi-sig Treasury**: 3-of-5 multisig для moderator functions
- **Upgradeable Proxies**: OpenZeppelin upgradeable contracts
- **Gas Price Oracle**: Dynamic gas pricing based on network conditions
- **Circuit Breakers**: Automatic pausing при обнаружении аномалий
- **Formal Verification**: Mathematical proof контракт безопасности

---

## 📋 Testing Strategy

### Contract Testing

```typescript
// test/MilestoneEscrow.test.ts
describe('MilestoneEscrow', function () {
  it('should handle investment flow correctly', async function () {
    const { contract, usdc, investor } = await loadFixture(deployEscrowFixture);

    await usdc.mint(investor.address, ethers.parseUnits('1000', 6));
    await usdc.connect(investor).approve(contract.address, ethers.parseUnits('100', 6));

    await expect(contract.connect(investor).invest(ethers.parseUnits('100', 6)))
      .to.emit(contract, 'InvestmentMade')
      .withArgs(investor.address, ethers.parseUnits('100', 6), false);

    expect(await contract.totalCollected()).to.equal(ethers.parseUnits('100', 6));
  });
});
```

### Integration Testing

```typescript
// Integration test с backend
describe('Blockchain Integration', () => {
  it('should sync investment events to database', async () => {
    const contractAddress = await deployTestContract();
    const eventMonitor = new EventMonitor(contractAddress);

    // Make investment
    await testInvestment(contractAddress, '100');

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify database sync
    const investment = await getInvestmentFromDb(contractAddress, investorAddress);
    expect(investment.amount_usd).toBe('100');
    expect(investment.status).toBe('confirmed');
  });
});
```

---

## 🎯 Хакатон Deliverables

### Day 1: Core Infrastructure **[alfa]**

- ✅ `MilestoneEscrow.sol` с базовой функциональностью
- ✅ Deployment scripts для Neon Devnet
- ✅ Event monitoring service
- ✅ Manual contract interaction scripts

### Day 2: Integration & Demo **[alfa]**

- ✅ Frontend wallet connection
- ✅ Investment flow (manual approval + transaction)
- ✅ Live contract status dashboard
- ✅ Refund mechanism demonstration

### Demo Script:

```bash
# 1. Deploy milestone contract
npm run deploy:milestone

# 2. Show contract state
npm run demo:contract-status

# 3. Simulate investments
npm run demo:invest --amount=100 --investor=0x123...

# 4. Show updated balances
npm run demo:balances

# 5. Simulate milestone completion
npm run demo:complete-milestone

# 6. Show fund release
npm run demo:final-state
```

### Success Metrics:

- Successful contract deployment на Neon Devnet
- Multiple test investments через MetaMask
- Automatic event synchronization с Supabase
- End-to-end fund flow demonstration
- Zero-downtime contract operation под нагрузкой

---

## 🔮 Post-Hackathon Roadmap

### **[beta] Phase - Production Ready:**

- Upgradeable contract architecture
- Comprehensive admin dashboard
- Automated testing pipeline
- Gas optimization (batch operations)
- Security audit preparation

### **[omega] Phase - Advanced Features:**

- ERC-721 equity tokens
- Secondary market integration
- Governance voting mechanisms
- Cross-chain bridge support
- Institutional investor tools

---

Данная архитектура обеспечивает production-ready краудфандинговую систему с blockchain-гарантиями безопасности средств и прозрачности операций, сохраняя гибкость бизнес-логики на backend уровне.
