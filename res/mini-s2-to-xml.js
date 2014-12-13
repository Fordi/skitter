//Include on an AMV mini post to get an XML copy of the info listing.
(function (g) {

	function getXML() {
		"use strict";
		var d = g.document,
			content = d.querySelector('.postcontent').innerHTML
				.replace(/[\s\S]*<\/iframe>/, '')
				.replace(/[\s\S]*Credits:[\s]*<\/b>(?:<br>)*/, '')
				.replace(/\n/g, '')
				.replace(/<br *\/?>/g, '\n')
				.replace(/[ \t]+/g, ' ')
				.split(/\n/),
			xmlDoc = d.createElement('div'),
			skits = d.createElement('skits'),
			skit = d.createElement('skit'),
			title = document.querySelector('h2.posttitle'),
			i,
			info,
			xmlFile,
			link = d.createElement('a');
		while (!content[0]) {
			content.shift();
		}
		while (!content[content.length - 1]) {
			content.pop();
		}
		xmlDoc.appendChild(skits);
		skits.appendChild(skit);
		for (i = 0; i < content.length; i += 1) {
			if (!content[i]) {
				skit = d.createElement('skit');
				skits.appendChild(skit);
			} else {
				info = d.createElement('info');
				info.innerHTML = content[i];
				skit.appendChild(info);
			}
		}
		xmlFile = new Blob([xmlDoc.innerHTML], { type: 'text/xml;charset=utf-8' });
		saveAs(xmlFile, title.textContent.replace(/^[\s\r\n\t»]+|[\s\r\n\t]+$/g, '').replace(/[^\w\d ]+/g, '_') + '.xml');
	}
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