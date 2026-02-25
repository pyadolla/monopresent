import React from "react";

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
  return (
    <Presentation bibUrl="/references.bib">
      <OverviewSlide
        title="Principiae Theme Sandbox"
        section="Overview"
      >
        <div className="mt-10 text-lg">
          Theme: <b>principiae</b> with core animation primitives
          ({m`\texttt{timeline},\ \texttt{AnimateSVG},\ \texttt{Morph}`}).
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
              Display math helper: {M`x_{t+1} = f_\theta(x_t)`}
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

      <QuestionSlide title="Questions or more Principiae experiments?" />
    </Presentation>
  );
}

export default App;
