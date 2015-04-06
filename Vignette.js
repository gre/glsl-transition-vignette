var React = require("react");
var raf = require("raf");
var extend = require('lodash/object/extend');
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
      down: false,
      hoverProgress: this.props.defaultProgress,
      progress: this.props.defaultProgress,
      i: 0,
      startTime: null
    };
  },

  getImageUrlsToPreload() {
    return this.props.images;
  },

  componentDidMount() {
  },

  componentDidUpdate() {
    if (!this._running && this.props.autostart && !this.isControlled() && this.preloadImages())
      raf(this.update);
  },

  update (t) {
    if (this.isControlled()) {
      this._running = false;
      return;
    }
    this._running = true;
    raf(this.update);
    const {
      transitionDuration,
      transitionDelay,
      transitionEasing,
      images
    } = this.props;
    const {
      startTime,
      progress
    } = this.state;
    if (!startTime) this.setState({ startTime: t });
    const dt = t-(startTime||t);
    if (dt > transitionDuration + transitionDelay) {
      const i = circular(this.state.i+1, images.length);
      this.setState({
        progress: 0,
        startTime: t,
        i
      });
    }
    else if (dt <= transitionDuration) {
      const p = transitionEasing(dt / transitionDuration);
      this.setState({ progress: p });
    }
    else if (progress !== 1) {
      this.setState({ progress: 1 });
    }
  },

  isControlled() {
    const controlsMode = this.props.controlsMode;
    const { down, hover } = this.state;
    return controlsMode===HOVER && hover || controlsMode===MOUSEDOWN && down;
  },

  render() {
    const {
      width,
      height,
      images,
      glsl,
      uniforms,
      cache,
      onClick,
      cursorColor,
      controlsMode,
      defaultProgress
    } = this.props;
    const {
      progress,
      down,
      hoverProgress,
      i
    } = this.state;
    const length = images.length;
    const from = this.getPreloadedImage(images[circular(i, length)]);
    const to = this.getPreloadedImage(images[circular(i+1, length)]);
    const cursorControlled = this.isControlled();
    const p = cursorControlled ? hoverProgress : (!this._running ? defaultProgress : progress);

    var style = extend({
      background: "#000",
      position: "relative",
      userSelect: "none",
      outline: cursorControlled ? "1px solid "+cursorColor : "1px solid #000",
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
      display: cursorControlled ? "block" : "none",
      position: "absolute",
      top: 0,
      left: (p * 100)+"%",
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
        style={canvasStyle}
        width={width}
        height={height}
        glsl={glsl}
        uniforms={uniforms}
        progress={p}
        from={from}
        to={to}
        drawer={cache.drawer}
        resolution={cache.resolution}
        delay={cache.delay}
      />
      :
      <TransitionCanvas
        style={canvasStyle}
        width={width}
        height={height}
        glsl={glsl}
        uniforms={uniforms}
        progress={p}
        from={from}
        to={to}
      />;
    }

    var mouseEvents = {};
    if (onClick) mouseEvents.onClick = onClick;
    if (controlsMode === HOVER) {
      mouseEvents.onMouseEnter = this.onMouseEnter;
      mouseEvents.onMouseLeave = this.onMouseLeave;
      mouseEvents.onMouseMove = this.onMouseMove;
    }
    else if (controlsMode === MOUSEDOWN) {
      mouseEvents.onMouseEnter = this.onMouseEnter;
      mouseEvents.onMouseLeave = this.onMouseLeave;
      mouseEvents.onMouseDown = this.onMouseDown;
      if (down) {
        mouseEvents.onMouseUp = this.onMouseUp;
        mouseEvents.onMouseMove = this.onMouseMove;
      }
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

  // N.B. following mouse events are only enable under some conditions (see render())

  onMouseDown (e) {
    this.setState({
      down: true,
      hoverProgress: this.progressForEvent(e)
    });
  },

  onMouseUp () {
    this.setState({
      down: false
    });
  },

  onMouseMove (e) {
    e.preventDefault();
    this.setState({
      hoverProgress: this.progressForEvent(e)
    });
  },

  onMouseEnter (e) {
    this.setState({
      hover: true,
      hoverProgress: this.progressForEvent(e)
    });
  },

  onMouseLeave () {
    this.setState({
      hover: false,
      down: false
    });
  }
});

export default Vignette;
