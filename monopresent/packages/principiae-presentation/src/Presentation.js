import React, { useEffect, useState } from "react";

import {
  AnimateSVG,
  Morph,
  m,
  M,
  Portal,
  Show,
  Notes,
  timeline,
  range,
  setLaTeXBaselineMetadataMode,
  themes,
} from "../../immersion-presentation/src";

const {
  Presentation,
  Slide,
  OverviewSlide,
  QuestionSlide,
  List,
  Item,
  Box,
  Qed,
} = themes.principiae;

const morphFrames = [
  String.raw`x_t`,
  String.raw`x_t + \Delta x`,
  String.raw`x_{t+1} = f_\theta(x_t)`,
];

const inlineMorphA = [
  String.raw`x`,
  String.raw`\frac{1}{1+x^2}`,
  String.raw`\left(\int_0^1 x^2\,dx\right)^2`,
  String.raw`\sum_{k=1}^{n}\frac{k^2}{(1+k)^2}`,
];

const inlineMorphB = [
  String.raw`y_t`,
  String.raw`\left[\sum_{i=1}^n i\right]`,
  String.raw`\left\langle \frac{a+b}{c}, \int_0^1 t\,dt \right\rangle`,
  String.raw`\frac{\left(\sum_{j=1}^m j\right)^2}{1+\left(\int_0^1 u^2\,du\right)}`,
];

const flowTimeline = timeline`
left  v p h
right h v p
arrow d D D
`;

const flowSteps = flowTimeline.map((s, i) => ({
  left: {
    ...s.left,
    css: {
      transform: s.left.opacity === 1 ? "scale(1.06)" : "scale(1)",
      transformOrigin: "center",
      transformBox: "fill-box",
    },
  },
  right: {
    ...s.right,
    css: {
      transform: s.right.opacity === 1 ? "scale(1.06)" : "scale(1)",
      transformOrigin: "center",
      transformBox: "fill-box",
    },
  },
  arrow: {
    ...s.arrow,
    opacity: s.arrow.drawSVG === 0 ? 0 : 1,
  },
  "text:left_label": ["$x_t$", "$x_t$", "$x_t$"][i],
  "text:right_label": ["$x_{t+1}$", "$f_\\theta(x_t)$", "$x_0$"][i],
}));

function DelayedUnderline({ text, delay = 2000, duration = 700 }) {
  const routePath = typeof window !== "undefined" ? window.location.pathname : "";
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
    const timer = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [delay, routePath]);

  return (
    <span style={{ position: "relative", display: "inline-block", paddingBottom: "2px" }}>
      {text}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "-1px",
          height: "2px",
          background: "#111827",
          transform: revealed ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left center",
          transition: `transform ${duration}ms ease`,
          pointerEvents: "none",
        }}
      />
    </span>
  );
}

const testLayerTimeline = timeline`
layer1 vvv
layer2 hhv
`;

const testLayerSteps = testLayerTimeline.map((s, i) => ({
  layer1: {
    ...s.layer1,
    opacity: i === 2 ? 0.1 : s.layer1.opacity,
    seconds: 0.45,
  },
  layer2: {
    ...s.layer2,
    opacity: i === 2 ? 0.9 : s.layer2.opacity,
    seconds: 0.45,
  },
  "text:text1": ["$x^2$", "$y^4$", "$y^4$"][i],
}));

const testLayerSweepSteps = testLayerTimeline.map((s, i) => ({
  layer1: {
    ...s.layer1,
    opacity: i === 2 ? 0.1 : s.layer1.opacity,
    seconds: 0.45,
  },
  layer2: {
    ...s.layer2,
    opacity: i === 2 ? 0.9 : s.layer2.opacity,
    x: i < 2 ? 220 : 0,
    seconds: 0.75,
    ease: "power2.out",
  },
  text1: {
    attr: {
      "data-scale": 2,
    },
    seconds: 0,
  },
  "text:text1": ["$x^2$", "$y^4$", "$y^4$"][i],
}));

const residueCgTimeline = timeline`
layer1 vvhh
layer2 hvvh
layer3 hhvv
layer4 hhhv
`;

const residueCgSteps = residueCgTimeline.map((s, i) => ({
  layer1: {
    ...s.layer1,
    seconds: i === 2 ? 0.6 : 0.8,
  },
  layer2: {
    ...s.layer2,
    delay: i === 3 ? 0.6 : 0,
    seconds: i === 3 ? 0.6 : 0.8,
  },
  layer3: {
    ...s.layer3,
    delay: i === 2 ? 0.6 : 0,
    seconds: 0.8,
  },
  layer4: {
    ...s.layer4,
    delay: 0,
    seconds: i === 3 ? 0.6 : 0.8,
  },
}));

const cgDefTimeline = timeline`
frame vv
text1 hv
`;

const cgDefSteps = cgDefTimeline.map((s) => ({
  frame: { ...s.frame, seconds: 0.45 },
  text1: { ...s.text1, seconds: 0.45 },
}));

const cgRepTimeline = timeline`
left vvvv
right hvvv
`;

const cgRepSteps = cgRepTimeline.map((s, i) => ({
  left: s.left,
  right: s.right,
  colorize: i >= 2,
  underlineOverlap: i >= 3,
}));

const edgeTypeTimeline = timeline`
g1 vv
text1-5 vv
cg_i_group vv
text1 hv
text1-7 hv
`;

const edgeTypeSteps = edgeTypeTimeline.map((s, i) => ({
  g1: {
    ...s.g1,
    opacity: i === 1 ? 0.2 : s.g1.opacity,
    delay: i === 1 ? 3.0 : 0,
    seconds: i === 1 ? 0.6 : 0.45,
  },
  "text1-5": {
    ...s["text1-5"],
    opacity: i === 1 ? 0.2 : s["text1-5"].opacity,
    delay: i === 1 ? 3.0 : 0,
    seconds: i === 1 ? 0.6 : 0.45,
  },
  cg_i_group: {
    ...s.cg_i_group,
    opacity: i === 1 ? 0.2 : s.cg_i_group.opacity,
    delay: i === 1 ? 3.0 : 0,
    seconds: i === 1 ? 0.6 : 0.45,
  },
  text1: {
    ...s.text1,
    opacity: s.text1.opacity,
    seconds: 0.45,
  },
  "text1-7": {
    ...s["text1-7"],
    delay: i === 1 ? 1.0 : 0,
    seconds: 0.45,
  },
}));

const graphEmbeddingMorphStates = [
  String.raw`\g{lhs}{D(\mathbf{R})=}\g{a}{D^{(0)}(\mathbf{R})}\g{op}{\oplus}\g{b}{D^{(1)}(\mathbf{R})}`,
  String.raw`\g{lhs}{D(\mathbf{R})=}\g{a}{1}\g{op}{\oplus}\g{b}{\mathbf{R}}`,
  String.raw`\g{lhs}{D(\mathbf{R})=}\begin{bmatrix}\g{a}{1}&\g{op}{0}\\0&\g{b}{\mathbf{R}}\end{bmatrix}`,
];

const outerBlockTimeline = timeline`
rect6      hhhhhhvv
rect6draw  ddddddDD
text6      vvvvvvvv
text1      vvvvvvvv
text2      hvvvvvvv
text1-3    hvvvvvvv
text7      hhvvvvvv
text1-367  hhvvvvvv
text3      hhhvvvvv
text1-5    hhhvvvvv
text4      hhhhvvvv
text1-9    hhhhvvvv
text1-7    hhhhvvvv
text5      hhhhhvvv
text1-36   hhhhhvvv
rect7      hhhhhhhv
`;

const OUTER_BLOCK_GRAY_STEP = outerBlockTimeline.length - 1;
const OUTER_BLOCK_DRAW_STEP = outerBlockTimeline.length - 2;

const grayStepOpacity = (id, baseOpacity, stepIndex) => {
  if (stepIndex !== OUTER_BLOCK_GRAY_STEP) return baseOpacity;
  if (id === "rect7") return baseOpacity;
  if (id === "text1-5") return 1;
  return 0.2;
};

const outerBlockSteps = outerBlockTimeline.map((s, i) => ({
  rect6: {
    ...s.rect6,
    opacity: grayStepOpacity("rect6", s.rect6.opacity, i),
    drawSVG: i === OUTER_BLOCK_DRAW_STEP ? "0 100%" : i > OUTER_BLOCK_DRAW_STEP ? "100%" : 0,
    seconds: i === OUTER_BLOCK_DRAW_STEP ? 1.2 : 0.45,
  },
  text6: { ...s.text6, opacity: grayStepOpacity("text6", s.text6.opacity, i), seconds: 0.45 },
  text1: { ...s.text1, opacity: grayStepOpacity("text1", s.text1.opacity, i), seconds: 0.45 },
  text2: { ...s.text2, opacity: grayStepOpacity("text2", s.text2.opacity, i), seconds: 0.45 },
  "text1-3": { ...s["text1-3"], opacity: grayStepOpacity("text1-3", s["text1-3"].opacity, i), seconds: 0.45 },
  text3: { ...s.text3, opacity: grayStepOpacity("text3", s.text3.opacity, i), seconds: 0.45 },
  "text1-5": { ...s["text1-5"], opacity: grayStepOpacity("text1-5", s["text1-5"].opacity, i), seconds: 0.45 },
  text4: { ...s.text4, opacity: grayStepOpacity("text4", s.text4.opacity, i), seconds: 0.45 },
  "text1-9": { ...s["text1-9"], opacity: grayStepOpacity("text1-9", s["text1-9"].opacity, i), seconds: 0.45 },
  "text1-7": { ...s["text1-7"], opacity: grayStepOpacity("text1-7", s["text1-7"].opacity, i), seconds: 0.45 },
  text5: { ...s.text5, opacity: grayStepOpacity("text5", s.text5.opacity, i), seconds: 0.45 },
  "text1-36": { ...s["text1-36"], opacity: grayStepOpacity("text1-36", s["text1-36"].opacity, i), seconds: 0.45 },
  text7: { ...s.text7, opacity: grayStepOpacity("text7", s.text7.opacity, i), seconds: 0.45 },
  "text1-367": { ...s["text1-367"], opacity: grayStepOpacity("text1-367", s["text1-367"].opacity, i), seconds: 0.45 },
  rect7: { ...s.rect7, seconds: 0.45 },
}));

const innerBlockTimeline = timeline`
text2      vvvvvvvvvvvv
text1      vvvvvvvvvvvv
text3      hvvvvvvvvvvv
text1-1    hvvvvvvvvvvv
text4      hhvvvvvvvvvv
text1-7    hhvvvvvvvvvv
text5      hhhvvvvvvvvv
text1-2    hhhvvvvvvvvv
text6      hhhhvvvvvvvv
text1-75   hhhhvvvvvvvv
text7      hhhhhvvvvvvv
text1-8    hhhhhvvvvvvv
text8      hhhhhhvvvvvv
text1-6    hhhhhhvvvvvv
text9      hhhhhhhvvvvv
text1-3    hhhhhhhvvvvv
text10     hhhhhhhhvvvv
text1-78   hhhhhhhhvvvv
text11     hhhhhhhhhvvv
text1-5    hhhhhhhhhvvv
text12     hhhhhhhhhhvv
text1-10   hhhhhhhhhhvv
rect12     hhhhhhhhhhhv
rect12draw dddddddddddD
`;

const innerBlockSteps = innerBlockTimeline.map((s, i) => ({
  text2: { ...s.text2, seconds: 0.45 },
  text1: { ...s.text1, seconds: 0.45 },
  text3: { ...s.text3, seconds: 0.45 },
  "text1-1": { ...s["text1-1"], seconds: 0.45 },
  text4: { ...s.text4, seconds: 0.45 },
  "text1-7": { ...s["text1-7"], seconds: 0.45 },
  text5: { ...s.text5, seconds: 0.45 },
  "text1-2": { ...s["text1-2"], seconds: 0.45 },
  text6: { ...s.text6, seconds: 0.45 },
  "text1-75": { ...s["text1-75"], seconds: 0.45 },
  text7: { ...s.text7, seconds: 0.45 },
  "text1-8": { ...s["text1-8"], seconds: 0.45 },
  text8: { ...s.text8, seconds: 0.45 },
  "text1-6": { ...s["text1-6"], seconds: 0.45 },
  text9: { ...s.text9, seconds: 0.45 },
  "text1-3": { ...s["text1-3"], seconds: 0.45 },
  text10: { ...s.text10, seconds: 0.45 },
  "text1-78": { ...s["text1-78"], seconds: 0.45 },
  text11: { ...s.text11, seconds: 0.45 },
  "text1-5": { ...s["text1-5"], seconds: 0.45 },
  text12: { ...s.text12, seconds: 0.45 },
  "text1-10": { ...s["text1-10"], seconds: 0.45 },
  rect12: {
    ...s.rect12,
    drawSVG: s.rect12draw.drawSVG,
    seconds: i === innerBlockTimeline.length - 1 ? 1.2 : 0.45,
  },
}));

const outerInnerStepsTimeline = timeline`
layer2     vvv
text1      vvv
text1-3    vvv
text15     hvv
text16     hhv
path1      hvv
path2      hvv
path4      hvv
path6      hvv
path7      hvv
path8      hvv
text1-9    hvv
text1-35   hvv
text1-36   hvv
text1-6    hvv
text8      hhv
text9      hhv
text10     hhv
text11     hhv
path11     hhv
text1-93   hhv
text12     hhv
rect12     hvv
rect13     hhv
path3      vvv
path5      vvv
path9      vvv
path10     vvv
g17        vvv
circle10   hvv
path12     hvv
path13     hvv
path14     hvv
g18        hvv
circle14   hhv
path15     hhv
path16     hhv
path17     hhv
g19        hhv
`;

const outerInnerSteps = outerInnerStepsTimeline.map((s) => ({
  layer2: {
    ...s.layer2,
    attr: { style: "display:inline" },
    seconds: 0,
  },
  text1: { ...s.text1, seconds: 0.45 },
  "text1-3": { ...s["text1-3"], seconds: 0.45 },
  text15: { ...s.text15, seconds: 0.45 },
  text16: { ...s.text16, seconds: 0.45 },
  path1: { ...s.path1, seconds: 0.45 },
  path2: { ...s.path2, seconds: 0.45 },
  path4: { ...s.path4, seconds: 0.45 },
  path6: { ...s.path6, seconds: 0.45 },
  path7: { ...s.path7, seconds: 0.45 },
  path8: { ...s.path8, seconds: 0.45 },
  "text1-9": { ...s["text1-9"], seconds: 0.45 },
  "text1-35": { ...s["text1-35"], seconds: 0.45 },
  "text1-36": { ...s["text1-36"], seconds: 0.45 },
  "text1-6": { ...s["text1-6"], seconds: 0.45 },
  text8: { ...s.text8, seconds: 0.45 },
  text9: { ...s.text9, seconds: 0.45 },
  text10: { ...s.text10, seconds: 0.45 },
  text11: { ...s.text11, seconds: 0.45 },
  path11: { ...s.path11, seconds: 0.45 },
  "text1-93": { ...s["text1-93"], seconds: 0.45 },
  text12: { ...s.text12, seconds: 0.45 },
  rect12: { ...s.rect12, seconds: 0.45 },
  rect13: { ...s.rect13, seconds: 0.45 },
  path3: { ...s.path3, seconds: 0.45, opacity: s.path3.opacity === 0 ? 0 : 0.4 },
  path5: { ...s.path5, seconds: 0.45, opacity: s.path5.opacity === 0 ? 0 : 0.4 },
  path9: { ...s.path9, seconds: 0.45, opacity: s.path9.opacity === 0 ? 0 : 0.4 },
  path10: { ...s.path10, seconds: 0.45, opacity: s.path10.opacity === 0 ? 0 : 0.4 },
  g17: {
    ...s.g17,
    seconds: 0.45,
    css: {
      transform: "scale(1.45)",
      transformOrigin: "center",
      transformBox: "fill-box",
    },
  },
  circle10: { ...s.circle10, seconds: 0.45, opacity: s.circle10.opacity === 0 ? 0 : 0.4 },
  path12: { ...s.path12, seconds: 0.45, opacity: s.path12.opacity === 0 ? 0 : 0.4 },
  path13: { ...s.path13, seconds: 0.45, opacity: s.path13.opacity === 0 ? 0 : 0.4 },
  path14: { ...s.path14, seconds: 0.45, opacity: s.path14.opacity === 0 ? 0 : 0.4 },
  g18: {
    ...s.g18,
    seconds: 0.45,
    css: {
      transform: "scale(1.45)",
      transformOrigin: "center",
      transformBox: "fill-box",
    },
  },
  circle14: { ...s.circle14, seconds: 0.45, opacity: s.circle14.opacity === 0 ? 0 : 0.4 },
  path15: { ...s.path15, seconds: 0.45, opacity: s.path15.opacity === 0 ? 0 : 0.4 },
  path16: { ...s.path16, seconds: 0.45, opacity: s.path16.opacity === 0 ? 0 : 0.4 },
  path17: { ...s.path17, seconds: 0.45, opacity: s.path17.opacity === 0 ? 0 : 0.4 },
  g19: {
    ...s.g19,
    seconds: 0.45,
    css: {
      transform: "scale(1.45)",
      transformOrigin: "center",
      transformBox: "fill-box",
    },
  },
}));

const innerStepsTimeline = timeline`
layer2     vvvvvvv
text15     hvvvvvv
text16     hhhhvvv
text1      vvvvvvv
text1-6    vvvvvvv
text1-5    vvvvvvv
text1-56   vvvvvvv
text1-9    vvvvvvv
text1-0    hvvvvvv
text1-2    hvvvvvv
text1-92   hvvvvvv
text1-23   hvvvvvv
path1      hvvvvvv
path2      hvvvvvv
path4      hvvvvvv
path6      hvvvvvv
path7      hvvvvvv
path8      hvvvvvv
text2      hvvvvvv
text3      hvvvvvv
text4      hvvvvvv
text8      hhhhvvv
text9      hhhhvvv
text9-3    hhhhvvv
text10     hhhhvvv
text5      hhhhvvv
text6      hhhhvvv
text7      hhhhvvv
path11     hhhhvvv
text1-93   hhhhvvv
text12     hhhhvvv
rect12     hvvvvvv
rect13     hhhhvvv
path10     hvvvvvv
path12     hvvvvvv
path13     hvvvvvv
path14     hvvvvvv
text1-1    hvvvvvv
text14     hvvvvvv
text17     hvvvvvv
text1-8    hvvvvvv
text18     hvvvvvv
text19     hvvvvvv
path20     hvvvvvv
path22     hvvvvvv
path23     hvvvvvv
path24     hvvvvvv
path25     hvvvvvv
path26     hvvvvvv
text1-3    hvvvvvv
text20     hvvvvvv
circle27   hhhhvvv
path27     hhhhvvv
path28     hhhhvvv
path29     hhhhvvv
text29     hhhhvvv
text30     hhhhvvv
text31     hhhhvvv
text32     hhhhvvv
text33     hhhhvvv
text34     hhhhvvv
path36     hhhhvvv
path37     hhhhvvv
path38     hhhhvvv
path39     hhhhvvv
path40     hhhhvvv
path41     hhhhvvv
text35     hhhhvvv
text36     hhhhvvv
`;

const innerSteps = innerStepsTimeline.map((s, i) => {
  const dimFirstGroup = i >= 4;
  const fgMainOpacity = dimFirstGroup ? 0.2 : 1;
  const fgMsgOpacity = dimFirstGroup ? 0.2 : 0.4;

  return {
  layer2: {
    ...s.layer2,
    attr: { style: "display:inline" },
    seconds: 0,
  },
  text15: { ...s.text15, seconds: 0.45 },
  text16: { ...s.text16, seconds: 0.45 },
  text1: { ...s.text1, seconds: 0.45 },
  "text1-6": { ...s["text1-6"], seconds: 0.45 },
  "text1-5": { ...s["text1-5"], seconds: 0.45 },
  "text1-56": { ...s["text1-56"], seconds: 0.45 },
  "text1-9": { ...s["text1-9"], seconds: 0.45 },
  "text1-0": { ...s["text1-0"], seconds: 0.45 },
  "text1-2": { ...s["text1-2"], seconds: 0.45 },
  "text1-92": { ...s["text1-92"], seconds: 0.45 },
  "text1-23": { ...s["text1-23"], seconds: 0.45 },
  path1: { ...s.path1, seconds: 0.45 },
  path2: { ...s.path2, seconds: 0.45 },
  path4: { ...s.path4, seconds: 0.45 },
  path6: { ...s.path6, seconds: 0.45 },
  path7: { ...s.path7, seconds: 0.45 },
  path8: { ...s.path8, seconds: 0.45 },
  text2: { ...s.text2, seconds: 0.45 },
  text3: { ...s.text3, seconds: 0.45 },
  text4: { ...s.text4, seconds: 0.45 },
  text8: { ...s.text8, seconds: 0.45 },
  text9: { ...s.text9, seconds: 0.45 },
  "text9-3": { ...s["text9-3"], seconds: 0.45 },
  text10: { ...s.text10, seconds: 0.45 },
  text5: { ...s.text5, seconds: 0.45 },
  text6: { ...s.text6, seconds: 0.45 },
  text7: { ...s.text7, seconds: 0.45 },
  path11: { ...s.path11, seconds: 0.45 },
  "text1-93": { ...s["text1-93"], seconds: 0.45 },
  text12: { ...s.text12, seconds: 0.45 },
  rect12: { ...s.rect12, seconds: 0.45 },
  rect13: { ...s.rect13, seconds: 0.45 },
  path10: { ...s.path10, seconds: 0.45, opacity: s.path10.opacity === 0 ? 0 : fgMainOpacity },
  path12: { ...s.path12, seconds: 0.45, opacity: s.path12.opacity === 0 ? 0 : fgMsgOpacity },
  path13: { ...s.path13, seconds: 0.45, opacity: s.path13.opacity === 0 ? 0 : fgMsgOpacity },
  path14: { ...s.path14, seconds: 0.45, opacity: s.path14.opacity === 0 ? 0 : fgMsgOpacity },
  "text1-1": { ...s["text1-1"], seconds: 0.45, delay: 1, opacity: s["text1-1"].opacity === 0 ? 0 : fgMsgOpacity },
  text14: { ...s.text14, seconds: 0.45, delay: 1, opacity: s.text14.opacity === 0 ? 0 : fgMsgOpacity },
  text17: { ...s.text17, seconds: 0.45, delay: 1, opacity: s.text17.opacity === 0 ? 0 : fgMsgOpacity },
  "text1-8": { ...s["text1-8"], seconds: 0.45, delay: 1, opacity: s["text1-8"].opacity === 0 ? 0 : fgMsgOpacity },
  text18: { ...s.text18, seconds: 0.45, delay: 1, opacity: s.text18.opacity === 0 ? 0 : fgMsgOpacity },
  text19: { ...s.text19, seconds: 0.45, delay: 1, opacity: s.text19.opacity === 0 ? 0 : fgMsgOpacity },
  path20: {
    ...s.path20,
    seconds: 0.55,
    delay: 1,
    opacity: s.path20.opacity === 0 ? 0 : fgMsgOpacity,
    drawSVG: s.path20.opacity === 0 ? 0 : "0 100%",
  },
  path22: {
    ...s.path22,
    seconds: 0.55,
    delay: 1,
    opacity: s.path22.opacity === 0 ? 0 : fgMsgOpacity,
    drawSVG: s.path22.opacity === 0 ? 0 : "0 100%",
  },
  path23: {
    ...s.path23,
    seconds: 0.55,
    delay: 1,
    opacity: s.path23.opacity === 0 ? 0 : fgMsgOpacity,
    drawSVG: s.path23.opacity === 0 ? 0 : "0 100%",
  },
  path24: {
    ...s.path24,
    seconds: 0.55,
    delay: 1,
    opacity: s.path24.opacity === 0 ? 0 : fgMsgOpacity,
    drawSVG: s.path24.opacity === 0 ? 0 : "0 100%",
  },
  path25: {
    ...s.path25,
    seconds: 0.55,
    delay: 1,
    opacity: s.path25.opacity === 0 ? 0 : fgMsgOpacity,
    drawSVG: s.path25.opacity === 0 ? 0 : "0 100%",
  },
  path26: {
    ...s.path26,
    seconds: 0.55,
    delay: 1,
    opacity: s.path26.opacity === 0 ? 0 : fgMsgOpacity,
    drawSVG: s.path26.opacity === 0 ? 0 : "0 100%",
  },
  "text1-3": {
    ...s["text1-3"],
    seconds: 0.45,
    delay: i <= 1 ? 2 : 0,
    opacity: s["text1-3"].opacity === 0 ? 0 : fgMainOpacity,
  },
  text20: {
    ...s.text20,
    seconds: 0.45,
    delay: i <= 1 ? 2 : 0,
    opacity: s.text20.opacity === 0 ? 0 : fgMainOpacity,
  },
  "text:text1-3":
    i <= 1
      ? "$\\scriptstyle \\sum_j \\alpha_{ij}m_{ij}^s$"
      : i === 2
        ? "$\\Delta s_i^{(k,0)}$"
      : "$s_i^{(k,1)}$",
  "text:text20":
    i <= 1
      ? "$\\scriptstyle \\sum_j \\alpha_{ij}\\mathbf{m}_{ij}^v$"
      : i === 2
        ? "$\\Delta \\mathbf{v}_i^{(k,0)}$"
      : "$\\mathbf{v}_i^{(k,1)}$",
  circle27: { ...s.circle27, seconds: 0.45 },
  path27: { ...s.path27, seconds: 0.45, opacity: s.path27.opacity === 0 ? 0 : 0.4 },
  path28: { ...s.path28, seconds: 0.45, opacity: s.path28.opacity === 0 ? 0 : 0.4 },
  path29: { ...s.path29, seconds: 0.45, opacity: s.path29.opacity === 0 ? 0 : 0.4 },
  text29: { ...s.text29, seconds: 0.45, delay: 1, opacity: s.text29.opacity === 0 ? 0 : 0.4 },
  text30: { ...s.text30, seconds: 0.45, delay: 1, opacity: s.text30.opacity === 0 ? 0 : 0.4 },
  text31: { ...s.text31, seconds: 0.45, delay: 1, opacity: s.text31.opacity === 0 ? 0 : 0.4 },
  text32: { ...s.text32, seconds: 0.45, delay: 1, opacity: s.text32.opacity === 0 ? 0 : 0.4 },
  text33: { ...s.text33, seconds: 0.45, delay: 1, opacity: s.text33.opacity === 0 ? 0 : 0.4 },
  text34: { ...s.text34, seconds: 0.45, delay: 1, opacity: s.text34.opacity === 0 ? 0 : 0.4 },
  path36: {
    ...s.path36,
    seconds: 0.55,
    delay: 1,
    opacity: s.path36.opacity === 0 ? 0 : 0.4,
    drawSVG: s.path36.opacity === 0 ? 0 : "0 100%",
  },
  path37: {
    ...s.path37,
    seconds: 0.55,
    delay: 1,
    opacity: s.path37.opacity === 0 ? 0 : 0.4,
    drawSVG: s.path37.opacity === 0 ? 0 : "0 100%",
  },
  path38: {
    ...s.path38,
    seconds: 0.55,
    delay: 1,
    opacity: s.path38.opacity === 0 ? 0 : 0.4,
    drawSVG: s.path38.opacity === 0 ? 0 : "0 100%",
  },
  path39: {
    ...s.path39,
    seconds: 0.55,
    delay: 1,
    opacity: s.path39.opacity === 0 ? 0 : 0.4,
    drawSVG: s.path39.opacity === 0 ? 0 : "0 100%",
  },
  path40: {
    ...s.path40,
    seconds: 0.55,
    delay: 1,
    opacity: s.path40.opacity === 0 ? 0 : 0.4,
    drawSVG: s.path40.opacity === 0 ? 0 : "0 100%",
  },
  path41: {
    ...s.path41,
    seconds: 0.55,
    delay: 1,
    opacity: s.path41.opacity === 0 ? 0 : 0.4,
    drawSVG: s.path41.opacity === 0 ? 0 : "0 100%",
  },
  text35: { ...s.text35, seconds: 0.45, delay: 2 },
  text36: { ...s.text36, seconds: 0.45, delay: 2 },
  "text:text35":
    i <= 4
      ? "$\\scriptstyle \\sum_j \\alpha_{ij}m_{ij}^s$"
      : i === 5
        ? "$\\Delta s_i^{(k,1)}$"
      : "$s_i^{(k,2)}$",
  "text:text36":
    i <= 4
      ? "$\\scriptstyle \\sum_j \\alpha_{ij}\\mathbf{m}_{ij}^v$"
      : i === 5
        ? "$\\Delta \\mathbf{v}_i^{(k,1)}$"
      : "$\\mathbf{v}_i^{(k,2)}$",
};
});

const lossRevealTimeline = timeline`
block1 vvv
block2 hvv
block3 hhv
`;

const lossRevealSteps = lossRevealTimeline.map((s) => s);

const notesContentStyle = {
  fontSize: "0.38rem",
  lineHeight: 1.18,
  width: "52ch",
  maxWidth: "100%",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

function App() {
  useEffect(() => {
    // Opt-in only in this sandbox while validating metadata-driven baseline.
    setLaTeXBaselineMetadataMode(true);
    return () => setLaTeXBaselineMetadataMode(false);
  }, []);

  return (
    <Presentation bibUrl="/references.bib">
      <Slide hideNavigation>
        <div className="h-full flex flex-col items-center justify-center text-center gap-5">
          <div style={{ fontSize: "2.1rem", lineHeight: 1.2, fontWeight: 700 }}>
            EquiFold: Fast, Equivariant All-Atom Protein Structure Prediction
          </div>
          <div style={{ fontSize: "1.1rem", opacity: 0.85 }}>Payman Yadollahpour</div>
          <div style={{ fontSize: "1rem", opacity: 0.8 }}>Genentech</div>
          <div style={{ fontSize: "0.9rem", opacity: 0.75 }}>February 23, 2026</div>
        </div>
      </Slide>

      <Slide header="Professional Background">
        <div className="h-full flex items-center" style={{ fontSize: "0.5rem", lineHeight: 1.05 }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.22rem" }}>
            <colgroup>
              <col style={{ width: "6.0rem" }} />
              <col />
              <col style={{ width: "4.8rem" }} />
            </colgroup>
            <tbody>
              <tr>
                <td>
                  <div className="flex items-center gap-1.5">
                    <img src="/assets/profile/logo-syracuse.svg" alt="Syracuse University logo" style={{ width: "1.75rem", height: "1.75rem", objectFit: "contain" }} />
                  </div>
                </td>
                <td>
                  <div>B.S. Biomedical Engineering (minor Neuroscience), Syracuse University (2001).</div>
                </td>
                <td>
                  <div style={{ width: "4.4rem", height: "2.1rem" }} />
                </td>
              </tr>
              <tr>
                <td>
                  <div className="flex items-center gap-1.5">
                    <img src="/assets/profile/logo-brown.svg" alt="Brown University logo" style={{ width: "1.75rem", height: "1.75rem", objectFit: "contain" }} />
                  </div>
                </td>
                <td>
                  <div>M.S. Computer Science, Brown University (2006).</div>
                  <div style={{ marginLeft: "0.55rem", opacity: 0.82 }}>Advisor: Michael Black</div>
                </td>
                <td>
                  <img src="/assets/profile/michael-black-headshot.jpg" alt="Michael Black headshot" style={{ width: "2.1rem", height: "2.1rem", objectFit: "cover", borderRadius: "999px" }} />
                </td>
              </tr>
              <tr>
                <td>
                  <div className="flex items-center gap-1.5">
                    <img src="/assets/profile/logo-ttic.png" alt="TTIC logo" style={{ width: "1.75rem", height: "1.75rem", objectFit: "contain" }} />
                    <img src="/assets/profile/logo-uchicago-coat.png" alt="University of Chicago logo" style={{ width: "1.75rem", height: "1.75rem", objectFit: "contain" }} />
                  </div>
                </td>
                <td>
                  <div>Ph.D. Computer Science, TTIC (2017).</div>
                  <div style={{ marginLeft: "0.55rem", opacity: 0.82 }}>Advisor: Gregory Shakhnarovich</div>
                </td>
                <td>
                  <img src="/assets/profile/greg-shakhnarovich-headshot.jpg" alt="Gregory Shakhnarovich headshot" style={{ width: "2.1rem", height: "2.1rem", objectFit: "cover", borderRadius: "999px" }} />
                </td>
              </tr>
              <tr>
                <td>
                  <div className="flex items-center gap-1.5">
                    <img src="/assets/profile/logo-csail-primary.svg" alt="MIT CSAIL logo" style={{ width: "2.05rem", height: "1.75rem", objectFit: "contain" }} />
                    <img src="/assets/profile/logo-upitt-seal.svg" alt="University of Pittsburgh logo" style={{ width: "1.75rem", height: "1.75rem", objectFit: "contain" }} />
                  </div>
                </td>
                <td>
                  <div>Postdoc I, Pittsburgh DBMI + MIT CSAIL (2018-2019).</div>
                  <div style={{ marginLeft: "0.55rem", opacity: 0.82 }}>Mentors: Polina Golland and Kayhan Batmanghelich</div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <img src="/assets/profile/polina-golland-headshot.jpg" alt="Polina Golland headshot" style={{ width: "2.1rem", height: "2.1rem", objectFit: "cover", borderRadius: "999px" }} />
                    <img src="/assets/profile/kayhan-batmanghelich-headshot.jpg" alt="Kayhan Batmanghelich headshot" style={{ width: "2.1rem", height: "2.1rem", objectFit: "cover", borderRadius: "999px" }} />
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="flex items-center gap-1.5">
                    <img src="/assets/profile/broadlogo.png" alt="Broad Institute logo" style={{ width: "2.25rem", height: "1.75rem", objectFit: "contain" }} />
                    <img src="/assets/profile/logo-genentech.svg" alt="Genentech logo" style={{ width: "1.95rem", height: "1.35rem", objectFit: "contain" }} />
                  </div>
                </td>
                <td>
                  <div>Postdoc II, Broad Institute then Genentech gRED (2019-present).</div>
                  <div style={{ marginLeft: "0.55rem", opacity: 0.82 }}>Mentor: Aviv Regev</div>
                </td>
                <td>
                  <img src="/assets/profile/aviv-regev-headshot.jpg" alt="Aviv Regev headshot" style={{ width: "2.1rem", height: "2.1rem", objectFit: "cover", borderRadius: "999px" }} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Slide>

      <Slide header="Why Tahoe" steps={[1, 2, 3, 4]}>
        {(step) => {
          const pulseStyle = (active) => ({
            transform: active ? "scale(1.04)" : "scale(1)",
            transformOrigin: "center center",
            transition: "transform 220ms ease",
          });
          return (
            <div className="h-full flex flex-col justify-center gap-4" style={{ fontSize: "0.72rem", lineHeight: 1.32 }}>
              <div style={pulseStyle(step === 1)}>
                <Box style={{ padding: "0.14rem 0.3rem" }}>
                  My background spans multiple domains (ML, brain-machine interfaces, CV, clinical imaging, molecular biology)
                  and modalities: single-cell (ATAC, RNA-seq), spatial transcriptomics (e.g., Slide-seq), tissue analysis
                  (tumor microenvironments), geometric 3D cell modeling in embryo, and clinical imaging (MRI/CT).
                </Box>
              </div>
              <div style={pulseStyle(step === 2)}>
                <Box style={{ padding: "0.14rem 0.3rem" }}>
                  I want to build multimodal foundation models that explicitly incorporate biological context and interventions,
                  linking chemical structure, protein sequence, and single-cell response.
                </Box>
              </div>
              <div style={pulseStyle(step === 3)}>
                <Box style={{ padding: "0.14rem 0.3rem" }}>
                  My experiences across PhD and post-PhD work in deep learning and ML for predicting structured data,
                  (spatial) transcriptomics, RNA-seq analysis, protein structure prediction (EquiFold), and sequence-structure
                  co-design provide the background needed to contribute effectively at Tahoe.
                </Box>
              </div>
            </div>
          );
        }}
      </Slide>

      <Slide header="Post-PhD Projects: What I Learned" steps={[1, 2, 3, 4]}>
        {(step) => (
          <div className="h-full flex flex-col gap-3" style={{ fontSize: "0.7rem", lineHeight: 1.3 }}>
            <Show when={step >= 1}>
              <Box title="2018 -> 2019 | Disease subtyping + DDNF">
                Built structured probabilistic models for disease subtyping and worked on diffeomorphic normalizing flows.
                Learned to pair expressive generative models with interpretable latent structure.
              </Box>
            </Show>
            <Show when={step >= 2}>
              <Box title="2019 -> 2021 | Single-cell and spatial transcriptomics">
                Worked on large-scale cellular lineage and tumor ecosystem analyses. Learned how to connect statistical models
                to biologically validated hypotheses.
              </Box>
            </Show>
            <Show when={step >= 3}>
              <Box
                title="2021 -> present | EquiFold + sequence-structure generation at Genentech"
                style={step >= 4 ? { backgroundColor: "rgba(255, 230, 120, 0.55)" } : undefined}
              >
                Developed SE(3)-equivariant protein modeling and diffusion-based co-generation stacks. Learned that practical
                impact requires both geometric inductive bias and high-throughput inference.
              </Box>
            </Show>
          </div>
        )}
      </Slide>

      <Slide header="Outline">
        <div className="h-full flex flex-col justify-center">
          <List step={6} style={{ lineHeight: 1.7 }}>
            <Item>Motivation and Context</Item>
            <Item>Equiformer Background</Item>
            <Item>EquiFold Method</Item>
            <Item>Experiments and Results</Item>
            <Item>Impact and Outcomes</Item>
          </List>
        </div>
      </Slide>

      <Slide hideNavigation>
        <div className="h-full flex items-center justify-center">
          <div style={{ fontSize: "2rem", opacity: 0.9 }}>Motivation and Context</div>
        </div>
      </Slide>

      <Slide header="Why This Problem Matters" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <div className="h-full flex flex-col" style={{ fontSize: "0.64rem", lineHeight: 1.18 }}>
              <Show when={step >= 1}>
                <div style={{ paddingTop: "0.05rem", paddingBottom: "0.35rem" }}>
                  Fast sequence-to-structure inference is the bottleneck for many real experimental loops.
                </div>
              </Show>

              <div className="grid grid-cols-2 gap-4" style={{ alignItems: "start" }}>
                <div className="flex flex-col gap-1.5 pr-2" style={{ paddingTop: "3.2rem" }}>
                  <Show when={step >= 2}>
                    <div>In practice this enables:</div>
                  </Show>
                  <div className="ml-3 mt-0.5 flex flex-col gap-1.5">
                    <Show when={step >= 2}>
                      <div>- Triage of large candidate libraries before synthesis or expression</div>
                    </Show>
                    <Show when={step >= 3}>
                      <div>- Rapid prioritization of antibody variants during affinity-maturation rounds</div>
                    </Show>
                    <Show when={step >= 4}>
                      <div>- Quick structural sanity checks before wet-lab handoff</div>
                    </Show>
                  </div>
                </div>

                <div className="h-full flex flex-col items-center justify-start gap-1" style={{ paddingTop: "0rem" }}>
                  <Show when={step >= 2}>
                    <div style={{ width: "100%", maxWidth: "18.2rem" }}>
                      <img
                        src="/assets/custom/library-triage-biorender.png"
                        alt="Library triage example"
                        className="w-full object-contain rounded"
                        style={{ height: "276px" }}
                      />
                      <div className="text-black text-center" style={{ marginTop: "-2px", fontSize: "0.44rem", opacity: 1 }}>Library triage</div>
                    </div>
                  </Show>

                  <div className="w-full flex items-start justify-center gap-6 mt-0">
                    <Show when={step >= 3}>
                      <div style={{ width: "44%", maxWidth: "8.8rem" }}>
                        <img
                          src="/assets/custom/antibody-prioritization-biorender.png"
                          alt="Antibody variant prioritization example"
                          className="w-full object-contain rounded"
                          style={{ height: "228px" }}
                        />
                        <div className="text-black text-center" style={{ marginTop: "-2px", fontSize: "0.44rem", opacity: 1 }}>Variant prioritization</div>
                      </div>
                    </Show>

                    <Show when={step >= 4}>
                      <div style={{ width: "44%", maxWidth: "8.8rem" }}>
                        <img
                          src="/assets/custom/pre-wetlab-checks-biorender.png"
                          alt="Pre wet-lab sanity check example"
                          className="w-full object-contain rounded"
                          style={{ height: "228px" }}
                        />
                        <div className="text-black text-center" style={{ marginTop: "-2px", fontSize: "0.44rem", opacity: 1 }}>Pre-wet-lab sanity checks</div>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            </div>
            <Notes>
              <div style={notesContentStyle}>
                The punchline here is speed-to-decision.

                If sequence-to-structure is slow, it bottlenecks the entire design loop.

                I’ll walk through three concrete places where that matters: triaging large libraries, prioritizing antibody
                variants, and quick structural checks before wet-lab handoff.

                The point is not just better models, but faster experimental iteration.
              </div>
            </Notes>
          </>
        )}
      </Slide>

      <Slide header="Prior Approaches" steps={[1, 2, 3, 4, 5, 6, 7]}>
        {(step) => (
          <>
            <div className="h-full flex flex-col" style={{ fontSize: "0.68rem", lineHeight: 1.24 }}>
              <div>
                <Show when={step >= 1}>
                  <div className="mb-1">
                    <Box style={{ padding: "0.08rem 0.28rem" }}>
                      Models like AlphaFold, RoseTTAFold, OmegaFold, and ESMFold represent backbone geometry as nodes
                      with Euclidean transforms, then iteratively refine those transforms per structure-model block.
                    </Box>
                  </div>
                </Show>
                <div className="mt-1.5 space-y-1.5">
                  <Show when={step >= 2}>
                    <div className="rounded px-2 py-1" style={{ backgroundColor: "rgba(251, 191, 36, 0.28)" }}>
                      <span style={{ display: "inline-flex", alignItems: "flex-start" }}>
                        <span style={{ marginRight: "0.35rem" }}>-</span>
                        <span>Side-chains are often implicit until final torsion-angle prediction.</span>
                      </span>
                    </div>
                  </Show>
                  <Show when={step >= 3}>
                    <div className="rounded px-2 py-1" style={{ backgroundColor: "rgba(251, 191, 36, 0.28)" }}>
                      <span style={{ display: "inline-flex", alignItems: "flex-start" }}>
                        <span style={{ marginRight: "0.35rem" }}>-</span>
                        <span>This can make side-chain 3D interactions harder to learn (e.g., clash avoidance).</span>
                      </span>
                    </div>
                  </Show>
                </div>
              </div>

              <div className="mt-2">
                <Show when={step >= 4}>
                  <div className="mb-1">
                    <Box style={{ padding: "0.08rem 0.28rem" }}>
                      Methods such as ProteinMPNN, inverse folding from predicted structures, and Rosetta-style
                      approaches use coarse-grained representations where each residue is modeled by one/few nodes.
                    </Box>
                  </div>
                </Show>
                <div className="mt-1.5 space-y-1.5">
                  <Show when={step >= 5}>
                    <div className="rounded px-2 py-1" style={{ backgroundColor: "rgba(251, 191, 36, 0.28)" }}>
                      <span style={{ display: "inline-flex", alignItems: "flex-start" }}>
                        <span style={{ marginRight: "0.35rem" }}>-</span>
                        <span>Improves efficiency for predictive tasks (e.g., interacting/functional residue prediction).</span>
                      </span>
                    </div>
                  </Show>
                  <Show when={step >= 6}>
                    <div className="rounded px-2 py-1" style={{ backgroundColor: "rgba(251, 191, 36, 0.28)" }}>
                      <span style={{ display: "inline-flex", alignItems: "flex-start" }}>
                        <span style={{ marginRight: "0.35rem" }}>-</span>
                        <span>Useful for generative tasks (e.g., backbone scaffold generation).</span>
                      </span>
                    </div>
                  </Show>
                  <Show when={step >= 7}>
                    <div className="rounded px-2 py-1" style={{ backgroundColor: "rgba(251, 191, 36, 0.28)" }}>
                      <span style={{ display: "inline-flex", alignItems: "flex-start" }}>
                        <span style={{ marginRight: "0.35rem" }}>-</span>
                        <span>Tradeoff: often loses all-atom detail needed for design/packing and function-relevant signals.</span>
                      </span>
                    </div>
                  </Show>
                </div>
              </div>

            </div>
            <Notes>
              <div style={notesContentStyle}>
                I’m contrasting two families of methods.

                One family keeps rich geometric refinement but often treats side chains late.

                The other family gains efficiency through coarse-graining but can lose all-atom detail needed for packing
                and function-relevant interactions.

                This sets up the gap EquiFold tries to close.
              </div>
            </Notes>
          </>
        )}
      </Slide>

      <Slide header="How EquiFold Addresses This" steps={[1]}>
        <>
          <Show when={true}>
            <div className="h-full flex items-center">
              <Box style={{ width: "100%", fontSize: "0.72rem", lineHeight: 1.28, paddingTop: "0.45rem", paddingBottom: "0.45rem" }}>
                EquiFold introduces a{" "}
                <DelayedUnderline text="coarse-grained representation" delay={2000} duration={700} />{" "}
                that retains{" "}
                <DelayedUnderline text="all-atom resolution" delay={2800} duration={700} />
                . Side-chain degrees of freedom are{" "}
                <DelayedUnderline text="modeled explicitly" delay={3600} duration={700} />{" "}
                in 3D space, not only as intrinsic torsion angles.
              </Box>
            </div>
          </Show>
          <Notes>
              <div style={notesContentStyle}>
                This is the core idea in one sentence:
                keep the efficiency benefits of coarse-graining, but don’t give up all-atom fidelity.

                The important nuance is that side-chain geometry is modeled explicitly in 3D, instead of being deferred to
                a late torsion-only stage.
              </div>
            </Notes>
        </>
      </Slide>

      <Slide header="EquiFold: Main Takeaway" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <div className="h-full grid grid-cols-2 gap-6 items-center">
              <div className="flex flex-col gap-2" style={{ lineHeight: 1.45, fontSize: "0.92rem" }}>
                <Show when={step >= 1}><div>All-atom structure prediction directly from sequence.</div></Show>
                <Show when={step >= 2}><div>SE(3)-equivariant iterative refinement over coarse-grained nodes.</div></Show>
                <Show when={step >= 3}><div>No MSA and no protein language model embeddings.</div></Show>
                <Show when={step >= 4}><div>Fast enough for high-throughput design loops.</div></Show>
              </div>
              <div>
                <video
                  className="w-full rounded"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                >
                  <source src="/assets/equifold/all_sticks.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <Notes>
              <div style={notesContentStyle}>
                This is the high-level takeaway slide.

                I’ll emphasize four points:
                direct all-atom prediction from sequence,
                equivariant iterative refinement,
                no dependence on MSA or PLM embeddings in this setup,
                and practical throughput for design loops.

                This is the thesis before we drill into details.
              </div>
            </Notes>
          </>
        )}
      </Slide>

      <Slide hideNavigation>
        <div className="h-full flex items-center justify-center">
          <div style={{ fontSize: "2rem", opacity: 0.9 }}>Equiformer Background</div>
        </div>
      </Slide>

      <Slide header="Equiformer in One Slide" steps={[1, 2, 3]}>
        {(step) => (
          <>
            <div className="flex flex-col gap-7">
              <div className="grid grid-cols-2 gap-7">
                <div className="flex flex-col items-center gap-4">
                  <Show when={step >= 1}>
                    <h3 className="text-[1.3rem] leading-tight text-center">
                      SE(3)-Equivariant Graph Transformer for 3D Atomistic Graphs
                    </h3>
                  </Show>
                  <Show when={step >= 1}>
                    <img
                      src="/assets/equiformer/equi_arch.svg"
                      alt="Equiformer architecture"
                      className="h-auto"
                      style={{ width: "30%" }}
                    />
                  </Show>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Show when={step >= 2}>
                    <h3 className="text-[1.3rem] leading-tight text-center">
                      Core attention change: MLP attention plus non-linear message passing.
                    </h3>
                  </Show>
                  <Show when={step >= 2}>
                    <img
                      src="/assets/equiformer/equi_attn.svg"
                      alt="Equiformer equivariant attention"
                      className="h-auto"
                      style={{ width: "30%" }}
                    />
                  </Show>
                </div>
              </div>
            </div>
            <Show when={step >= 3}>
              <div className="mt-6">
                <h3 className="text-[1.45rem] leading-tight text-center">
                  Equivariant Transformer blocks on irreps features.
                </h3>
              </div>
            </Show>
          </>
        )}
      </Slide>

      <Slide header="What EquiFold Reuses from Equiformer" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <div className="h-full flex flex-col" style={{ fontSize: "0.68rem", lineHeight: 1.24 }}>
              <div>
                <Show when={step >= 1}>
                  <div className="mb-1">
                    <Box style={{ padding: "0.08rem 0.28rem" }}>
                      EquiFold directly reuses Equiformer-style equivariant sub-blocks for geometry-aware message passing
                      and representation updates on coarse-grained nodes.
                    </Box>
                  </div>
                </Show>
                <div className="mt-1.5 space-y-1.5">
                  <Show when={step >= 2}>
                    <div className="rounded px-2 py-1" style={{ backgroundColor: "rgba(251, 191, 36, 0.28)" }}>
                      <span style={{ display: "inline-flex", alignItems: "flex-start" }}>
                        <span style={{ marginRight: "0.35rem" }}>-</span>
                        <span>Rotational and translational symmetries are preserved through equivariant operations.</span>
                      </span>
                    </div>
                  </Show>
                </div>
              </div>

              <div className="mt-2">
                <Show when={step >= 3}>
                  <div className="mb-1">
                    <Box style={{ padding: "0.08rem 0.28rem" }}>
                      These reused sub-blocks are embedded inside EquiFold's iterative refinement loop, where each block
                      predicts frame updates and improves all-atom structure.
                    </Box>
                  </div>
                </Show>
                <div className="mt-1.5 space-y-1.5">
                  <Show when={step >= 4}>
                    <div
                      className="rounded px-2"
                      style={{
                        backgroundColor: "rgba(251, 191, 36, 0.28)",
                        height: "1.9rem",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          lineHeight: 1,
                        }}
                      >
                        <div style={{ display: "inline-block", transform: "translateY(0.56rem)" }}>
                          {M`(\mathbf{T}_i^{(k+1)}, \mathbf{R}_i^{(k+1)}) = (\mathbf{T}_i^{(k)} + \Delta \mathbf{T}_i^{(k)}, \Delta \mathbf{R}_i^{(k)} \mathbf{R}_i^{(k)})`}
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          </>
        )}
      </Slide>

      <Slide hideNavigation>
        <div className="h-full flex items-center justify-center">
          <div style={{ fontSize: "2rem", opacity: 0.9 }}>EquiFold Method</div>
        </div>
      </Slide>

      {/*
      <OverviewSlide
        title="Principiae Theme Sandbox"
        section="Overview"
      >
        <div className="mt-10 text-lg">
          Theme: <b>principiae</b> with core animation primitives
          (<code>timeline</code>, <code>AnimateSVG</code>, <code>Morph</code>).
        </div>
      </OverviewSlide>

      <Slide header="Step Reveal: Plain Content" steps={[1, 2, 3]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <List step={step} style={{ listStyle: "none", paddingLeft: 0, lineHeight: 1.7 }}>
              <Item style={{ listStyle: "none" }}>
                This is a plain sentence reveal with no bullet marker.
              </Item>
              <Item style={{ listStyle: "none" }}>
                You can keep normal weight or set custom font weight per line.
              </Item>
              <Item style={{ listStyle: "none" }}>
                Equation helper inline: {m`x_t = \alpha_t x_0 + \sigma_t\epsilon`}.
              </Item>
            </List>
            <Notes>
              <div style={notesContentStyle}>
                Principiae List/Item can still drive step-based reveal while you override list styling.
              </div>
            </Notes>
          </div>
        )}
      </Slide>

      <Slide header="Morph Example" steps={[0, 1, 2]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-10">
            <Box title="State Update" style={{ fontSize: "2.1rem" }}>
              <Morph display>{morphFrames[step]}</Morph>
            </Box>
            <div style={{ fontSize: "1.2rem" }}>
              Display math helper: {m`x_{t+1} = f_\theta(x_t)`}
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Timeline + AnimateSVG" steps={range(flowSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <AnimateSVG
              src="/figures/principiae-flow.svg"
              step={flowSteps[step]}
              style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}
            />
            <div className="mt-6" style={{ fontSize: "1.05rem" }}>
              {[
                "Step 1: left node appears.",
                "Step 2: right node appears and arrow draws.",
                "Step 3: left fades while right remains emphasized.",
              ][step]}
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Portal Transition Pair" steps={[1, 2]}>
        {(step) => (
          <div className="h-full grid grid-cols-2 gap-10 items-center">
            <Portal zoomin>
              <Box title="Zoom Target">
                <div style={{ fontSize: "1.1rem" }}>
                  Region prepared for a portal zoom transition.
                </div>
              </Box>
            </Portal>
            <Show when={step >= 2}>
              <Portal zoomout>
                <Box title="After Zoom">
                  <div style={{ fontSize: "1.1rem" }}>
                    Landing region after zoom-out.
                  </div>
                </Box>
              </Portal>
            </Show>
          </div>
        )}
      </Slide>

      <Slide header="Theme Components" steps={[1, 2]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-8">
            <Box title="Principiae Box" smallTitle>
              Works with regular React content and step reveals.
            </Box>
            <Show when={step >= 2}>
              <div>
                QED marker from theme: <Qed style={{ marginTop: "1rem" }} />
              </div>
            </Show>
          </div>
        )}
      </Slide>

      <Slide header="Inline Baseline Stress" steps={[1]}>
        {() => (
          <div className="h-full flex flex-col justify-center gap-4" style={{ fontSize: "1.15rem", lineHeight: 1.55 }}>
            <div>
              Sentence A with fraction and powers: parameter is {m`\frac{1+x^2}{(1-x)^3}`} inside normal text flow.
            </div>
            <div>
              Sentence B with integral + brackets: define correction as {m`\left(\int_0^1 t^2\,dt\right) + \left[\sum_{i=1}^{n} i\right]`}.
            </div>
            <div>
              Sentence C with large delimiters: stability region is {m`\left\langle \frac{a+b}{c}, \frac{d+e}{f} \right\rangle`} for the update.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Inline Regular-Size Integral" steps={[1]}>
        {() => (
          <div className="h-full flex flex-col justify-center gap-4" style={{ fontSize: "1.15rem", lineHeight: 1.55 }}>
            <div>
              Default inline integral (already textstyle): value is {m`\int_0^1 x^2\,dx`} in sentence flow.
            </div>
            <div>
              Forced display size inside inline text: value is {m`\displaystyle \int_0^1 x^2\,dx`} in sentence flow.
            </div>
            <div>
              Forced regular style inside inline text: value is {m`\textstyle \int_0^1 x^2\,dx`} (matches default inline style).
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Inline Morph Height Stress" steps={range(inlineMorphA.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-6" style={{ fontSize: "1.25rem", lineHeight: 1.8 }}>
            <div>
              Morph set A in sentence flow: value of A is <Morph inline>{inlineMorphA[step]}</Morph> while the sentence continues.
            </div>
            <div>
              Morph set B in sentence flow: value of B is <Morph inline>{inlineMorphB[step]}</Morph> and text remains on baseline.
            </div>
            <div>
              Combined check: C = <Morph inline>{String.raw`\left(${inlineMorphA[step]}\right)\left(${inlineMorphB[step]}\right)`}</Morph> is updated each step.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Inline Displaystyle Stress A" steps={[1]}>
        {() => (
          <div className="h-full flex flex-col justify-center gap-4" style={{ fontSize: "1.1rem", lineHeight: 1.6 }}>
            <div>
              Fraction: {m`\displaystyle \frac{1+x^2}{(1-x)^3}`} inside sentence flow.
            </div>
            <div>
              Sum with limits: {m`\displaystyle \sum_{k=1}^{n}\frac{k^2}{(1+k)^2}`} inside sentence flow.
            </div>
            <div>
              Integral with limits: {m`\displaystyle \int_0^1 t^2\,dt`} inside sentence flow.
            </div>
            <div>
              Large brackets: {m`\displaystyle \left\langle \frac{a+b}{c}, \frac{d+e}{f} \right\rangle`} inline.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Inline Displaystyle Stress B" steps={[1]}>
        {() => (
          <div className="h-full flex flex-col justify-center gap-4" style={{ fontSize: "1.1rem", lineHeight: 1.65 }}>
            <div>
              Combined A: {m`\displaystyle \left(\int_0^1 x^2\,dx\right)^2 + \left[\sum_{i=1}^{n} i\right]`}.
            </div>
            <div>
              Combined B: {m`\displaystyle \frac{\left(\sum_{j=1}^{m} j\right)^2}{1+\left(\int_0^1 u^2\,du\right)}`}.
            </div>
            <div>
              Nested delimiters: {m`\displaystyle \left\{\left[\frac{\int_0^1 x\,dx}{\sum_{k=1}^{n}k}\right],\left(\frac{a+b}{c}\right)\right\}`}.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Layered SVG Test" steps={range(testLayerSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <AnimateSVG
              src="/figures/testlayer.svg"
              step={testLayerSteps[step]}
              style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}
            />
            <div className="mt-6 text-center" style={{ fontSize: "1.05rem" }}>
              {[
                "Step 1: reveal layer1.",
                "Step 2: morph equation text from x^2 to y^4 in layer1.",
                "Step 3: fade layer1 to 10% and reveal layer2 at 90%.",
              ][step]}
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Layered SVG Test + Sweep-In" steps={range(testLayerSweepSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <AnimateSVG
              src="/figures/testlayer.svg"
              step={testLayerSweepSteps[step]}
              style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}
            />
            <div className="mt-6 text-center" style={{ fontSize: "1.05rem" }}>
              {[
                "Step 1: reveal layer1.",
                "Step 2: morph equation text from x^2 to y^4 in layer1.",
                "Step 3: fade layer1 to 10% and sweep layer2 in from the right to 90% opacity.",
              ][step]}
            </div>
          </div>
        )}
      </Slide>
      */}

      <Slide header="Residue CG Layers" steps={range(residueCgSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <Portal zoomin>
              <AnimateSVG
                src="/figures/residuecg.svg"
                step={residueCgSteps[step]}
                style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}
              />
            </Portal>
            <div className="mt-6 text-center" style={{ fontSize: "1.05rem" }}>
              {[
                "Given a polypeptide chain we discritize the residues.",
                "We map subsets of residue atoms to coarse-grained nodes.",
                "Each CG node defines a rigid frame over residue atoms.",
                "We can build a graph over CG nodes.",
              ][step]}
            </div>
          </div>
        )}
      </Slide>

      <Slide header="CG Definition" steps={range(cgDefSteps.length + 5)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-3 py-2">
            <div className="flex items-center justify-center">
              <Portal zoomout>
                <AnimateSVG
                  src="/figures/cgdef.svg"
                  step={cgDefSteps[Math.min(step, cgDefSteps.length - 1)]}
                  style={{ width: "100%", maxWidth: "820px", margin: "0 auto" }}
                />
              </Portal>
            </div>
            <Show when={step >= 2}>
              <Box className="mx-auto" style={{ width: "100%", maxWidth: "1000px", fontSize: "0.76rem", lineHeight: 1.45 }}>
                <div className="grid gap-x-6 items-start" style={{ gridTemplateColumns: "2.4fr 1fr" }}>
                  <div className="whitespace-nowrap">
                    <Show when={step >= 2}>
                      <div>discrete CG node types&nbsp;&nbsp;<span style={{ display: "inline-block", zoom: "0.8" }}>{m`c \in \mathcal{C}`}</span></div>
                    </Show>
                    <Show when={step >= 3}>
                      <div>node rigid transform&nbsp;&nbsp;<span style={{ display: "inline-block", zoom: "0.8" }}>{m`\mathbf{R}, \mathbf{T} \in SO(3) \times \mathbb{R}^3`}</span></div>
                    </Show>
                    <Show when={step >= 4}>
                      <div>local template atom coordinates&nbsp;&nbsp;<span style={{ display: "inline-block", zoom: "0.8" }}>{m`X^0 \in \mathbb{R}^{n_j \times 3}`}</span></div>
                    </Show>
                    <Show when={step >= 5}>
                      <div>scalar identity embedding&nbsp;&nbsp;<span style={{ display: "inline-block", zoom: "0.8" }}>{m`s \in \mathbb{R}`}</span></div>
                    </Show>
                    <Show when={step >= 6}>
                      <div>vector orientation embedding&nbsp;&nbsp;<span style={{ display: "inline-block", zoom: "0.8" }}>{m`\mathbf{v} \in \mathbb{R}^{n \times 3}`}</span></div>
                    </Show>
                  </div>
                  <div className="flex items-start">
                    <Show when={step >= 3}>
                      <div style={{ display: "inline-block", transform: "scale(0.8)", transformOrigin: "right top", marginTop: "1.05rem", marginLeft: "-3rem" }}>
                        <div className="flex items-start gap-1">
                          <div>
                            {m`\mathbf{R}=\begin{bmatrix}
                            r_{11} & r_{12} & r_{13}\\
                            r_{21} & r_{22} & r_{23}\\
                            r_{31} & r_{32} & r_{33}
                            \end{bmatrix}`}
                          </div>
                          <div>
                            {m`\mathbf{T}=\begin{bmatrix}
                            t_{1}\\
                            t_{2}\\
                            t_{3}
                            \end{bmatrix}`}
                          </div>
                        </div>
                      </div>
                    </Show>
                  </div>
                </div>
              </Box>
            </Show>
          </div>
        )}
      </Slide>

      <Slide header="CG Representation" steps={range(cgRepSteps.length)}>
        {(step) => (
          <div className="h-full grid grid-cols-2 gap-x-8 gap-y-0 items-center" style={{ marginTop: "-1.4rem" }}>
            <style>{`
              .cg-cyan svg * { fill: #19b7c6 !important; stroke: none !important; }
              .cg-magenta svg * { fill: #ea67c2 !important; stroke: none !important; }
              .cg-brown svg * { fill: #9c3437 !important; stroke: none !important; }
              .cg-orange svg * { fill: #efb04f !important; stroke: none !important; }
              .cg-green svg * { fill: #1c7b2a !important; stroke: none !important; }
              .cg-violet svg * { fill: #5b2ad6 !important; stroke: none !important; }
              .cg-red svg * { fill: #ef1f27 !important; stroke: none !important; }
              .cg-gray svg * { fill: #9ea0a3 !important; stroke: none !important; }
              .cg-line { margin-top: -0.24rem; line-height: 0; }
              .cg-line.first { margin-top: -0.14rem; }
            `}</style>
            <div style={{ lineHeight: 1.0, opacity: cgRepSteps[step].left.opacity, transition: "opacity 0.35s ease" }}>
                <div><span style={{ display: "inline-block", zoom: "0.8" }}>{m`\mathrm{LYS} \rightarrow 4\ \mathrm{CG\ nodes}`}</span></div>
                <div className="ml-4 whitespace-nowrap">
                  <div className={`${cgRepSteps[step].colorize ? "cg-cyan " : ""}cg-line first`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}},\ \underline{\text{C}_{\alpha}},\ \underline{\text{C}_{\beta}},\ \text{N})` : String.raw`(\text{C},\ \text{C}_{\alpha},\ \text{C}_{\beta},\ \text{N})`}</Morph>
                    </span>
                  </div>
                  <div className={`${cgRepSteps[step].colorize ? "cg-magenta " : ""}cg-line`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}},\ \underline{\text{C}_{\alpha}},\ \text{O})` : String.raw`(\text{C},\ \text{C}_{\alpha},\ \text{O})`}</Morph>
                    </span>
                  </div>
                  <div className={`${cgRepSteps[step].colorize ? "cg-brown " : ""}cg-line`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}_{\beta}},\ \text{C}_{\gamma},\ \underline{\text{C}_{\delta}})` : String.raw`(\text{C}_{\beta},\ \text{C}_{\gamma},\ \text{C}_{\delta})`}</Morph>
                    </span>
                  </div>
                  <div className={`${cgRepSteps[step].colorize ? "cg-orange " : ""}cg-line`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}_{\delta}},\ \text{C}_{\epsilon},\ \text{N}_{\zeta})` : String.raw`(\text{C}_{\delta},\ \text{C}_{\epsilon},\ \text{N}_{\zeta})`}</Morph>
                    </span>
                  </div>
                </div>
              </div>
            <div className="flex justify-center" style={{ opacity: cgRepSteps[step].right.opacity, transition: "opacity 0.35s ease" }}>
                <div style={{ width: "280px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src="/figures/res_a.png"
                    alt="LYS coarse-grained representation"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
              </div>
            

            <div style={{ lineHeight: 1.0, opacity: cgRepSteps[step].left.opacity, transition: "opacity 0.35s ease" }}>
                <div><span style={{ display: "inline-block", zoom: "0.8" }}>{m`\mathrm{PHE} \rightarrow 3\ \mathrm{CG\ nodes}`}</span></div>
                <div className="ml-4 whitespace-nowrap">
                  <div className={`${cgRepSteps[step].colorize ? "cg-cyan " : ""}cg-line first`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}},\ \underline{\text{C}_{\alpha}},\ \text{C}_{\beta},\ \text{N})` : String.raw`(\text{C},\ \text{C}_{\alpha},\ \text{C}_{\beta},\ \text{N})`}</Morph>
                    </span>
                  </div>
                  <div className={`${cgRepSteps[step].colorize ? "cg-magenta " : ""}cg-line`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}},\ \underline{\text{C}_{\alpha}},\ \text{O})` : String.raw`(\text{C},\ \text{C}_{\alpha},\ \text{O})`}</Morph>
                    </span>
                  </div>
                  <div className={`${cgRepSteps[step].colorize ? "cg-green " : ""}cg-line`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{String.raw`(\text{C}_{\gamma},\ \text{C}_{\delta_1},\ \text{C}_{\delta_2},\ \text{C}_{\epsilon_1},\ \text{C}_{\epsilon_2},\ \text{C}_{\zeta})`}</Morph>
                    </span>
                  </div>
                </div>
              </div>
            <div className="flex justify-center" style={{ opacity: cgRepSteps[step].right.opacity, transition: "opacity 0.35s ease" }}>
                <div style={{ width: "280px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src="/figures/res_b.png"
                    alt="PHE coarse-grained representation"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
              </div>
            

            <div style={{ lineHeight: 1.0, opacity: cgRepSteps[step].left.opacity, transition: "opacity 0.35s ease" }}>
                <div><span style={{ display: "inline-block", zoom: "0.8" }}>{m`\mathrm{ILE} \rightarrow 4\ \mathrm{CG\ nodes}`}</span></div>
                <div className="ml-4 whitespace-nowrap">
                  <div className={`${cgRepSteps[step].colorize ? "cg-cyan " : ""}cg-line first`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}},\ \underline{\text{C}_{\alpha}},\ \underline{\text{C}_{\beta}},\ \text{N})` : String.raw`(\text{C},\ \text{C}_{\alpha},\ \text{C}_{\beta},\ \text{N})`}</Morph>
                    </span>
                  </div>
                  <div className={`${cgRepSteps[step].colorize ? "cg-magenta " : ""}cg-line`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}},\ \underline{\text{C}_{\alpha}},\ \text{O})` : String.raw`(\text{C},\ \text{C}_{\alpha},\ \text{O})`}</Morph>
                    </span>
                  </div>
                  <div className={`${cgRepSteps[step].colorize ? "cg-violet " : ""}cg-line`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}_{\beta}},\ \underline{\text{C}_{\gamma_1}},\ \text{C}_{\gamma_2})` : String.raw`(\text{C}_{\beta},\ \text{C}_{\gamma_1},\ \text{C}_{\gamma_2})`}</Morph>
                    </span>
                  </div>
                  <div className={`${cgRepSteps[step].colorize ? "cg-red " : ""}cg-line`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}_{\beta}},\ \underline{\text{C}_{\gamma_1}},\ \text{C}_{\delta_1})` : String.raw`(\text{C}_{\beta},\ \text{C}_{\gamma_1},\ \text{C}_{\delta_1})`}</Morph>
                    </span>
                  </div>
                </div>
              </div>
            <div className="flex justify-center" style={{ opacity: cgRepSteps[step].right.opacity, transition: "opacity 0.35s ease" }}>
                <div style={{ width: "280px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src="/figures/res_c.png"
                    alt="ILE coarse-grained representation"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
              </div>
            

            <div style={{ lineHeight: 1.0, opacity: cgRepSteps[step].left.opacity, transition: "opacity 0.35s ease" }}>
                <div><span style={{ display: "inline-block", zoom: "0.8" }}>{m`\mathrm{GLU} \rightarrow 3\ \mathrm{CG\ nodes}`}</span></div>
                <div className="ml-4 whitespace-nowrap">
                  <div className={`${cgRepSteps[step].colorize ? "cg-cyan " : ""}cg-line first`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}},\ \underline{\text{C}_{\alpha}},\ \text{C}_{\beta},\ \text{N})` : String.raw`(\text{C},\ \text{C}_{\alpha},\ \text{C}_{\beta},\ \text{N})`}</Morph>
                    </span>
                  </div>
                  <div className={`${cgRepSteps[step].colorize ? "cg-magenta " : ""}cg-line`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{cgRepSteps[step].underlineOverlap ? String.raw`(\underline{\text{C}},\ \underline{\text{C}_{\alpha}},\ \text{O})` : String.raw`(\text{C},\ \text{C}_{\alpha},\ \text{O})`}</Morph>
                    </span>
                  </div>
                  <div className={`${cgRepSteps[step].colorize ? "cg-gray " : ""}cg-line`}>
                    <span style={{ display: "inline-block", zoom: "0.68" }}>
                      <Morph inline>{String.raw`(\text{C}_{\gamma},\ \text{C}_{\delta},\ \text{O}_{\epsilon_1},\ \text{O}_{\epsilon_2})`}</Morph>
                    </span>
                  </div>
                </div>
              </div>
            <div className="flex justify-center" style={{ opacity: cgRepSteps[step].right.opacity, transition: "opacity 0.35s ease" }}>
                <div style={{ width: "280px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src="/figures/res_d.png"
                    alt="GLU coarse-grained representation"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
              </div>
            
          </div>
        )}
      </Slide>

      <Slide header="Edge Definition" steps={range(edgeTypeSteps.length + 2)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-4">
            <AnimateSVG
              src="/figures/edgetype.svg"
              step={edgeTypeSteps[Math.min(step, edgeTypeSteps.length - 1)]}
              style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}
            />
            <Box
              className="mx-auto"
              style={{
                width: "100%",
                maxWidth: "1000px",
                fontSize: "0.78rem",
                lineHeight: 1.45,
                opacity: step >= edgeTypeSteps.length - 1 ? 1 : 0,
                transition: step === edgeTypeSteps.length - 1 ? "opacity 0.6s ease 3.0s" : "opacity 0.35s ease",
                pointerEvents: step >= edgeTypeSteps.length - 1 ? "auto" : "none",
              }}
            >
              <Show when={step >= edgeTypeSteps.length - 1}>
                <div className="whitespace-nowrap">
                  <div>distance&nbsp;&nbsp;{m`r_{ij}=\|\mathbf{r}_{ij}\|_2`}&nbsp;&nbsp;&nbsp;&nbsp;{m`\mathbf{r}_{ij}=\mathbf{T}_j-\mathbf{T}_i`}</div>
                  <div>relative direction&nbsp;&nbsp;{m`\hat{\mathbf{r}}_{ij}=\frac{\mathbf{r}_{ij}}{r_{ij}}`}&nbsp;&nbsp;&nbsp;&nbsp;{m`\hat{\mathbf r}_{ji}=-\hat{\mathbf r}_{ij}`}</div>
                  <div>
                    edge type&nbsp;&nbsp;{m`e_{ij}=\mathrm{clip}(n_{ij},-D,D)+D`}
                    &nbsp;&nbsp;&nbsp;&nbsp;{m`\Delta n_{ij}=n_j-n_i`}
                  </div>
                  <Show when={step >= edgeTypeSteps.length}>
                    <div>message ({m`j \to i`}) uses&nbsp;&nbsp;{m`(\mathbf r_{ij},\hat{\mathbf r}_{ij})`}</div>
                    <div>message ({m`i \to j`}) uses&nbsp;&nbsp;{m`(\mathbf r_{ji},\hat{\mathbf r}_{ji})`}</div>
                  </Show>
                </div>
              </Show>
            </Box>
          </div>
        )}
      </Slide>

      <Slide header="Graph Embedding" steps={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-4" style={{ overflow: "hidden" }}>
            <div style={{ position: "relative", minHeight: "1.6rem", width: "100%" }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  fontSize: "1.02rem",
                  fontWeight: 400,
                  lineHeight: 1.25,
                  transform: step >= 10 ? "translateX(-120%)" : "translateX(0)",
                  opacity: step >= 10 ? 0 : 1,
                  transition: "transform 0.5s ease, opacity 0.35s ease",
                }}
              >
                Node embedding {m`(c,\mathbf{R})\mapsto e=`}
                {m`${step >= 8 ? String.raw`(s',\mathbf{v}')` : String.raw`(s,\mathbf{v})`}`}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  fontSize: "1.02rem",
                  fontWeight: 400,
                  lineHeight: 1.25,
                  transform: step >= 10 ? "translateX(0)" : "translateX(120%)",
                  opacity: step >= 10 ? 1 : 0,
                  transition: "transform 0.5s ease, opacity 0.35s ease",
                }}
              >
                Edge embedding {m`\mathbf{r}_{ij},\ \hat{\mathbf{r}}_{ij},\ \mathbf{z}_{ij},\ \mathbf{w}_{ij}`}
              </div>
            </div>
            <div
              style={{
                transform: step >= 10 ? "translateX(-120%)" : "translateX(0)",
                opacity: step >= 10 ? 0 : 1,
                transition: "transform 0.5s ease, opacity 0.35s ease",
                height: step >= 10 ? 0 : "auto",
                overflow: step >= 10 ? "hidden" : "visible",
              }}
            >
              <Box className="mx-auto" style={{ width: "100%", maxWidth: "1000px", fontSize: "0.86rem", lineHeight: 1.35 }}>
              <div>
                {step >= 9 ? (
                  <div style={{ textAlign: "center", marginBottom: "0.25rem" }}>
                    {m`e=D(\mathbf{R})\,\mathrm{LOOKUP}(c)`}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", marginBottom: "0.25rem" }}>
                    <span style={{ display: "inline-block" }}>{m`e=`}</span>
                    <span
                      style={{
                        display: "inline-block",
                        opacity: step >= 6 && step < 8 ? 0.2 : 1,
                        transition: "opacity 0.25s ease",
                      }}
                    >
                      <Morph inline>
                        {step >= 6
                          ? String.raw`\begin{bmatrix}1&0\\0&\mathbf{R}\end{bmatrix}\,`
                          : String.raw`D(\mathbf{R})\,`}
                      </Morph>
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        opacity: step >= 2 && step < 6 ? 0.2 : 1,
                        transition: "opacity 0.25s ease",
                      }}
                    >
                      <Morph inline>{step >= 7 ? String.raw`[s,\mathbf{v}]^T` : String.raw`\mathrm{LOOKUP}(c)`}</Morph>
                    </span>
                  </div>
                )}
                <div style={{ position: "relative", minHeight: "11rem" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: step === 2 ? 1 : 0,
                      transition: "opacity 0.2s ease",
                      pointerEvents: step === 2 ? "auto" : "none",
                    }}
                  >
                    <div style={{ margin: "0.15rem 0 0.45rem 0" }}>
                      A Wigner-D matrix {m`D^{(\ell)}(\mathbf{R})`} is the representation matrix that specifies how degree-{m`\ell`} features transform under a rotation {m`\mathbf{R}\in SO(3)`}. You can think of it as the linear rule for rotating coefficients in the {m`\ell`}-th irrep basis. For {m`\ell=0`}, {m`D^{(0)}(\mathbf{R})=1`}, so scalars are unchanged. For {m`\ell=1`}, {m`D^{(1)}(\mathbf{R})=\mathbf{R}`}, so vectors rotate exactly like ordinary 3D vectors.
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: step >= 3 && step < 6 ? 1 : 0,
                      transition: "opacity 0.2s ease",
                      pointerEvents: step >= 3 && step < 6 ? "auto" : "none",
                    }}
                  >
                    <Morph display>
                      {graphEmbeddingMorphStates[Math.min(Math.max(step - 3, 0), 2)]}
                    </Morph>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: step === 6 ? 1 : 0,
                      transition: "opacity 0.2s ease",
                      pointerEvents: step === 6 ? "auto" : "none",
                      lineHeight: 1.35,
                    }}
                  >
                    <div style={{ margin: "0.15rem 0 0.35rem 0" }}>
                      <div>Type lookup (canonical template features)</div>
                      <div style={{ textAlign: "center", marginTop: "0.35rem" }}>{m`\mathrm{LOOKUP}(c)=[s,\mathbf{v}]^T,\ s\in\mathbb{R},\ \mathbf{v}\in\mathbb{R}^{3}.`}</div>
                      <div>These are learned per CG node type.</div>
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: step === 8 ? 1 : 0,
                      transition: "opacity 0.2s ease",
                      pointerEvents: step === 8 ? "auto" : "none",
                      lineHeight: 1.35,
                    }}
                  >
                    <div style={{ marginTop: "0.1rem" }}>
                      {M`e=\begin{bmatrix}1&0\\0&\mathbf{R}\end{bmatrix}[s,\mathbf{v}]^T=[s,\mathbf{R}\mathbf{v}]^T`}
                      <div style={{ marginTop: "0.1rem" }}>{m`\ell=0`} part unchanged:</div>
                      <div style={{ textAlign: "center" }}>{m`s'=s`}</div>
                      <div style={{ marginTop: "0.2rem" }}>{m`\ell=1`} part rotated channelwise:</div>
                      <div style={{ textAlign: "center" }}>{m`\mathbf{v}'=\mathbf{R}\mathbf{v}`}</div>
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: step === 9 ? 1 : 0,
                      transition: "opacity 0.2s ease",
                      pointerEvents: step === 9 ? "auto" : "none",
                      lineHeight: 1.35,
                    }}
                  >
                    <div style={{ marginTop: "0.2rem" }}>
                      <div><b>Interpretation:</b></div>
                      <div>lookup gives a node-type-specific canonical feature template;</div>
                      <div>{m`D(\mathbf{R})`} “steers” the equivariant part to the node’s current orientation.</div>
                    </div>
                  </div>
                </div>
              </div>
              </Box>
            </div>
            <div
              style={{
                opacity: step >= 11 ? 1 : 0,
                transition: "opacity 0.25s ease",
                pointerEvents: step >= 11 ? "auto" : "none",
              }}
            >
              <Box className="mx-auto" style={{ width: "100%", maxWidth: "1000px", fontSize: "0.82rem", lineHeight: 1.4 }}>
                <div className="whitespace-nowrap">
                  <Show when={step >= 11}>
                    <div>
                      Recall pair geometry {m`\mathbf{r}_{ij}=\mathbf{T}_j-\mathbf{T}_i\quad r_{ij}=\|\mathbf{r}_{ij}\|_2\quad \hat{\mathbf{r}}_{ij}=\mathbf{r}_{ij}/r_{ij}`}
                    </div>
                  </Show>
                  <Show when={step >= 12}>
                    <div><span style={{ display: "inline-block", width: "2.4rem" }}>"  "</span>edge type</div>
                    <div style={{ textAlign: "center" }}>
                      {M`\Delta n_{ij}=n_j-n_i\qquad e_{ij}^{\mathrm{type}}=\mathrm{clip}(\Delta n_{ij},-D,D)+D`}
                    </div>
                  </Show>
                  <Show when={step >= 13}>
                    <div>Edge embedding + radial basis</div>
                    <div style={{ textAlign: "center" }}>
                      {M`\mathbf{z}_{ij}=\mathrm{Embed}(e_{ij}^{\mathrm{type}})\qquad \boldsymbol{\phi}_{ij}=\mathrm{Bessel}(r_{ij})`}
                    </div>
                  </Show>
                  <Show when={step >= 14}>
                    <div>Combined edge features for message passing</div>
                    <div style={{ textAlign: "center" }}>
                      {M`\mathbf{w}_{ij}=\mathrm{RadialNN}\!\left([\boldsymbol{\phi}_{ij};\mathbf{z}_{ij}]\right)\ \rightarrow\ \{w_{ss,ij},w_{sv,ij},w_{vs,ij},w_{vv,ij}\}`}
                    </div>
                  </Show>
                </div>
              </Box>
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Outer Equivariant Block Updates" steps={range(outerInnerSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <AnimateSVG
              src="/figures/outersteps.svg"
              step={outerInnerSteps[step]}
              style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}
            />
          </div>
        )}
      </Slide>

      <Slide header="Equivariant Message Passing" steps={range(outerBlockSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-4">
            <div className="mx-auto w-full" style={{ maxWidth: "1000px", fontSize: "1.05rem", textAlign: "left" }}>
              Outer Equifold Block
            </div>
            <div
              style={{
                width: "100%",
                maxWidth: "1000px",
                margin: "0 auto",
                position: "relative",
              }}
            >
              <AnimateSVG
                src="/figures/outerblock.svg"
                step={outerBlockSteps[step]}
                style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}
              />
              <Show when={step === OUTER_BLOCK_GRAY_STEP}>
                <Portal zoomin className="absolute" style={{ left: "32%", top: "45%", width: "36%", height: "10%" }}>
                  <div style={{ width: "100%", height: "100%" }} />
                </Portal>
              </Show>
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Inner Equivariant Block Updates" steps={range(innerSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <AnimateSVG
              src="/figures/innersteps.svg"
              step={innerSteps[step]}
              style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}
            />
          </div>
        )}
      </Slide>

      <Slide steps={range(innerBlockSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-3">
            <div className="mx-auto w-full" style={{ maxWidth: "1000px", fontSize: "1.05rem", textAlign: "left" }}>
              Inner equivariant sub-block
            </div>
            <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto", transform: "translateY(-12%)" }}>
              <AnimateSVG
                src="/figures/innerblock.svg"
                step={innerBlockSteps[step]}
                style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}
              />
            </div>
          </div>
        )}
      </Slide>

      <Slide header="EquiFold Loss Functions" steps={range(lossRevealSteps.length)}>
        {(step) => (
        <div className="h-full flex flex-col justify-center gap-5">
          <div
            className="mx-auto w-full"
            style={{
              maxWidth: "1060px",
              fontSize: "0.64rem",
              lineHeight: 1.45,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
            }}
          >
            <div style={{ marginBottom: "0.35rem" }}>
              Total training objective is applied at each outer-block output and combines frame-aligned atom error with structure-violation penalties.
            </div>

            <Show when={lossRevealSteps[step].block1.opacity === 1}>
              <div style={{ marginTop: "0.55rem", marginBottom: "0.2rem", fontWeight: 700 }}>1. Frame-aligned point error (all-atom FAPE)</div>
              <div style={{ marginBottom: "0.46rem", fontSize: "0.48rem", lineHeight: 1.25 }}>
                <span style={{ display: "inline-block", zoom: "0.82", transformOrigin: "left top" }}>
                  {m`\mathcal{L}_{\mathrm{FAPE}}^{(k)}=\frac{1}{Z\,N_{\mathrm{pairs}}}\sum_{i,j,a}m_{ija}\,\min\!\left(d_{\max},\left\|\mathbf{X}^{(k)}_{ij,a}-\widehat{\mathbf{X}}^{(k)}_{ij,a}\right\|_2\right)`}
                </span>
              </div>
              <div style={{ marginTop: "-0.2rem", marginBottom: "0.26rem", fontSize: "0.27rem", lineHeight: 1.06, opacity: 0.88 }}>
                <span style={{ display: "inline-block", zoom: "0.52", transformOrigin: "left top" }}>
                  {m`\mathbf{X}^{(k)}_{ij,a}=\mathbf{R}_i^{\top}\!\left(\mathbf{x}_{j,a}^{(k)}-\mathbf{T}_i^{(k)}\right);\ \mathbf{X}^{(k)}_{ij,a}\text{ is ground-truth atom }a\text{ from CG node }j\text{ expressed in frame }i;\ \widehat{\mathbf{X}}^{(k)}_{ij,a}\text{ is the prediction.}`}
                </span>
              </div>
            </Show>

            <Show when={lossRevealSteps[step].block2.opacity === 1}>
              <div style={{ marginTop: "0.55rem", marginBottom: "0.2rem", fontWeight: 700 }}>2. Structure-violation losses</div>
              <div style={{ marginBottom: "0.45rem", fontSize: "0.48rem", lineHeight: 1.25 }}>
                <span style={{ display: "inline-block", zoom: "0.82", transformOrigin: "left top" }}>
                  {m`\mathcal{L}_{\mathrm{struct}}^{(k)}=\mathcal{L}_{\mathrm{bond}}^{(k)}+\mathcal{L}_{\mathrm{angle}}^{(k)}+\mathcal{L}_{\mathrm{clash}}^{(k)}`}
                </span>
              </div>
              <div style={{ marginBottom: "0.2rem", fontSize: "0.48rem", lineHeight: 1.25 }}>
                <span style={{ display: "inline-block", zoom: "0.82", transformOrigin: "left top" }}>
                  {m`\mathcal{L}_{\mathrm{bond}}=\frac{1}{|\mathcal{B}|}\sum_{(p,q)\in\mathcal{B}}\left[\left|\,\|\mathbf{x}_p-\mathbf{x}_q\|_2-\ell_{pq}\right|-\delta_{pq}^{\mathrm{bond}}\right]_+`}
                </span>
              </div>
              <div style={{ marginBottom: "0.2rem", fontSize: "0.48rem", lineHeight: 1.25 }}>
                <span style={{ display: "inline-block", zoom: "0.82", transformOrigin: "left top" }}>
                  {m`\mathcal{L}_{\mathrm{angle}}=\frac{1}{|\mathcal{A}|}\sum_{(p,q,r)\in\mathcal{A}}\left[\left|\,\cos\angle_{\scriptscriptstyle pqr}-c_{pqr}\right|-\delta_{pqr}^{\mathrm{angle}}\right]_+`}
                </span>
              </div>
              <div style={{ marginBottom: "0.45rem", fontSize: "0.48rem", lineHeight: 1.25 }}>
                <span style={{ display: "inline-block", zoom: "0.82", transformOrigin: "left top" }}>
                  {m`\mathcal{L}_{\mathrm{clash}}=\frac{1}{|\mathcal{C}|}\sum_{(p,q)\in\mathcal{C}}\left[(w_p+w_q-\delta_{\mathrm{clash}})-\|\mathbf{x}_p-\mathbf{x}_q\|_2\right]_+`}
                </span>
              </div>
            </Show>

            <Show when={lossRevealSteps[step].block3.opacity === 1}>
              <div style={{ marginTop: "0.55rem", marginBottom: "0.2rem", fontWeight: 700 }}>3. Per-block objective and aggregation</div>
              <div style={{ marginBottom: "0.2rem", fontSize: "0.48rem", lineHeight: 1.25 }}>
                <span style={{ display: "inline-block", zoom: "0.82", transformOrigin: "left top" }}>
                  {m`\mathcal{L}^{(k)}=\mathcal{L}_{\mathrm{FAPE}}^{(k)}+\tau\,\lambda_{\mathrm{struct}}\,s_k\,\mathcal{L}_{\mathrm{struct}}^{(k)},\quad s_k\in\left\{1,\frac{k}{K},\left(\frac{k}{K}\right)^2\right\}`}
                </span>
              </div>
              <div style={{ fontSize: "0.48rem", lineHeight: 1.25 }}>
                <span style={{ display: "inline-block", zoom: "0.82", transformOrigin: "left top" }}>
                  {m`\mathcal{L}_{\mathrm{total}}=\frac{1}{K}\sum_{k=1}^{K}\mathcal{L}^{(k)}`}
                </span>
              </div>
            </Show>
          </div>
        </div>
        )}
      </Slide>

      <Slide header="De novo Designed Mini-proteins">
        <div className="h-full flex flex-col justify-center gap-4">
          <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
            <AnimateSVG
              src="/figures/designedminiproteins.svg"
              step={{}}
              style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}
            />
          </div>
          <div
            className="mx-auto"
            style={{
              width: "100%",
              maxWidth: "1000px",
              fontSize: "0.62rem",
              lineHeight: 1.6,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
              border: "none",
              background: "transparent",
              boxShadow: "none",
              padding: 0,
            }}
          >
            <div>Dataset source: Rocklin et al. (2017), Rosetta-predicted structures.</div>
            <div>Folds evaluated: {m`\alpha\alpha\alpha,\ \alpha\beta\beta\alpha,\ \beta\alpha\beta\beta,\ \beta\beta\alpha\beta\beta`}.</div>
            <div>Filtering: stability score &gt;1 gives 2,842 sequences (length 43–50).</div>
            <div>Split: train 2,742, validation 50, test 50.</div>
            <div>Evaluation protocol: all-atom RMSD and {m`C_\alpha`} RMSD versus Rosetta structures.</div>
            <div>Reported experiment footprint: ~0.03 s/sequence, 2.30M trainable parameters.</div>
          </div>
        </div>
      </Slide>

      <Slide header="De novo Designed Mini-protein Examples">
        <div className="h-full flex flex-col justify-center gap-3">
          <div
            style={{
              width: "100%",
              maxWidth: "1200px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "minmax(120px, 1fr) 820px minmax(120px, 1fr)",
              alignItems: "stretch",
              columnGap: "0.45rem",
            }}
          >
            <div
              style={{
                fontSize: "0.46rem",
                lineHeight: 1.35,
                fontFamily: "Spallet, Computer Modern Sans, sans-serif",
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
              }}
            >
              <div>ααα, 0.88 Å, 62%</div>
              <div>βαββ, 1.15 Å, 60%</div>
            </div>

            <div style={{ width: "100%", margin: "0 auto" }}>
              <img
                src="/assets/equifold/out-002.png"
                alt="EquiFold Figure 2 overlays on de novo mini-proteins"
                style={{ width: "100%", height: "auto", display: "block", margin: "0 auto" }}
              />
            </div>

            <div
              style={{
                fontSize: "0.46rem",
                lineHeight: 1.35,
                fontFamily: "Spallet, Computer Modern Sans, sans-serif",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
              }}
            >
              <div>αββα, 1.75 Å, 51%</div>
              <div>ββαββ, 1.12 Å, 60%</div>
            </div>
          </div>

          <div className="mx-auto" style={{ width: "100%", maxWidth: "1000px", fontSize: "0.58rem", lineHeight: 1.5, fontFamily: "Spallet, Computer Modern Sans, sans-serif", textAlign: "center" }}>
            EquiFold predictions (rainbow) overlaid with Rosetta references (gray); values are (all-atom RMSD, nearest-train sequence similarity).
          </div>
        </div>
      </Slide>

      <Slide header="De novo Designed Mini-protein Results">
        <div className="h-full flex flex-col justify-center gap-3">
          <div
            className="mx-auto"
            style={{
              width: "100%",
              maxWidth: "1000px",
              fontSize: "0.62rem",
              lineHeight: 1.6,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
            }}
          >
            <div>Fold-wise RMSD on the mini-protein test split (vs Rosetta structures).</div>
          </div>
          <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto", fontSize: "0.68rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Spallet, Computer Modern Sans, sans-serif" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>Fold</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>Train</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>Test</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>RMSD (Å)</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>{m`C_\alpha`} RMSD (Å)</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>{m`C_\alpha`} RMSD (train) (Å)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "0.2rem 0.35rem" }}>{m`\alpha\beta\beta\alpha`}</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>92</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>3</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>2.20</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>1.76</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>4.36</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.2rem 0.35rem" }}>{m`\beta\beta\alpha\beta\beta`}</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>533</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>8</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>1.12</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>0.45</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>0.91</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.2rem 0.35rem" }}>{m`\beta\alpha\beta\beta`}</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>787</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>15</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>1.00</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>0.43</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>0.99</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.2rem 0.35rem" }}>{m`\alpha\alpha\alpha`}</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>1330</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>24</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>1.14</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>0.53</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.35rem" }}>2.79</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Slide>

      <Slide header="Antibody Structure Prediction Experiment">
        <div className="h-full flex flex-col justify-center gap-4">
          <div
            style={{
              width: "100%",
              maxWidth: "1040px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: "1rem",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.6rem",
                lineHeight: 1.45,
                fontFamily: "Spallet, Computer Modern Sans, sans-serif",
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
              }}
            >
              <div>Source structures: all antibodies in PDB listed in SAbDab.</div>
              <div>Preprocessing: variable fragment extraction and Chothia numbering via ANARCI.</div>
              <div>Training pool: 6,789 antibody structures with resolution better than 4 Å.</div>
              <div>Validation: 50 structures sampled from the training pool.</div>
              <div>Test protocol: same benchmark test set used by IgFold, resolution better than 3 Å and held out by deposition cutoff.</div>
              <div>Evaluation setup: compare predicted and experimental structures by backbone RMSD across framework and CDR regions.</div>
            </div>

            <div style={{ width: "100%", maxWidth: "520px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <img
                  src="/assets/SAbDab_logo.png"
                  alt="SAbDab logo"
                  style={{ width: "52%", height: "auto", display: "block" }}
                />
              </div>
              <img
                src="/assets/antibody_schematic.png"
                alt="Antibody schematic from SAbDab/SAbPred"
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "4px" }}
              />
            </div>
          </div>
          <div
            className="mx-auto"
            style={{
              width: "100%",
              maxWidth: "1040px",
              fontSize: "0.45rem",
              lineHeight: 1.4,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
              textAlign: "right",
              opacity: 0.75,
            }}
          >
            Visual assets: OPIG SAbDab/SAbPred (antibody schematic and SAbDab logo).
          </div>
        </div>
      </Slide>

      <Slide header="Antibody Structure Prediction Results" steps={[0, 1]}>
        {(step) => (
        <div className="h-full flex flex-col justify-center gap-3">
          <div
            className="mx-auto"
            style={{
              width: "100%",
              maxWidth: "1040px",
              fontSize: "0.6rem",
              lineHeight: 1.55,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
            }}
          >
            <div>
              RMSD (Å) over backbone{" "}
              <span style={{ display: "inline-block", zoom: "0.78", transformOrigin: "left top" }}>
                {m`N,\ C_\alpha,\ C`}
              </span>{" "}
              atoms by heavy/light framework and CDR loops.
            </div>
            <div style={{ opacity: step >= 1 ? 1 : 0, transition: "0.35s opacity ease-in-out" }}>
              Time reports inference time for predicting all-atom structure.
            </div>
            <div>All-atom RMSD for EquiFold on this test set: 1.52 Å.</div>
          </div>

          <div style={{ width: "100%", maxWidth: "1040px", margin: "0 auto", fontSize: "0.6rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Spallet, Computer Modern Sans, sans-serif" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #888", padding: "0.2rem 0.3rem" }}>Model</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.3rem" }}>H Fr</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.3rem" }}>H1</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.3rem" }}>H2</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.3rem" }}>H3</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.3rem" }}>L Fr</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.3rem" }}>L1</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.3rem" }}>L2</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #888", padding: "0.2rem 0.3rem" }}>L3</th>
                  <th
                    style={{
                      textAlign: "right",
                      borderBottom: `1px solid ${step >= 1 ? "#888" : "transparent"}`,
                      padding: "0.2rem 0.3rem",
                      width: "4.6rem",
                      opacity: step >= 1 ? 1 : 0,
                      transition: "0.35s opacity ease-in-out, 0.35s border-color ease-in-out",
                    }}
                  >
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "0.2rem 0.3rem" }}>EquiFold</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}><strong>0.41</strong></td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}><strong>0.74</strong></td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.70</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}><strong>2.92</strong></td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}><strong>0.39</strong></td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}><strong>0.78</strong></td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}><strong>0.34</strong></td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}><strong>1.02</strong></td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "0.2rem 0.3rem",
                      width: "4.6rem",
                      opacity: step >= 1 ? 1 : 0,
                      transition: "0.35s opacity ease-in-out",
                    }}
                  >
                    <strong>
                      <span style={{ display: "inline-block", zoom: "0.8", transformOrigin: "right center" }}>
                        {m`\sim 1\ \text{second}`}
                      </span>
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "0.2rem 0.3rem" }}>AlphaFold-Multimer{m`^{\dagger}`}</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.43</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.75</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}><strong>0.69</strong></td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>3.02</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}><strong>0.39</strong></td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.82</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.41</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>1.13</td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "0.2rem 0.3rem",
                      width: "4.6rem",
                      opacity: step >= 1 ? 1 : 0,
                      transition: "0.35s opacity ease-in-out",
                    }}
                  >
                    <span style={{ display: "inline-block", zoom: "0.8", transformOrigin: "right center" }}>
                      {m`\sim 1\ \text{hour}`}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "0.2rem 0.3rem" }}>IgFold{m`^{\ddagger}`}</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.45</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.80</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.75</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>2.99</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.45</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.83</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>0.51</td>
                  <td style={{ textAlign: "right", padding: "0.2rem 0.3rem" }}>1.07</td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "0.2rem 0.3rem",
                      width: "4.6rem",
                      opacity: step >= 1 ? 1 : 0,
                      transition: "0.35s opacity ease-in-out",
                    }}
                  >
                    <span style={{ display: "inline-block", zoom: "0.8", transformOrigin: "right center" }}>
                      {m`\sim 1\ \text{minute}`}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            className="mx-auto"
            style={{
              width: "100%",
              maxWidth: "1040px",
              fontSize: "0.5rem",
              lineHeight: 1.45,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
              opacity: 0.85,
              display: "flex",
              flexDirection: "column",
              gap: "0.28rem",
            }}
          >
            <div style={{ fontSize: "0.44rem", lineHeight: 1.2, opacity: 0.8, marginTop: "0.1rem" }}>
              <div>{m`^{\dagger}`} AlphaFold-Multimer: MSA/pair transformer with an equivariant structure module using rigid-frame updates.</div>
              <div>{m`^{\ddagger}`} IgFold: antibody-focused model with equivariant geometric refinement; not a vanilla Equiformer/EGNN-style graph GNN.</div>
            </div>
          </div>
        </div>
        )}
      </Slide>

      <Slide header="Antibody Structure Prediction Examples">
        <div className="h-full flex flex-col justify-center gap-3">
          <div style={{ width: "100%", maxWidth: "760px", margin: "0 auto" }}>
            <img
              src="/assets/out-004-trim.png"
              alt="Antibody prediction overlays"
              style={{ width: "100%", height: "auto", display: "block", margin: "0 auto" }}
            />
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "760px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: "0.9rem",
              fontSize: "0.44rem",
              lineHeight: 1.45,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div><strong>7fb_HL</strong></div>
              <div>All-atom RMSD: 1.24 Å</div>
              <div>Nearest-train similarity: 71%</div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div><strong>7o2c_CD</strong></div>
              <div>All-atom RMSD: 1.00 Å</div>
              <div>Nearest-train similarity: 72%</div>
            </div>
          </div>

          <div
            className="mx-auto"
            style={{
              width: "100%",
              maxWidth: "1000px",
              fontSize: "0.58rem",
              lineHeight: 1.5,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
              textAlign: "center",
            }}
          >
            Predicted antibody structures (rainbow) overlaid with reference structures (gray).
          </div>
        </div>
      </Slide>

      <Slide header="Model Size And Training">
        {(() => {
          const modelSizes = [
            { name: "EquiFold (Mini-protein)", paramsM: 2.3, color: "#2563eb" },
            { name: "EquiFold (Antibody)", paramsM: 7.38, color: "#0ea5a8" },
            { name: "AlphaFold", paramsM: 93.2, color: "#f59e0b" },
            { name: "IgFold (with AntiBERTy)", paramsM: 559.6, color: "#ef4444" },
          ];
          const maxParamsM = 559.6;

          return (
            <div className="h-full flex flex-col justify-center gap-3">
              <div
                className="mx-auto"
                style={{
                  width: "100%",
                  maxWidth: "1040px",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.55rem",
                }}
              >
                <div style={{ border: "1px solid #7c8ca8", borderRadius: "8px", padding: "0.45rem 0.55rem", background: "rgba(255,255,255,0.45)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: "0.44rem", opacity: 0.75 }}>Mini-batch Size</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>8</div>
                </div>
                <div style={{ border: "1px solid #7c8ca8", borderRadius: "8px", padding: "0.45rem 0.55rem", background: "rgba(255,255,255,0.45)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: "0.44rem", opacity: 0.75 }}>Parallel Hardware</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>8 × A100 GPUs</div>
                </div>
                <div style={{ border: "1px solid #7c8ca8", borderRadius: "8px", padding: "0.45rem 0.55rem", background: "rgba(255,255,255,0.45)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: "0.44rem", opacity: 0.75 }}>Training Duration</div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, lineHeight: 1.25 }}>
                    <div>Mini: 1 day</div>
                    <div>
                      Ab: 3.5 + 7 days{" "}
                      <span style={{ display: "inline-block", transform: "translateY(-0.03rem)" }}>↓</span>
                      {" "}lr
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ width: "100%", maxWidth: "1040px", margin: "0 auto", fontSize: "0.52rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Spallet, Computer Modern Sans, sans-serif" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #7c8ca8", padding: "0.2rem 0.28rem" }}>EquiFold Model</th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #7c8ca8", padding: "0.2rem 0.28rem" }}>
                        <span style={{ display: "inline-block", zoom: "0.76", transformOrigin: "right center" }}>{m`n_c`}</span>
                      </th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #7c8ca8", padding: "0.2rem 0.28rem" }}>
                        <span style={{ display: "inline-block", zoom: "0.76", transformOrigin: "right center" }}>{m`d_{\mathrm{bessel}}`}</span>
                      </th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #7c8ca8", padding: "0.2rem 0.28rem" }}>
                        <span style={{ display: "inline-block", zoom: "0.76", transformOrigin: "right center" }}>{m`N_{\mathrm{blocks}}`}</span>
                      </th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #7c8ca8", padding: "0.2rem 0.28rem" }}>
                        <span style={{ display: "inline-block", zoom: "0.76", transformOrigin: "right center" }}>{m`N_{\mathrm{sub}}`}</span>
                      </th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #7c8ca8", padding: "0.2rem 0.28rem" }}>
                        <span style={{ display: "inline-block", zoom: "0.76", transformOrigin: "right center" }}>{m`N_{\mathrm{head}}`}</span>
                      </th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #7c8ca8", padding: "0.2rem 0.28rem" }}>
                        <span style={{ display: "inline-block", zoom: "0.76", transformOrigin: "right center" }}>{m`r_c`}</span>
                      </th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #7c8ca8", padding: "0.2rem 0.28rem" }}>Trainable Params</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "0.2rem 0.28rem" }}>Mini-protein</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>64</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>64</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>4</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>3</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>2</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>32 Å</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem", fontWeight: 700 }}>2.30M</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "0.2rem 0.28rem" }}>Antibody</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>96</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>96</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>6</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>3</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>3</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem" }}>64 Å</td>
                      <td style={{ textAlign: "right", padding: "0.2rem 0.28rem", fontWeight: 700 }}>7.38M</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                className="mx-auto"
                style={{
                  width: "100%",
                  maxWidth: "1040px",
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  columnGap: "0.45rem",
                }}
              >
                {modelSizes.map((model) => {
                  const pct = Math.min(100, (model.paramsM / maxParamsM) * 100);
                  return (
                    <div key={model.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.24rem" }}>
                      <div
                        style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "999px",
                          background: `conic-gradient(${model.color} 0% ${pct}%, #d5dde8 ${pct}% 100%)`,
                          border: "1px solid #7c8ca8",
                        }}
                      />
                      <div style={{ textAlign: "center", fontSize: "0.42rem", lineHeight: 1.25 }}>
                        <div style={{ fontWeight: 700 }}>{model.name}</div>
                        <div>{model.paramsM.toFixed(model.paramsM < 10 ? 2 : 1)}M parameters</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="mx-auto"
                style={{
                  width: "100%",
                  maxWidth: "1040px",
                  fontSize: "0.4rem",
                  lineHeight: 1.3,
                  fontFamily: "Spallet, Computer Modern Sans, sans-serif",
                  opacity: 0.75,
                }}
              >
                Pie slices are linearly scaled to the largest model (IgFold = 559.6M parameters).
              </div>
            </div>
          );
        })()}
      </Slide>

      <Slide header="EquiFold vs AF-Multimer/IgFold">
        <div className="h-full flex flex-col justify-center gap-5">
          <div
            className="mx-auto"
            style={{
              width: "100%",
              maxWidth: "1040px",
              fontSize: "0.56rem",
              lineHeight: 1.45,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
              display: "flex",
              flexDirection: "column",
              gap: "0.34rem",
            }}
          >
            <div><strong>Representation:</strong> EquiFold uses overlapping coarse-grained nodes with local all-atom templates; AF-Multimer/IgFold use sequence/pair feature stacks with downstream structure refinement modules.</div>
            <div><strong>Input priors:</strong> AF-Multimer is MSA/template-heavy, IgFold uses learned antibody sequence priors, while EquiFold is designed to run without MSA/PLM inputs in the reported setup.</div>
            <div><strong>Where iteration lives:</strong> all three are iterative, but EquiFold explicitly iterates node rigid transforms {m`{\scriptscriptstyle (\mathbf{R},\mathbf{T})}`} across outer blocks.</div>
            <div><strong>State carry-over:</strong> in EquiFold, geometry {m`{\scriptscriptstyle (\mathbf{R},\mathbf{T})}`} is the primary carried state and embeddings are re-steered each block via {m`{\scriptscriptstyle D(\mathbf{R})\,\mathrm{LOOKUP}(c)}`}. </div>
          </div>
          <div style={{ width: "100%", maxWidth: "1040px", margin: "0 auto", fontSize: "0.56rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Spallet, Computer Modern Sans, sans-serif" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>Axis</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>EquiFold</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>AF-Multimer / IgFold</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Primary representation</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>CG rigid nodes + overlapping atom templates</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Sequence/pair features + structure refinement stacks</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Main carried state across iterations</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>{m`{\scriptscriptstyle (\mathbf{R},\mathbf{T})}`} node transforms</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Internal trunk/structure-module features and frames</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.2rem 0.35rem" }}>All-atom decoding</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Transform templates, then merge overlaps</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Direct structure-head refinement pipeline</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Slide>

      <Slide header="EquiFold vs AF-Multimer/IgFold">
        <div className="h-full flex flex-col justify-center gap-5">
          <div
            className="mx-auto"
            style={{
              width: "100%",
              maxWidth: "1040px",
              fontSize: "0.56rem",
              lineHeight: 1.45,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
              display: "flex",
              flexDirection: "column",
              gap: "0.34rem",
            }}
          >
            <div><strong>Side-chain parameterization:</strong> AF-Multimer predicts explicit side-chain torsion angles; EquiFold models side-chain geometry in extrinsic 3D through CG node transforms and template decoding.</div>
            <div><strong>Frame granularity:</strong> AF-Multimer is centered on residue-level frame updates; EquiFold updates multiple CG-node frames per residue.</div>
            <div><strong>IgFold path:</strong> antibody-focused coordinate prediction with geometric refinement; side-chain completion/refinement is typically downstream rather than an explicit AF-style torsion head.</div>
            <div><strong>Practical outcome in reported tasks:</strong> EquiFold emphasizes a compact, fast geometric pipeline for all-atom prediction from sequence.</div>
          </div>
          <div style={{ width: "100%", maxWidth: "1040px", margin: "0 auto", fontSize: "0.56rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Spallet, Computer Modern Sans, sans-serif" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>Detail</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>EquiFold</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #888", padding: "0.2rem 0.35rem" }}>AF-Multimer / IgFold</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Iteration primitive</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Outer-block updates of CG-node {m`{\scriptscriptstyle (\mathbf{R},\mathbf{T})}`}</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Structure-module/refinement-stack updates</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Side-chain handling</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Extrinsic 3D via CG nodes and template merge</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>AF-Multimer: explicit torsions; IgFold: downstream completion/refinement</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Per-residue frame count</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Multiple CG-node frames</td>
                  <td style={{ padding: "0.2rem 0.35rem" }}>Typically residue-level frame backbone refinement</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Slide>

      <Slide header="Impact">
        <div className="h-full flex flex-col justify-center gap-4">
          <div
            className="mx-auto"
            style={{
              width: "100%",
              maxWidth: "1040px",
              fontSize: "0.62rem",
              lineHeight: 1.35,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
            }}
          >
            <Box style={{ padding: "0.16rem 0.32rem" }}>
              EquiFold established the geometric modeling foundation that directly informed the follow-on portfolio work at
              Genentech (Prescient Design / gRED sequence-structure co-generation platform).
            </Box>
          </div>

          <div
            className="mx-auto"
            style={{
              width: "100%",
              maxWidth: "1040px",
              fontSize: "0.58rem",
              lineHeight: 1.35,
              fontFamily: "Spallet, Computer Modern Sans, sans-serif",
              display: "flex",
              flexDirection: "column",
              gap: "0.34rem",
            }}
          >
            <div>- Progression: EquiFold (fast SE(3)-equivariant all-atom prediction) -> portfolio sequence-structure co-generation stack.</div>
            <div>- Platform outcome: modular PyTorch framework combining SE(3)-equivariant GNNs with score-based diffusion/SDE modeling for bidirectional inference and conditional generation.</div>
            <div>- Organizational impact: cross-functional workflow adopted with 20+ ML scientists, structural biologists, and protein engineers.</div>
            <div>- Downstream impact: internal toolkits and methods that now support gRED discovery programs.</div>
          </div>
        </div>
      </Slide>

      <QuestionSlide title="Questions?" />
    </Presentation>
  );
}

export default App;
