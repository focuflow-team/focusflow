/**
 * FocusFlow Blocker — Content Script
 *
 * Injected into FocusFlow webapp pages.
 * Reads timer state from localStorage and forwards it to the background service worker.
 */

const TIMER_STATE_KEY = 'focusflow_timer_state';
const REPORT_INTERVAL_MS = 5000; // Report every 5 seconds while page is visible

function readTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function reportTimerState() {
  const timerState = readTimerState();
  if (!timerState) return;

  chrome.runtime.sendMessage({
    type: 'WEBAPP_TIMER_STATE',
    timerState: { ...timerState, source: 'webapp' },
  }).catch(() => {
    // Background service worker may be sleeping — ignore
  });
}

// Respond to background polling requests
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_TIMER_STATE') {
    const timerState = readTimerState();
    sendResponse({ timerState: timerState ? { ...timerState, source: 'webapp' } : null });
  }
  return true;
});

// Report on interval while page is active
let intervalId = setInterval(reportTimerState, REPORT_INTERVAL_MS);

// Pause reporting when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    clearInterval(intervalId);
  } else {
    reportTimerState(); // Immediate report on tab restore
    intervalId = setInterval(reportTimerState, REPORT_INTERVAL_MS);
  }
});

// Initial report
reportTimerState();
