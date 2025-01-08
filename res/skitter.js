import config from "./config.js";

const localStorage = globalThis.localStorage;
const ready = Promise.withResolvers();
const SKITTER_CACHE_ID = "skitter-cache";
const skitter = {
  config,
  ready: ready.promise,
  currentSkit: 0,
  cleanHtml: (str) =>
    str
      .replace(/^[\s\S]+<body[^>]*>|<\/body>[\s\S]+$/g, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<link[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<img[^>]*>/g, ""),
  interpolate(tpl, obj) {
    return tpl.replace(/%(\w+)%/g, function (match, varName) {
      return obj[varName] || "";
    });
  },
  formatStamp(t) {
    var u = Math.floor((t % 1) * 100),
      s = Math.floor(t % 60),
      m = Math.floor((t % 3600) / 60),
      h = Math.floor(t / 3600);
    if (h < 10) {
      h = "0" + h;
    }
    if (m < 10) {
      m = "0" + m;
    }
    if (s < 10) {
      s = "0" + s;
    }
    if (u < 10) {
      u = "0" + u;
    }
    return [h, m, s].join(":") + "." + u;
  },
  parseSkitSource(xmlDoc) {
    const colNames = skitter.config.columns;
    const skits = [...xmlDoc.querySelectorAll(skitter.config.skitRowSelector)];
    const result = [];
    for (let index = 0; index < skits.length; index++) {
      const skit = skits[index];
      if (false === skitter.config.skitRowFilter(skit, index)) continue;
      const values = [
        ...skit.querySelectorAll(skitter.config.skitColumnSelector),
      ];
      const obj = {};
      for (let valueIndex = 0; valueIndex < colNames.length; valueIndex += 1) {
        if (values[valueIndex]) {
          obj[colNames[valueIndex]] = values[valueIndex].textContent.trim();
        }
      }
      result.push(obj);
    }
    return result;
  },
  async loadStoredEvents() {
    var storedEvents = localStorage.getItem(SKITTER_CACHE_ID);
    if (!storedEvents) {
      skitter.events = [];
      return;
    }

    skitter.events = JSON.parse(storedEvents) || [];
    if (skitter.events.length > 0) {
      skitter.currentSkit = skitter.events.length;
      await skitter.ready;
      skitter.vid.currentTime = skitter.events[skitter.events.length - 1].stamp;
    }
  },
  storeEvents() {
    localStorage.setItem(SKITTER_CACHE_ID, JSON.stringify(skitter.events));
  },
  processEvent(index) {
    const event = { ...skitter.events[index] };
    const next = skitter.events[index + 1] || {};
    event.start = skitter.formatStamp(event.stamp);
    event.end = skitter.formatStamp(
      Math.min(event.stamp + 5, next.stamp || Infinity)
    );
    return event;
  },
  renderOutput() {
    skitter.fileOutput = skitter.interpolate(skitter.subTemplate, {
      events: skitter.events
        .map(function (event, index) {
          return skitter.interpolate(
            skitter.eventTemplate,
            skitter.processEvent(index)
          );
        })
        .join("\r\n"),
      ...skitter.config,
    });
    return skitter.fileOutput;
  },
  updateSubDisplay() {
    skitter.subDisplay.innerHTML = skitter.fileOutput;
    skitter.subDisplay.scrollTop = skitter.subDisplay.scrollHeight;
  },
  updateSubLink() {
    skitter.subLink.href = `data:application/octet-stream;base64,${btoa(
      unescape(escape(skitter.fileOutput).replace(/%u(\d{4})/g, "&#x$1;"))
    )}`;
  },
  updateApplication() {
    skitter.storeEvents();
    skitter.renderOutput();
    skitter.updateSubDisplay();
    skitter.updateSubLink();
  },
  async initVideo(videoElement) {
    return new Promise((resolve, reject) => {
      videoElement.addEventListener("canplay", resolve);
      videoElement.addEventListener("error", reject);
      videoElement.appendChild(
        Object.assign(document.createElement("source"), {
          type: "video/" + skitter.config.video.replace(/^.*\.([^\.]+)$/, "$1"),
          src: skitter.config.video,
        })
      );
    });
  },
  async fetchSkitSource(src) {
    const parser = new DOMParser();
    const xml = await skitter.fetchText(src);
    const document = parser.parseFromString(xml, "text/xml");
    return skitter.parseSkitSource(document);
  },
  async fetchText(src) {
    const response = await fetch(src);
    return response.text();
  },
  async onDomReady() {
    const jobs = [];
    skitter.loadStoredEvents();
    skitter.vid = document.querySelector("video.skitter");
    skitter.subDisplay = document.querySelector("pre.assFile");
    skitter.subLink = document.querySelector("a.download");
    skitter.subLink.setAttribute(
      "download",
      skitter.config.video
        .replace(/^.*\/([^\/]+)$/, "$1")
        .replace(/\.[^\.]+$/, ".ass")
    );
    skitter.skits = [];
    const { skitSource, subTemplate, eventTemplate } = skitter.config;
    jobs.push(
      (async () => {
        skitter.skits = await skitter.fetchSkitSource(skitSource);
      })(),
      (async () => {
        skitter.subTemplate = await skitter.fetchText(subTemplate);
      })(),
      (async () => {
        skitter.eventTemplate = await skitter.fetchText(eventTemplate);
      })(),
      skitter.initVideo(skitter.vid)
    );
    await Promise.all(jobs);
  },
  keyCode: {
    BACKSPACE: 8,
    ENTER: 13,
    RIGHT: 39,
    LEFT: 37,
    UP: 38,
    DOWN: 40,
    SPACE: 32,
  },
  next() {
    skitter.events.push({
      stamp: skitter.vid.currentTime,
      ...skitter.skits[skitter.currentSkit],
    });
    skitter.currentSkit += 1;
    skitter.updateApplication();
    return false;
  },
  previous() {
    skitter.currentSkit = Math.max(0, skitter.currentSkit - 1);
    skitter.events.pop();
    skitter.updateApplication();
    return false;
  },
  seek(distance) {
    skitter.vid.currentTime += distance;
    return false;
  },
  togglePlay() {
    if (skitter.vid.paused) {
      skitter.vid.play();
    } else {
      skitter.vid.pause();
    }
    return false;
  },
  observeKeys() {
    document.addEventListener("keydown", ({ key }) =>
      ({
        Backspace: skitter.previous,
        Enter: skitter.next,
        ArrowRight: () => skitter.seek(+5),
        ArrowLeft: () => skitter.seek(-2),
        ArrowUp: () => skitter.seek(+15),
        ArrowDown: () => skitter.seek(-10),
        " ": skitter.togglePlay,
      }[key]?.())
    );
  },
  async init() {
    await skitter.onDomReady();
    skitter.updateApplication();
    skitter.observeKeys();
  },
};

await skitter.init();
