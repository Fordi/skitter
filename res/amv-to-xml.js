//Include on an AMV hell description to get an XML copy of the info listing as a download link next to the title
(function getXML(g) {
	"use strict";
	var i, j, cols, info, skit, xmlFile, 
		d = g.document,
		rows = document.querySelectorAll('.blockbody table tr'),
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
			info.innerHTML = cols[j].innerHTML;
			skit.appendChild(info);
		}
	}

	xmlFile = 'data:text/xml;base64,' + g.btoa(unescape(escape(xmlDoc.innerHTML).replace(/%u(\d{4})/g, '&#x$1;')));
	link.href=xmlFile;
	link.setAttribute('download', title.textContent.replace(/^[\s\r\n\t»]+|[\s\r\n\t]+$/g, '').replace(/[^\w\d ]+/g, '_') + '.xml');
	link.innerHTML = "-> Download XML";
	title.appendChild(link);
}(this));