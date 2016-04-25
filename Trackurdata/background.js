//list where we are at
var url_i;
var category_i;
var tI;
var blocking = false;
var sizeOfTrackers;
var numTrackers;
var trackerDict;
var urlTrackerDict;
var port;
var urlList = ['http://www.google.com','http://www.facebook.com','http://www.youtube.com','http://www.amazon.com','http://www.yahoo.com', 
'http://www.wikipedia.org','http://www.ebay.com','http://www.twitter.com','http://www.reddit.com','http://www.netflix.com', 'http://www.live.com',
'http://www.linkedin.com','http://www.pinterest.com','http://www.craigslist.org','http://www.imgur.com',
'http://www.go.com','http://www.chase.com','http://www.paypal.com','http://www.cnn.com','http://www.instagram.com','http://www.tumblr.com', 
'http://www.bing.com','http://www.nytimes.com','http://www.bankofamerica.com','http://www.msn.com','http://www.imdb.com',
'http://www.espn.go.com','http://www.blogspot.com','http://www.wellsfargo.com','http://www.zillow.com','http://www.zillow.com',
'http://www.office.com','http://www.yelp.com','http://www.weather.com','http://www.walmart.com','http://www.intuit.com',
'http://www.apple.com','http://www.huffingtonpost.com','http://www.wordpress.com','http://www.etsy.com','http://www.microsoftonline.com',
'http://www.buzzfeed.com','http://www.feed.com','http://www.microsoft.com','http://www.aol.com','http://www.target.com',
'http://www.washingtonpost.com','http://www.foxnews.com','http://www.news.com','http://www.bestbuy.com', 'http://www.xfinity.com','http://www.usps.com',
'http://www.pornhub.com','http://www.gfycat.com','http://www.ups.com','http://www.cnet.com','http://www.capitalone.com',
'http://www.homedepot.com','http://www.wikia.com','http://www.googleusercontent.com','http://www.att.com','http://www.indeed.com',
'http://www.hulu.com','http://www.pandora.com','http://www.usatoday.com','http://www.adobe.com','http://www.americanexpress.com',
'http://www.ask.com','http://www.outbrain.com','http://www.groupon.com','http://www.stackoverflow.com','http://www.dropbox.com',
'http://www.tripadvisor.com','http://www.forbes.com','http://www.realtor.com','http://www.vice.com','http://www.verizonwireless.com',
'http://www.conservativetribune.com','http://www.businessinsider.com','http://www.fedex.com','http://www.kohls.com','http://www.webmd.com',
'http://www.instructure.com','http://www.xvideos.com','http://www.force.com','http://www.about.com','http://www.macys.com',
'http://www.salesforce.com','http://www.patch.com','http://www.worldlifestyle.com','http://www.amazonaws.com','http://www.citi.com',
'http://www.lowes.com','http://www.github.com','http://www.buzzlie.com']; 
// var urlList = ['http://www.bbc.com', 'http://www.cnn.com'];
var user_categories;
var anon_function;
var isDone;
var isGettingTrackerDict;
var isBlocked = false;
var isGettingTimings = false;
var charles_proxy = false;
var urlTiming;
var charlesData;
var categoryDict;
var numTimingIterations;
var num_timing_i;
var tracker_parsing_mode = false;

//the id of the tab that the extension is running in
var tabId;




function blockRequest(details) {
	return {cancel: true};

}
function updateFilters(urls) {
	console.log("in updatefilters");
	if(chrome.webRequest.onBeforeRequest.hasListener(blockRequest))
		chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
	chrome.webRequest.onBeforeRequest.addListener(blockRequest, {urls: urls}, ['blocking']);
}

function convertFromGoogleRegex(googleRegex) {
	var re = googleRegex.replace('*.', '*');
	re = re.replace(/\*/, '[https|http]');
	re = re.replace(/\*/g, '.*');
	re = re.replace(/\//g, '\\/');
	// re = re.replace(/\?/g, '\\\?')
	re = re.replace(/\+/g, '\\\+');
	if (/(\.com\\\/\.\*$)/.test(re)) {
		re = re.replace(/\\\/\.\*$/, '\.\*');
	}
	return re;
}

function saveTimingAndUpdate(request, sender, sendResponse) {


	var categories = Object.keys(trackerDict);
	var category = user_categories[category_i];

	var urls = Object.keys(trackerDict[category]);

	var url = urls[url_i];

	var trackers = trackerDict[category][url];

	if (!isBlocked) {
		if (trackers) {
			updateFilters(trackers);
		}
	} else {
		chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
	}

	if (!isBlocked) {
		urlTiming = request.timing;
	} else {
		if (!categoryDict[category]['timings'][url]) {
			categoryDict[category]['timings'][url] = [urlTiming - request.timing];
		} else {
			categoryDict[category]['timings'][url].push(urlTiming - request.timing);
		}

		url_i++;
		if (url_i == urls.length) {
			url_i = 0;
			category_i++;

			//if we are done, restart
			if (category_i >= categories.length) {
				url_i = 0;
				category_i = 0;
				num_timing_i++;
			}

			categories = Object.keys(trackerDict);
			category = user_categories[category_i];

			urls = Object.keys(trackerDict[category]);
			//if there are no urls for this category, then go to the next tracker
			while (urls.length == 0 && category_i < categories.length) {
				category_i++;
				categories = Object.keys(trackerDict);
				category = user_categories[category_i];

				urls = Object.keys(trackerDict[category]);
			}
		}

		if (category_i >= categories.length) {
			url_i = 0;
			category_i = 0;
			num_timing_i++;
		}

		if (num_timing_i == numTimingIterations) {
			isDone = true;

			//do statistical analysis on numerical fields
			doStats();
			return;
		}
	}
	isBlocked = !isBlocked;

	categories = Object.keys(trackerDict);
	category = user_categories[category_i];

	urls = Object.keys(trackerDict[category]);

	console.log(categories.length);
	console.log(url_i);
	console.log(category_i);
	goToUrl(urls[url_i]);
}

function doStats() {
	for (var key in categoryDict) {
		//we have some prototypes in javascript array so we only want to iterate through keys
		var responseSizes = [];
		var responseDurations = [];
		for (var j = 0; j < categoryDict[key]['trackers'].length; j++) {
			var size = parseInt(categoryDict[key]['trackers'][j]['Response Body Size (bytes)']) || 0;
			size += parseInt(categoryDict[key]['trackers'][j]['Response Header Size (bytes)']) || 0;
			responseSizes.push(size);

			var duration = parseInt(categoryDict[key]['trackers'][j]['Response Duration (ms)']) || 0;
			responseDurations.push(duration);
		}

		//add stats
		categoryDict[key]['stats'] = {};
		categoryDict[key]['stats']['responseSize'] = {};
		categoryDict[key]['stats']['responseSize']['sum'] = responseSizes.sum();
		categoryDict[key]['stats']['responseSize']['mean'] = responseSizes.mean();
		categoryDict[key]['stats']['responseSize']['median'] = responseSizes.median();
		categoryDict[key]['stats']['responseSize']['stdDev'] = responseSizes.stdDev();
		categoryDict[key]['stats']['responseSize']['histogram'] = responseSizes.histogram();

		categoryDict[key]['stats']['responseDurations'] = {};
		categoryDict[key]['stats']['responseDurations']['sum'] = responseDurations.sum();
		categoryDict[key]['stats']['responseDurations']['mean'] = responseDurations.mean();
		categoryDict[key]['stats']['responseDurations']['median'] = responseDurations.median();
		categoryDict[key]['stats']['responseDurations']['stdDev'] = responseDurations.stdDev();
		categoryDict[key]['stats']['responseDurations']['histogram'] = responseDurations.histogram();

	}
	console.log("done");

	//done- return to options page
	goToUrl(chrome.extension.getURL("options.html"));
	return;
}

function goToUrl(url) {
	console.log(tabId);
	chrome.tabs.update(tabId, {url: url});
}

function setUpStats() {
	console.log("in setupstats");
	var categories = {};
	for (var i = 0; i < user_categories.length; i++) {
		var urls = {};
		for (var j = 0; j < urlList.length; j++) {
			var urlDict = {};
			urlDict['timeDifference'] = 0;
			urlDict['trackerSizes'] = {};
			urls[urlList[j]] = urlDict;
		}
		categories[user_categories[i]] = urls;
	}

	chrome.storage.sync.set({categories: categories});
}

function getTrackersInSitesListener(request) {

	url_i++;

	if (url_i == urlList.length) {
		url_i = 0;
		category_i++;
	}

	//done getting all trackers in each website
	if (category_i >= user_categories.length) {
		charles_proxy = true;
		goToUrl(chrome.extension.getURL("options.html"));
		console.log(JSON.stringify(trackerDict));
		return;
	}
	var category = user_categories[category_i];
	getTrackersInSites(category, trackerList[category], url_i, category_i);
}

function getTrackersInSitesOnCompleteListener(category, trackers, url, details) {

	for (var i = 0; i < trackers.length; i++) {

		var re = convertFromGoogleRegex(trackers[i]);
		re = new RegExp(re);

		//it matches a tracker
		if (re.test(details.url)) {
				 // console.log(details.url);
				// console.log(re);
				// console.log(url);
			//add it to the dict of url : trackers
			if (!trackerDict[category][url]) {
				var key = url;
				var arr = [];
				arr.push(trackers[i]);
				trackerDict[category][url] = arr;
				//console.log(trackerDict);
			}
			else {
				var arr = trackerDict[category][url];
				if (arr.indexOf(trackers[i]) < 0) {
					arr.push(trackers[i]);
				}
			}
		}
	}
}



//returns a dict of key: site url and value: array of trackers in that url
function getTrackersInSites(category, trackers, url_i, category_i) {
	// console.log("in getTrackersInSites");
	// console.log(category);
	// console.log(trackers);
	// console.log(url_i);
	// console.log(category_i);

	var url = urlList[url_i];

	// console.log(url_i);
	// if (chrome.runtime.onMessage.hasListener(delegateMessages)) {
	// 	chrome.runtime.onMessage.removeListener(delegateMessages);
	// }

	//update the listener with the current url we are testing
	// if (chrome.webRequest.onCompleted.hasListener(anon_function)) {
	// 	chrome.webRequest.onCompleted.removeListener(anon_function);
	// }

	var cat = category;
	var ts = trackers;
	var anon_function =	function(details) {
		getTrackersInSitesOnCompleteListener(cat, ts, url, details);
	};

	chrome.webRequest.onCompleted.addListener ( anon_function,
		{urls: trackers});

	// console.log("in getTrackersInSites");
	goToUrl(url);
	return;
}


function runTests() {
	var categories = Object.keys(trackerDict);
	var category = categories[category_i];

	var urls = Object.keys(trackerDict[category]);
	var url = urls[url_i];

	var trackers = trackerDict[category][url];
	// console.log(trackers);

	if (!isBlocked) {
		chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
	} else {
		updateFilters(trackers);
	}
	goToUrl(url);
}

// function delegateMessages(request, sender, sendResponse) {
// // 	if (request.from == 'content_script') {
// // 		saveTimingAndUpdate(request, sender, sendResponse);
// // 	}
// // }

// // chrome.runtime.onMessage.addListener(
// // 	delegateMessages
// // );

function cleanRegexes(categories) {
	var googleUrl = /^(\*|http|https|ftp|file):\/\/(\*|\*\.[^\*\/]+|[^\*\/]+)\/.*[^\|]/;

	for (var j = 0; j < categories.length; j++) {
		var urls = trackerList[categories[j]];
		for (var i = urls.length-1; i >= 0; i--) {
			if(!urls[i].match(googleUrl)) {
				urls.splice(i, 1);
			}
		}
	}
	// console.log('done cleaning');
}

//returns the status of the extension
function getStatus() {
	if (!charles_proxy) {
		if (!isDone) {
			if (isGettingTimings) {
				if (!tracker_parsing_mode)
					return 'timings';
				else
					return 'trackers';
			} else {
				return 'begin';
			}
		} else {
			return 'done';
		}
	}

	if (charles_proxy) {

		return 'charles'
	}
}

chrome.runtime.onMessage.addListener(function(request,sender, sendResponse) {
	console.log(request);
	if (request.action == 'get_categories') {
		sendResponse({'categories': Object.keys(trackerList)});
	}
	if (request.action == 'set_categories') {


		//set tab id of extension

		chrome.tabs.query(
			{currentWindow: true, active: true},
			function(tabArray) {
				if (tabArray && tabArray[0]) {

					tabId = tabArray[0].id;

	            	//set up for tests
	            	user_categories = request.categories;
	            	console.log(user_categories);
	            	cleanRegexes(user_categories);

	            	url_i = 0;
	            	category_i = 0;
	            	isDone = false;
	            	charles_proxy = true;

					//start to get tracker dict
					goToUrl(urlList[url_i]);
					return;
				}


			});
	}
	if (request.action == 'page_done') {

		console.log('received action');
		//if tab not the extension tab do nothing
		if (charles_proxy) {

			// comment out to not go through all the websites
			url_i++;
			// url_i = urlList.length;
			if (url_i >= urlList.length) {
				url_i = 0;
				charles_proxy = false;
				isGettingTimings = true;
				goToUrl(chrome.extension.getURL("options.html"));

			} else {
				//go to next url for charles data
				goToUrl(urlList[url_i]);
			}
		}else if (!isDone) {
			saveTimingAndUpdate(request);
		}
	}

	//gets the status of the script
	if (request.action == 'get_status') {

		var status = getStatus();
		sendResponse({'status': status});

	}

	if (request.action == 'get_charles_data') {
		setUpStats();
		url_i = 0;
		category_i = 0;
		isGettingTrackerDict = false;
		if (chrome.webRequest.onCompleted.hasListener(anon_function)) {
			chrome.webRequest.onCompleted.removeListener(anon_function);
		}

		goToUrl(urlList[url_i]);
	}

	if (request.action == 'get_timings') {
				//run the timing tests

		url_i = 0;
		category_i = 0;
		num_timing_i = 0;
		numTimingIterations = parseInt(request.numTimingIterations);
		console.log(numTimingIterations);
		isBlocked = false;

		goToUrl(urlList[url_i]);
	}

	if (request.action == 'get_results') {
		var status = getStatus();
		if (status == 'charles') {
			sendResponse({'results': JSON.stringify(trackerDict)});
		}
	}

	if (request.action == 'parse_charles') {
		var results = Papa.parse(request.data).data;

		//trackerDict is a dict of category: website: trackers
		trackerDict = {};
		for (var i = 0; i < user_categories.length; i++) {
			var user_category = user_categories[i];
			trackerDict[user_category] = {};
		}

		//set up category dict-
		//dict is category: {'timings': [], 'trackers': []}
		categoryDict = {};
		for (var i = 0; i < user_categories.length; i++) {
			categoryDict[user_categories[i]] = {'timings': {}, 'trackers': []};
		}


		//the charles data should go in order from urlList, so we can keep track of which website we're on
		var urlIndex = -1;

		//must turn on no-caching in charles

		//add the new columns into results
		results[0].splice(1, 0, 'Website');
		results[0].splice(1, 0, 'Category');
		results[0].splice(1, 0, 'Tracker Matched');

		//assume the first row in csv is the column header row
		for (var i = 1; i < results.length; i++) {
			var url = results[i][0];

			if (urlIndex != urlList.length-1) {
				//strip http

				var stripped = urlList[urlIndex+1].replace(/http:\/\/www\./, '');
				console.log(stripped);
				var regEx = new RegExp('.*'+stripped);
				if (regEx.test(url)) {
					urlIndex++;
				}
			}

			if (urlIndex < 0) {
				results.splice(i--, 1);
				continue;
			}

			var isTracker = false;

			//want to add this information to the csv

			//website that we saw this tracker on
			var urlListUrl = urlList[urlIndex];

			//what category did this tracker belong to
			var category;

			//the regex that matched this tracker
			var trackerRegex;

			//goes through the user selected trackers and adds the category/url to the csv if it matches
			for (var k = 0; k < user_categories.length; k++) {
				var user_category = user_categories[k];
				var trackers = trackerList[user_category];
				for (var j = 0; j < trackers.length; j++) {
					var tracker = convertFromGoogleRegex(trackers[j]);
					tracker = new RegExp(tracker);
					if (tracker.test(url)) {
						category = user_category;
						trackerRegex = trackers[j];
						isTracker = true;


						//add to trackerDict
						if (!trackerDict[category][urlListUrl]) {
							var key = url;
							var arr = [];
							arr.push(trackers[j]);
							trackerDict[category][urlListUrl] = arr;
							//console.log(trackerDict);
						}
						else {
							var arr = trackerDict[category][urlListUrl];
							if (arr.indexOf(trackers[j]) < 0) {
								arr.push(trackers[j]);
							}
						}
					}
				}
			}

			//if not a tracker for that website, remove
			if (!isTracker) {
				results.splice(i--, 1);
			} else {
				//add new info to csv
				results[i].splice(1, 0, urlListUrl);
				results[i].splice(1, 0, category);
				results[i].splice(1, 0, trackerRegex);

			}
		}

		console.log(results);

		//convert back to csv and then back to dict with papaparse
		results = Papa.parse(Papa.unparse(results), {header: true}).data;

		//iterate through results and add the tracker to its proper category in categoryDict

		for (var i = 0; i < results.length; i++) {
			var category = results[i]['Category'];
			categoryDict[category]['trackers'].push(results[i]);
		}
		sendResponse({'results': results});

	}

	if (request.action == 'get_category_stats') {

		sendResponse({'statistics': JSON.stringify(categoryDict)});
	}

	if (request.action == 'parse_trackers_dict') {
		var results = Papa.parse(request.data, {header: true}).data;

		//trackerDict is a dict of category: website: trackers
		trackerDict = {};
		for (var i = 0; i < user_categories.length; i++) {
			var user_category = user_categories[i];
			trackerDict[user_category] = {};
		}

		//set up category dict-
		//dict is category: {'timings': [], 'trackers': []}
		categoryDict = {};
		for (var i = 0; i < user_categories.length; i++) {
			categoryDict[user_categories[i]] = {'timings': {}, 'trackers': []};
		}

		console.log(results);
		for (var i = 0; i < results.length; i++) {
			//add to categorydict
			var category = results[i]['Category'];
			categoryDict[category]['trackers'].push(results[i]);

			var urlListUrl = results[i]['Website'];
			var url = results[i]['URL'];
			console.log(urlListUrl);
			//add to trackerDict
			if (!trackerDict[category][urlListUrl]) {
				var key = url;
				var arr = [];
				arr.push(results[i]['Tracker Matched']);
				trackerDict[category][urlListUrl] = arr;
				//console.log(trackerDict);
			}
			else {
				var arr = trackerDict[category][urlListUrl];
				if (arr.indexOf(results[i]['Tracker Matched']) < 0) {
					arr.push(results[i]['Tracker Matched']);
				}
			}
		}

		console.log(trackerDict);
		sendResponse({'results': results});
	}

});