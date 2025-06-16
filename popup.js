document.addEventListener('DOMContentLoaded', function () {
  const onOffSwitch = document.getElementById('onOffSwitch');
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyButton = document.getElementById('saveApiKey');
  const apiKeyStatus = document.getElementById('apiKeyStatus'); // For save status
  const generalStatus = document.createElement('div'); // For general feedback
  generalStatus.style.marginTop = '5px';
  generalStatus.style.fontSize = '0.9em';
  document.querySelector('.container').appendChild(generalStatus); // Add to container

  function showGeneralStatus(message, type = 'info') {
    generalStatus.textContent = message;
    switch (type) {
      case 'error':
        generalStatus.style.color = 'red';
        break;
      case 'warning':
        generalStatus.style.color = 'orange';
        break;
      default:
        generalStatus.style.color = 'green';
    }
    if (message) {
        setTimeout(() => {
            generalStatus.textContent = ''; // Clear after a delay
        }, 4000);
    }
  }

  function showApiKeyStatus(message, type = 'info') {
    apiKeyStatus.textContent = message;
    apiKeyStatus.style.color = type === 'error' ? 'red' : 'green';
    setTimeout(() => {
      apiKeyStatus.textContent = '';
    }, 3000);
  }

  // Load saved settings
  chrome.storage.sync.get(['extensionEnabled', 'apiKey'], function (data) {
    if (chrome.runtime.lastError) {
        showGeneralStatus('Error loading settings.', 'error');
        console.error("Error loading settings:", chrome.runtime.lastError.message);
        return;
    }
    onOffSwitch.checked = !!data.extensionEnabled; // Ensure boolean
    if (data.apiKey) {
      apiKeyInput.value = data.apiKey;
    }
    // Check if enabled but API key is missing
    if (onOffSwitch.checked && !data.apiKey) {
        showGeneralStatus('Extension is ON but API key is missing.', 'warning');
    }
  });

  // Save on/off state
  onOffSwitch.addEventListener('change', function () {
    const isEnabled = onOffSwitch.checked;
    chrome.storage.sync.get('apiKey', function(data) {
        if (chrome.runtime.lastError) {
            showGeneralStatus('Error checking API key.', 'error');
            console.error("Error checking API key:", chrome.runtime.lastError.message);
            onOffSwitch.checked = !isEnabled; // Revert UI change
            return;
        }
        if (isEnabled && !data.apiKey) {
            showGeneralStatus('Cannot enable without an API key. Please save an API key first.', 'error');
            onOffSwitch.checked = false; // Prevent enabling
            return; // Don't save or send message
        }

        // If all good, or disabling
        chrome.storage.sync.set({ extensionEnabled: isEnabled }, function () {
            if (chrome.runtime.lastError) {
                showGeneralStatus(`Error saving state: ${chrome.runtime.lastError.message}`, 'error');
                console.error("Error saving state:", chrome.runtime.lastError.message);
                onOffSwitch.checked = !isEnabled; // Revert UI change
                return;
            }
            console.log('Extension enabled state saved:', isEnabled);
            showGeneralStatus(isEnabled ? 'Extension enabled.' : 'Extension disabled.', 'info');

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                action: 'setEnabled',
                enabled: isEnabled
                }, function(response) {
                if (chrome.runtime.lastError) {
                    console.warn("Popup: Could not send 'setEnabled' message to content script.", chrome.runtime.lastError.message);
                    // This error is often non-critical for the user if content script isn't on a valid page.
                } else if (response) {
                    console.log("Popup: Message sent to content script, response:", response.status);
                }
                });
            } else {
                console.error("Popup: Could not get active tab ID to send 'setEnabled' message.");
            }
            });
        });
    });
  });

  // Save API key
  saveApiKeyButton.addEventListener('click', function () {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ apiKey: apiKey }, function () {
        if (chrome.runtime.lastError) {
            showApiKeyStatus(`Error saving API key: ${chrome.runtime.lastError.message}`, 'error');
            console.error("Error saving API key:", chrome.runtime.lastError.message);
            return;
        }
        showApiKeyStatus('API Key saved!', 'success');
        console.log('API Key saved.');
        // If extension was pending activation due to missing key, inform user they can now enable it.
        if (!onOffSwitch.checked) {
            showGeneralStatus('API Key saved. You can now enable the extension.', 'info');
        } else {
             // If it was on, but key was missing, and now it's added, maybe trigger an update or re-check.
             // For now, just a positive message.
            showGeneralStatus('API Key updated.', 'info');
        }
      });
    } else {
      showApiKeyStatus('Please enter an API key.', 'error');
    }
  });
});
