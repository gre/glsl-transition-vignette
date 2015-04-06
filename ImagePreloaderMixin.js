
// Inspired by react-dnd
var _cachedImages = {}, _readyImages = {}, _pendingInstances = {};

function inPending (instance, url) {
  var pending = _pendingInstances[url];
  return pending && pending.indexOf(instance) !== -1;
}
function addPending (instance, url) {
  var pending = _pendingInstances[url];
  if (!pending) _pendingInstances[url] = pending = [];
  pending.push(instance);
}
function releasePending (url) {
  (_pendingInstances[url]||[]).forEach(function (instance) {
    if (instance.isMounted()) {
      instance.forceUpdate();
    }
  });
  delete _pendingInstances[url];
}

var ImagePreloaderMixin = {
  componentDidMount() {
    this.preloadImages();
  },

  componentDidUpdate() {
    this.preloadImages();
  },

  hasPreloadedImage (url) {
    return !!_readyImages[url];
  },

  getPreloadedImage (url) {
    if (this.hasPreloadedImage(url)) {
      return _cachedImages[url];
    }
  },

  preloadImages() {
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
    if (!inPending(this, url)) {
      addPending(this, url);
    }
    if (!url || _cachedImages[url]) {
      return;
    }
    var img = new window.Image();
    img.onload = function () {
      _readyImages[url] = true;
      releasePending(url);
    };
    img.onerror = function () {
      delete _cachedImages[url];
      delete _pendingInstances[url];
    };
    img.src = url;
    _cachedImages[url] = img;
  }
};

export default ImagePreloaderMixin;
