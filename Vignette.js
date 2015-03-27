var React = require("react");
var Q = require("q");
var extend = require('lodash/object/extend');
var GlslTransition = require("glsl-transition");
var TransitionCanvas = require("./TransitionCanvas");
var TransitionCanvasCache = require("./TransitionCanvasCache");
var ImagePreloaderMixin = require("./ImagePreloaderMixin");

function circular (n, l) {
  return n < l ? n : 0;
}

var HOVER = "hover";
var MOUSEDOWN = "mousedown";
var NONE = "none";

var Vignette = React.createClass({
  mixins: [ ImagePreloaderMixin ],

  propTypes: {
    glsl: React.PropTypes.string.isRequired,
    images: React.PropTypes.array.isRequired,
    uniforms: React.PropTypes.object.isRequired,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    onClick: React.PropTypes.func,
    autostart: React.PropTypes.bool,
    startonleave: React.PropTypes.bool,
    defaultProgress: React.PropTypes.number,
    transitionDuration: React.PropTypes.number,
    transitionDelay: React.PropTypes.number,
    transitionEasing: React.PropTypes.func,
    controlsMode: React.PropTypes.oneOf([ HOVER, MOUSEDOWN, NONE ]),
    cache: React.PropTypes.shape({
      drawer: React.PropTypes.func.isRequired,
      resolution: React.PropTypes.number,
      delay: React.PropTypes.number
    }),
    onTransitionPerformed: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      controlsMode: HOVER,
      autostart: false,
      startonleave: false,
      defaultProgress: 0.4,
      onTransitionPerformed: function(){},
      transitionDuration: 1500,
      transitionDelay: 100,
      transitionEasing: function(x){ return x; }
    };
  },

  getInitialState: function () {
    return {
      hover: false,
      progress: this.props.defaultProgress,
      i: 0,
      cursorEnabled: this.props.controlsMode === HOVER
    };
  },

  getImageUrlsToPreload: function () {
    return this.props.images;
  },

  componentDidUpdate: function() {
    if (!this._neverStarted && this.preloadImages()) {
      this._neverStarted = true;
      if (this.props.autostart)
        this.start();
    }
  },

  render: function() {
    var controlsMode = this.props.controlsMode;
    var width = this.props.width;
    var height = this.props.height;
    var images = this.props.images;
    var glsl = this.props.glsl;
    var progress = this.state.progress;
    var uniforms = this.props.uniforms;
    var cursorEnabled = this.state.cursorEnabled;
    var cache = this.props.cache;
    var onClick = this.props.onClick;
    var hover = this.state.hover;
    var hoverModeHovered = hover && cursorEnabled;
    var length = images.length;
    var i = circular(this.state.i, length);
    var j = circular(i+1, length);
    var from = this.getPreloadedImage(images[i]);
    var to = this.getPreloadedImage(images[j]);

    var style = extend({
      background: "#000",
      position: "relative",
      userSelect: "none",
      outline: hoverModeHovered ? "1px solid #FC6" : "1px solid #000",
      width: width+"px",
      height: height+"px"
    }, this.props.style);

    var contentStyle = {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      overflow: "hidden",
      zIndex: 2
    };

    var cursorStyle = {
      display: hoverModeHovered ? "block" : "none",
      position: "absolute",
      top: 0,
      left: (progress * 100)+"%",
      height: "100%",
      pointerEvents: "none",
      zIndex: 1,
      width: "2px",
      background: "#FC6",
      boxShadow: "0px 0px 4px rgba(255,150,80,1)"
    };

    var canvasStyle = {
      position: "absolute",
      top: 0,
      left: 0,
      width: width+"px",
      height: height+"px"
    };

    var canvas;
    if (this.preloadImages()) {
      canvas = cache ?
      <TransitionCanvasCache
        ref="transition"
        style={canvasStyle}
        progress={progress}
        width={width}
        height={height}
        glsl={glsl}
        uniforms={uniforms}
        from={from}
        to={to}
        drawer={cache.drawer}
        resolution={cache.resolution}
        delay={cache.delay}
      />
      :
      <TransitionCanvas
        ref="transition"
        style={canvasStyle}
        progress={progress}
        width={width}
        height={height}
        glsl={glsl}
        uniforms={uniforms}
        from={from}
        to={to}
      />;
    }

    return <div
      style={style}
      onClick={onClick}
      onMouseDown={this.onMouseDown}
      onMouseUp={this.onMouseUp}
      onMouseMove={this.onMouseMove}
      onMouseEnter={this.onMouseEnter}
      onMouseLeave={this.onMouseLeave}>
      {canvas}
      <div style={contentStyle}>{this.props.children}</div>
      <span style={cursorStyle}></span>
    </div>;
  },

  progressForEvent: function (e) {
    var node = this.getDOMNode();
    return (e.clientX - node.getBoundingClientRect().left) / node.clientWidth;
  },

  setProgress: function (p) {
    this.stop();
    this.setState({
      progress: p
    });
  },

  onMouseDown: function (e) {
    if (this.props.controlsMode === MOUSEDOWN) {
      e.preventDefault();
      this.setState({
        cursorEnabled: true
      });
      this.setProgress(this.progressForEvent(e));
    }
  },

  onMouseUp: function () {
    if (this.props.controlsMode === MOUSEDOWN) {
      this.setState({
        cursorEnabled: false
      });
      this.maybeRestart();
    }
  },

  onMouseMove: function (e) {
    if (this.props.controlsMode === HOVER || this.state.cursorEnabled) {
      e.preventDefault();
      this.setProgress(this.progressForEvent(e));
    }
  },

  onMouseEnter: function (e) {
    this.setState({
      hover: true
    });
    if (this.props.controlsMode === HOVER) {
      if (this.props.autostart || this.props.startonleave)
        this.stop();
      this.setProgress(this.progressForEvent(e));
    }
  },

  onMouseLeave: function () {
    this.setState({
      hover: false
    });
    if (this.props.controlsMode === MOUSEDOWN) {
      if (this.state.cursorEnabled) {
        this.setState({
          cursorEnabled: false
        });
        this.maybeRestart();
      }
    }
    else {
      this.maybeRestart();
    }
  },

  maybeRestart: function () {
    if (this.props.autostart || this.props.startonleave)
      this.start();
    else if ("defaultProgress" in this.props)
      this.setProgress(this.props.defaultProgress);
  },

  nextFromTo: function () {
    var l = this.props.images.length;
    this.setState({
      i: circular(this.state.i+1, l)
    });
  },
  start: function () {
    var transition = this.refs.transition;
    var self = this;
    var args = arguments;
    this.restart = function () {
      return self.start.apply(self, args);
    };
    this.running = true;
    return (function loop () {
      if (!self.isMounted()) self.stop();
      if (!self.running) return;
      return Q.fcall(transition.animate.bind(transition, self.props.transitionDuration, self.props.transitionEasing))
        .then(function (result) {
          if (result) self.props.onTransitionPerformed(result);
          return result;
        })
        .then(function () {
          return Q.delay(self.props.transitionDelay);
        })
        .then(function () {
          if (!self.isMounted()) self.stop();
          else self.nextFromTo();
        })
        .then(loop)
        .fail(function(e){
          // Recover an interrupted animation
          if (e instanceof GlslTransition.TransitionAbortedError) {
            return Q.delay(200).then(loop);
          }
          else {
            console.log("TransitionViewer transition anormally aborted", e.stack);
          }
        });
    }());
  },
  stop: function () {
    this.running = false;
    if (this.refs.transition) this.refs.transition.abort();
  }
});

module.exports = Vignette;
