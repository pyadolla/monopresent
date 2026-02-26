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

const eqfOverview1SvgStep = {
  txt_seq_title: { css: { fill: "#dce6f5" } },
  txt_seq_sub1: { css: { fill: "#b7c7dc" } },
  txt_seq_sub2: { css: { fill: "#b7c7dc" } },
  txt_cg_title1: { css: { fill: "#dce6f5" } },
  txt_cg_title2: { css: { fill: "#dce6f5" } },
  txt_cg_sub: { css: { fill: "#b7c7dc" } },
  txt_tpl_title: { css: { fill: "#dce6f5" } },
  txt_tpl_math: { css: { fill: "#a8c8ff" } },
  txt_tpl_atoms: { css: { fill: "#b7c7dc" } },
  txt_tpl_sub: { css: { fill: "#b7c7dc" } },
};

const eqfOverview2SvgStep = {
  eq2_math_init: { css: { fill: "#a8c8ff" } },
  eq2_math_in: { css: { fill: "#a8c8ff" } },
  eq2_math_update: { css: { fill: "#a8c8ff" } },
  eq2_math_out: { css: { fill: "#a8c8ff" } },
  eq2_math_iter: { css: { fill: "#a8c8ff" } },
};

const eqfOverview3SvgStep = {
  eq3_math_in: { css: { fill: "#a8c8ff" } },
  eq3_math_geom: { css: { fill: "#a8c8ff" } },
  eq3_math_no_delta: { css: { fill: "#a8c8ff" } },
  eq3_math_out: { css: { fill: "#a8c8ff" } },
  eq3_math_delta: { css: { fill: "#a8c8ff" } },
  eq3_math_s: { css: { fill: "#a8c8ff" } },
  eq3_math_k: { css: { fill: "#a8c8ff" } },
  eq3_outer_k: { css: { fill: "#a8c8ff" } },
};

const eqfOverview4SvgStep = {
  eq4_math_rt: { css: { fill: "#a8c8ff" } },
  eq4_math_xv: { css: { fill: "#a8c8ff" } },
  eq4_math_merge: { css: { fill: "#a8c8ff" } },
  text36: { css: { fontSize: "9px" } },
  text37: { css: { fontSize: "9px" } },
};

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

const dualEquationTimeline = timeline`
left_eq          vvvvv
right_eq         hhvvh
right_next_layer hhhhv
right_eq_next    vvvvv
`;

const dualEquationLeftFrames = [
  "$x_t$",
  "$x_t + \\Delta x$",
  "$x_t + \\Delta x$",
  "$x_t + \\Delta x$",
  "$x_t + \\Delta x$",
];

const dualEquationRightFrames = [
  "$y_t$",
  "$y_t$",
  "$y_t$",
  "$y_t + \\Delta y$",
  "$y_t + \\Delta y$",
];

const dualEquationRightReplacement = "$\\hat{y}_{t+1}=f_\\theta(y_t)$";

const dualEquationSteps = dualEquationTimeline.map((s, i) => ({
  left_eq: {
    ...s.left_eq,
    seconds: 0.55,
  },
  right_eq: {
    ...s.right_eq,
    seconds: 0.55,
  },
  right_eq_next: {
    ...s.right_eq_next,
    seconds: 0.6,
  },
  right_next_layer: {
    ...s.right_next_layer,
    x: i === 4 ? 0 : 220,
    opacity: i === 4 ? 1 : 0,
    seconds: 0.6,
  },
  "text:left_eq": dualEquationLeftFrames[i],
  "text:right_eq": dualEquationRightFrames[i],
  "text:right_eq_next": dualEquationRightReplacement,
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
            <ul className="space-y-6">
              <Show when={step >= 1}>
                <div>
                  <Item className="text-green">EquiFold adopts Equiformer-style equivariant sub-blocks.</Item>
                  <ul className="list-none ml-8 mt-2 space-y-1">
                    <li>- These blocks preserve rotational and translational symmetries during updates.</li>
                  </ul>
                  <div className="ml-6 -mt-8 -mb-8">
                    <img
                      src="/assets/equiformer/equivariance-subblock-simple.svg"
                      alt="Equivariance schematic for reused Equiformer-style sub-blocks"
                      style={{ width: "56%" }}
                    />
                  </div>
                </div>
              </Show>
              <Show when={step >= 2}>
                <div>
                  <Item className="text-green">It reuses Equiformer-style 3D message passing where spherical harmonics and tensor products make node updates geometry-aware and equivariant.</Item>
                  <ul className="list-none ml-8 mt-2 space-y-1">
                    <li>- This enables geometry-aware feature exchange between coarse-grained nodes.</li>
                  </ul>
                </div>
              </Show>
              <Show when={step >= 3}>
                <div>
                  <Item className="text-green">It integrates these blocks into iterative structure refinement.</Item>
                  <ul className="list-none ml-8 mt-2 space-y-1">
                    <li>- Each block predicts transform updates that progressively improve all-atom structure.</li>
                  </ul>
                  <div className="ml-8 mt-0">
                    <Box title="Refinement Update">
                      {M`(t_i^{(k+1)}, R_i^{(k+1)}) = (t_i^{(k)} + \Delta t_i^{(k)}, \Delta R_i^{(k)} R_i^{(k)})`}
                    </Box>
                  </div>
                </div>
              </Show>
              <Show when={step >= 4}>
                <Item>Callout: EquiFold Appendix A.2 and Equiformer Figure 1.</Item>
              </Show>
            </ul>
            <Notes>One line to emphasize: architecture reuse plus a protein-specific representation change.</Notes>
          </>
        )}
      </Slide>

      <SectionSlide section="EquiFold Method" />

      <Slide header="EquiFold Architecture Overview" steps={[1, 2, 3, 4]}>
        {(step) => (
          <>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
              <div>
                <Show when={step >= 1}>
                  <Item className="text-green">Input sequence is mapped to residue-specific coarse-grained node types, each with a fixed local atom template {m`x^0`}.</Item>
                </Show>
              </div>
              <div className="-mt-4">
                <Show when={step >= 1}>
                  <AnimateSVG
                    src="/assets/equifold/eqf-overview-1-cg-templates.svg"
                    step={eqfOverview1SvgStep}
                    width="100%"
                    style={{ width: "100%" }}
                  />
                </Show>
              </div>

              <div className="-mt-6">
                <Show when={step >= 2}>
                  <Item className="text-green">Node transforms {m`(R_i, T_i)`} are initialized (identity/zero or random), then each refinement block takes {m`(R_i^{(k)},T_i^{(k)})`} and outputs updated transforms.</Item>
                </Show>
              </div>
              <div className="-mt-10">
                <Show when={step >= 2}>
                  <AnimateSVG
                    src="/assets/equifold/eqf-overview-2-init-refine.svg"
                    step={eqfOverview2SvgStep}
                    width="100%"
                    style={{ width: "100%" }}
                  />
                </Show>
              </div>

              <div className="-mt-6">
                <Show when={step >= 3}>
                  <div>
                    <Item className="text-green">Inside each block, stacked equivariant sub-blocks update node feature representations {m`h_i^{(k,s)} \rightarrow h_i^{(k,s+1)}`} using current geometry {m`(R^{(k)},T^{(k)})`}.</Item>
                    <div className="ml-8 mt-0 text-[1.1rem] text-gray-300">No transform update is produced at intermediate sub-blocks; {m`(\Delta R_i,\Delta T_i)`} is predicted only once by the block head after the final sub-block.</div>
                  </div>
                </Show>
              </div>
              <div className="-mt-10">
                <Show when={step >= 3}>
                  <AnimateSVG
                    src="/assets/equifold/eqf-overview-3-block-update.svg"
                    step={eqfOverview3SvgStep}
                    width="100%"
                    style={{ width: "100%" }}
                  />
                </Show>
              </div>

              <div className="mt-4">
                <Show when={step >= 4}>
                  <div>
                    <Item className="text-green">Final all-atom coordinates are decoded by transforming each node's local template into global space, then merging shared atoms across nodes.</Item>
                    <div className="ml-8 mt-0 text-[1.2rem]">
                      {m`x_a=\sum_{v\in\mathcal{V}(a)}w_{av}\left(R_vx^{0}_{av}+T_v\right)`}
                    </div>
                  </div>
                </Show>
              </div>
              <div className="mt-2">
                <Show when={step >= 4}>
                  <AnimateSVG
                    src="/assets/equifold/eqf-overview-4-reconstruct.svg"
                    step={eqfOverview4SvgStep}
                    width="100%"
                    style={{ width: "100%" }}
                  />
                </Show>
              </div>
            </div>
            <Notes>
              Keep this slide architectural and linear: representation - iterative refinement - transform updates - all-atom decode.
            </Notes>
          </>
        )}
      </Slide>

      <Slide header="Novel Coarse-Grained Representation" steps={[1, 2, 3, 4, 5, 6, 7]}>
        {(step) => (
          <>
            <div className="grid grid-cols-2 gap-8 items-start">
              <ul>
                <Show when={step >= 1}>
                  <Item className="text-green">Residues are decomposed into residue-specific rigid node templates.</Item>
                </Show>
                <div className="ml-6 mt-1 space-y-1">
                  <Show when={step >= 2}>
                    <div>- For residue {m`r`}, use a fixed node set {m`\mathcal{V}(r)`} with local template atoms {m`x^0_{v,a}`}. </div>
                  </Show>
                  <Show when={step >= 3}>
                    <div>- Each node encodes local orientation and side-chain geometry explicitly in 3D.</div>
                  </Show>
                  <Show when={step >= 3}>
                    <div>
                      - Example pair (LYS, GLU): both share backbone-overlap nodes (
                      <span style={{ color: "#49d65a" }}>C,CA,CB</span>,
                      <span style={{ color: "#3f6bff" }}>N</span>) and (
                      <span style={{ color: "#49d65a" }}>C,CA</span>,
                      <span style={{ color: "#ff5a5a" }}>O</span>).
                    </div>
                  </Show>
                  <Show when={step >= 3}>
                    <div>
                      - They then differ by side-chain nodes (e.g., LYS: (
                      <span style={{ color: "#49d65a" }}>CB,CG,CD</span>), (
                      <span style={{ color: "#49d65a" }}>CD,CE</span>,
                      <span style={{ color: "#3f6bff" }}>NZ</span>); GLU: (
                      <span style={{ color: "#49d65a" }}>CG,CD</span>,
                      <span style={{ color: "#ff5a5a" }}>OE1,OE2</span>)).
                    </div>
                  </Show>
                </div>

                <Show when={step >= 4}>
                  <Item className="text-green mt-4">Node geometry is rigid; only global transforms are predicted.</Item>
                </Show>
                <div className="ml-6 mt-1 space-y-1">
                  <Show when={step >= 5}>
                    <div>- Per-node atom proposals are generated by rigid transforms:</div>
                  </Show>
                  <Show when={step >= 5}>
                    <div className="ml-6 text-[1.1rem]">{m`x_{a\leftarrow v}=R_vx^0_{v,a}+T_v`}</div>
                  </Show>
                </div>

                <Show when={step >= 6}>
                  <Item className="text-green mt-4">Overlapping node proposals are merged into all-atom coordinates.</Item>
                </Show>
                <div className="ml-6 mt-1 space-y-1">
                  <Show when={step >= 7}>
                    <div>- Shared atoms are averaged across contributing nodes:</div>
                  </Show>
                  <Show when={step >= 7}>
                    <div className="ml-6 text-[1.1rem]">{m`x_a=\sum_{v\in\mathcal{V}(a)}w_{av}\,x_{a\leftarrow v},\ \sum_{v\in\mathcal{V}(a)}w_{av}=1`}</div>
                  </Show>
                </div>
              </ul>

              <div className="h-full flex items-start justify-center">
                <Show when={step >= 3}>
                  <div className="flex flex-col items-center">
                    <img
                      src="/assets/equifold/out-000.png"
                      alt="EquiFold coarse-grained residue-node example"
                      className="w-[30rem] max-w-full rounded"
                    />
                    <div className="mt-2 text-[0.9rem] text-gray-300">
                      (a) <span style={{ color: "#c792ea" }}>Lysine</span>, (b) <span style={{ color: "#f7b267" }}>Phenylalanine</span>, (c) <span style={{ color: "#5aa7ff" }}>Isoleucine</span>, (d) <span style={{ color: "#ff7a7a" }}>Glutamate</span>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
            <Notes>
              Emphasize novelty: coarse-graining for efficiency, but with rigid local all-atom templates so side-chain geometry is still explicit.
            </Notes>
          </>
        )}
      </Slide>

      <Slide header="Forward and Reverse CG Mappings" steps={[1, 2, 3, 4, 5, 6]}>
        {(step) => (
          <>
            <div className="grid grid-cols-2 gap-8 items-start">
              <ul>
                <Show when={step >= 1}>
                  <Item className="text-green">Forward map {m`F`} converts all-atom residue coordinates into CG node identities and per-node Euclidean transforms.</Item>
                </Show>
                <div className="ml-6 mt-1 space-y-1">
                  <Show when={step >= 2}>
                    <div>- For residue {m`a_i`}, produce {m`\{(c^{a_i}_j, T^{a_i}_j)\}_{j=1}^{N_{CG}(a_i)}`}, where {m`T=(t,R)`}.</div>
                  </Show>
                  <Show when={step >= 2}>
                    <div>- CG node templates are fixed in local coordinates {m`x^0_{v,a}`}; only {m`(R_v,t_v)`} vary per structure.</div>
                  </Show>
                </div>

                <Show when={step >= 3}>
                  <Item className="text-green mt-4">Reverse map {m`G`} reconstructs all-atom coordinates from transformed node templates.</Item>
                </Show>
                <div className="ml-6 mt-1 space-y-1">
                  <Show when={step >= 4}>
                    <div>- Each contributing node proposes an atom position:</div>
                  </Show>
                  <Show when={step >= 4}>
                    <div className="ml-6 text-[1.1rem]">{m`x_{a\leftarrow v}=R_vx^0_{v,a}+t_v`}</div>
                  </Show>
                </div>

                <Show when={step >= 5}>
                  <Item className="text-green mt-4">Atoms shared across nodes are merged by weighted averaging.</Item>
                </Show>
                <div className="ml-6 mt-1 space-y-1">
                  <Show when={step >= 6}>
                    <div className="ml-6 text-[1.1rem]">{m`x_a=\sum_{v\in\mathcal{V}(a)}w_{av}\,x_{a\leftarrow v},\qquad \sum_{v\in\mathcal{V}(a)}w_{av}=1`}</div>
                  </Show>
                </div>
              </ul>

              <div className="h-full flex items-start justify-center">
                <Show when={step >= 1}>
                  <img
                    src="/assets/equifold/forward-reverse-cg.svg"
                    alt="Forward and reverse coarse-grained mapping schematic"
                    className="w-[32rem] max-w-full rounded"
                  />
                </Show>
              </div>
            </div>
            <Notes>Key point: train/predict in CG transform space, then decode to all atoms via reverse mapping and overlap merge.</Notes>
          </>
        )}
      </Slide>

      <Slide header="Geometric Features and Equivariant Updates" steps={[1, 2, 3, 4, 5, 6, 7]}>
        {(step) => (
          <>
            <ul>
              <Show when={step >= 1}>
                <Item className="text-green">Each CG node carries geometric tensor features across irreducible degrees {m`l=0,\dots,l_{max}`}. </Item>
              </Show>
              <div className="ml-6 mt-1 space-y-1">
                <Show when={step >= 2}>
                  <div>- For degree {m`l`}, each channel transforms as an SO(3) irrep with {m`2l+1`} components.</div>
                </Show>
                <Show when={step >= 2}>
                  <div>- Total features per node are organized by {m`(l, c)`} blocks rather than Cartesian xyz coordinates.</div>
                </Show>
              </div>

              <Show when={step >= 3}>
                <Item className="text-green mt-4">Rotation-equivariant embedding is implemented via Wigner-{m`D`} transforms.</Item>
              </Show>
              <div className="ml-6 mt-1 space-y-1">
                <Show when={step >= 4}>
                  <div>- Initial embedding for node type {m`c^{a_i}_j`} and rotation {m`R^{a_i}_j`}:</div>
                </Show>
                <Show when={step >= 4}>
                  <div className="ml-6 text-[1.1rem]">{m`e^{a_i}_j=D(R^{a_i}_j)\cdot \mathrm{LOOKUP}(c^{a_i}_j)`}</div>
                </Show>
              </div>

              <Show when={step >= 5}>
                <Item className="text-green mt-4">Each block updates node transforms with equivariant rotation/translation increments.</Item>
              </Show>
              <div className="ml-6 mt-1 space-y-1">
                <Show when={step >= 6}>
                  <div className="ml-6 text-[1.1rem]">{m`R_{new}=R'R_{in},\qquad t_{new}=t'+t_{in}`}</div>
                </Show>
                <Show when={step >= 7}>
                  <div>- Intermediate sub-blocks update embeddings; the final sub-block outputs the {m`l=1`} vectors used for {m`(R',t')`}. </div>
                </Show>
              </div>
            </ul>
            <Notes>Emphasize separation of roles: sub-blocks update equivariant features; block output head turns final l=1 vectors into transform updates.</Notes>
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
              <Item>Reported metrics include all-atom RMSD and {m`C_{\alpha}`} RMSD.</Item>
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
              <Item>{m`C_{\alpha}`} RMSD spans roughly 0.43-1.76 A.</Item>
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

      <Slide header="Sandbox: Two Equations (AnimateSVG + Timeline)" steps={range(dualEquationSteps.length)}>
        {(step) => (
          <div className="h-full flex flex-col justify-center">
            <AnimateSVG
              src="/figures/two-equations-timeline.svg"
              step={dualEquationSteps[step]}
              style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
            />
            <div className="mt-6 text-sm text-gray-300">
              {[
                "Step 1: left equation appears.",
                "Step 2: left equation morphs.",
                "Step 3: right equation appears (no sweep).",
                "Step 4: right equation morphs.",
                "Step 5: right equation is replaced by a new one sweeping in from the right.",
              ][step]}
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Sandbox: Plain Sentences via List/Item Overrides" steps={[1, 2, 3]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-8">
            <Box title="Approach 1: Keep List/Item, Override Styling">
              <List
                step={step}
                style={{
                  listStyleType: "none",
                  paddingLeft: 0,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                <Item style={{ fontWeight: 400 }}>This is regular sentence text with no bullet.</Item>
                <Item style={{ fontWeight: 400 }}>Reveal still works using the theme step mechanism.</Item>
                <Item style={{ fontWeight: 400 }}>No leading dash or marker is rendered.</Item>
              </List>
            </Box>
            <div className="text-sm text-gray-300">
              Uses theme List/Item step behavior, but styled to look like plain paragraph lines.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Sandbox: Plain Sentences via Show + p" steps={[0, 1, 2]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-8">
            <Box title="Approach 2: Plain Elements + Show">
              <div className="space-y-4 text-base font-normal">
                <Show when={step >= 0}>
                  <p style={{ fontWeight: 400, margin: 0 }}>
                    This is regular sentence text with no bullet and no item styling.
                  </p>
                </Show>
                <Show when={step >= 1}>
                  <p style={{ fontWeight: 400, margin: 0 }}>
                    Each sentence reveals by step using Show conditions.
                  </p>
                </Show>
                <Show when={step >= 2}>
                  <p style={{ fontWeight: 400, margin: 0 }}>
                    This is the cleanest option when you want pure paragraph-style reveals.
                  </p>
                </Show>
              </div>
            </Box>
            <div className="text-sm text-gray-300">
              Uses only plain paragraph tags and Show visibility conditions.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Sandbox: Equation Sweep-In (Right to Center)" steps={[0, 1, 2]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-8">
            <Box title="Equation Entry Motion">
              <div
                style={{
                  transform: step >= 1 ? "translateX(0)" : "translateX(42vw)",
                  opacity: step >= 1 ? 1 : 0,
                  transition: "transform 600ms ease, opacity 600ms ease",
                  willChange: "transform, opacity",
                }}
              >
                <Morph display>{String.raw`s_\theta(x,t) \approx \nabla_x \log p_t(x)`}</Morph>
              </div>
            </Box>
            <div className="text-sm text-gray-300">
              Step 1: off-screen right. Step 2+: swept into center.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Sandbox: Sweep-In + Box Overlay (No Equation Shift)" steps={[0, 1, 2]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-8">
            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  transform: step >= 1 ? "translateX(0)" : "translateX(42vw)",
                  opacity: step >= 1 ? 1 : 0,
                  transition: "transform 600ms ease, opacity 600ms ease",
                  willChange: "transform, opacity",
                  zIndex: 2,
                }}
              >
                <Morph display>{String.raw`s_\theta(x,t) \approx \nabla_x \log p_t(x)`}</Morph>
              </div>

              <Box
                title="Equation Entry Motion"
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: step >= 2 ? 1 : 0,
                  transition: "opacity 300ms ease",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                <div />
              </Box>
            </div>
            <div className="text-sm text-gray-300">
              Step 1: sweep equation in. Step 3: fade in package Box overlay.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Sandbox: Fade-Under + SVG Overlay Arrow" steps={[0, 1]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-8">
            <Box title="Layered Emphasis Demo" style={{ width: "100%", maxWidth: 980, margin: "0 auto" }}>
              <div
                style={{
                  position: "relative",
                  minHeight: 240,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    opacity: step >= 1 ? 0.08 : 1,
                    transition: "opacity 450ms ease",
                  }}
                >
                  <div className="text-xl font-semibold">Initial content block</div>
                  <div className="mt-2 text-base">
                    This paragraph and sketch fade to near-transparent while new markup is overlaid.
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      width: 150,
                      height: 90,
                      border: "2px solid #9ca3af",
                      borderRadius: 6,
                      position: "relative",
                    }}
                  >
                    <div style={{ position: "absolute", left: 12, top: 18, width: 36, height: 2, background: "#9ca3af" }} />
                    <div style={{ position: "absolute", left: 46, top: 24, width: 2, height: 28, background: "#9ca3af" }} />
                    <div style={{ position: "absolute", left: 74, top: 52, width: 46, height: 2, background: "#9ca3af" }} />
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: step >= 1 ? 1 : 0,
                    transition: "opacity 450ms ease",
                    pointerEvents: "none",
                  }}
                >
                  <svg width="340" height="130" viewBox="0 0 340 130" aria-hidden="true">
                    <defs>
                      <marker id="overlay-arrow-head" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#00D56F" />
                      </marker>
                    </defs>
                    <path
                      d="M20 100 C 120 20, 220 20, 320 90"
                      fill="none"
                      stroke="#00D56F"
                      strokeWidth="8"
                      markerEnd="url(#overlay-arrow-head)"
                    />
                  </svg>
                </div>
              </div>
            </Box>
            <div className="text-sm text-gray-300">
              Step 1: original content. Step 2: original fades underneath and SVG arrow overlays on top.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Sandbox: Whole Box Fade + SVG Overlay Arrow" steps={[0, 1]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-8">
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 980,
                margin: "0 auto",
                minHeight: 300,
              }}
            >
              <div
                style={{
                  opacity: step >= 1 ? 0.08 : 1,
                  transition: "opacity 450ms ease",
                }}
              >
                <Box title="Whole Box Fades" style={{ width: "100%" }}>
                  <div className="text-xl font-semibold">Initial content block</div>
                  <div className="mt-2 text-base">
                    In this variant, the entire Box container and everything inside it become nearly transparent.
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      width: 170,
                      height: 90,
                      border: "2px solid #9ca3af",
                      borderRadius: 6,
                      position: "relative",
                    }}
                  >
                    <div style={{ position: "absolute", left: 14, top: 18, width: 40, height: 2, background: "#9ca3af" }} />
                    <div style={{ position: "absolute", left: 54, top: 24, width: 2, height: 32, background: "#9ca3af" }} />
                    <div style={{ position: "absolute", left: 84, top: 56, width: 56, height: 2, background: "#9ca3af" }} />
                  </div>
                </Box>
              </div>

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: step >= 1 ? 1 : 0,
                  transition: "opacity 450ms ease",
                  pointerEvents: "none",
                }}
              >
                <svg width="360" height="140" viewBox="0 0 360 140" aria-hidden="true">
                  <defs>
                    <marker id="overlay-arrow-head-whole-box" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#00D56F" />
                    </marker>
                  </defs>
                  <path
                    d="M24 112 C 124 24, 236 24, 336 96"
                    fill="none"
                    stroke="#00D56F"
                    strokeWidth="8"
                    markerEnd="url(#overlay-arrow-head-whole-box)"
                  />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-300">
              Step 1: full Box visible. Step 2: entire Box fades underneath and SVG arrow overlays on top.
            </div>
          </div>
        )}
      </Slide>

      <Slide header="Sandbox: Two Boxes + Mid Text + Top-to-Bottom Arrow" steps={[0, 1]}>
        {(step) => (
          <div className="h-full flex flex-col justify-center gap-8">
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 980,
                margin: "0 auto",
                minHeight: 520,
              }}
            >
              <div
                style={{
                  opacity: step >= 1 ? 0.08 : 1,
                  transition: "opacity 500ms ease",
                }}
              >
                <Box title="Top Box: Source State" style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
                  <div className="text-base">
                    Source features and assumptions live here before propagation.
                  </div>
                </Box>

                <div className="text-center mt-8 mb-8 text-lg">
                  Intermediate narrative text between source and target boxes.
                </div>

                <Box title="Bottom Box: Target State" style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
                  <div className="text-base">
                    Target outputs and checks appear here after transition.
                  </div>
                </Box>
              </div>

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: step >= 1 ? 1 : 0,
                  transition: "opacity 500ms ease",
                  pointerEvents: "none",
                }}
              >
                <svg width="420" height="470" viewBox="0 0 420 470" aria-hidden="true">
                  <defs>
                    <marker id="overlay-arrow-head-two-box" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#00D56F" />
                    </marker>
                  </defs>
                  <path
                    d="M210 55 C 210 150, 210 300, 210 415"
                    fill="none"
                    stroke="#00D56F"
                    strokeWidth="9"
                    markerEnd="url(#overlay-arrow-head-two-box)"
                  />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-300">
              Step 1: two boxes + middle text visible. Step 2: all fades underneath and overlay arrow connects top to bottom.
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
