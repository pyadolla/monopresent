import React from "react";

import {
  AnimateSVG,
  Morph,
  m,
  M,
  Show,
  Notes,
  Portal,
  timeline,
  range,
  themes,
} from "../../immersion-presentation/src";

const {
  Presentation,
  Slide,
  BibliographySlide,
  TitleSlide,
  TableOfContentsSlide,
  SectionSlide,
  QuestionSlide,
  List,
  Item,
  Cite,
  Box,
} = themes.modern;

const equationFrames = [
  String.raw`p_\theta(x_0) = \int p_\theta(x_0\mid z) p(z)\,\mathrm{d}z`,
  String.raw`\nabla_x \log p_t(x)`,
  String.raw`s_\theta(x,t) \approx \nabla_x \log p_t(x)`,
];

const pipelineTimeline = timeline`
left   v v p h
middle h p v v
right  h h p v
`;

const pipelineSteps = pipelineTimeline.map((s, i) => ({
  left: {
    ...s.left,
    css: {
      transform:
        s.left.opacity === 1 ? "scale(1.08) translate(-6px, -6px)" : "scale(1)",
      transformOrigin: "center",
    },
  },
  middle: {
    ...s.middle,
    css: {
      transform:
        s.middle.opacity === 1 ? "scale(1.08) translate(-6px, -6px)" : "scale(1)",
      transformOrigin: "center",
    },
  },
  right: {
    ...s.right,
    css: {
      transform:
        s.right.opacity === 1 ? "scale(1.08) translate(-6px, -6px)" : "scale(1)",
      transformOrigin: "center",
    },
  },
  "text:left_label": i < 2 ? "$x_0$" : "$x_t$",
  "text:middle_label": i < 2 ? "$x_t$" : "$s_\\theta(x_t,t)$",
  "text:right_label": i < 3 ? "$x_{t-1}$" : "$x_0$",
}));

const complexPipelineTimeline = timeline`
left     a a p h h v ${{ a: { opacity: 1, scale: 1.08 }, p: { opacity: 0.35, scale: 1.02 } }}
middle   h a a p h v ${{ a: { opacity: 1, scale: 1.08 }, p: { opacity: 0.35, scale: 1.02 } }}
right    h h a a p v ${{ a: { opacity: 1, scale: 1.08 }, p: { opacity: 0.35, scale: 1.02 } }}
arrow_lm d D D D d D
arrow_mr d d d D D D
`;

const complexPipelineSteps = complexPipelineTimeline.map((s, i) => {
  const { scale: leftScale = 1, ...leftRest } = s.left;
  const { scale: middleScale = 1, ...middleRest } = s.middle;
  const { scale: rightScale = 1, ...rightRest } = s.right;

  return {
    left: {
      ...leftRest,
      css: {
        transform: `scale(${leftScale})`,
        transformOrigin: "center",
      },
    },
    middle: {
      ...middleRest,
      css: {
        transform: `scale(${middleScale})`,
        transformOrigin: "center",
      },
    },
    right: {
      ...rightRest,
      css: {
        transform: `scale(${rightScale})`,
        transformOrigin: "center",
      },
    },
    arrow_lm: s.arrow_lm,
    arrow_mr: s.arrow_mr,
    "text:left_label": ["$x_0$", "$x_0$", "$x_t$", "$x_t$", "$x_t$", "$x_0$"][i],
    "text:middle_label": ["$x_t$", "$f_\\theta$", "$z_t$", "$z_t$", "$f_\\theta$", "$x_t$"][i],
    "text:right_label": ["$x_0$", "$x_0$", "$x_0$", "$x_{t-1}$", "$x_{t-1}$", "$x_0$"][i],
  };
});

function App() {
  return (
    <Presentation bibUrl="/references.bib">
      <TitleSlide
        title="New Immersion Deck"
        names="Your Name"
        names2="Team / Organization"
        date="February 19, 2026"
      />

      <TableOfContentsSlide header="Outline" />

      <SectionSlide section="Core Authoring APIs" />

      <Slide header="Step-Based Authoring" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>
                Compose with theme components: {m`\texttt{Slide},\ \texttt{List},\ \texttt{Item}`}
              </Item>
              <Item>
                Gate content by step using {m`\texttt{Show}`}: <Show when={step > 1}><b>now visible</b></Show>
              </Item>
              <Item>
                Add presenter-only notes with {m`\texttt{Notes}`}
              </Item>
              <Item>
                Add section/header metadata for navigation and progress
              </Item>
            </List>
            <Notes>
              This slide demonstrates the core authoring loop: define <b>steps</b>, reveal content progressively,
              and keep speaker detail in notes.
            </Notes>
          </>
        )}
      </Slide>

      <Slide header="Morphing Math" steps={[0, 1, 2]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-8">
            <Box title="Morph">
              <Morph display>{equationFrames[step]}</Morph>
            </Box>
            <div>
              <Item>
                Inline helpers still work during transitions: {m`\alpha_t x_0 + \sigma_t\epsilon`}
              </Item>
              <Item>
                Display helper: {M`x_t \sim \mathcal{N}(\alpha_t x_0, \sigma_t^2 I)`}
              </Item>
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Timeline + AnimateSVG" steps={range(pipelineSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <AnimateSVG
              src="/figures/pipeline.svg"
              step={pipelineSteps[step]}
              style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
            />
            <div className="mt-6 text-sm text-gray-300">
              Step {step + 1}: timeline-driven state mapping for SVG ids and label text.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Complex Timeline (Custom Map + DrawSVG)" steps={range(complexPipelineSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <AnimateSVG
              src="/figures/pipeline.svg"
              step={complexPipelineSteps[step]}
              style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
            />
            <div className="mt-6 text-sm text-gray-300">
              Step {step + 1}: custom tokens (a/p), multi-node sequencing, and connector draw animations (d/D).
            </div>
          </div>
        )}
      </Slide>

      <SectionSlide section="Transitions and References" />

      <Slide header="Portal Transition (Zoom In)">
        <div className="h-full flex items-center justify-center">
          <Portal zoomin>
            <Box title="Focus Region" className="text-center" style={{ width: 480 }}>
              This region is marked for a portal zoom transition into the next slide.
            </Box>
          </Portal>
        </div>
      </Slide>

      <Slide header="Portal Transition (Zoom Out)">
        <div className="h-full grid grid-cols-2 gap-8 items-center">
          <Portal zoomout>
            <Box title="Focused Content">
              <List step={3}>
                <Item>Portal links transitions between neighboring slides.</Item>
                <Item>Use it to move from overview to detail views.</Item>
                <Item>Works with normal slide stepping and theming.</Item>
              </List>
            </Box>
          </Portal>
          <Box title="References">
            This deck cites diffusion work <Cite id="song2021scorebased" /> and DDPM <Cite id="ho2020ddpm" />.
          </Box>
        </div>
      </Slide>

      <BibliographySlide />
      <QuestionSlide title="Questions?" />
    </Presentation>
  );
}

export default App;
