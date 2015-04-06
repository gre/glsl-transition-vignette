
// Inspired by react-dnd
var _cachedImages = {}, _readyImages = {};

var ImagePreloaderMixin = {
  componentDidMount() {
    this.preloadImages();
  },

  componentDidUpdate() {
    this.preloadImages();
  },

  hasPreloadedImage (url) {
    return _readyImages && !!_readyImages[url];
  },

  getPreloadedImage (url) {
    if (this.hasPreloadedImage(url)) {
      return _cachedImages[url];
    }
  },

  preloadImages() {
    if (!_cachedImages) return false;
    var urls = this.getImageUrlsToPreload();
    var allLoaded = true;
    for (var i=0; i<urls.length; ++i) {
      var url = urls[i];
      this.preloadImage(url);
      allLoaded = allLoaded && this.hasPreloadedImage(url);
    }
    return allLoaded;
  },

  preloadImage (url) {
    if (!url || _cachedImages[url]) {
      return;
    }
    var img = new window.Image();
    img.onload = function () {
      this._readyImages[url] = true;
      if (this.isMounted()) {
        this.forceUpdate();
      }
    }.bind(this);
    img.onerror = function () {
      delete _cachedImages[url];
    }.bind(this);
    img.src = url;
    _cachedImages[url] = img;
  }
};

export default ImagePreloaderMixin;
