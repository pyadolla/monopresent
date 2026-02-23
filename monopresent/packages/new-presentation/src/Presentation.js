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
            <div className="h-full grid grid-cols-2 gap-8 items-center">
              <List step={step}>
                <Item>All-atom structure prediction directly from sequence.</Item>
                <Item>SE(3)-equivariant iterative refinement over coarse-grained nodes.</Item>
                <Item>No MSA and no protein language model embeddings.</Item>
                <Item>Fast enough for high-throughput design loops.</Item>
              </List>
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
              Narrative: EquiFold targets the practical speed-accuracy gap. Mention this slide as the thesis:
              all-atom quality, simpler inputs, and throughput-oriented inference.
            </Notes>
          </>
        )}
      </Slide>

      <Slide header="Why This Problem Matters" steps={[1, 2, 3, 4, 5]}>
        {(step) => (
          <>
            <div className="h-full grid grid-cols-2 gap-8 items-center">
              <ul>
                <Show when={step >= 1}>
                  <Item>Fast sequence-to-structure inference is the bottleneck for many real experimental loops.</Item>
                </Show>
                <Show when={step >= 2}>
                  <Item>In practice this enables:</Item>
                </Show>
                <div className="ml-6 mt-1">
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
                <Show when={step >= 5}>
                  <Item>Callout: EquiFold Section 1 (Introduction).</Item>
                </Show>
              </ul>
              <div className="h-full p-3 flex flex-col items-center justify-center">
                <Show when={step >= 2}>
                  <div className="w-56 -mt-8">
                    <img
                      src="/assets/custom/library-triage-biorender.png"
                      alt="Library triage example"
                      className="w-full h-[7.5rem] object-contain rounded"
                    />
                    <div className="mt-0 text-[11px] text-gray-300 text-center">Library triage</div>
                  </div>
                </Show>

                <div className="w-full flex items-start justify-center gap-20 mt-8">
                  <Show when={step >= 3}>
                    <div className="w-56">
                      <img
                        src="/assets/custom/antibody-prioritization-biorender.png"
                        alt="Antibody variant prioritization example"
                        className="w-full h-[7.5rem] object-contain rounded"
                      />
                      <div className="mt-0 text-[11px] text-gray-300 text-center">Variant prioritization</div>
                    </div>
                  </Show>

                  <Show when={step >= 4}>
                    <div className="w-56">
                      <img
                        src="/assets/custom/pre-wetlab-checks-biorender.png"
                        alt="Pre wet-lab sanity check example"
                        className="w-full h-[7.5rem] object-contain rounded"
                      />
                      <div className="mt-0 text-[11px] text-gray-300 text-center">Pre-wet-lab sanity checks</div>
                    </div>
                  </Show>
                </div>
              </div>
            </div>
            <Notes>
              <div>
                <div><b>Library triage</b></div>
                <ul style={{ marginTop: 6, marginBottom: 10, paddingLeft: 20 }}>
                  <li>Run fast structure prediction on a large candidate set.</li>
                  <li>Keep a small top subset for expensive downstream experiments.</li>
                </ul>

                <div><b>How ML tools filter with EquiFold outputs</b></div>
                <ul style={{ marginTop: 6, marginBottom: 10, paddingLeft: 20 }}>
                  <li>RFdiffusion: generate backbones; keep candidates where EquiFold preserves intended scaffold/motif geometry.</li>
                  <li>ProteinMPNN: filter by sequence-backbone compatibility on EquiFold-predicted structures.</li>
                  <li>AlphaFold/ESMFold: cross-model confirmation via agreement and confidence.</li>
                  <li>Task-specific predictors: filter by binding and developability properties.</li>
                </ul>

                <div><b>Takeaway</b></div>
                <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 20 }}>
                  <li>EquiFold speed makes this multi-model filtering loop practical at scale.</li>
                </ul>
              </div>
            </Notes>
          </>
        )}
      </Slide>

      <Slide header="Prior Approaches" steps={[1, 2, 3, 4, 5, 6, 7, 8, 9]}>
        {(step) => (
          <>
            <div className="h-full flex flex-col">
              <div>
                <Show when={step >= 1}>
                  <Item className="text-green mb-2">
                    Models like AlphaFold, RoseTTAFold, OmegaFold, and ESMFold represent backbone geometry as nodes
                    with Euclidean transforms, then iteratively refine those transforms per structure-model block.
                  </Item>
                </Show>
                <div className="ml-6 mt-2 space-y-2">
                  <Show when={step >= 2}>
                    <div>- Side-chains are often implicit until final torsion-angle prediction.</div>
                  </Show>
                  <Show when={step >= 3}>
                    <div className={step >= 8 ? "inline-block border border-white rounded px-2 py-1" : ""}>
                      - This can make side-chain 3D interactions harder to learn (e.g., clash avoidance).
                    </div>
                  </Show>
                </div>
              </div>

              <div className="mt-12">
                <Show when={step >= 4}>
                  <Item className="text-green mb-2">
                    Methods such as ProteinMPNN, inverse folding from predicted structures (Hsu et al.), and Rosetta-style
                    approaches use coarse-grained representations: each residue is modeled by one/few nodes positioned
                    from atom coordinates.
                  </Item>
                </Show>
                <div className="ml-6 mt-2 space-y-2">
                  <Show when={step >= 5}>
                    <div>- Improves efficiency for predictive tasks (e.g., interacting/functional residue prediction).</div>
                  </Show>
                  <Show when={step >= 6}>
                    <div>- Useful for generative tasks (e.g., backbone scaffold generation).</div>
                  </Show>
                  <Show when={step >= 7}>
                    <div className={step >= 8 ? "inline-block border border-white rounded px-2 py-1" : ""}>
                      - Tradeoff: often loses all-atom detail needed for design/packing and function-relevant signals.
                    </div>
                  </Show>
                </div>
              </div>

              <Show when={step >= 9}>
                <div className="mt-8">
                  <Box title="How EquiFold Addresses This">
                    EquiFold introduces a novel coarse-grained representation that retains all-atom resolution. Side-chain
                    degrees of freedom are modeled explicitly in 3D space (rather than only as intrinsic torsion angles),
                    which makes geometry and interaction modeling easier in 3D.
                  </Box>
                </div>
              </Show>
            </div>
            <Notes>
              <div>
                <div><b>Source basis</b></div>
                <ul style={{ marginTop: 6, marginBottom: 10, paddingLeft: 20 }}>
                  <li>This slide is a direct paraphrase of Section 2 (Related Work), first two paragraphs.</li>
                </ul>
                <div><b>Bridge to next slides</b></div>
                <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 20 }}>
                  <li>Next, show how EquiFold addresses this: explicit 3D side-chain DOFs in a CG representation.</li>
                </ul>
              </div>
            </Notes>
          </>
        )}
      </Slide>

      <SectionSlide section="Equiformer Background" />

      <Slide header="Equiformer in One Slide" steps={[1, 2, 3]}>
        {(step) => (
          <>
            <div className="flex flex-col gap-10">
              <div className="grid grid-cols-2 gap-10">
                <div className="flex flex-col items-center gap-4">
                  <Show when={step >= 1}>
                    <h3 className="text-[1.75rem] leading-tight text-green text-center">
                      SE(3)-Equivariant Graph Transformer for 3D Atomistic Graphs
                    </h3>
                  </Show>
                  <Show when={step >= 1}>
                    <img
                      src="/assets/equiformer/equi_arch.svg"
                      alt="Equiformer architecture"
                      className="h-auto"
                      style={{ width: "35%" }}
                    />
                  </Show>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Show when={step >= 2}>
                    <h3 className="text-[1.75rem] leading-tight text-green text-center">
                      Core attention change: MLP attention plus non-linear message passing.
                    </h3>
                  </Show>
                  <Show when={step >= 2}>
                    <img
                      src="/assets/equiformer/equi_attn.svg"
                      alt="Equiformer equivariant attention"
                      className="h-auto"
                      style={{ width: "35%" }}
                    />
                  </Show>
                </div>
              </div>
            </div>
            <Show when={step >= 3}>
              <div className="mt-8">
                <h3 className="text-[1.85rem] leading-tight text-center text-green">
                  Equivariant Transformer blocks on irreps features.
                </h3>
              </div>
            </Show>
            <Notes>
              <div>
                <div><b>Purpose of this slide</b></div>
                <ul style={{ marginTop: 6, marginBottom: 10, paddingLeft: 20 }}>
                  <li>Give only the minimum background needed for EquiFold architecture choices.</li>
                </ul>
                <div><b>Speaker emphasis</b></div>
                <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 20 }}>
                  <li>Equiformer contributes the equivariant Transformer block design.</li>
                  <li>Do not spend long on benchmark details here.</li>
                </ul>
              </div>
            </Notes>
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
