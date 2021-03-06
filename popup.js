var globalSettings = {
	searchTweetsUrl: "http://localhost:65500/tweets/byurl/",
	tweetContainerSelector: "#tweetContainer",
	tweetCountSelector: "#tweetCount",
	tweetPaginatorSelector: "#tweetPaginator",
	tweetFilterBySelector: "#tweetFilterBy",
	tweetFilterByValue: "no-filter",
	searchNersUrl: "http://localhost:65500/namedentities/byurl",
	nerContainerSelector: "#nersContainer",
	searchUrlNer: "http://localhost:65500/urls/bynamedentity",
	nerCountSelector: "#nerCount",
	nerUrlContainerSelector: "#ners #urlsContainer",
	nerCloseUrlButtonSelector: ".close-button",
	searchSentimentScoresUrl: "http://localhost:65500/urls/sentiment",
	sentimentContainerSelector: "#sentimentContainer",
	sentimentScoreSelector: "#sentimentScore"
};

twttr.ready(function() {
	// Load handlebars templates and helpers
	setupHandlebars();
	// Get current active tab url and load UI
	var query = { active: true, currentWindow: true };
	chrome.tabs.query(query, loadMain);
});

function setupHandlebars() {
	// Helpers
	Handlebars.registerHelper('trimString', function(str, nChars) {
		var ret = str.substring(0,nChars);
		if(str.length > nChars) {
			ret += "...";
		}
		return new Handlebars.SafeString(ret);
	});
	Handlebars.registerHelper('replaceStringWhitespaces', function(str, strToReplace) {
		return new Handlebars.SafeString(str.replace(/ /g, strToReplace).replace(/&/g, strToReplace));
	});
	// Templates
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
	jQuery.get("templates/sentimentScore.html", function(template) {
		globalSettings.sentimentScoreTemplate = Handlebars.compile(template);
	});
	jQuery.get("templates/tweetFilterBySelector.html", function(template) {
		globalSettings.tweetFilterByTemplate = Handlebars.compile(template);
	});
	jQuery.get("templates/ctxTwWrapperFooter.html", function(template) {
		globalSettings.tweetFooterTemplate = Handlebars.compile(template);
	});
};

function loadMain(urls) {
	var tab = urls[0];
	globalSettings.currentUrl = tab.url.split('#')[0];
	globalSettings.tabid = tab.id;
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
			jQuery(globalSettings.nerCountSelector).html("<h3>" + namedEntities.length + " terms</h3>");
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
		jQuery("#kw-" + ne.replace(/ /g, "-").replace(/&/g, "-")).on("click", function() {
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
			renderSentimentScore(result.average);
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

function renderSentimentScore(sentimentScore) {
	var container = jQuery(globalSettings.sentimentScoreSelector);
	var roundedScore = getNormalisedSentimentScore(sentimentScore);
	container.html(globalSettings.sentimentScoreTemplate({average: roundedScore}));
}

function getNormalisedSentimentScore(sentimentScore) {
	var normalizedScore = ((sentimentScore + 1) * 10) / 2;
	return Math.round(normalizedScore * 100) / 100;
}

function renderSentimentSlider(sentimentScore) {
	var container = jQuery(globalSettings.sentimentContainerSelector);
	var opts = getSentimentOptions(sentimentScore);
	container.append(globalSettings.sentimentSliderTemplate({options: opts}));
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
	} else if (sentimentScore > -0.6) {
		options.neg = true;
	} else {
		options.veryNeg = true;
	}
	return options
};

function loadTweets(refresh=false) {
	// get filter by value from selector (use default if selector not found)
	var filterBy = globalSettings.tweetFilterByValue;
	// load tweets filtered by selector value
	jQuery.ajax({
		type: "GET",
		url: globalSettings.searchTweetsUrl,
		accepts: "application/json",
		data: { url: globalSettings.currentUrl, filter: filterBy },
		success: function(result) {
			console.log("Tweets found: " + result.length);
			// show entries and selector
			jQuery(globalSettings.tweetCountSelector).html("<h3>" + result.length + " entries</h3>");
			if(!refresh) renderTweetFilterBySelector(result.length);
			renderTweetPaginator(result);
			
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("Error: " + textStatus + " -- " + errorThrown);
			if(jqXHR.status == 404) {
				jQuery(globalSettings.tweetContainerSelector)
					.html("<p style='text-align: left;'>No tweets were found. Please, try again later or use a different filter.</p>");
				jQuery(globalSettings.tweetCountSelector).html("<h3>0 entries</h3>");
				jQuery(globalSettings.tweetPaginatorSelector).empty();
			} else {
				jQuery(globalSettings.tweetContainerSelector)
					.html("<p style='text-align: left;'>Unexpected server error. Please, try again later.</p>");
			}
		}
	});
};

function renderTweetFilterBySelector(nEntries) {
	var filterBy = jQuery(globalSettings.tweetFilterBySelector);
	filterBy.html(globalSettings.tweetFilterByTemplate({entries: nEntries}));
	//attach change handler
	filterBy.on("change", "select", function() {
		globalSettings.tweetFilterByValue = this.value;
		loadTweets(true);
	});
}

function renderTweetPaginator(data, callback) {
	var paginator = jQuery(globalSettings.tweetPaginatorSelector);
	if(paginator.length > 0) {
		paginator.pagination({
		    dataSource: data,
		    totalNumber: data.length,
		    pageSize: 2,
		    className: 'paginationjs-small paginationjs-theme-blue',
		    showNavigator: false,
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
	//create div for the tweet
	var div = jQuery("<div/>", {
		id: "ctx-tw-" + tweetId,
		class: "ctx-tw-wrapper"
	});
	div.appendTo(container);
	//render tweet inside div
	if(container.length > 0 && div != null) {
		twttr.widgets.createTweet(
	  		tweetId,
			div.get(0),
			{
				align: 'center',
				cards: 'hidden',
				conversation: 'none',
				width: 370
			}
		).then(function (el) {
			if(el == null) {
				div.html(globalSettings.tweetUnavailableTemplate({tweetId: tweetId}));
				console.log("Tweet #" + tweetId + " not available.")
			} else {
				//add sentiment to div
				renderTweetSentiment(div, tweet.sentimentScore);
				//log success
				console.log("Tweet #" + tweetId + " rendered");
			}
		});
	}
};

function renderTweetSentiment(div, sentimentScore) {
	var options = getFooterOptions(sentimentScore);
	div.append(globalSettings.tweetFooterTemplate(options));
}

function getFooterOptions(sentimentScore) {
	var options = {};
	if (sentimentScore >= 0.6) {
		options.sentimentClass = "very-pos";
		options.smileyIcon = "icon-happy";
	} else if (sentimentScore > 0.05) {
		options.sentimentClass = "pos";
		options.smileyIcon = "icon-smile";
	} else if (sentimentScore >= -0.05) {
		options.sentimentClass = "neutral";
		options.smileyIcon = "icon-neutral";
	} else if (sentimentScore > -0.6) {
		options.sentimentClass = "neg";
		options.smileyIcon = "icon-sad";
	} else {
		options.sentimentClass = "very-neg";
		options.smileyIcon = "icon-angry";
	}
	options.sentimentScore = getNormalisedSentimentScore(sentimentScore);
	return options
}