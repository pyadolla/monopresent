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
              <Item>
                EquiFold predicts all-atom protein structures from sequence with an SE(3)-equivariant model.
              </Item>
              <Item>
                It uses a novel coarse-grained representation with explicit side-chain geometry in 3D.
              </Item>
              <Item>
                It avoids MSA and protein language model embeddings at inference.
              </Item>
              <Item>
                Result: strong accuracy with much faster inference for targeted protein design use cases.
              </Item>
            </List>
          </>
        )}
      </Slide>

      <Slide header="Why This Problem Matters" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>Protein design workflows need structure predictions at high throughput.</Item>
            <Item>Many methods are slowed by expensive input preparation and large models.</Item>
            <Item>Small designed proteins and flexible antibody loops remain difficult regions.</Item>
            <Item>Practical systems need speed, atomic detail, and robust geometry.</Item>
          </List>
        )}
      </Slide>

      <Slide header="Positioning vs Prior Pipelines" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>AlphaFold-style systems are highly accurate but often heavy for screening-scale use.</Item>
            <Item>Language-model/MSA dependencies can complicate production workflows.</Item>
            <Item>EquiFold aims to simplify the input stack while preserving all-atom fidelity.</Item>
            <Item>This work focuses on difficult, high-value subsets: mini-proteins and antibodies.</Item>
          </List>
        )}
      </Slide>

      <SectionSlide section="Equiformer Background" />

      <Slide header="Equiformer in One Slide" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>Equiformer is an equivariant graph attention Transformer for 3D atomistic graphs.</Item>
            <Item>It represents features as irreducible representations (irreps) with equivariant operations.</Item>
            <Item>It introduces equivariant graph attention with MLP attention + non-linear message passing.</Item>
            <Item>It reports competitive performance across QM9, MD17, and OC20.</Item>
          </List>
        )}
      </Slide>

      <Slide header="What EquiFold Reuses from Equiformer" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>SE(3)-equivariant block design and geometric tensor processing.</Item>
            <Item>Tensor-product-based message passing over 3D neighborhoods.</Item>
            <Item>Transformer-style iterative refinement stack adapted for structure prediction.</Item>
            <Item>EquiFold customizes this around a protein-specific coarse-grained representation.</Item>
          </List>
        )}
      </Slide>

      <SectionSlide section="EquiFold Method" />

      <Slide header="EquiFold Architecture Overview" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>Input: amino acid sequence.</Item>
            <Item>Initialize coarse-grained nodes with random transforms.</Item>
            <Item>Apply multiple SE(3)-equivariant refinement blocks.</Item>
            <Item>Reverse-map CG nodes to all-atom coordinates.</Item>
          </List>
        )}
      </Slide>

      <Slide header="Novel Coarse-Grained Representation" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>Each residue is decomposed into predefined CG nodes.</Item>
            <Item>Node definitions cover all atoms and preserve local bonded structure.</Item>
            <Item>Each node has enough atoms to define a rigid-body orientation in 3D.</Item>
            <Item>This keeps all-atom resolution while reducing modeling complexity.</Item>
          </List>
        )}
      </Slide>

      <Slide header="Forward and Reverse CG Mappings" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>
              Forward map: atom coordinates to CG node identities + Euclidean transforms {m`(t, R)`}.
            </Item>
            <Item>Reverse map: reconstruct atom coordinates from transformed node templates.</Item>
            <Item>Atoms represented by multiple nodes are aggregated by averaging.</Item>
            <Item>This creates an end-to-end differentiable structure pipeline.</Item>
          </List>
        )}
      </Slide>

      <Slide header="Geometric Features and Equivariant Updates" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>Each node gets geometric tensor features across degrees {m`l=0...l_{max}`}. </Item>
            <Item>Embeddings are rotated via Wigner-D matrices to preserve equivariance.</Item>
            <Item>Each block predicts translation and rotation updates per node.</Item>
            <Item>Iterative updates refine structure with symmetry-respecting dynamics.</Item>
          </List>
        )}
      </Slide>

      <Slide header="Training Objective and Scale" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>Losses: Frame Aligned Point Error (FAPE) + structure violation loss.</Item>
            <Item>Loss terms are computed on outputs from each refinement block.</Item>
            <Item>Mini-protein model: 2.30M parameters.</Item>
            <Item>Antibody model: 7.38M parameters.</Item>
          </List>
        )}
      </Slide>

      <SectionSlide section="Experiments and Results" />

      <Slide header="Experiment 1: De Novo Mini-Proteins" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>Dataset from four fold families: {m`\alpha\alpha\alpha,\ \alpha\beta\beta\alpha,\ \beta\alpha\beta\beta,\ \beta\beta\alpha\beta\beta`}.</Item>
            <Item>Focuses on challenging compact designed proteins.</Item>
            <Item>Reported per-fold all-atom RMSD and {m`C_\alpha`} RMSD.</Item>
            <Item>Average inference speed reported as ~0.03 seconds per sequence.</Item>
          </List>
        )}
      </Slide>

      <Slide header="Mini-Protein Results: Key Numbers" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>Representative all-atom RMSD by fold: 1.00-2.20 A.</Item>
            <Item>Representative {m`C_\alpha`} RMSD by fold: 0.43-1.76 A.</Item>
            <Item>Examples show good performance even with moderate train-set sequence similarity.</Item>
            <Item>Demonstrates learned topology + atomic placement at very high speed.</Item>
          </List>
        )}
      </Slide>

      <Slide header="Experiment 2: Antibody Structures" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>Training data curated from SAbDab/PDB; benchmarked on post-cutoff antibody test set.</Item>
            <Item>Evaluation emphasizes framework + CDR regions including hard CDR-H3 loops.</Item>
            <Item>Compared against AlphaFold-Multimer and IgFold backbone RMSD metrics.</Item>
            <Item>Also reports all-atom RMSD and practical inference time.</Item>
          </List>
        )}
      </Slide>

      <Slide header="Antibody Results: Accuracy + Throughput" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>Backbone RMSD is competitive across heavy/light chain framework and CDR regions.</Item>
            <Item>All-atom RMSD reported as 1.52 A on the test set average.</Item>
            <Item>Inference is ~1 second per antibody on a single A100 GPU.</Item>
            <Item>Runtime comparison in paper table: ~1 second vs ~1 minute (IgFold) vs ~1 hour (AF-Multimer).</Item>
          </List>
        )}
      </Slide>

      <SectionSlide section="Conclusions and Next Steps" />

      <Slide header="Conclusions and Open Directions" steps={[1, 2, 3, 4]}>
        {(step) => (
          <List step={step}>
            <Item>EquiFold combines explicit 3D side-chain-aware CG modeling with equivariant refinement.</Item>
            <Item>It achieves strong accuracy-speed tradeoffs on targeted protein design benchmarks.</Item>
            <Item>Main technical limitation: quadratic complexity in message passing for larger proteins.</Item>
            <Item>Future directions: broader protein coverage, stronger physical priors, and generative integration.</Item>
          </List>
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
