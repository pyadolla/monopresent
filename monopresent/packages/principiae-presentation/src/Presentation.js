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

function App() {
  useEffect(() => {
    // Opt-in only in this sandbox while validating metadata-driven baseline.
    setLaTeXBaselineMetadataMode(true);
    return () => setLaTeXBaselineMetadataMode(false);
  }, []);

  return (
    <Presentation bibUrl="/references.bib">
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

      <QuestionSlide title="Questions or more Principiae experiments?" />
    </Presentation>
  );
}

export default App;
