
// Inspired by react-dnd

var TRANSPARENT_PIXEL_SRC = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

var ImagePreloaderMixin = {
  componentDidMount: function() {
    this._cachedImages = {};
    this._readyImages = {};
    this.preloadImages();
  },

  componentDidUpdate: function() {
    this.preloadImages();
  },

  componentWillUnmount: function() {
    for (var key in this._cachedImages) {
      this._cachedImages[key].src = TRANSPARENT_PIXEL_SRC;
    }
    this._cachedImages = {};
  },

  hasPreloadedImage: function (url) {
    return this._readyImages && !!this._readyImages[url];
  },

  getPreloadedImage: function (url) {
    if (this.hasPreloadedImage(url)) {
      return this._cachedImages[url];
    }
  },

  preloadImages: function() {
    if (!this._cachedImages) return false;
    var urls = this.getImageUrlsToPreload();
    var allLoaded = true;
    for (var i=0; i<urls.length; ++i) {
      var url = urls[i];
      this.preloadImage(url);
      allLoaded = allLoaded && this.hasPreloadedImage(url);
    }
    return allLoaded;
  },

  preloadImage: function (url) {
    if (!url || this._cachedImages[url]) {
      return;
    }
    var img = new Image();
    img.onload = function () {
      if (this.isMounted()) {
        this._readyImages[url] = true;
        this.forceUpdate();
      }
    }.bind(this);
    img.onerror = function () {
      if (this.isMounted()) {
        delete this._cachedImages[url];
      }
    }.bind(this);
    img.src = url;

    this._cachedImages[url] = img;
  }
};

module.exports = ImagePreloaderMixin;
