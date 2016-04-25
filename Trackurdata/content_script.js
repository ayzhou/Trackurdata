function saveTimings() {
	console.log("done");
	var timing = performance.timing;
	var time = timing.domContentLoadedEventEnd - timing.navigationStart;
	chrome.runtime.sendMessage({
		from: 'content_script',
		to: 'background',
		action: 'page_done',
		timing : time
	});
}


setTimeout(function(){ saveTimings(); }, 10000);
$(document).ready(function() {saveTimings(); })