var charlesCsv;

var categories = document.getElementById('categories')

//hide everything by default
document.getElementById('save').style.display = 'none';
document.getElementById('continue').style.display = 'none';
document.getElementById('getTimings').style.display = 'none';
document.getElementById('sendInput').style.display = 'none';
document.getElementById('resultsDiv').style.display = 'none';
document.getElementById('fileDiv').style.display = 'none';
document.getElementById('numTimingIterationsDiv').style.display = 'none';
document.getElementById('categories').style.display = 'none';


chrome.runtime.sendMessage({'action': 'get_status'}, function(response) {
	console.log(response.status);
	var status = document.getElementById('status');
	if (response.status == 'begin') {
		status.appendChild(document.createTextNode('Choose the categories of trackers that you\'d like to analyze. Click run to get the trackers per website'));
		document.getElementById('categories').style.display = 'block';
		document.getElementById('save').style.display = 'block';

		chrome.runtime.sendMessage({'action': 'get_categories'}, function(response) {
			for (var i = 0; i < response.categories.length; i++) {
				var checkbox = document.createElement('input');
				checkbox.setAttribute('type', 'checkbox');
				checkbox.setAttribute('id', response.categories[i]);
				checkbox.setAttribute('name', 'category_checkbox');

				categories.appendChild(checkbox);
				categories.appendChild(document.createTextNode(response.categories[i]));
			}
		});
	}
	if (response.status == 'charles') {
		status.appendChild(document.createTextNode('In the results box is the JSON object of the trackers per category per website that you requested. Start the Charles session then click run. Once this page loads again, export the results to a file'));
		document.getElementById('save').style.display = 'hidden';
		document.getElementById('getTimings').style.display = 'hidden';
		document.getElementById('categories').style.display = 'hidden';

		chrome.runtime.sendMessage({'action': 'get_results'}, function(response) {
			document.getElementById('results').value = response.results;

		});
	}

	if (response.status == 'timings') {
		status.appendChild(document.createTextNode('Upload the csv file that you exported from Charles. and click Parse. Once the csv table shows up, fill in the number oftrials you want to do for timing tests, then click continue.'));
		document.getElementById('fileDiv').style.display = 'block';
		document.getElementById('sendInput').style.display = 'block';
		console.log(document.getElementById('fileDiv').style.display)
		console.log('suppsedly its visible');
	}

	if (response.status == 'done') {
		document.getElementById('categories').style.display = 'hidden';
		status.appendChild(document.createTextNode('This shows the statistics for the specific categories that you selected'));
		chrome.runtime.sendMessage({'action': 'get_category_stats'}, function(response) {
			console.log(response);
			var statistics = response.statistics;
			//document.getElementById('resultsDiv').appendChild(document.createTextNode(statistics));
			document.getElementById('results').value = statistics;
			document.getElementById('resultsDiv').style.display = 'block';

		});
	}

	if (response.status == 'trackers') {		

		status.appendChild(document.createTextNode('Upload the csv file that you exported from Charles. and click Parse. Once the csv table shows up, fill in the number oftrials you want to do for timing tests, then click continue.'));
		document.getElementById('fileDiv').style.display = 'block';
		document.getElementById('sendInput').style.display = 'block';
		console.log(document.getElementById('fileDiv').style.display)
		console.log('suppsedly its visible');
		document.getElementById('sendInput').removeEventListener('click', sendInput);
		document.getElementById('sendInput').addEventListener('click', sendTrackers);
	}
})

function runAnalysis() {
	var checked_categories = [];
	var children = document.getElementsByName('category_checkbox');

	for (var i = 0; i < children.length; i++) {

		if (children[i].checked) {
			checked_categories.push(children[i].getAttribute("id"));
		}
	}
	console.log(checked_categories);
	

	chrome.runtime.sendMessage({'action': 'set_categories', 'categories': checked_categories});
}

function getCharlesData() {
	chrome.runtime.sendMessage({'action': 'get_charles_data'});
}

function getTimings() {
	chrome.runtime.sendMessage({'action': 'get_timings', 'numTimingIterations': document.getElementById('numTimingIterations').value});
}

function drawTable(response) {
		var results = response.results;

		//hide parsing stuff and show timing input divs
		document.getElementById('numTimingIterationsDiv').style.display = 'block';
		document.getElementById('getTimings').style.display = 'block';

		document.getElementById('fileDiv').style.display = 'none';
		document.getElementById('sendInput').style.display = 'none';

		document.getElementById('resultsDiv').style.display = 'block';

		var table = document.createElement('table');
		table.style.tableLayout = "fixed";
		table.style.width = "100%";
			//create header row
		var tr = document.createElement('tr');  
		for (var key in results[0]) {
			var td = document.createElement('th');   
			td.style.wordWrap = "break-word";
			td.style.overflow = "hidden"; 
			td.style.textOverflow = "ellipsis"; 
			td.style.whiteSpace= "nowrap";
			td.style.width = "100px";

			var text = document.createTextNode(key);
			td.appendChild(text);
			tr.appendChild(td);
		}
		table.appendChild(tr);

		//create data rows
		for (var i = 0; i < results.length; i++) {
			var tr = document.createElement('tr');  
			for (var key in results[i]) {
				var td = document.createElement('td');
				td.style.wordWrap = "break-word";   
				td.style.overflow = "hidden"; 
				td.style.textOverflow = "ellipsis"; 
				td.style.whiteSpace= "nowrap";
				td.style.width = "100px";

				var text = document.createTextNode(results[i][key]);
				td.appendChild(text);
				tr.appendChild(td);
			}
			table.appendChild(tr);
		}

		document.getElementById('results_table').appendChild(table);

		text = document.createTextNode(Papa.unparse(results));
		document.getElementById('results').appendChild(text);
}

function sendInput() {
	chrome.runtime.sendMessage({'action': 'parse_charles', 'data': charlesCsv}, function(response) {
		drawTable(response);
	});
}

function sendTrackers() {
	chrome.runtime.sendMessage({'action': 'parse_trackers_dict', 'data': charlesCsv}, function(response) {
		drawTable(response);
	});
}

function readSingleFile(evt) {
	var f = evt.target.files[0]; 

	console.log(f);

	if (f) {
		var r = new FileReader();
		r.onload = function(e) { 
			var contents = e.target.result;
			charlesCsv = contents;
		}
		r.readAsText(f);
	} else { 
		alert("Failed to load file");
	}
}


document.getElementById('save').addEventListener('click',
	runAnalysis);

document.getElementById('continue').addEventListener('click', getCharlesData);
document.getElementById('getTimings').addEventListener('click', getTimings);
document.getElementById('sendInput').addEventListener('click', sendInput);
document.getElementById('input').addEventListener('change', readSingleFile, false);