/** @jsx React.DOM */
var React = require("react");
var extend = require('lodash/object/extend');
var GlslTransition = require("glsl-transition");
var uniformsEquals = require("./uniformsEquals");

var validSampler2D = React.PropTypes.oneOfType([
  React.PropTypes.instanceOf(window.HTMLImageElement),
  React.PropTypes.instanceOf(window.HTMLVideoElement),
  React.PropTypes.instanceOf(window.HTMLCanvasElement)
]);

var TransitionCanvas = React.createClass({
  propTypes: {
    glsl: React.PropTypes.string.isRequired,
    from: validSampler2D,
    to: validSampler2D,
    uniforms: React.PropTypes.object.isRequired,
    width: React.PropTypes.number.isRequired, // TODO handle width/height changes@
    height: React.PropTypes.number.isRequired,
    progress: React.PropTypes.number.isRequired
  },
  render: function () {
    var dpr = window.devicePixelRatio || 1;
    var width = this.props.width;
    var height = this.props.height;
    var style = extend({
      width: width+"px",
      height: height+"px"
    }, this.props.style);
    return <canvas width={width*dpr} height={height*dpr} style={style}></canvas>;
  },
  componentDidMount: function () {
    this.running = 0;
    this.Transition = GlslTransition(this.getDOMNode());
    this.componentDidUpdate();
  },
  componentWillUnmount: function () {
    if (this.transition) this.transition.destroy();
    this.transition = null;
    this.Transition = null;
  },
  componentDidUpdate: function () {
    if (this.props.glsl !== this.lastGlsl) {
      this.syncGlsl();
    }
    else if (
      this.props.to !== this.lastTo ||
      this.props.from !== this.lastFrom ||
      !uniformsEquals(this.props.uniforms, this.lastUniforms)
    ) {
      this.syncUniforms();
    }

    if (this.props.progress !== this.lastProgress) {
      this.syncProgress();
    }
    this.lastTo = this.props.to;
    this.lastFrom = this.props.from;
    this.lastUniforms = this.props.uniforms;
    this.lastProgress = this.props.progress;
    this.lastGlsl = this.props.glsl;
  },
  syncGlsl: function () {
    var glsl = this.props.glsl;
    if (this.transition) {
      this.Transition.abort();
      this.transition.destroy();
    }
    try {
      this.transition = this.Transition(glsl);
      this.syncUniforms();
    }
    catch (e) {
      console.error(e);
    }
  },
  syncUniforms: function () {
    this.transition.core.reset();
    var uniforms = this.getAllUniforms();
    for (var u in uniforms) {
      this.transition.core.setUniform(u, uniforms[u]);
    }
  },
  syncProgress: function () {
    if (!this.running) {
      this.transition.core.setUniform("progress", this.props.progress);
      this.transition.core.draw();
    }
  },
  getAllUniforms: function () {
    return extend({ from: this.props.from, to: this.props.to }, this.props.uniforms);
  },
  animate: function (duration, easing) {
    // this.transition.core.reset(); // FIXME figure out if this is required and if the transition() shouldn't fix that
    var p = this.transition(this.getAllUniforms(), duration, easing);
    this.running++;
    p.fin(function () {
      this.running--;
    }.bind(this));
    return p;
  },
  abort: function () {
    this.Transition.abort();
  }
});

module.exports = TransitionCanvas;
