// background.js

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'analyzeTextWithOpenAI') {
    console.log('Background: Received text for analysis from content script:', request.text.substring(0, 100) + '...');
    chrome.storage.sync.get(['apiKey', 'extensionEnabled'], async function (data) {
      if (chrome.runtime.lastError) {
        console.error('Background: Error retrieving settings from storage:', chrome.runtime.lastError.message);
        sendResponse({ error: `Storage error: ${chrome.runtime.lastError.message}` });
        return true; // Still need to return true as sendResponse might be async if no error
      }
      if (!data.extensionEnabled) {
        console.log('Background: Extension is disabled. Aborting OpenAI call.');
        sendResponse({ error: 'Extension disabled.' });
        return true;
      }
      if (!data.apiKey) {
        console.error('Background: API Key not found in storage.');
        sendResponse({ error: 'API Key not found. Please set it in the extension popup.' });
        return true;
      }

      const apiKey = data.apiKey;
      const textToAnalyze = request.text;

      console.log('Background: Making OpenAI API call...');
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo', // Or another suitable model
            messages: [
              {
                role: 'system',
                content: 'You are an assistant that evaluates the likelihood of a given text being false or misleading. Respond only with a numerical percentage value representing this probability (e.g., "75" for 75%). If you cannot determine a probability or the text is too short/vague, respond with "N/A".'
              },
              {
                role: 'user',
                content: `Here is a piece of text: "${textToAnalyze}"

Based on the content of this text, what is the probability, as a percentage, that the information presented is false or misleading?`
              }
            ],
            max_tokens: 10, // Expecting a short response
            temperature: 0.2 // Low temperature for more deterministic output
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response from OpenAI API.' }));
          console.error('Background: OpenAI API Error:', response.status, errorData);
          let errorMessage = `OpenAI API Error: ${response.status}`;
          if (errorData && errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          } else if (response.status === 401) {
            errorMessage = 'Invalid OpenAI API Key. Please check your key.';
          } else if (response.status === 429) {
            errorMessage = 'OpenAI API rate limit exceeded or quota reached.';
          }
          sendResponse({ error: errorMessage });
          return true;
        }

        const result = await response.json();
        console.log('Background: OpenAI API Success:', result);

        if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
          const probabilityText = result.choices[0].message.content.trim();
          console.log('Background: Probability text from OpenAI:', probabilityText);
          sendResponse({ probability: probabilityText });
        } else {
          console.error('Background: Unexpected response structure from OpenAI:', result);
          sendResponse({ error: 'Unexpected response structure from OpenAI.' });
        }

      } catch (error) {
        console.error('Background: Error during fetch to OpenAI:', error);
        sendResponse({ error: `Network or other error: ${error.message}` });
      }
    });
    return true; // Indicates that sendResponse will be called asynchronously.
  }
});

console.log("Falsehood Detector: background.js loaded and listener ready.");
