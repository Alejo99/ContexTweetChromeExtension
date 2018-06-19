var settings = {
	searchTweetsEndpoint: "http://localhost:65500/tweets/byurl/1",
	tweetContainerId: "tweetContainer" 
};

twttr.ready(function() {
	// Get current active tab url
	var query = { active: true, currentWindow: true };
	chrome.tabs.query(query, loadTweets);
});

function loadTweets(urls) {
	var currentUrl = urls[0].url
	// Send request to backend service
	console.log("Searching tweets for url " + currentUrl);
	jQuery.ajax({
		type: "POST",
		url: settings.searchTweetsEndpoint,
		accepts: "application/json",
		contentType: "application/json",
		data: JSON.stringify(currentUrl),
		success: function(result) {
			console.log("Tweets found: " + result.tweets.length)
			// If there are results
			if (result.tweets.length > 0) {
				// Render tweets
				result.tweets.forEach(function(tw) {
					renderTweet(tw.id)
				});
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("Error: " + textStatus + " -- " + errorThrown);
			jQuery("#" + settings.tweetContainerId).append("<p>Sorry, no data for this URL yet. Try again later.</p>")
		}
	});
};

function renderTweet(tweetId) {
	twttr.widgets.createTweet(
  		tweetId,
		document.getElementById(settings.tweetContainerId),
		{
			align: 'center',
			cards: 'hidden',
			conversation: 'none',
			width: 350
		})
	.then(function (el) {
		console.log("Tweet rendered")
	});
};