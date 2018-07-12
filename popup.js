var endpointSettings = {
	searchTweetsUrl: "http://localhost:65500/tweets/byurl/",
	tweetContainerSelector: "#tweetContainer",
	tweetPaginatorSelector: "#tweetPaginator"
};

twttr.ready(function() {
	// Load handlebars templates
	loadTemplates();
	// Get current active tab url
	var query = { active: true, currentWindow: true };
	chrome.tabs.query(query, paginateTweets);
});

function loadTemplates() {
	jQuery.get("templates/tweetUnavailable.html", function(template) {
		endpointSettings.tweetUnavailableTemplate = Handlebars.compile(template);
	});
}

function paginateTweets(urls) {
	var currentUrl = urls[0].url.split('#')[0];
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
			if(jqXHR.status == 404) {
				jQuery(endpointSettings.tweetContainerSelector)
					.append("<p>No data for this URL yet. Please, try again later.</p>");
			} else {
				jQuery(endpointSettings.tweetContainerSelector)
					.append("<p>Unexpected server error. Please, try again later.</p>");
			}
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
			if(el == null) {
				//container.append("<div class='unavailable'><p id='" + tweetId + "'>Rendering error, Tweet " + tweetId + " is unavailable.</p></div>")
				container.append(endpointSettings.tweetUnavailableTemplate({tweetId: tweetId}));
				console.log("Tweet #" + tweetId + " not available.")
			}
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