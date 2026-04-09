/**
 * FocusFlow Blocker — Popup Script
 */

const PHASE_LABELS = {
  idle: '대기',
  work: '집중',
  break: '휴식',
  long_break: '긴 휴식',
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function loadState() {
  const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  return state;
}

function renderState(state) {
  const { focusActive, blockedSites = [], webappTimerState } = state;

  // Focus toggle
  const dot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const toggleBtn = document.getElementById('toggle-btn');

  if (focusActive) {
    dot.classList.add('active');
    statusText.textContent = '집중 모드 켜짐';
    statusText.classList.add('active');
    toggleBtn.textContent = '집중 종료';
    toggleBtn.classList.add('active');
  } else {
    dot.classList.remove('active');
    statusText.textContent = '집중 모드 꺼짐';
    statusText.classList.remove('active');
    toggleBtn.textContent = '집중 시작';
    toggleBtn.classList.remove('active');
  }

  // Webapp timer
  const webappSection = document.getElementById('webapp-section');
  if (webappTimerState) {
    webappSection.style.display = 'block';
    const remaining = Math.max(0, (webappTimerState.totalDuration || 0) - (webappTimerState.elapsed || 0));
    document.getElementById('webapp-phase').textContent = PHASE_LABELS[webappTimerState.phase] || '-';
    document.getElementById('webapp-time').textContent = formatTime(remaining);
  } else {
    webappSection.style.display = 'none';
  }

  // Blocked sites list
  const sitesList = document.getElementById('sites-list');
  const sitesCount = document.getElementById('sites-count');

  sitesCount.textContent = `${blockedSites.length}개`;
  sitesList.innerHTML = '';

  blockedSites.slice(0, 6).forEach(site => {
    const li = document.createElement('li');
    li.className = `site-tag${focusActive ? ' blocked' : ''}`;
    li.textContent = site;
    sitesList.appendChild(li);
  });

  if (blockedSites.length > 6) {
    const li = document.createElement('li');
    li.className = 'site-tag';
    li.textContent = `+${blockedSites.length - 6}개`;
    sitesList.appendChild(li);
  }
}

async function init() {
  const state = await loadState();
  renderState(state);

  // Toggle focus mode
  document.getElementById('toggle-btn').addEventListener('click', async () => {
    const current = await loadState();
    const newActive = !current.focusActive;

    // Mark manual override so auto-sync doesn't undo it
    await chrome.storage.local.set({ manualOverride: newActive });

    await chrome.runtime.sendMessage({ type: 'SET_FOCUS_ACTIVE', active: newActive });
    const updated = await loadState();
    renderState(updated);
  });

  // Open options page
  document.getElementById('options-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('manage-sites').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

document.addEventListener('DOMContentLoaded', init);
