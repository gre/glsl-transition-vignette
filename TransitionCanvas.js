import React from "react";
import extend from 'lodash/object/extend';
import GlslTransition from "glsl-transition";
import uniformsEquals from "./uniformsEquals";

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
    width: React.PropTypes.number.isRequired, // TODO handle width/height changes
    height: React.PropTypes.number.isRequired,
    progress: React.PropTypes.number.isRequired
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
    this.running = 0;
    this.Transition = GlslTransition(this.getDOMNode());
    this.componentDidUpdate();
  },
  componentWillUnmount () {
    if (this.transition) this.transition.destroy();
    this.transition = null;
    this.Transition = null;
  },
  componentDidUpdate () {
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
  syncGlsl () {
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
  syncUniforms () {
    this.transition.core.reset();
    var uniforms = this.getAllUniforms();
    for (var u in uniforms) {
      this.transition.core.setUniform(u, uniforms[u]);
    }
  },
  syncProgress () {
    if (!this.running) {
      this.transition.core.setUniform("progress", this.props.progress);
      this.transition.core.draw();
    }
  },
  getAllUniforms () {
    return extend({ from: this.props.from, to: this.props.to }, this.props.uniforms);
  },
  animate (duration, easing) {
    // this.transition.core.reset(); // FIXME figure out if this is required and if the transition() shouldn't fix that
    var p = this.transition(this.getAllUniforms(), duration, easing);
    this.running++;
    p.fin(function () {
      this.running--;
    }.bind(this));
    return p;
  },
  abort () {
    this.Transition.abort();
  }
});

export default TransitionCanvas;
