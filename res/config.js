// Example configuration

let name = 'AMV Hell CE';
export default {
  // Shows up in the ass file
  get title() {
    return name;
  },
  set title(n) {
    name = n;
  },
  // Your name here!
  author: 'Fordi',
  // of the video
  aspect: 1.333333,
  // of the video
  height: 480,
  // url of the video relative to index.html
  // Why webm?  HTML5 video doesn't support AVI, and VLC makes webm's easily.
  get video() {
    return `video/${name}.webm`;
  },
  // url of the XML source containing the skit data.
  // This one is taken from http://www.amvhell.com/index.php?pageid=amvhell3
  get skitSource() {
    return `data/${name}.xml`;
  },
  // Each element returned by this selector should represent one skit.
  skitRowSelector: 'skits skit',
  // Each element returned by this selector into a skit should return a list of data points for the skit
  skitColumnSelector: 'info',
  // If this method returns false on a row, it is skipped.
  skitRowFilter: function (row, index) {
    return true;
  },
  // The properties for an event that are mapped from the columns above
  columns: [ 'animeName', 'songName', 'songArtist', 'editor' ],
  // Template for the subtitle file
  subTemplate: 'template/ass-file.txt',
  // Template for each event
  eventTemplate: 'template/ass-event.txt'
};