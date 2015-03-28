import React from "react";
import Q from "q";
import memoize from "lodash/function/memoize";
import extend from 'lodash/object/extend';
import requestAnimationFrame from "raf";
import uniformsEquals from "./uniformsEquals";

var validSampler2D = React.PropTypes.oneOfType([
  React.PropTypes.instanceOf(window.HTMLImageElement),
  React.PropTypes.instanceOf(window.HTMLCanvasElement)
]);

function screenshot (canvas) {
  var c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  var ctx = c.getContext("2d");
  ctx.drawImage(canvas, 0, 0);
  return c;
}

var TransitionCanvasCache = React.createClass({
  propTypes: {
    glsl: React.PropTypes.string.isRequired,
    from: validSampler2D,
    to: validSampler2D,
    uniforms: React.PropTypes.object.isRequired,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    progress: React.PropTypes.number.isRequired,
    drawer: React.PropTypes.func.isRequired,
    resolution: React.PropTypes.number,
    delay: React.PropTypes.number
    // TODO: add a "thumbnail" image parameter
  },
  getInitialProps () {
    return {
      resolution: this.props.width
    };
  },
  render () {
    var dpr = window.devicePixelRatio || 1;
    var {width, height} = this.props;
    var style = extend({
      width: width+"px",
      height: height+"px"
    }, this.props.style);
    return <canvas width={width*dpr} height={height*dpr} style={style}></canvas>;
  },
  componentDidMount () {
    this.ctx = this.getDOMNode().getContext("2d");
    if (this.props.delay)
      setTimeout(this.sync, this.props.delay);
    else
      this.sync();
  },
  componentWillUnmount () {
    this.clearCache();
  },
  componentDidUpdate () {
    this.sync();
  },
  sync () {
    if (!this.isMounted()) return;
    if (this.props.glsl !== this.lastGlsl ||
      this.props.to !== this.lastTo ||
      this.props.from !== this.lastFrom ||
      !uniformsEquals(this.props.uniforms, this.lastUniforms)
      ) {
      this._allUniforms = extend({ from: this.props.from, to: this.props.to }, this.props.uniforms);
      this.resetCache();
      this.setProgress(this.props.progress);
    }
    else if (this.props.progress !== this.lastProgress) {
      this.setProgress(this.props.progress);
    }
    this.lastTo = this.props.to;
    this.lastFrom = this.props.from;
    this.lastUniforms = this.props.uniforms;
    this.lastProgress = this.props.progress;
    this.lastGlsl = this.props.glsl;
  },
  drawer (i) {
    return screenshot(this.props.drawer(i / this.props.resolution, this._allUniforms));
  },
  clearCache () {
    if (this.canvases) {
      for (var k in this.canvases.cache) {
        delete this.canvases.cache[k];
      }
      this.canvases.cache = null;
      this.canvases = null;
    }
  },
  resetCache () {
    this.clearCache();
    this.canvases = memoize(this.drawer);
  },
  setProgress (p) {
    var i = Math.max(0, Math.min(Math.round(p * this.props.resolution), this.props.resolution));
    if (this.canvases) {
      var canvas = this.canvases(i);
      if (canvas) {
        this.ctx.drawImage(canvas, 0, 0);
      }
    }
  },
  animate (duration, easing) {
    var d = Q.defer();
    var start = Date.now();
    var self = this;
    this.abortRequest = false;
    requestAnimationFrame(function loop () {
      if (self.abortRequest) {
        d.reject(new Error("TransitionCanvasCache: Transition Aborted"));
        return;
      }
      var p = (Date.now() - start) / duration;
      if (p<1) {
        requestAnimationFrame(loop);
        self.setProgress(easing(p));
      }
      else {
        self.setProgress(easing(1));
        d.resolve();
      }
    });
    return d.promise;
  },
  abort () {
    this.abortRequest = true;
  }
});

export default TransitionCanvasCache;
