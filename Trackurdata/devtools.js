var urls;
var regExList;

function setUrls(request, sender, sendResponse) {
	console.log(request);
	// if (chrome.devtools.network.onRequestFinished.hasListeners()) {
	// 	chrome.devtools.network.onRequestFinished.removeListener(sendSize);
	// }

	regExList = [];
	for (var i = 0; i < request.urls.length; i++) {
		var re = new RegExp(convertFromGoogleRegex(request.urls[i]));
		regExList.push(re);
	}
	urls = request.urls;
	console.log(regExList);
	console.log(urls);
}

function convertFromGoogleRegex(googleRegex) {
	var re = googleRegex.replace('*.', '*');
	re = re.replace(/\*/g, '.*');
	re = re.replace(/\//g, '\\/');
	return re;
}

var port = chrome.runtime.connect({name: "network_info"});
port.onMessage.addListener(setUrls);
chrome.devtools.network.onRequestFinished.addListener(sendSize);

function sendSize(request) {
	if (!urls) {
		return;
	}

	for (var i = 0; i < urls.length; i++) {
		var re = regExList[i];
		var url = urls[i];

		if (re.test(request.request.url)) {
			console.log(request);


			port.postMessage({
				from: 'devtools',
				to: 'background',
				requestUrl: request.request.url,
				url: url,
				time: request.time,
				size: request.response.content.size

			});
		}
	}
};