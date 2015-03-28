import React from "react";
import Vignette from "..";
import GlslTransitions from "glsl-transitions";

var transitions =
  [ "swap", "cube", "ButterflyWaveScrawler", "doorway" ]
  .map(name => GlslTransitions.filter(t => t.name === name)[0]);

var vignetteStyle = {
  display: "inline-block",
  margin: "5px"
};

var titleStyle = {
  fontSize: "1.2em",
  color: "#fff",
  textShadow: "#000 0px 0px 1px",
  margin: "0",
  padding: "8px"
};

var linkStyle = {
  color: "#fc6",
  textDecoration: "none"
};

document.body.style.padding = "0px 20px";
document.body.style.color = "#ddd";
document.body.style.background = "#333";
document.body.style.fontFamily = "sans-serif";

React.render(<div>
  <h1>
    <a href="http://github.com/glslio/glsl-transition-vignette" style={linkStyle}>
      glsl-transition-vignette
    </a>
  </h1>

  <h2>customizable GLSL Transition Vignette with hover controls</h2>

  <Vignette
    style={vignetteStyle}
    glsl={transitions[0].glsl}
    uniforms={transitions[0].uniforms}
    images={[ "1.jpg", "2.jpg" ]}
    width={400}
    height={300}
    onClick={console.log.bind(console, "CLICK")}
    controlsMode="hover">
    <h2 style={titleStyle}>hover controls</h2>
  </Vignette>

  <Vignette
    style={vignetteStyle}
    glsl={transitions[1].glsl}
    uniforms={transitions[1].uniforms}
    images={[ "1.jpg", "2.jpg", "3.jpg" ]}
    width={400}
    height={300}
    autostart={true}
    startonleave={true}
    controlsMode="mousedown"
    transitionDuration={1000}
    transitionDelay={0}>
    <h2 style={titleStyle}>autoplay and mousedown controls</h2>
    <p style={{
        textAlign:"center",
        position: "absolute",
        width: "100%",
        bottom: "5px",
        color: "#fc6",
        textShadow: "1px 1px 1px #000"
      }}>(try to drag on the vignette)</p>
  </Vignette>

  <Vignette
    style={vignetteStyle}
    glsl={transitions[2].glsl}
    uniforms={transitions[2].uniforms}
    images={[ "1.jpg", "2.jpg", "3.jpg" ]}
    width={400}
    height={300}
    transitionDuration={5000}
    autostart={true}
    controlsMode="none">
    <h2 style={titleStyle}>no controls, slower</h2>
  </Vignette>

  <Vignette
    style={vignetteStyle}
    glsl={transitions[3].glsl}
    uniforms={transitions[3].uniforms}
    images={[ "1.jpg", "2.jpg", "3.jpg" ]}
    width={400}
    height={300}
    transitionEasing={x => x * x * x}
    autostart={true}
    cursorColor="#6cf">
    <h2 style={titleStyle}>custom cursor color, cubic easing</h2>
  </Vignette>

  <p>
    <a style={linkStyle} target="_blank" href="https://github.com/glslio/glsl-transition-vignette/blob/master/example/index.js">Source code of these examples.</a>
  </p>

</div>, document.body);
