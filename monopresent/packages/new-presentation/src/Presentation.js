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
      transform: s.left.opacity === 1 ? "scale(1.08)" : "scale(1)",
      transformOrigin: "center",
      transformBox: "fill-box",
    },
  },
  middle: {
    ...s.middle,
    css: {
      transform: s.middle.opacity === 1 ? "scale(1.08)" : "scale(1)",
      transformOrigin: "center",
      transformBox: "fill-box",
    },
  },
  right: {
    ...s.right,
    css: {
      transform: s.right.opacity === 1 ? "scale(1.08)" : "scale(1)",
      transformOrigin: "center",
      transformBox: "fill-box",
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
        transformBox: "fill-box",
      },
    },
    middle: {
      ...middleRest,
      css: {
        transform: `scale(${middleScale})`,
        transformOrigin: "center",
        transformBox: "fill-box",
      },
    },
    right: {
      ...rightRest,
      css: {
        transform: `scale(${rightScale})`,
        transformOrigin: "center",
        transformBox: "fill-box",
      },
    },
    arrow_lm: {
      ...s.arrow_lm,
      opacity: s.arrow_lm.drawSVG === 0 ? 0 : 1,
    },
    arrow_mr: {
      ...s.arrow_mr,
      opacity: s.arrow_mr.drawSVG === 0 ? 0 : 1,
    },
    "text:left_label": ["$x_0$", "$x_0$", "$x_t$", "$x_t$", "$x_t$", "$x_0$"][i],
    "text:middle_label": ["$x_t$", "$f_\\theta$", "$z_t$", "$z_t$", "$f_\\theta$", "$x_t$"][i],
    "text:right_label": ["$x_0$", "$x_0$", "$x_0$", "$x_{t-1}$", "$x_{t-1}$", "$x_0$"][i],
  };
});

const textEdgeCasesSteps = [
  { plain: "$x_0$", tspan: "$x_t$" },
  { plain: "$x_{t-1}$", tspan: "$\\mu_t$" },
  { plain: "$\\nabla_x \\log p_t$", tspan: "$s_t$" },
  { plain: "$\\alpha_t x_0$", tspan: "$\\hat{x}_0$" },
].map(({ plain, tspan }) => ({
  "text:plain_label": plain,
  "text:tspan_label": tspan,
}));

function App() {
  return (
    <Presentation bibUrl="/references.bib">
      <TitleSlide
        title="EquiFold: Fast, Equivariant All-Atom Protein Structure Prediction"
        names="Payman Yadollahpour"
        names2="Genentech"
        date="February 23, 2026"
      />

      <TableOfContentsSlide header="Outline" />

      <SectionSlide section="Motivation and Context" />

      <Slide header="EquiFold: Main Takeaway" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>EquiFold predicts all-atom structures from sequence with SE(3)-equivariant refinement.</Item>
              <Item>It uses a new coarse-grained representation with explicit side-chain geometry in 3D.</Item>
              <Item>It does not require MSA or protein language model embeddings.</Item>
              <Item>Callout: EquiFold Abstract.</Item>
            </List>
            <Notes>Open with one sentence: this is a speed-plus-accuracy structure predictor for design workflows.</Notes>
          </>
        )}
      </Slide>

      <Slide header="Why This Problem Matters" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Protein engineering pipelines need structure calls at high throughput.</Item>
              <Item>Input preparation and large models can dominate runtime.</Item>
              <Item>Hard regions like mini-proteins and CDR-H3 loops are high value.</Item>
              <Item>Callout: EquiFold Section 1 (Introduction).</Item>
            </List>
            <Notes>Frame this as an operations problem: throughput, latency, and hard targets.</Notes>
          </>
        )}
      </Slide>

      <Slide header="Positioning vs Prior Pipelines" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Prior pipelines are accurate but often costly at screening scale.</Item>
              <Item>MSA/LM dependencies add preprocessing and system complexity.</Item>
              <Item>EquiFold simplifies the input stack while keeping all-atom outputs.</Item>
              <Item>Callout: EquiFold Table 2 runtime row.</Item>
            </List>
            <Notes>Keep this neutral: not "better in all cases," but a better point on the speed-accuracy curve.</Notes>
          </>
        )}
      </Slide>

      <SectionSlide section="Equiformer Background" />

      <Slide header="Equiformer in One Slide" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Equiformer is an equivariant graph Transformer for 3D atomistic graphs.</Item>
              <Item>It uses irreps features and tensor-product-based equivariant operations.</Item>
              <Item>Its graph attention uses MLP attention with non-linear messages.</Item>
              <Item>Callout: Equiformer Figure 1 and Tables 6-7.</Item>
            </List>
            <Notes>Only set context here. Detailed Equiformer results are not the main story.</Notes>
          </>
        )}
      </Slide>

      <Slide header="What EquiFold Reuses from Equiformer" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>EquiFold adopts Equiformer-style equivariant sub-blocks.</Item>
              <Item>It reuses 3D message passing with spherical harmonics and tensor products.</Item>
              <Item>It integrates these blocks into iterative structure refinement.</Item>
              <Item>Callout: EquiFold Appendix A.2 and Equiformer Figure 1.</Item>
            </List>
            <Notes>One line to emphasize: architecture reuse plus a protein-specific representation change.</Notes>
          </>
        )}
      </Slide>

      <SectionSlide section="EquiFold Method" />

      <Slide header="EquiFold Architecture Overview" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Sequence input is mapped to coarse-grained nodes.</Item>
              <Item>Node transforms are initialized and iteratively refined.</Item>
              <Item>Refinement blocks are SE(3)-equivariant.</Item>
              <Item>Callout: EquiFold Section 3.3.</Item>
            </List>
            <Notes>Walk left-to-right through pipeline. Avoid implementation detail on this slide.</Notes>
          </>
        )}
      </Slide>

      <Slide header="Novel Coarse-Grained Representation" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Each residue is partitioned into predefined rigid coarse-grained nodes.</Item>
              <Item>Node rules enforce full atom coverage and bonded consistency.</Item>
              <Item>Nodes preserve orientation information for 3D updates.</Item>
              <Item>Callout: EquiFold Figure 1 and Table 3.</Item>
            </List>
            <Notes>This is the main novelty slide. Slow down and make the representation intuition clear.</Notes>
          </>
        )}
      </Slide>

      <Slide header="Forward and Reverse CG Mappings" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Forward map: atoms to node identity plus transform {m`(t, R)`}.</Item>
              <Item>Reverse map: transformed templates back to atom coordinates.</Item>
              <Item>Shared atoms are merged by averaging node-derived coordinates.</Item>
              <Item>Callout: EquiFold Section 3.1.</Item>
            </List>
            <Notes>Mention this is what enables all-atom output while training in CG transform space.</Notes>
          </>
        )}
      </Slide>

      <Slide header="Geometric Features and Equivariant Updates" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Node features are geometric tensors across degrees {m`l=0...l_{max}`}. </Item>
              <Item>Wigner-D transforms maintain rotation equivariance.</Item>
              <Item>Each block predicts translation and rotation updates.</Item>
              <Item>Callout: EquiFold Sections 3.2-3.3.</Item>
            </List>
            <Notes>Say "equivariance is built in, not learned as an afterthought."</Notes>
          </>
        )}
      </Slide>

      <Slide header="Training Objective and Scale" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Losses: FAPE plus structure-violation regularization.</Item>
              <Item>Both losses are applied at every refinement block.</Item>
              <Item>Model sizes: 2.30M (mini-proteins), 7.38M (antibodies).</Item>
              <Item>Callout: EquiFold Table 4.</Item>
            </List>
            <Notes>Connect this slide to efficiency claims: small models, practical runtime.</Notes>
          </>
        )}
      </Slide>

      <SectionSlide section="Experiments and Results" />

      <Slide header="Experiment 1: De Novo Mini-Proteins" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Benchmark covers four mini-protein fold families.</Item>
              <Item>Reported metrics include all-atom RMSD and {m`C_\alpha`} RMSD.</Item>
              <Item>Average inference speed is ~0.03 seconds per sequence.</Item>
              <Item>Callout: EquiFold Section 4.1 and Table 1.</Item>
            </List>
            <Notes>Position this as a stress test for compact designed structures.</Notes>
          </>
        )}
      </Slide>

      <Slide header="Mini-Protein Results: Key Numbers" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>All-atom RMSD spans roughly 1.00-2.20 A across folds.</Item>
              <Item>{m`C_\alpha`} RMSD spans roughly 0.43-1.76 A.</Item>
              <Item>Visual overlays show close topology and packing agreement.</Item>
              <Item>Callout: EquiFold Figure 2 and Table 1.</Item>
            </List>
            <Notes>Point to one good and one harder fold to keep the discussion balanced.</Notes>
          </>
        )}
      </Slide>

      <Slide header="Experiment 2: Antibody Structures" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Antibody data is curated from SAbDab/PDB with time-based test separation.</Item>
              <Item>Metrics are reported by framework and CDR regions, including CDR-H3.</Item>
              <Item>Baselines include AlphaFold-Multimer and IgFold.</Item>
              <Item>Callout: EquiFold Section 4.2 and Table 2.</Item>
            </List>
            <Notes>Emphasize that this benchmark targets flexible and practical therapeutic regions.</Notes>
          </>
        )}
      </Slide>

      <Slide header="Antibody Results: Accuracy + Throughput" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>Backbone RMSD is competitive across framework and loop regions.</Item>
              <Item>Mean all-atom RMSD is 1.52 A on the test set.</Item>
              <Item>Runtime is about 1 second per antibody on one A100 GPU.</Item>
              <Item>Callout: EquiFold Figure 3 and Table 2.</Item>
            </List>
            <Notes>Deliver the comparison line crisply: ~1s vs ~1min vs ~1hr from the paper table.</Notes>
          </>
        )}
      </Slide>

      <SectionSlide section="Conclusions and Next Steps" />

      <Slide header="Conclusions and Open Directions" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <List step={step}>
              <Item>EquiFold pairs explicit CG geometry with equivariant iterative refinement.</Item>
              <Item>It achieves a practical speed-accuracy profile on focused design benchmarks.</Item>
              <Item>Current scaling bottleneck is quadratic message passing on large systems.</Item>
              <Item>Callout: EquiFold Section 5 (Conclusion and Future Work).</Item>
            </List>
            <Notes>Close with where this fits in a design stack and what you plan to test next.</Notes>
          </>
        )}
      </Slide>

      <SectionSlide section="Appendix: Sandbox / Practice Slides" />

      <SectionSlide section="Sandbox / Debug Slides" />

      <Slide header="Sandbox: Timeline + AnimateSVG" steps={range(pipelineSteps.length)}>
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

      <Slide header="Sandbox: Complex Timeline (Custom Map + DrawSVG)" steps={range(complexPipelineSteps.length)}>
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

      <Slide header="Sandbox: Text Edge Cases (Centered Labels + tspan)" steps={range(textEdgeCasesSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <AnimateSVG
              src="/figures/text-edge-cases.svg"
              step={textEdgeCasesSteps[step]}
              style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
            />
            <div className="mt-6 text-sm text-gray-300">
              Step {step + 1}: validates plain text and tspan replacement paths with centered label anchors.
            </div>
          </div>
        )}
      </Slide>

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
