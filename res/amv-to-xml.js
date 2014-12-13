//Include on an AMV hell description to get an XML copy of the info listing as a download link next to the title
(function (g) {
	function getXML() {
		"use strict";
		
		var i, j, cols, info, skit, xmlFile, 
			d = g.document,
			rows = d.querySelectorAll('.blockbody table tr'),
			xmlDoc = d.createElement('div'),
			skits = d.createElement('skits'),
			title = d.querySelector('h2.blockhead'),
			link = d.createElement('a');
		xmlDoc.appendChild(skits);
		
		for (i = 1; i < rows.length; i += 1) {
			cols = rows[i].querySelectorAll('td');
			skit = d.createElement('skit');
			skits.appendChild(skit);
			for (j = Math.min(1, cols.length - 1); j < cols.length; j += 1) {
				info = d.createElement('info');
				info.innerHTML = cols[j].innerHTML.replace(/^\s+|\s+$/g, '');
				skit.appendChild(info);
			}
		}
		xmlFile = new Blob([xmlDoc.innerHTML], { type: 'text/xml;charset=utf-8' });
		saveAs(xmlFile, title.textContent.replace(/^[\s\r\n\t»]+|[\s\r\n\t]+$/g, '').replace(/[^\w\d ]+/g, '_') + '.xml');
	};
	if (!window.saveAs) {
		var s = d.createElement('script');
		s.src = 'http://eligrey.com/demos/FileSaver.js/FileSaver.js';
		s.onload = function () {
			getXML();
		};
		document.body.appendChild(s);
	} else {
		getXML();
	}
}(this));