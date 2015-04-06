import React from "react";
import extend from 'lodash/object/extend';
import createGlslTransition from "glsl-transition";
import createTexture from "gl-texture2d";

var validSampler2D = React.PropTypes.oneOfType([
  React.PropTypes.instanceOf(window.HTMLImageElement),
  React.PropTypes.instanceOf(window.HTMLVideoElement),
  React.PropTypes.instanceOf(window.HTMLCanvasElement)
]);

var TransitionCanvas = React.createClass({
  propTypes: {
    glsl: React.PropTypes.string.isRequired,
    progress: React.PropTypes.number.isRequired,
    from: validSampler2D.isRequired,
    to: validSampler2D.isRequired,
    uniforms: React.PropTypes.object.isRequired,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired
  },
  render () {
    var dpr = window.devicePixelRatio || 1;
    var {width, height, style} = this.props;
    var styles = extend({
      width: width+"px",
      height: height+"px"
    }, style);
    return <canvas width={width*dpr} height={height*dpr} style={styles}></canvas>;
  },
  update () {
    const {
      progress,
      uniforms
    } = this.props;
    if (this.transition) this.transition.render(progress, this.fromTexture, this.toTexture, uniforms);
  },
  componentDidMount () {
    const canvas = this.getDOMNode();
    const gl = canvas.getContext("webgl");
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    this.gl = gl;
    this.syncGlsl();
    this.syncFrom();
    this.syncTo();
    this.update();
  },
  componentWillUnmount () {
    if (this.transition) this.transition.dispose();
    this.transition = null;
    this.gl = null;
  },
  componentDidUpdate (prevProps) {
    const {
      glsl,
      from,
      to
    } = this.props;
    if (to !== prevProps.to) this.syncTo();
    if (from !== prevProps.from) this.syncFrom();
    if (glsl !== prevProps.glsl) this.syncGlsl();
    this.update();
  },
  syncFrom () {
    if (this.fromTexture) this.fromTexture.dispose();
    this.fromTexture = createTexture(this.gl, this.props.from);
  },
  syncTo () {
    if (this.toTexture) this.toTexture.dispose();
    this.toTexture = createTexture(this.gl, this.props.to);
  },
  syncGlsl () {
    if (this.transition) this.transition.dispose();
    try {
      this.transition = createGlslTransition(this.gl, this.props.glsl);
    }
    catch (e) {
      console.error(e);
    }
  }
});

export default TransitionCanvas;
