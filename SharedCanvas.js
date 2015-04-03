import GlslTransition from "glsl-transition";

function SharedCache () {
}

SharedCache.prototype = {
  init: function (width, height) {
    var dpr = window.devicePixelRatio || 1;
    var canvasTransition = document.createElement("canvas");
    canvasTransition.width = dpr * width;
    canvasTransition.height = dpr * height;
    var Transition = GlslTransition(canvasTransition);
    this._Transition = Transition;
    this.canvasTransition = canvasTransition;
    this.transitions = {};
  },
  destroy: function () {
    for (var k in this.transitions) {
      this.transitions[k].transition.destroy();
    }
    this._Transition = null;
    this.transitions = null;
    this.canvasTransition = null;
  },
  clear: function () {
    for (var k in this.transitions) {
      this.transitions[k].transition.destroy();
    }
    this.transitions = {};
  },
  getAllIds: function () {
    return Object.keys(this.transitions);
  },
  getTransitionDrawer: function (id) {
    return this.transitions[id].res;
  },
  removeTransitionDrawer: function (id) {
    if (this.transitions[id]) {
      this.transitions[id].transition.destroy();
      delete this.transitions[id];
    }
  },
  createTransitionDrawer: function (id, glsl) {
    var transition = this._Transition(glsl);
    if (this.transitions[id]) {
      this.transitions[id].destroy();
    }
    const res = function (p, uniforms) {
      if (transition.core.reset()) {
        for (let u in uniforms) {
          var value = uniforms[u];
          transition.core.setUniform(u, value);
        }
      }
      transition.core.setUniform("progress", p);
      transition.core.draw();
      return this.canvasTransition;
    }.bind(this);
    this.transitions[id] = {
      glsl: glsl,
      transition: transition,
      res: res
    };
    return res;
  }

};

SharedCache.create = function (width, height) {
  var s = new SharedCache();
  s.init(width, height);
  return s;
};

export default SharedCache;
