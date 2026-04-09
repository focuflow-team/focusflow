/**
 * FocusFlow Blocker — Background Service Worker (Manifest V3)
 *
 * Manages:
 *  - Dynamic declarativeNetRequest rules for blocked sites
 *  - Focus mode state (active/inactive)
 *  - Timer state sync from FocusFlow webapp (via content script messages)
 *  - Alarm-based polling for webapp timer sync
 */

const ALARM_NAME = 'focusflow-sync';
const SYNC_INTERVAL_MINUTES = 1; // Poll webapp timer state every minute

// ──────────────────────────────────────────────────────────────────────────────
// Initialization
// ──────────────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  // Set defaults if not already stored
  const existing = await chrome.storage.local.get(['focusActive', 'blockedSites', 'timerState']);

  if (existing.focusActive === undefined) {
    await chrome.storage.local.set({ focusActive: false });
  }

  if (!existing.blockedSites) {
    await chrome.storage.local.set({
      blockedSites: [
        'youtube.com',
        'twitter.com',
        'x.com',
        'reddit.com',
        'facebook.com',
        'instagram.com',
        'tiktok.com',
        'news.ycombinator.com',
      ],
    });
  }

  // Apply current state
  await applyBlockingRules();

  // Start sync alarm
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: SYNC_INTERVAL_MINUTES });
});

// Restore alarm on service worker restart
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.get(ALARM_NAME, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: SYNC_INTERVAL_MINUTES });
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Alarm — periodic webapp sync
// ──────────────────────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await syncWithWebapp();
  }
});

async function syncWithWebapp() {
  // Try to find an active FocusFlow tab and query its timer state
  const tabs = await chrome.tabs.query({ url: [
    'http://localhost:3000/*',
    'https://focusflow.app/*',
    'https://*.focusflow.app/*',
    'https://*.vercel.app/*',
  ]});

  for (const tab of tabs) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_TIMER_STATE' });
      if (response && response.timerState) {
        await handleWebappTimerState(response.timerState);
        break;
      }
    } catch {
      // Tab might not have content script injected yet — ignore
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Message handling (from popup, options page, content script)
// ──────────────────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'GET_STATE': {
        const state = await chrome.storage.local.get(['focusActive', 'blockedSites', 'timerState', 'webappTimerState']);
        sendResponse({ success: true, ...state });
        break;
      }

      case 'SET_FOCUS_ACTIVE': {
        await chrome.storage.local.set({ focusActive: message.active });
        await applyBlockingRules();
        // Broadcast to all extension pages
        sendResponse({ success: true });
        break;
      }

      case 'UPDATE_BLOCKED_SITES': {
        await chrome.storage.local.set({ blockedSites: message.sites });
        await applyBlockingRules();
        sendResponse({ success: true });
        break;
      }

      case 'WEBAPP_TIMER_STATE': {
        // Message from content script with timer state from FocusFlow webapp
        await handleWebappTimerState(message.timerState);
        sendResponse({ success: true });
        break;
      }

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  })();

  // Return true to indicate async response
  return true;
});

// ──────────────────────────────────────────────────────────────────────────────
// Webapp timer state handling
// ──────────────────────────────────────────────────────────────────────────────

async function handleWebappTimerState(timerState) {
  await chrome.storage.local.set({ webappTimerState: timerState });

  const { focusActive } = await chrome.storage.local.get('focusActive');
  const webappRunning = timerState.status === 'running' && timerState.phase === 'work';

  // Auto-enable focus mode when webapp timer starts work phase
  if (webappRunning && !focusActive) {
    await chrome.storage.local.set({ focusActive: true });
    await applyBlockingRules();
  }

  // Auto-disable focus mode when webapp timer stops (only if it was auto-enabled)
  if (!webappRunning && focusActive && timerState.source === 'webapp') {
    // Only auto-disable if webapp was the source (don't override manual toggle)
    const manualOverride = (await chrome.storage.local.get('manualOverride')).manualOverride;
    if (!manualOverride) {
      await chrome.storage.local.set({ focusActive: false });
      await applyBlockingRules();
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// declarativeNetRequest rule management
// ──────────────────────────────────────────────────────────────────────────────

async function applyBlockingRules() {
  const { focusActive, blockedSites } = await chrome.storage.local.get(['focusActive', 'blockedSites']);

  // Remove all existing dynamic rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existingRules.map(r => r.id);

  if (!focusActive || !blockedSites?.length) {
    if (removeIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds });
    }
    updateBadge(false);
    return;
  }

  // Build new rules from blocked sites list
  const addRules = blockedSites.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/blocked.html' },
    },
    condition: {
      urlFilter: `*${site}/*`,
      resourceTypes: ['main_frame'],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules,
  });

  updateBadge(true);
}

function updateBadge(active) {
  if (active) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}
