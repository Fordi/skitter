/*jslint regexp:true */
(function (global) {
	"use strict";
	var skitter = global.skitter = {},
		$ = global.jQuery,
		localStorage = global.localStorage,
		ready = new $.Deferred();
	skitter.ready = ready.promise();
	skitter.currentSkit = 0;
	skitter.cleanHtml = function cleanHtml(str) {
		str = str.replace(/^[\s\S]+<body[^>]*>|<\/body>[\s\S]+$/g, '')
			.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
			.replace(/<link[^>]*>[\s\S]*?<\/script>/g, '')
			.replace(/<img[^>]*>/g, '');
		return str;
	};
	skitter.interpolate = function interpolate(tpl, obj) {
		return tpl.replace(/%(\w+)%/g, function (match, varName) {
			return obj[varName] || '';
		});
	};
	skitter.formatStamp = function formatStamp(t) {
		var u = Math.floor((t % 1) * 100),
			s = Math.floor(t % 60),
			m = Math.floor((t % 3600) / 60),
			h = Math.floor(t / 3600);
		if (h < 10) { h = '0' + h; }
		if (m < 10) { m = '0' + m; }
		if (s < 10) { s = '0' + s; }
		if (u < 10) { u = '0' + u; }
		return [h, m, s].join(':') + '.' + u;
	};
	skitter.parseSkitSource = function parseSkitSource(data) {
		var obj = data,
			colNames = skitter.config.columns;
		if (!obj instanceof Document) {
			obj = skitter.cleanHtml(obj);
		}
		obj = $(obj);
		obj.find(skitter.config.skitRowSelector).each(function (index) {
			if (false === skitter.config.skitRowFilter(this, index)) {
				return;
			}
			var i, obj = {},
				cols = $(this).find(skitter.config.skitColumnSelector);
			for (i = 0; i < colNames.length; i += 1) {
				if (cols.get(i)) {
					obj[colNames[i]] = cols.eq(i).text() || cols.get(i).nodeValue;
				}
			}
			skitter.skits.push(obj);
		});
	};
	skitter.loadStoredEvents = function loadStoredEvents() {
		var storedEvents = localStorage.getItem('skitter-cache');
		if (!storedEvents) {
			skitter.events = [];
			return;
		}

		skitter.events = JSON.parse(storedEvents) || [];
		if (skitter.events.length > 0) {
			skitter.ready.done(function () {
				skitter.vid.currentTime = skitter.events[skitter.events.length - 1].stamp;
			});
			skitter.currentSkit = skitter.events.length;
		}
	};
	skitter.storeEvents = function storeEvents() {
		localStorage.setItem('skitter-cache', JSON.stringify(skitter.events));
	};
	skitter.renderOutput = function renderOutput() {
		skitter.fileOutput = skitter.interpolate(
			skitter.subTemplate,
			$.extend({
				events: $(skitter.events).map(function () {
					return skitter.interpolate(skitter.eventTemplate, this);
				}).toArray().join("\r\n")
			}, skitter.config)
		);
		return skitter.fileOutput;
	};
	skitter.updateSubDisplay = function updateSubDisplay() {
		skitter.subDisplay.html(skitter.fileOutput);
		skitter.subDisplay[0].scrollTop = skitter.subDisplay[0].scrollHeight;
		skitter.subDisplay.outerHeight($(global.window).innerHeight() - skitter.subDisplay.offset().top - 16);
	};
	skitter.updateSubLink = function updateSubLink() {
		skitter.subLink.attr({
			href: 'data:application/octet-stream;base64,' + global.btoa(unescape(escape(skitter.fileOutput).replace(/%u(\d{4})/g, '&#x$1;')))
		});
	};
	skitter.updateApplication = function updateApplication() {
		skitter.storeEvents();
		skitter.renderOutput();
		skitter.updateSubDisplay();
		skitter.updateSubLink();
	};
	skitter.onDomReady = function onDomReady() {
		var deferreds = [],
			readyToPlay = new $.Deferred();
		skitter.loadStoredEvents();			
		skitter.vid = $('video.skitter')[0];
		skitter.subDisplay = $('textarea.assFile');
		skitter.subLink = $('a.download').attr({
			download: skitter.config.video.replace(/^.*\/([^\/]+)$/, '$1').replace(/\.[^\.]+$/, '.ass')
		})
		skitter.skits = [];
		deferreds.push(
			$.ajax(skitter.config.skitSource).done(skitter.parseSkitSource)
		);
		deferreds.push(
			$.ajax(skitter.config.subTemplate).done(function (tpl) {
				skitter.subTemplate = tpl;
			})
		);
		deferreds.push(
			$.ajax(skitter.config.eventTemplate).done(function (tpl) {
				skitter.eventTemplate = tpl;
			})
		);
		deferreds.push(readyToPlay);
		$(skitter.vid)
			.on('error', function () {
				readyToPlay.reject();
			})
			.on('canplay', function () {
				readyToPlay.resolve();
			})
			.append(
				$('<source>').attr({
					type: 'video/' + skitter.config.video.replace(/^.*\.([^\.]+)$/, '$1'),
					src: skitter.config.video
				})
			);
		$.when.apply($, deferreds)
			.done(function () {
				ready.resolve();
			})
			.fail(function () {
				ready.reject();
			});
		
	};
	skitter.keyCode = {
		BACKSPACE: 8,
		ENTER: 13,
		RIGHT: 39,
		LEFT: 37,
		UP: 38,
		DOWN: 40,
		SPACE: 32
	};
	skitter.next = function next() {
		var start = skitter.formatStamp(skitter.vid.currentTime),
			end = skitter.formatStamp(skitter.vid.currentTime + 5);
		skitter.events.push($.extend(
			{
				stamp: skitter.vid.currentTime,
				start: start,
				end: end
			},
			skitter.skits[skitter.currentSkit]
		));
		skitter.currentSkit += 1;
		skitter.updateApplication();
		return false;
	};
	skitter.previous = function previous() {
		skitter.currentSkit = Math.max(0, skitter.currentSkit - 1);
		skitter.events.pop();
		skitter.updateApplication();
		return false;
	};
	skitter.seek = function seek(distance) {
		skitter.vid.currentTime += distance;
		return false;
	};
	skitter.togglePlay = function togglePlay() {
		if (skitter.vid.paused) {
			skitter.vid.play();
		} else {
			skitter.vid.pause();
		}
		return false;
	};
	skitter.ready.done(function () {
		skitter.updateApplication();
		$(global.document).on('keydown', function (e) {
			if (e.keyCode === skitter.keyCode.BACKSPACE) { return skitter.previous();   }
			if (e.keyCode === skitter.keyCode.ENTER) {     return skitter.next();       }
			if (e.keyCode === skitter.keyCode.RIGHT) {     return skitter.seek(+5);     }
			if (e.keyCode === skitter.keyCode.LEFT) {      return skitter.seek(-2);     }
			if (e.keyCode === skitter.keyCode.UP) {        return skitter.seek(+15);    }
			if (e.keyCode === skitter.keyCode.DOWN) {      return skitter.seek(-10);    }
			if (e.keyCode === skitter.keyCode.SPACE) {     return skitter.togglePlay(); }
		});
	});
	$(skitter.onDomReady);
}(this));
