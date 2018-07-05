var endpointSettings = {
	searchTweetsUrl: "http://localhost:65500/tweets/byurl/",
	tweetContainerSelector: "#tweetContainer",
	tweetPaginatorSelector: "#tweetPaginator"
};

twttr.ready(function() {
	// Get current active tab url
	var query = { active: true, currentWindow: true };
	chrome.tabs.query(query, paginateTweets);
});

function paginateTweets(urls) {
	var currentUrl = urls[0].url;
	jQuery.ajax({
		type: "POST",
		url: endpointSettings.searchTweetsUrl,
		accepts: "application/json",
		contentType: "application/json",
		data: JSON.stringify(currentUrl),
		success: function(result) {
			console.log("Tweets found: " + result.length);
			renderPaginator(endpointSettings.tweetPaginatorSelector, endpointSettings.tweetContainerSelector, result, renderTweet);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("Error: " + textStatus + " -- " + errorThrown);
			jQuery(endpointSettings.tweetContainerSelector)
				.append("<p>Sorry, no data for this URL yet. Try again later.</p>");
		}
	});
};

function renderTweet(tweet, containerSelector) {
	var tweetId = tweet.id;
	var container = jQuery(containerSelector);
	if(container.length > 0) {
		twttr.widgets.createTweet(
	  		tweetId,
			container.get(0),
			{
				align: 'center',
				cards: 'hidden',
				conversation: 'none',
				width: 350
			}
		).then(function (el) {
			console.log("Tweet #" + tweetId + " rendered");
		});
	}
};

function renderPaginator(paginatorSelector, containerSelector, data, callback) {
	var paginator = jQuery(paginatorSelector);
	if(paginator.length > 0) {
		paginator.pagination({
		    dataSource: data,
		    totalNumber: data.length,
		    pageSize: 2,
		    className: 'paginationjs-small paginationjs-theme-blue',
		    showNavigator: true,
		    formatNavigator: '(<%= totalNumber %> entries)',
		    callback: function(data, pagination) {
		    	jQuery(containerSelector).empty();
		    	data.forEach(function(item) {
		    		callback(item, containerSelector);
		    	});
		    }
		});
	}
}