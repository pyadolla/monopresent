import React, { useEffect } from "react";

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
rect6      hhhhhvv
rect6draw  dddddDD
text6      vvvvvvv
text1      vvvvvvv
text2      hvvvvvv
text1-3    hvvvvvv
text3      hhvvvvv
text1-5    hhvvvvv
text4      hhhvvvv
text1-9    hhhvvvv
text1-7    hhhvvvv
text5      hhhhvvv
text1-36   hhhhvvv
rect7      hhhhhhv
`;

const OUTER_BLOCK_GRAY_STEP = outerBlockTimeline.length - 1;

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
    drawSVG: s.rect6draw.drawSVG,
    seconds: i === 5 ? 1.2 : 0.45,
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

function App() {
  useEffect(() => {
    // Opt-in only in this sandbox while validating metadata-driven baseline.
    setLaTeXBaselineMetadataMode(true);
    return () => setLaTeXBaselineMetadataMode(false);
  }, []);

  return (
    <Presentation bibUrl="/references.bib">
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
            <Notes>Principiae List/Item can still drive step-based reveal while you override list styling.</Notes>
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

      <QuestionSlide title="Questions or more Principiae experiments?" />
    </Presentation>
  );
}

export default App;
