//Include on an AMV mini post to get an XML copy of the info listing.
(function getXML(g) {
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
	xmlFile = 'data:text/xml;base64,' + g.btoa(unescape(escape(xmlDoc.innerHTML).replace(/%u(\d{4})/g, '&#x$1;')));
	link.href=xmlFile;
	link.setAttribute('download', title.textContent.replace(/^[\s\r\n\t]+|[\s\r\n\t]+$/g, '') + '.xml');
	link.innerHTML = "-> Download XML";
	title.appendChild(link);
}(this));