import React from "react";
import memoize from "lodash/function/memoize";
import extend from 'lodash/object/extend';
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
  componentDidUpdate (prevProps) {
    const {
      glsl,
      from,
      to,
      uniforms,
      width,
      height,
      drawer,
      resolution
    } = this.props;
    if (to !== prevProps.to ||
      from !== prevProps.from ||
      glsl !== prevProps.glsl ||
      width !== prevProps.width ||
      height !== prevProps.height ||
      drawer !== prevProps.drawer ||
      resolution !== prevProps.resolution ||
      !uniformsEquals(uniforms, prevProps.uniforms))
      this.resetCache();
    this.update();
  },
  drawer (i) {
    const {
      resolution,
      from,
      to,
      drawer,
      uniforms
    } = this.props;
    return screenshot(drawer(i / resolution, from, to, uniforms));
  },
  clearCache () {
    this._curDrawn = null;
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
  update () {
    const {
      progress,
      resolution
    } = this.props;
    var i = Math.max(0, Math.min(Math.round(progress * resolution), resolution));
    if (i === this._curDrawn) return;
    if (this.canvases) {
      var canvas = this.canvases(i);
      if (canvas) {
        this._curDrawn = i;
        this.ctx.drawImage(canvas, 0, 0);
      }
    }
  }
});

export default TransitionCanvasCache;
