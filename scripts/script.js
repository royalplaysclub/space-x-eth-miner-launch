// =======================
// 🌌 SPACE X ETH MINER JS
// Fully Refactored + Advanced Logic
// =======================

// ==== 🔁 UTILITY FUNCTIONS ====

// Format milliseconds into readable HH:MM:SS
const formatTime = (ms) => {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
};

// Get & Save from Local Storage
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const load = (key, fallback = null) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback;
};

// ==== 🔗 DOM ELEMENTS ====

const $ = (id) => document.getElementById(id);
const balanceDisplay = $('eth-balance');
const dailyClaimBtn = $('daily-claim');
const treasureClaimBtn = $('treasure-claim');
const dailyTimer = $('daily-timer');
const treasureTimer = $('treasure-timer');
const miningWheel = $('mining-wheel');
const startMiningBtn = $('start-mining');
const tiersContainer = document.querySelector('.tiers');
const refCodeDisplay = $('ref-code');
const refInput = $('ref-input');
const submitRefBtn = $('submit-ref');
const refList = $('ref-list');
const withdrawBtn = $('withdraw-btn');
const walletInput = $('wallet-address');
const withdrawStatus = $('withdraw-status');

// ==== 💰 GAME STATE ====

let balance = load('eth-balance', 0);
let lastDailyClaim = load('last-daily-claim', 0);
let lastTreasureClaim = load('last-treasure-claim', 0);
let selectedMiner = load('selected-miner', 'Basic Miner');
let ethPerSec = load('eth-sec', 0.0);
let referrals = load('referrals', []);
let miningInterval = null;

const REFERRAL_BONUS = 0.0008;
const ETH_PRICE_USD = 3200; // Fixed rate for withdraw logic

// ==== 🧱 MINER TIERS ====

const minerTiers = [
  {
    name: 'Basic Miner',
    daily: 0.008,
    ethSec: 0.0,
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

// ==== ⚙️ CORE FUNCTIONS ====

function updateBalance() {
  balanceDisplay.textContent = balance.toFixed(6);
  save('eth-balance', balance);
}

function setMinerTier(index) {
  selectedMiner = minerTiers[index].name;
  ethPerSec = minerTiers[index].ethSec;
  save('selected-miner', selectedMiner);
  save('eth-sec', ethPerSec);
  renderTiers();
  alert(`✅ Activated: ${selectedMiner}`);
}

function renderTiers() {
  tiersContainer.innerHTML = '';
  minerTiers.forEach((tier, index) => {
    const card = document.createElement('div');
    card.className = 'miner-card';
    card.innerHTML = `
      <h3>${tier.name}</h3>
      <p>💰 Daily: ${tier.daily} ETH</p>
      <p>⚙️ ETH/sec: ${tier.ethSec}</p>
      <p class="price">${tier.price > 0 ? `$${tier.price}` : 'Free'}</p>
      <p>${tier.desc}</p>
      ${selectedMiner === tier.name
        ? '<p class="upgrade-note">✅ Active</p>'
        : `<button onclick="setMinerTier(${index})">Activate</button>`}
    `;
    tiersContainer.appendChild(card);
  });
}

function startMining() {
  if (miningInterval) clearInterval(miningInterval);
  miningWheel.style.animation = 'rotateWheel 2s linear infinite';

  miningInterval = setInterval(() => {
    balance += ethPerSec;
    updateBalance();
  }, 1000);
}

// ==== 🎁 CLAIM FUNCTIONS ====

function claim(type = 'daily') {
  const now = Date.now();
  const key = type === 'daily' ? 'last-daily-claim' : 'last-treasure-claim';
  const lastClaim = type === 'daily' ? lastDailyClaim : lastTreasureClaim;
  const cooldown = type === 'daily' ? 86400000 : 3600000; // 24h or 1h
  const min = type === 'daily' ? 0.00001 : 0.000005;
  const max = type === 'daily' ? 0.00012 : 0.00004;

  if (now - lastClaim < cooldown) {
    alert(`⏱️ ${type === 'daily' ? 'Daily' : 'Treasure'} not ready yet!`);
    return;
  }

  const reward = parseFloat((Math.random() * (max - min) + min).toFixed(6));
  balance += reward;
  save('eth-balance', balance);
  if (type === 'daily') {
    lastDailyClaim = now;
    save('last-daily-claim', now);
  } else {
    lastTreasureClaim = now;
    save('last-treasure-claim', now);
  }
  updateBalance();
  alert(`🎉 You claimed ${reward} ETH from ${type === 'daily' ? 'daily' : 'treasure'} reward!`);
}

function updateTimers() {
  const now = Date.now();
  const dailyRemaining = 86400000 - (now - lastDailyClaim);
  const treasureRemaining = 3600000 - (now - lastTreasureClaim);
  dailyTimer.textContent = dailyRemaining > 0 ? `Next claim: ${formatTime(dailyRemaining)}` : '✅ Claim Ready!';
  treasureTimer.textContent = treasureRemaining > 0 ? `Treasure: ${formatTime(treasureRemaining)}` : '💎 Ready!';
}
// ==== 👥 REFERRAL SYSTEM ====

function generateReferralCode() {
  const stored = localStorage.getItem('ref-code');
  if (stored) return stored;
  const newCode = 'REF' + Math.floor(Math.random() * 99999 + 10000);
  localStorage.setItem('ref-code', newCode);
  return newCode;
}

function showReferrals() {
  refList.innerHTML = referrals.length
    ? referrals.map(r => `
        <div class="referral-code">
          <span>${r.code}</span>
          <span>+${r.earned} ETH</span>
        </div>`).join('')
    : '<p>No referrals yet.</p>';
}

function addReferral() {
  const code = refInput.value.trim();
  const selfCode = localStorage.getItem('ref-code');
  if (!code || code === selfCode) {
    alert("⚠️ Invalid or self-referral.");
    return;
  }

  // Prevent duplicates
  if (referrals.some(ref => ref.code === code)) {
    alert("✅ You've already claimed this referral.");
    return;
  }

  referrals.push({ code, earned: REFERRAL_BONUS });
  balance += REFERRAL_BONUS;
  updateBalance();
  save('referrals', referrals);
  showReferrals();
  alert(`🎁 Referral bonus claimed: +${REFERRAL_BONUS} ETH`);
}

// ==== 🏦 WITHDRAWAL SYSTEM ====

function handleWithdraw() {
  const wallet = walletInput.value.trim();
  if (!wallet || !wallet.startsWith('0x') || wallet.length < 20) {
    withdrawStatus.textContent = "❌ Invalid ETH wallet address.";
    return;
  }

  const usdValue = balance * ETH_PRICE_USD;
  if (usdValue < 100) {
    withdrawStatus.textContent = `⛔ You need at least $100 (currently $${usdValue.toFixed(2)})`;
    return;
  }

  withdrawStatus.textContent = "✅ Withdrawal sent to admin. Processing...";

  // Simulate sending to backend (e.g., via webhook/API/email)
  console.log("Withdrawal request:", { wallet, amount: balance.toFixed(6) });

  // Reset
  balance = 0;
  updateBalance();
  save('eth-balance', balance);
}

// ==== 🚀 INITIALIZATION ====

function initializeApp() {
  updateBalance();
  renderTiers();
  showReferrals();
  refCodeDisplay.textContent = generateReferralCode();
  updateTimers();
  setInterval(updateTimers, 1000);
}

// ==== 🖱️ EVENT LISTENERS ====

dailyClaimBtn.addEventListener('click', () => claim('daily'));
treasureClaimBtn.addEventListener('click', () => claim('treasure'));
startMiningBtn.addEventListener('click', startMining);
submitRefBtn.addEventListener('click', addReferral);
withdrawBtn.addEventListener('click', handleWithdraw);

// ==== 🔓 START ====
initializeApp();
