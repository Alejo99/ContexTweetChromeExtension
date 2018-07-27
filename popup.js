var globalSettings = {
	searchTweetsUrl: "http://localhost:65500/tweets/byurl/",
	tweetContainerSelector: "#tweetContainer",
	tweetPaginatorSelector: "#tweetPaginator",
	searchNersUrl: "http://localhost:65500/namedentities/byurl",
	nerContainerSelector: "#nersContainer",
	searchUrlNer: "http://localhost:65500/urls/bynamedentity",
	nerUrlContainerSelector: "#ners #urlsContainer",
	nerCloseUrlButtonSelector: ".close-button",
	searchSentimentScoresUrl: "http://localhost:65500/urls/sentiment",
	sentimentContainerSelector: "#sentimentContainer"
};

twttr.ready(function() {
	// Load handlebars templates and helpers
	setupHandlebars();
	// Get current active tab url and load UI
	var query = { active: true, currentWindow: true };
	chrome.tabs.query(query, loadMain);
});

function setupHandlebars() {
	Handlebars.registerHelper('trimString', function(str, nChars) {
		var ret = str.substring(0,nChars);
		if(str.length > nChars) {
			ret += "...";
		}
		return new Handlebars.SafeString(ret);
	});
	Handlebars.registerHelper('replaceStringWhitespaces', function(str, strToReplace) {
		return new Handlebars.SafeString(str.replace(" ", strToReplace));
	});
	jQuery.get("templates/tweetUnavailable.html", function(template) {
		globalSettings.tweetUnavailableTemplate = Handlebars.compile(template);
	});
	jQuery.get("templates/neOnlyThisUrl.html", function(template) {
		globalSettings.namedEntityOnlyOneUrlTemplate = Handlebars.compile(template);
	});
	jQuery.get("templates/keyword.html", function(template) {
		globalSettings.nerTemplate = Handlebars.compile(template);
	});
	jQuery.get("templates/keywordUrls.html", function(template) {
		globalSettings.namedEntityUrlsTemplate = Handlebars.compile(template);
	});
	jQuery.get("templates/sentimentSlider.html", function(template) {
		globalSettings.sentimentSliderTemplate = Handlebars.compile(template);
	});
};

function loadMain(urls) {
	globalSettings.currentUrl = urls[0].url.split('#')[0];
	loadNers()
	loadSentiment();
	loadTweets();
};

function loadNers() {
	jQuery.ajax({
		type: "GET",
		url: globalSettings.searchNersUrl,
		accepts: "application/json",
		data: { url: globalSettings.currentUrl },
		success: function(result) {
			console.log("Named entities found: " + result.length)
			var namedEntities = result.slice(0,10);
			renderNamedEntities(namedEntities);
			enableNamedEntitiesClick(namedEntities);
			enableCloseUrlsBox();
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("Error: " + textStatus + " -- " + errorThrown);
			if(jqXHR.status == 404) {
				jQuery(globalSettings.nerContainerSelector)
					.append("<p>No keywords for this page yet. Please, try again later.</p>");
			} else {
				jQuery(globalSettings.nerContainerSelector)
					.append("<p>Unexpected server error. Please, try again later.</p>");
			}
		}
	});
};

function renderNamedEntities(namedEntities) {
	jQuery(globalSettings.nerContainerSelector)
		.append(globalSettings.nerTemplate({keywords: namedEntities}));
};

function enableNamedEntitiesClick(namedEntities) {
	namedEntities.forEach(function(ne) {
		jQuery("#kw-" + ne.replace(" ", "-")).on("click", function() {
			loadNamedEntityUrls(ne);
		});
	});
};

function enableCloseUrlsBox() {
	jQuery(globalSettings.nerUrlContainerSelector).on("click", globalSettings.nerCloseUrlButtonSelector, function() {
		var container = jQuery(globalSettings.nerUrlContainerSelector);
		container.removeClass('active');
	});
};

function loadNamedEntityUrls(neText) {
	var container = jQuery(globalSettings.nerUrlContainerSelector);
	if(container.hasClass('active') && container.attr('data-value') == neText) {
		container.removeClass('active');
	} else {
		if (!container.hasClass('active')) {
			container.addClass('active');
		}
		container.attr('data-value', neText);
		jQuery.ajax({
			type: "GET",
			url: globalSettings.searchUrlNer,
			accepts: "application/json",
			data: { excludeUrl: globalSettings.currentUrl, namedEntityText: neText },
			success: function(result) {
				console.log(result.length + " urls for named entity " + neText)
				renderNamedEntityUrls(neText, result.slice(0,10));
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log("Error: " + textStatus + " -- " + errorThrown);
				if(jqXHR.status == 404) {
					container.html(globalSettings.namedEntityOnlyOneUrlTemplate({namedEntityText: neText}));
				} else {
					container.html('<div id="urlsWrapper"><h3>Unexpected server error. Please, try again later.</h3></div>');
				}
			}
		});
	}
};

function renderNamedEntityUrls(neText, links) {
	container = jQuery(globalSettings.nerUrlContainerSelector);
	container.html(globalSettings.namedEntityUrlsTemplate({urls: links, namedEntityText: neText}))
};

function loadSentiment() {
	jQuery.ajax({
		type: "GET",
		url: globalSettings.searchSentimentScoresUrl,
		accepts: "application/json",
		data: { url: globalSettings.currentUrl },
		success: function(result) {
			console.log("Average sentiment score is: " + result.average)
			renderSentimentSlider(result.average);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("Error: " + textStatus + " -- " + errorThrown);
			if(jqXHR.status == 404) {
				jQuery(globalSettings.sentimentContainerSelector)
					.append("<p>No opinion score for this page yet. Please, try again later.</p>");
			} else {
				jQuery(globalSettings.sentimentContainerSelector)
					.append("<p>Unexpected server error. Please, try again later.</p>");
			}
		}
	});
};

function renderSentimentSlider(sentimentScore) {
	var container = jQuery(globalSettings.sentimentContainerSelector);
	var opts = getSentimentOptions(sentimentScore);
	var normalizedScore = ((sentimentScore+1) * 10) / 2;
	var roundedScore = Math.round(normalizedScore * 100) / 100;
	container.append(globalSettings.sentimentSliderTemplate({average: roundedScore, options: opts}));
};

function getSentimentOptions(sentimentScore) {
	var options = { 
		veryPos: false, 
		pos: false, 
		neutral: false, 
		neg: false, 
		veryNeg: false
	};
	if (sentimentScore >= 0.6) {
		options.veryPos = true;
	} else if (sentimentScore > 0.05) {
		options.pos = true;
	} else if (sentimentScore >= -0.05) {
		options.neutral = true;
	} else if (sentimentScore >= -0.6) {
		options.neg = true;
	} else {
		options.veryNeg = true;
	}
	return options
};

function loadTweets() {
	jQuery.ajax({
		type: "GET",
		url: globalSettings.searchTweetsUrl,
		accepts: "application/json",
		data: { url: globalSettings.currentUrl },
		success: function(result) {
			console.log("Tweets found: " + result.length);
			renderTweetPaginator(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("Error: " + textStatus + " -- " + errorThrown);
			if(jqXHR.status == 404) {
				jQuery(globalSettings.tweetContainerSelector)
					.append("<p>No tweets for this page yet. Please, try again later.</p>");
			} else {
				jQuery(globalSettings.tweetContainerSelector)
					.append("<p>Unexpected server error. Please, try again later.</p>");
			}
		}
	});
};

function renderTweetPaginator(data, callback) {
	var paginator = jQuery(globalSettings.tweetPaginatorSelector);
	if(paginator.length > 0) {
		paginator.pagination({
		    dataSource: data,
		    totalNumber: data.length,
		    pageSize: 2,
		    className: 'paginationjs-small paginationjs-theme-blue',
		    showNavigator: true,
		    formatNavigator: '(<%= totalNumber %> entries)',
		    callback: function(data, pagination) {
		    	jQuery(globalSettings.tweetContainerSelector).empty();
		    	data.forEach(function(item) {
		    		renderTweet(item);
		    	});
		    }
		});
	}
};

function renderTweet(tweet) {
	var tweetId = tweet.id;
	var container = jQuery(globalSettings.tweetContainerSelector);
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
				container.append(globalSettings.tweetUnavailableTemplate({tweetId: tweetId}));
				console.log("Tweet #" + tweetId + " not available.")
			} else {
				console.log("Tweet #" + tweetId + " rendered");
			}
		});
	}
};