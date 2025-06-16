let extensionActive = false; // Tracks the current state

// Function to extract text from the page
function extractPageText() {
  // A more sophisticated approach might be needed for complex pages,
  // but this will get most of the visible text.
  return document.body.innerText || "";
}

const UI_ELEMENT_ID = 'falsehood-detector-results-container';
let messageTimeout = null; // To manage auto-hiding messages

function removeGeneratedUI() {
  console.log("Content: Attempting to remove UI elements.");
  const existingElement = document.getElementById(UI_ELEMENT_ID);
  if (existingElement) {
    existingElement.remove();
    console.log("Content: Results UI element removed.");
  }
  if (messageTimeout) {
    clearTimeout(messageTimeout);
    messageTimeout = null;
  }
}

function displayMessageOnPage(message, type = 'info', persistent = false) {
  removeGeneratedUI(); // Clear previous messages/results

  const container = document.createElement('div');
  container.id = UI_ELEMENT_ID;
  container.style.position = 'fixed';
  container.style.top = '10px';
  container.style.left = '50%';
  container.style.transform = 'translateX(-50%)';
  container.style.padding = '10px 20px';
  container.style.borderRadius = '5px';
  container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  container.style.zIndex = '99999'; // High z-index
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '14px';
  container.style.textAlign = 'center';

  switch (type) {
    case 'error':
      container.style.backgroundColor = '#ffdddd';
      container.style.color = '#d8000c';
      container.style.border = '1px solid #d8000c';
      break;
    case 'warning':
      container.style.backgroundColor = '#fff3cd';
      container.style.color = '#856404';
      container.style.border = '1px solid #ffeeba';
      break;
    case 'success':
      container.style.backgroundColor = '#d4edda';
      container.style.color = '#155724';
      container.style.border = '1px solid #c3e6cb';
      break;
    default: // info
      container.style.backgroundColor = '#e7f3fe';
      container.style.color = '#0c5460';
      container.style.border = '1px solid #b8daff';
  }

  container.textContent = message;
  document.body.appendChild(container);
  console.log(`Content: Displaying message - Type: ${type}, Message: ${message}`);

  if (!persistent) {
    messageTimeout = setTimeout(() => {
      if (container && container.parentNode) {
        container.remove();
      }
      messageTimeout = null;
    }, 5000); // Auto-hide after 5 seconds if not persistent
  }
}

function displayProbabilityOnPage(probabilityText) {
  removeGeneratedUI(); // Clear previous messages/results

  let message;
  let type = 'info';

  if (probabilityText === null || typeof probabilityText === 'undefined') {
    message = "Could not determine probability.";
    type = 'warning';
  } else if (String(probabilityText).toUpperCase() === "N/A") {
    message = "Probability assessment: N/A (Not Applicable or Undeterminable)";
    type = 'info';
  } else {
    const numericProb = parseFloat(probabilityText);
    if (!isNaN(numericProb)) {
      // Basic progress bar simulation with text
      const barLength = 20;
      const filledLength = Math.round((numericProb / 100) * barLength);
      const emptyLength = barLength - filledLength;
      const progressBar = `[${'❚'.repeat(filledLength)}${'-'.repeat(emptyLength)}]`;
      message = `Falsehood Probability: ${numericProb}% ${progressBar}`;
      type = 'success'; // Using success style for the result display
    } else {
      message = `Received unexpected probability format: ${probabilityText}`;
      type = 'warning';
    }
  }
  // Make the probability display persistent until next analysis or turned off
  displayMessageOnPage(message, type, true);
}

// Update the `processPage` function's response handling to use these new display functions
function processPage() {
  if (extensionActive) {
    console.log("Content: Extension is active. Attempting to process page.");
    // Clear previous results before starting a new analysis
    removeGeneratedUI();
    displayMessageOnPage("Analyzing text...", "info", true); // Show "Analyzing" message

    chrome.storage.sync.get('apiKey', function(data) {
      if (chrome.runtime.lastError) {
        console.error("Content: Error checking API key:", chrome.runtime.lastError.message);
        displayMessageOnPage(`Error checking API key: ${chrome.runtime.lastError.message}`, "error", true);
        return;
      }
      if (!data.apiKey) {
        console.warn("Content: API Key not found. Cannot process page.");
        displayMessageOnPage("API Key is missing. Please set it in the extension popup.", "error", true);
        return;
      }

      const pageText = extractPageText();
      // Limit text sent to OpenAI to avoid overly long requests (e.g., first 10000 characters)
      // This is a simple truncation; more sophisticated chunking might be needed for very long pages.
      const maxChars = 10000;
      const truncatedText = pageText.substring(0, maxChars);

      if (truncatedText.trim().length > 50) {
        console.log("Content: Extracted Text (first 100 chars for sending):", truncatedText.substring(0, 100));
        chrome.runtime.sendMessage(
          { action: 'analyzeTextWithOpenAI', text: truncatedText },
          function (response) {
            removeGeneratedUI(); // Remove "Analyzing..." message
            if (chrome.runtime.lastError) {
              console.error("Content: Error sending/receiving msg:", chrome.runtime.lastError.message);
              displayMessageOnPage(`Error: ${chrome.runtime.lastError.message}`, "error", true);
              return;
            }
            if (response) {
              if (response.error) {
                console.error('Content: Received error from background:', response.error);
                displayMessageOnPage(`Analysis Error: ${response.error}`, "error", true);
              } else if (typeof response.probability !== 'undefined') { // Check for undefined explicitly
                console.log('Content: Received probability from background:', response.probability);
                displayProbabilityOnPage(response.probability);
              } else {
                console.warn('Content: Received undefined or unexpected response structure from background.');
                displayMessageOnPage("Received an unexpected response from the analysis service.", "warning", true);
              }
            } else {
                console.warn('Content: Received null/empty response from background script.');
                displayMessageOnPage("No response from analysis service.", "warning", true);
            }
          }
        );
      } else {
        removeGeneratedUI(); // Remove "Analyzing..." message
        console.log("Content: Not enough text found on the page to analyze.");
        displayMessageOnPage("Not enough text on the page to analyze (min 50 chars).", "info", false);
      }
    });
  } else {
    console.log("Content: Extension is not active. No processing.");
    removeGeneratedUI(); // Ensure UI is cleared if extension becomes inactive
  }
}

// Update the 'setEnabled' message listener to also clear UI if disabled
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'setEnabled') {
    const oldState = extensionActive;
    extensionActive = request.enabled;
    console.log(`Content: Message received. Extension state changed from ${oldState} to ${extensionActive}.`);
    if (extensionActive) {
      // console.log("Content: Extension is now ON. Page processing can be triggered via Alt+P or automatically if designed so.");
    } else {
      console.log("Content: Extension is now OFF. Clearing any generated UI.");
      removeGeneratedUI();
    }
    sendResponse({ status: `Content script state updated to ${extensionActive}` });
  }
  // Important: If you have other message types, ensure this listener doesn't break them
  // or consider having separate listeners if logic becomes too complex.
  return true; // Important for asynchronous sendResponse
});


// Check initial state when the content script loads
chrome.storage.sync.get(['extensionEnabled', 'apiKey'], function (data) {
  if (chrome.runtime.lastError) {
    console.error("Error retrieving settings in content.js:", chrome.runtime.lastError);
    return;
  }
  extensionActive = !!data.extensionEnabled; // Ensure boolean
  const currentApiKey = data.apiKey;
  console.log(`Falsehood Detector: Initial state loaded. Active: ${extensionActive}, API Key present: ${!!currentApiKey}`);

  // If the extension was already active (e.g., after a page reload),
  // and an API key is present, you might want to trigger processing.
  // This depends on the desired UX.
  if (extensionActive && currentApiKey) {
    // processPage(); // Uncomment if you want to process on load if already active
    console.log("Falsehood Detector: Ready to process on demand or if triggered.");
  } else if (extensionActive && !currentApiKey) {
    console.log("Falsehood Detector: Active, but API key is missing. Waiting for API key.");
  }
});

// Keep the Alt+P trigger for testing, but ensure it calls the modified processPage
document.addEventListener('keydown', function(event) {
  if (event.key === 'P' && event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey) { // Alt+P
    console.log("Falsehood Detector: Alt+P pressed. Triggering page process.");
    event.preventDefault(); // Prevent default browser action for Alt+P
    processPage();
  }
});

// Ensure UI is removed if the script is re-injected or page is reloaded and extension is off
chrome.storage.sync.get('extensionEnabled', function(data) {
  if (chrome.runtime.lastError) {
    // Even if storage fails, it's probably safer to assume it might be disabled
    // or rely on the next load's message passing to clear UI.
    // For now, just log it, as showing an error on page load without user action might be intrusive.
    console.warn("Content: Could not check initial enabled state for UI cleanup:", chrome.runtime.lastError.message);
  } else if (!data.extensionEnabled) {
    removeGeneratedUI();
  }
});

console.log("Falsehood Detector: content.js (with UI display functions) loaded.");
