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
    cursorColor: React.PropTypes.string,
    controlsMode: React.PropTypes.oneOf([ HOVER, MOUSEDOWN, NONE ]),
    cache: React.PropTypes.shape({
      drawer: React.PropTypes.func.isRequired,
      resolution: React.PropTypes.number,
      delay: React.PropTypes.number
    }),
    onTransitionPerformed: React.PropTypes.func
  },

  getDefaultProps () {
    return {
      controlsMode: HOVER,
      autostart: false,
      startonleave: false,
      defaultProgress: 0.4,
      onTransitionPerformed: function(){},
      transitionDuration: 1500,
      transitionDelay: 100,
      transitionEasing: x => x,
      cursorColor: "#FC6"
    };
  },

  getInitialState() {
    return {
      hover: false,
      progress: this.props.defaultProgress,
      i: 0,
      cursorEnabled: this.props.controlsMode === HOVER
    };
  },

  getImageUrlsToPreload() {
    return this.props.images;
  },

  componentDidUpdate() {
    if (!this._neverStarted && this.preloadImages()) {
      this._neverStarted = true;
      if (this.props.autostart)
        this.start();
    }
  },

  render() {
    var {width, height, images, glsl, uniforms, cache, onClick, cursorColor} = this.props;
    var {progress, cursorEnabled, hover} = this.state;
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
      outline: hoverModeHovered ? "1px solid "+cursorColor : "1px solid #000",
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
      background: cursorColor,
      boxShadow: "0px 0px 4px "+cursorColor
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

    var mouseEvents = {};
    if (onClick) mouseEvents.onClick = onClick;
    if (this.controlsMode !== NONE) {
      mouseEvents.onMouseEnter = this.onMouseEnter;
      mouseEvents.onMouseLeave = this.onMouseLeave;
      mouseEvents.onMouseDown = this.onMouseDown;
      mouseEvents.onMouseUp = this.onMouseUp;
      mouseEvents.onMouseMove = this.onMouseMove;
    }

    return <div
      style={style}
      {...mouseEvents}>
      {canvas}
      <div style={contentStyle}>{this.props.children}</div>
      <span style={cursorStyle}></span>
    </div>;
  },

  progressForEvent (e) {
    var node = this.getDOMNode();
    return (e.clientX - node.getBoundingClientRect().left) / node.clientWidth;
  },

  setProgress (p) {
    this.stop();
    this.setState({
      progress: p
    });
  },

  onMouseDown (e) {
    if (this.props.controlsMode === MOUSEDOWN) {
      e.preventDefault();
      this.setState({
        cursorEnabled: true
      });
      this.setProgress(this.progressForEvent(e));
    }
  },

  onMouseUp () {
    if (this.props.controlsMode === MOUSEDOWN) {
      this.setState({
        cursorEnabled: false
      });
      this.maybeRestart();
    }
  },

  onMouseMove (e) {
    if (this.props.controlsMode === HOVER || this.state.cursorEnabled) {
      e.preventDefault();
      this.setProgress(this.progressForEvent(e));
    }
  },

  onMouseEnter (e) {
    this.setState({
      hover: true
    });
    if (this.props.controlsMode === HOVER) {
      if (this.props.autostart || this.props.startonleave)
        this.stop();
      this.setProgress(this.progressForEvent(e));
    }
  },

  onMouseLeave () {
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

  maybeRestart () {
    if (this.props.autostart || this.props.startonleave)
      this.start();
    else if ("defaultProgress" in this.props)
      this.setProgress(this.props.defaultProgress);
  },

  nextFromTo () {
    var l = this.props.images.length;
    this.setState({
      i: circular(this.state.i+1, l)
    });
  },
  start () {
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
  stop () {
    this.running = false;
    if (this.refs.transition) this.refs.transition.abort();
  }
});

export default Vignette;
