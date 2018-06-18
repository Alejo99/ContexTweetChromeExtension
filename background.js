/*
// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
	// Send request to backend service
	console.log("Sending xmlhttpreq for url " + tab.url);
	jQuery.ajax({
		type: "POST",
		url: "http://localhost:65500/tweets/byurl",
		accepts: "application/json",
		contentType: "application/json",
		data: JSON.stringify(tab.url),
		success: function(result) {
			console.log("Result: " + result)
			// If the tab url was found ...
			if (result.length > 0) {
				// ... show the page action.
				console.log("Showing pageAction for tab " + tab.url);
				chrome.pageAction.show(tabId);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("Error: " + textStatus + " -- " + errorThrown);
		}
	});
};

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);
*/
if (jQuery !== "undefined") console.log("jQuery loaded");