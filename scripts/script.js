// DOM Elements
const balanceDisplay = document.getElementById('eth-balance');
const dailyClaimBtn = document.getElementById('daily-claim');
const treasureClaimBtn = document.getElementById('treasure-claim');
const dailyTimer = document.getElementById('daily-timer');
const treasureTimer = document.getElementById('treasure-timer');
const miningWheel = document.getElementById('mining-wheel');
const startMiningBtn = document.getElementById('start-mining');
const tiersContainer = document.querySelector('.tiers');
const refCodeDisplay = document.getElementById('ref-code');
const refInput = document.getElementById('ref-input');
const submitRefBtn = document.getElementById('submit-ref');
const refList = document.getElementById('ref-list');
const withdrawBtn = document.getElementById('withdraw-btn');
const walletInput = document.getElementById('wallet-address');
const withdrawStatus = document.getElementById('withdraw-status');

// Local Storage State
let balance = parseFloat(localStorage.getItem('eth-balance')) || 0;
let lastDailyClaim = parseInt(localStorage.getItem('last-daily-claim')) || 0;
let lastTreasureClaim = parseInt(localStorage.getItem('last-treasure-claim')) || 0;
let selectedMiner = localStorage.getItem('selected-miner') || 'basic';
let referrals = JSON.parse(localStorage.getItem('referrals')) || [];
let referralBonus = 0.0008;
let miningInterval;
let ethPerSec = 0.0000000;

// Miner Tiers
const minerTiers = [
  {
    name: 'Basic Miner',
    daily: 0.008,
    ethSec: 0.0000000,
    price: 0,
    desc: 'Starter tier — good for beginners',
  },
  {
    name: 'Pro Miner',
    daily: 0.016,
    ethSec: 0.0000001852,
    price: 100,
    desc: 'Faster mining, better ROI',
  },
  {
    name: 'Mega Miner',
    daily: 0.032,
    ethSec: 0.0000003704,
    price: 150,
    desc: 'Great for committed miners',
  },
  {
    name: 'Ultra Miner',
    daily: 0.064,
    ethSec: 0.0000007407,
    price: 300,
    desc: 'Top-tier ETH engine',
  }
];

// Render miner cards
function renderTiers() {
  tiersContainer.innerHTML = '';
  minerTiers.forEach((tier, index) => {
    const card = document.createElement('div');
    card.className = 'miner-card';
    card.innerHTML = `
      <h3>${tier.name}</h3>
      <p>💰 Daily: ${tier.daily} ETH</p>
      <p>⚙️ ETH/sec: ${tier.ethSec}</p>
      <p class="price">💵 ${tier.price > 0 ? '$' + tier.price : 'Free'}</p>
      <p>${tier.desc}</p>
      ${selectedMiner === tier.name ? '<p class="upgrade-note">✅ Active</p>' : `<button onclick="selectMiner(${index})">Activate</button>`}
    `;
    tiersContainer.appendChild(card);
  });
}

// Select Miner Tier
function selectMiner(index) {
  selectedMiner = minerTiers[index].name;
  ethPerSec = minerTiers[index].ethSec;
  localStorage.setItem('selected-miner', selectedMiner);
  localStorage.setItem('eth-sec', ethPerSec);
  renderTiers();
  alert(`Activated: ${selectedMiner}`);
}

// Mining Animation + Income
function startMining() {
  clearInterval(miningInterval);
  miningWheel.style.animation = 'rotateWheel 2s linear infinite';

  miningInterval = setInterval(() => {
    balance += ethPerSec;
    updateBalance();
    localStorage.setItem('eth-balance', balance.toFixed(6));
  }, 1000);
}

// Update ETH Balance UI
function updateBalance() {
  balanceDisplay.textContent = balance.toFixed(6);
}

// Claim Functions
function claimDaily() {
  const now = Date.now();
  if (now - lastDailyClaim < 86400000) {
    alert("⏱️ Wait 24h before next daily claim!");
    return;
  }

  const reward = (Math.random() * 0.00012 + 0.00001).toFixed(6);
  balance += parseFloat(reward);
  lastDailyClaim = now;
  localStorage.setItem('eth-balance', balance.toFixed(6));
  localStorage.setItem('last-daily-claim', now);
  updateBalance();
  alert(`🎉 You claimed ${reward} ETH`);
}

function claimTreasure() {
  const now = Date.now();
  if (now - lastTreasureClaim < 3600000) {
    alert("⏱️ Wait 1 hour before claiming treasure again!");
    return;
  }

  const reward = (Math.random() * 0.00004 + 0.000005).toFixed(6);
  balance += parseFloat(reward);
  lastTreasureClaim = now;
  localStorage.setItem('eth-balance', balance.toFixed(6));
  localStorage.setItem('last-treasure-claim', now);
  updateBalance();
  alert(`🔐 You claimed a treasure: ${reward} ETH`);
}

// Timer Checkers
function updateTimers() {
  const now = Date.now();
  const dailyLeft = Math.max(0, 86400000 - (now - lastDailyClaim));
  const treasureLeft = Math.max(0, 3600000 - (now - lastTreasureClaim));

  dailyTimer.textContent = dailyLeft > 0 ? `Next claim in: ${formatTime(dailyLeft)}` : 'Claim ready!';
  treasureTimer.textContent = treasureLeft > 0 ? `Treasure in: ${formatTime(treasureLeft)}` : 'Treasure ready!';
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${s}s`;
}

// Referral Logic
function generateRefCode() {
  const code = 'REF' + Math.floor(Math.random() * 100000);
  localStorage.setItem('ref-code', code);
  return code;
}

function addReferral() {
  const inputCode = refInput.value.trim();
  if (!inputCode || inputCode === localStorage.getItem('ref-code')) {
    alert("⚠️ Invalid referral code.");
    return;
  }

  referrals.push({ code: inputCode, earned: referralBonus });
  balance += referralBonus;
  localStorage.setItem('eth-balance', balance.toFixed(6));
  localStorage.setItem('referrals', JSON.stringify(referrals));
  updateBalance();
  showReferrals();
}

function showReferrals() {
  refList.innerHTML = referrals.map(r => `
    <div class="referral-code">
      <span>${r.code}</span>
      <span>+${r.earned} ETH</span>
    </div>
  `).join('');
}

// Withdraw Logic
function handleWithdraw() {
  const wallet = walletInput.value.trim();
  if (!wallet || !wallet.startsWith('0x') || wallet.length < 20) {
    withdrawStatus.textContent = "❌ Invalid ETH wallet address.";
    return;
  }

  const usdValue = balance * 3200; // Assume ETH = $3200
  if (usdValue < 100) {
    withdrawStatus.textContent = `⛔ You need at least $100 (currently $${usdValue.toFixed(2)})`;
    return;
  }

  withdrawStatus.textContent = "✅ Withdrawal request sent. Processing manually.";
  // Here you would forward wallet + balance to admin inbox or webhook
  balance = 0;
  updateBalance();
  localStorage.setItem('eth-balance', '0');
}

// Initialization
function init() {
  updateBalance();
  renderTiers();
  showReferrals();
  refCodeDisplay.textContent = localStorage.getItem('ref-code') || generateRefCode();
  setInterval(updateTimers, 1000);
  updateTimers();
}

// Event Listeners
dailyClaimBtn.addEventListener('click', claimDaily);
treasureClaimBtn.addEventListener('click', claimTreasure);
startMiningBtn.addEventListener('click', startMining);
submitRefBtn.addEventListener('click', addReferral);
withdrawBtn.addEventListener('click', handleWithdraw);

// Start
init();
