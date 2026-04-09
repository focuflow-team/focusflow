/**
 * FocusFlow Blocker — Options Page Script
 */

const DEFAULT_BLOCKED_SITES = [
  'youtube.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'news.ycombinator.com',
];

let blockedSites = [];

function showSaveStatus(message = '저장됨') {
  const el = document.getElementById('save-status');
  el.textContent = message;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

function renderSites() {
  const list = document.getElementById('sites-list');
  list.innerHTML = '';

  blockedSites.forEach((site, index) => {
    const li = document.createElement('li');
    li.className = 'site-item';

    const domain = document.createElement('span');
    domain.className = 'site-domain';
    domain.textContent = site;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.title = '제거';
    removeBtn.addEventListener('click', () => {
      blockedSites.splice(index, 1);
      renderSites();
      saveSites();
    });

    li.appendChild(domain);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

async function saveSites() {
  await chrome.runtime.sendMessage({ type: 'UPDATE_BLOCKED_SITES', sites: blockedSites });
  showSaveStatus();
}

async function loadSettings() {
  const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  blockedSites = state.blockedSites || [...DEFAULT_BLOCKED_SITES];
  renderSites();

  // Load sync settings
  const syncSettings = await chrome.storage.local.get(['autoSyncEnabled', 'autoStopEnabled']);
  document.getElementById('auto-sync-checkbox').checked = syncSettings.autoSyncEnabled !== false;
  document.getElementById('auto-stop-checkbox').checked = syncSettings.autoStopEnabled !== false;
}

async function init() {
  await loadSettings();

  // Add site
  const addBtn = document.getElementById('add-site-btn');
  const input = document.getElementById('new-site-input');

  function addSite() {
    const raw = input.value.trim().toLowerCase();
    if (!raw) return;

    // Normalize: strip protocol and trailing slashes
    const site = raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!site) return;

    if (blockedSites.includes(site)) {
      showSaveStatus('이미 목록에 있습니다');
      return;
    }

    blockedSites.push(site);
    input.value = '';
    renderSites();
    saveSites();
  }

  addBtn.addEventListener('click', addSite);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSite();
  });

  // Sync settings
  document.getElementById('auto-sync-checkbox').addEventListener('change', async (e) => {
    await chrome.storage.local.set({ autoSyncEnabled: e.target.checked });
    showSaveStatus();
  });

  document.getElementById('auto-stop-checkbox').addEventListener('change', async (e) => {
    await chrome.storage.local.set({ autoStopEnabled: e.target.checked });
    showSaveStatus();
  });

  // Reset
  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!confirm('기본 차단 목록으로 초기화하시겠습니까?')) return;
    blockedSites = [...DEFAULT_BLOCKED_SITES];
    renderSites();
    await saveSites();
  });
}

document.addEventListener('DOMContentLoaded', init);
