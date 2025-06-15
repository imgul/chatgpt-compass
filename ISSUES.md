# ChatGPT Compass Issues

## Issue #1: chrome.runtime.lastError showing "[object Object]" instead of readable error message

**Priority:** High  
**Type:** Bug  
**Status:** Fixed  
**Created:** 2024-12-19

### Description
The extension is logging `chrome.runtime.lastError` directly, which results in "[object Object]" being displayed in the console instead of the actual error message. This makes debugging difficult.

### Error Log
```
ChatGPT Compass: Error opening sidepanel: [object Object]
```

### Root Cause
`chrome.runtime.lastError` is an object with a `message` property. Logging the object directly doesn't show the error message.

### Expected Behavior
Error logs should show the actual error message, e.g.:
```
ChatGPT Compass: Error opening sidepanel: Cannot access contents of url "chrome://newtab/"
```

### Solution
Extract the error message using `chrome.runtime.lastError.message` before logging.

### Code Location
- File: `src/background/background.ts`
- Function: `chrome.action.onClicked.addListener`
- Multiple error logging statements need updating

### Acceptance Criteria
- [x] All error logs show readable error messages
- [x] No more "[object Object]" in console logs
- [x] Error handling maintains same functionality
- [x] Add proper error message extraction throughout the codebase

### Resolution
Fixed by extracting the actual error message using `chrome.runtime.lastError.message` instead of logging the entire object. Updated all instances in the background script.

---

## Issue #2: "No active side panel for tabId" error despite sidepanel being enabled

**Priority:** High  
**Type:** Bug  
**Status:** Fixed  
**Created:** 2024-12-19

### Description
Even after successfully enabling the sidepanel for a ChatGPT tab, attempting to open it results in "No active side panel for tabId" error.

### Error Log
```
ChatGPT Compass: Enabled sidepanel for ChatGPT tab 737707504
ChatGPT Compass: Error opening sidepanel: No active side panel for tabId: 737707504
```

### Root Cause
The sidepanel.setOptions() and sidepanel.open() are called in nested callbacks, which may be causing timing or state issues. The sidepanel might not be fully "active" immediately after being enabled.

### Solution
Enable sidepanel for all ChatGPT tabs when they load, then simply open on click without re-enabling.

---

## Issue #3: User gesture lost in fallback sidepanel opening

**Priority:** High  
**Type:** Bug  
**Status:** Fixed  
**Created:** 2024-12-19

### Description
The fallback sidepanel opening fails with "sidePanel.open() may only be called in response to a user gesture" because the nested callback breaks the user gesture context.

### Error Log
```
ChatGPT Compass: Fallback also failed: `sidePanel.open()` may only be called in response to a user gesture.
```

### Root Cause
Multiple nested callbacks in the click handler break the user gesture chain, making Chrome think the fallback call is not in response to user action.

### Solution
Simplify the click handler and pre-enable sidepanels to avoid nested calls during user gesture.

### Resolution Issues #2 & #3
Fixed by implementing a two-phase approach:
1. **Pre-enable sidepanels**: Enable sidepanels immediately when ChatGPT tabs load or when extension installs
2. **Simplified click handler**: Remove nested callbacks that break user gesture context
3. **Early enabling**: Enable sidepanel on 'loading' status, not waiting for 'complete'
4. **Existing tab support**: Enable sidepanel for any existing ChatGPT tabs on extension install

This ensures sidepanels are ready before user clicks, eliminating timing issues and maintaining user gesture context. 