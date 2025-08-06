document.addEventListener('DOMContentLoaded', function() {
  const emailInput = document.getElementById('email');
  const saveButton = document.getElementById('saveEmail');
  const testButton = document.getElementById('testConnection');
  const statusDiv = document.getElementById('status');

  // Load saved email
  chrome.storage.sync.get(['email'], function(result) {
    if (result.email) {
      emailInput.value = result.email;
    }
  });

  // Save email
  saveButton.addEventListener('click', function() {
    const email = emailInput.value.trim();
    if (!email) {
      showStatus('Please enter a valid email address.', 'error');
      return;
    }

    chrome.storage.sync.set({email: email}, function() {
      showStatus('Email saved successfully!', 'success');
    });
  });

  // Test backend connection
  testButton.addEventListener('click', function() {
    showStatus('Testing connection...', 'info');
    
    const testData = {
      email: emailInput.value || 'test@example.com',
      platform: 'test',
      problemTitle: 'Test Problem',
      problemSlug: 'test-problem',
      submissionTime: new Date().toISOString(),
      attempts: 1
    };

    chrome.runtime.sendMessage({
      type: 'submitData',
      data: testData
    }, function(response) {
      if (response && response.success) {
        showStatus('Backend connection successful!', 'success');
      } else {
        showStatus('Backend connection failed: ' + (response?.error || 'Unknown error'), 'error');
      }
    });
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
  }
});
