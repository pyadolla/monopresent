import React from "react";

/* eslint-disable jsx-a11y/iframe-has-title, jsx-a11y/alt-text,  */
/* eslint-disable no-unused-vars */

import { useState, useEffect } from "react";

import {
  AnimateSVG,
  Morph,
  m,
  mOffset,
  M,
  Show,
  Notes,
  Portal,
  timeline,
  range,
  themes,
} from "../../immersion-presentation/src";

import { TestSource } from './TestSource';
// import "immersion-presentation/src/index.css";
import step from "immersion-presentation/src/step.macro";
// import step from "./step.macro";
const YOFF = '-0.9em';
// import { useIsCurrentlyVisible } from "immersion-presentation"
const {
  Presentation,
  Slide,
  BibliographySlide,
  TitleSlide,
  TableOfContentsSlide,
  SectionSlide,
  QuestionSlide,
  ConclusionSlide,
  Figure,
  List,
  Item,
  Cite,
  Box,
  Qed,
  useIsCurrentlyVisible
} = themes.modern;


function StepMessage({ step, steps }) {
  const visible = useIsCurrentlyVisible(step, steps)

  useEffect(() => {
    if (visible) {
      // debugger // only triggers when visible
    }
  }, [visible])

  return <>{visible && `The step is ${step}`}</>
}


const children = ['\\g1{E}\\g2{=}\\g3{mc}^{\\g5{2}}', '\\frac{\\g1{\\partial E}}{\\g1{\\partial c}}\\g2{=}\\g5{2}\\g3{mc}']
const children0 = ['E=mc^{2}', '\\frac{\\partial E}{\\partial c}= 2mc']

const forwardsde = ['\\D \\mathbf{x} = \\g1{\\mathbf{f}(\\mathbf{x},t)}\\D t + \\g2{g(t)}\\D \\mathbf{w}',
  '\\D \\mathbf{x} = \\g1{-\\frac{1}{2}\\beta_t\\mathbf{x}}\\D t + \\g2{\\sqrt{\\beta_t}}\\D \\mathbf{w}'
]

const reversesde = ['\\D \\overset{\\leftarrow}{\\mathbf{x}} = [\\g3{\\mathbf{f}(\\overset{\\leftarrow}{\\mathbf{x}},t)}-\\g4{g^2(t)}\\g5{\\nabla_{\\mathbf{x}} \\log p_t(\\overset{\\leftarrow}{\\mathbf{x}})]\\D t + }\\g6{g(t)}\\g7{\\D B_t}',
  '\\D \\overset{\\leftarrow}{\\mathbf{x}} = [\\g3{-\\frac{1}{2}\\beta_t\\overset{\\leftarrow}{\\mathbf{x}}}-\\g4{\\beta_t}\\g5{\\nabla_{\\mathbf{x}} \\log p_t(\\overset{\\leftarrow}{\\mathbf{x}})]\\D t + }\\g6{\\sqrt{\\beta_t}}\\g7{\\D B_t}',
]

const loss = ['\\g8{\\log p(\\mathbf{x}_0)} \\g{10}{\\geq} \\g6{-\\frac{1}{2}} \\g1{\\mathbb{E}_{p(t)}}\\g9{\\mathbb{E}_{p(\\mathbf{x}_t|\\mathbf{x}_0)}} \\g4{\\Big[}\\g3{\\lambda(t)}\\g2{\\left\\Vert s_\\theta(\\mathbf{x}_t,t) - \\nabla_{\\mathbf{x}} \\log p_{0t}(\\mathbf{x}_t\\;|\\;\\mathbf{x}_0)\\right\\Vert_2^2}\\g5{\\Big]}',
  '\\g8{\\theta^*} \\g{10}{=} \\arg\\min\\limits_\\theta \\g1{\\mathbb{E}_{p(t)}} \\left\\{\\g3{\\lambda(t)}\\g7{\\mathbb{E}_{p(\\mathbf{x}_0)}}\\g9{\\mathbb{E}_{p(\\mathbf{x}_t|\\mathbf{x}_0)}}\\g4{\\Big[}\\g2{\\left\\Vert s_\\theta(\\mathbf{x}_t,t) - \\nabla_{\\mathbf{x}} \\log p_{0t}(\\mathbf{x}_t\\;|\\;\\mathbf{x}_0)\\right\\Vert_2^2}\\g5{\\Big]}\\right\\}'
]

const ssteps =
  [
    {
      'text:mytspan': '$z$',
      'mytspan': { css: { 'transform': 'scale(1.0)', 'transform-origin': 'center', 'fill': '#000000' } }
    },
    {
      'text:mytspan': '$c$',
      'mytspan': { css: { 'transform': 'translate(0px,0px)' } }
    }
  ]

const axissteps =
  [
    {
      "text:xaxis": "$z$", "text:yaxis": "$q$",
      'xaxis': { css: { 'transform': 'scale(1.0)', 'transform-origin': 'center', 'fill': '#FFFFFF' }, opacity: 1 }
    },
    {
      "text:xaxis": "$a$", "text:yaxis": "$b$",
      'xaxis': { opacity: 0 }
      // 'xaxis': { css: { 'transform': 'scale(2.0) translateX(1pt)', 'transform-origin': 'center', 'fill': '#FF0000' }, opacity: 0 }
    },
  ]

const sdestep =
  [
    { "reversegroup": { opacity: 0, duration: 0.3 }, "scorebox": { opacity: 0, duration: 0.3 } },
    { "reversegroup": { opacity: 1, duration: 0.3 }, "scorebox": { opacity: 1, duration: 0.3 } }
  ]

const forwardbackstep =
  [
    {
      "forwardsdeeq": { css: { 'transform': 'scale(0.65) translate(22.5pt, 53.5pt)' } },
      "reversesdeeq": { css: { 'transform': 'scale(0.65) translate(45pt, 54.5pt)' } }
    }
  ]

const torsionstep =
  [
    {
      "dihedrals": { opacity: 0 },
      "sidechains": { opacity: 0 },
    },
    {
      "dihedrals": { opacity: 1 },
      "sidechains": { opacity: 0 },
    },
    {
      "dihedrals": { opacity: 1 },
      "sidechains": { opacity: 1 },
    }
  ]

const atomstep =
  [
    { "positions": { opacity: 0 } },
    { "positions": { opacity: 1 } }
  ]
function App() {
  // return (
  //   <div>
  //     <TestSource />
  //   </div>
  // );
  return (
    <Presentation>
      <TitleSlide title="De Novo Protein Design & Diffusion Models" subtitle="" names="Payman Yadollahpour" date="July 9, 2025"></TitleSlide>
      {/* <TableOfContentsSlide></TableOfContentsSlide> */}
      <SectionSlide section="Score Matching & Denoising Diffusion"></SectionSlide>
      <TitleSlide title="Goal of Score-Based Diffusion Models"></TitleSlide>
      <Slide steps={[1, 2]}>
        <List step={step}>
          <Item name={<span className="text-green">Objective</span>}>
            <List>To model complex data distributions {m`p_{data}(x)`} by learning to reverse a gradual noising process — transforming noise back into data.</List>
          </Item>

          <Item name={<span className="text-green">Key Ideas</span>}>
            <List>
              <Item>Transform data {m`x_0 \sim p_{data}`} into noise via a <i>forward SDE</i>
                <Figure>
                  <img src="/figures/dognoising.svg" style={{ display: "block", margin: "0 auto", width: '75%' }} />
                </Figure>
              </Item>

              <Item>Learn to reverse this process by estimating the <i>score function</i>: {M`s_{\theta}(x,t) \approx \nabla_x \log p_t(x)`}
                <Figure>
                  <img src="/figures/reversedognoising.svg" style={{ display: "block", margin: "0 auto", width: '75%' }} />
                </Figure>
              </Item>
              <Item> Sampling is done by simulating a <i>reverse-time SDE</i> using this learned score</Item>
            </List>
          </Item>
        </List>
        <Notes>
          The <b>objective of diffusion models</b> is to construct a <b>generative model</b> that lets us <b>sample from a complex data distribution</b> (e.g., images, molecules, proteins) by starting from a <b>simple prior</b> and <b>denoising</b> through learned transitions.
        </Notes>
      </Slide>

      <TitleSlide title="Langevin Dynamics"></TitleSlide>
      <Slide steps={[1, 2, 3, 4, 5, 6, 7, 8]}>
        <Item name={<span className="text-green">Langevin Dynamics</span>}></Item>
        <List step={step}>
          <Item> Defined by a <i>time-homogenous</i> SDE:
            {M`\D X_t = -\frac{1}{2} \nabla U(X_t)\D t +\sigma \D B_t`}</Item>
          <List>
            <Item name="-"> The <i>drift</i> {m`-\frac{1}{2} \nabla U(X_t)`} depends only on {m`X_t`}, <i>not</i> on {m`t`}</Item>
            <Item name="-"> The <i>diffusion</i> coefficient {m`\sigma`} is a constant</Item>
            <Item name="-"> Therefore, the dynamics are <i>stationary</i>: they don't change over time</Item>
          </List>
          <Item> The system has a <i>stationary distribution</i>:
            {M`p_{inv}(x) \propto e^{-U(x)/\sigma^2}`}</Item>
          <Item name="→"> Marginal distribution {m`p(x,t |x_0)`} <i>converges</i> to this stationary distribution as {m`t\rightarrow \infty`}</Item>
        </List>
        <Show when={step > 4}>
          <Item name={<span className="text-green">Generalized Langevin-like SDEs (e.g. VP SDE)...</span>}></Item>
          We often write time-dependent SDEs in a <i>Langevin-style form</i>, even though they are <i>not</i> strictly Langevin dynamics:
          {M`dX_t = -\frac{1}{2}\nabla U_t(X_t) \D t + \sigma_t \D B_t`}
        </Show>
        <List step={step - 5}>
          <Item> Here, both {m`U_t(X_t)`} <i>and</i> {m`\sigma_t`} depend on time</Item>
          <Item> This makes the process <i>time-inhomogenous</i></Item>
          <Item> So it's <i>not</i> Langevin in the strict sense (no stationary distribution), but we borrow the terminology to describe the <i>form</i> of the dynamics</Item>
        </List>
        <Notes>An SDE describes how a system evolves due to both: <br />

          1. Deterministic flow along a vector field (drift), and <br />

          2. Random perturbations from Brownian motion (diffusion).<br />

          This dual influence makes SDEs the right tool for modeling noisy, uncertain dynamics—like in generative modeling and physics.
        </Notes>
      </Slide>

      <TitleSlide title="Forward SDEs in Diffusion Models"></TitleSlide>
      <Slide steps={[1, 2, 3]}>
        <List step={step}>
          <Item name={<span className="text-green">General Forward SDE (Itô Form)</span>}>
            {M`\D X_t = f(x,t)\D t + g(t) \D B_t`}
            <List>
              <Item><i>Drift</i> {m`f(x,t)`}: pulls samples toward simpler solutions</Item>
              <Item><i>Diffusion</i> {m`g(t)`}: injects noise</Item>
              <Item>Initial condition: {m`X_0 \sim p_{data}`}</Item>
              <Item>Are <i>not</i> Langevin dynamics: both drift and diffusion are <i>time-dependent</i></Item>
            </List>
          </Item>
          <Item name={<span className="text-green">Drift</span>}>
            {m`f(x,t)`} determines the <i>deterministic trend</i> or <i>average direction of motion</i> of the process {m`X_t`}.
            <List>
              <Item>Think of it as the velocity field that the process would follow in the <i>absence of noise</i></Item>
              <Item>Suppose {m`x\in \mathbb{R}^d`}</Item>
              <Item>Then the drift {m`f(x,t) \in \mathbb{R}^d`} -- a <i>vector at each point</i> {m`x`} and time {m`t`}</Item>
              <Item>The function {m`f(\cdot,t)`} defines a <i>vector field</i> over {m`\mathbb{R}^d`}</Item>
              <br />
              <Show when={step > 2}>
                <Item name={<span className="text-green">Vector field interpretation</span>}>
                  At every point {m`x`}, the vector {m`f(x,t)`} tells you:
                  <List>
                    <Item name="-"> The <i>direction</i> in which the process wants to move</Item>
                    <Item name="-"> The rate at which it tends to move in that direction (when averaged over noise)</Item>
                  </List>
                  So the drift defines a <i>flow</i> -- a deterministic path you'd follow if you removed the noise from the SDE
                </Item>
              </Show>
            </List>
          </Item>
        </List>
        <Notes>
          The forward SDE in diffusion models describes the progressive corruption of data into noise, typically by injecting Gaussian noise in a way that’s analytically or numerically tractable. <br /><br />
          It’s the starting point for defining the reverse process, which is the generative model. <br /><br />
          This forward process defines the marginal distribution {m`p(x_t|x_0)`}, which is used during training.
        </Notes>
      </Slide>

      <Slide steps={[1, 2, 3, 4]}>
        <div className="fixed top-0 right-0 z-50"
          style={{ width: '660px', transform: 'scale(0.75)', transformOrigin: 'top right' }}>
          <Box title="" smallTitle
            className="w-fit"
            style={{ textAlign: 'center' }}>
            <span className="text-green text-xs block">Forward SDE:</span>
            {M`\D X_t = \boxed{f(x,t)} \D t + g(t) \D B_t`}
            <span className="text-green text-xs block">Langevin Drift:</span>
            <div className='pr-2' style={{ textAlign: 'left' }}>
              {M`f(x) = -\frac{1}{2}\nabla U(x)`}
              <List>
                <Item className="text-xs">Derived from potential function {m`U(x)`}</Item>
                <Item className="text-xs">Pushes particles <i>downhill</i> on the energy landscape {m`U`}</Item>
              </List>
            </div>
            <span className="text-green text-xs block">VP (Variance Preserving) SDE:</span>
            <div className='pr-2' style={{ textAlign: 'left' }}>
              {M`f(x,t) = -\frac{1}{2}\beta(t)x`}
              <List>
                <Item className="text-xs">A <i>linear vector field</i> pulling toward zero</Item>
                <Item className="text-xs">Strength of pull changes with {m`t`}</Item>
              </List>
            </div>
            <span className="text-green text-xs block">VE (Variance Exploding) SDE:</span>
            <div className='pr-2' style={{ textAlign: 'left' }}>
              {M`f(x,t) = 0`}
              <List>
                <Item className="text-xs"><i>No drift term</i></Item>
                <Item className="text-xs">Process evolves <i>purely by noise</i></Item>
                <Item className="text-xs"><i>No deterministic force</i> pulling toward or away from anything</Item>
              </List>
            </div>

            <figure className="flex flex-col items-center origin-top"
              style={{ 'transform': 'scale(0.8)' }}>
              <AnimateSVG
                src="/figures/driftvf.svg"
                width="100%"
                // step={atomstep[step]}
                style={{ width: "90%", maxWidth: "700px" }}
              />
              <figcaption className="mt-2 text-sm text-gray-400 italic text-center">
                VP-style Drift Field: {m`f(\mathbf{x}) = -\frac{1}{2}\mathbf{x}`}
              </figcaption>
            </figure>
          </Box>
        </div>
        <div className="pl-0 pr-60 text-justify">
          <Item name={<span className="text-green">Properties of the Drift Field</span>}>
            <List step={step}>
              <Item name={<><u>Time-dependence</u>:</>}>
                <List>
                  <Item>In general, {m`f(x,t)`} can vary with time</Item>
                  <Item>If <i>time-independent</i>, the vector field is static (as in Langevin dynamics)</Item>
                  <Item> If <i>time-dependent</i>, the vector field evolves (as in VP SDE)</Item>
                </List>
              </Item>
              <Item name={<><u>Linearity</u> (in some cases):</>}>
                <List>
                  <Item> Example: VP SDE drift is linear in {m`x`}: {m`f(x,t) = -\frac{1}{2}\beta(t)x`}
                  </Item>
                  <Item>This gives a <i>contractive vector field</i>: vectors always point toward the origin</Item>
                </List>
              </Item>
              <Item name={<><u>Smoothness</u>:</>}>
                <List>
                  <Item> Usually assumed to be <i>Lipschitz continuous</i> to ensure solutions exist and are unique</Item>
                </List>
              </Item>
              <Item name={<><u>Divergence</u>:</>}>
                <List>
                  <Item> The <i>divergence</i> {m`\nabla \cdot f(x,t)`} tells you if the field is compressing or expanding volume</Item>
                  <Item> For example, if {m`\nabla \cdot f < 0`}, the trajectories tend to concentrate (e.g., toward a mode)</Item>
                </List>
              </Item>
            </List>
          </Item >
        </div>
      </Slide >

      <Slide>
        <div className="fixed top-0 right-0 z-50"
          style={{ width: '640px', transform: 'scale(0.75)', transformOrigin: 'top right' }}>
          <Box title="" smallTitle
            className="w-fit"
            style={{ textAlign: 'center', }}>
            <span className="text-green text-xs block">Forward SDE:</span>
            <div className='pr-2' style={{ textAlign: 'left' }}>
              {M`\D X_t = f(x,t) \D t + \boxed{g(x,t)} \D B_t`}
              <List>
                <Item className="text-xs"> {m`g(x,t)`} can be:
                  <List>
                    <Item>Scalar: {m`\sigma(t)`}, or</Item>
                    <Item>Matrix-valued: anisotropic noise</Item>
                  </List>
                </Item>
                <Item className="text-xs"><i>Time-dependent or not</i></Item>
              </List>
            </div>

            <span className="text-green text-xs block">Langevin Dynamics:</span>
            <div className='pr-2' style={{ textAlign: 'left' }}>
              {M`g = \sigma`}
              <List>
                <Item className="text-xs">Interpretation:
                  <List>
                    <Item className="text-xs"> Fixed level of uncertainty</Item>
                    <Item className="text-xs"> Equilibrium between deterministic drift and stochastic diffusion</Item>
                  </List>
                </Item>
              </List>
            </div>
            <span className="text-green text-xs block">VP (Variance Preserving) SDE:</span>
            <div className='pr-2' style={{ textAlign: 'left' }}>
              {M`g(t) = \sqrt{\beta(t)}`}
              <List>
                <Item className="text-xs"><i>Time-dependent</i>, isotropic</Item>
                <Item className="text-xs">Starts small, grows slowly</Item>
                <Item className="text-xs">Designed so that variance increases in controlled "preserving" way</Item>
                <Item className="text-xs">Still retains signal in early steps</Item>
              </List>
            </div>
            <span className="text-green text-xs block">VE (Variance Exploding) SDE:</span>
            <div className='pr-2' style={{ textAlign: 'left' }}>
              {M`g(t) = \sigma(t)`}
              <List>
                <Item className="text-xs"><i>No drift</i> ({m`f(x,t)=0`}), only diffusion</Item>
                <Item className="text-xs">{m`\sigma(t)`} is <i>increasing rapidly</i> with time</Item>
                <Item className="text-xs">Noise dominates, causing the variance to <i>explode</i></Item>
              </List>
            </div>
          </Box>
        </div>

        <div className="pl-0 pr-60 text-justify">
          <Item name={<span className="text-green">What is the Diffusion Term?</span>}></Item>
          <List>
            In SDE of the form:
            {M`\D X_t = f(x,t) \D t +g(x,t) \D B_t`}
            <List>
              <Item>The function {m`g(x,t)\in \mathbb{R}^{d\times m}`} is the <i>diffusion term</i></Item>
              <Item>Controls <i>how much noise</i> is injected into the system at time {m`t`} (and position {m`x`})</Item>
              <Item>If {m`g(x,t)`} is scalar (e.g., {m`\sigma(t)\mathbf{I}`}), then it's <i>isotropic noise</i> -- equally strong in all directions</Item>
            </List>
          </List>

          <Item name={<span className="text-green">Interpretation: Diffusion as a Stochastic Field</span>}></Item>
          <List>
            <Item>While the drift pulls deterministically, the diffusion <i>adds uncertainty</i></Item>
            <Item>The stronger {m`g(x,t)`}, the <i>faster the distribution spreads</i></Item>
            <Item>It shapes the <i>covariance structure</i> of {m`p(x,t)`}</Item>
          </List>
          <figure className="flex flex-col items-center origin-top"
            style={{ transform: "scale(0.5)" }}>
            <AnimateSVG
              src="/figures/diffusionvf.svg"
              width="100%"
              // step={atomstep[step]}
              style={{ width: "50%", maxWidth: "700px" }}
            />
            <figcaption className="mt-2 text-sm text-gray-400 italic text-center">
              Brownian Diffusion Field: {m`f(\mathbf{x}) = 0`}, random {m`\sigma\,\D B_t`}
            </figcaption>
          </figure>

        </div>

      </Slide>


      <Slide>
        <List>
          <Item name={<span className="text-green">Evolution of Distribution</span>}>
            <List>
              <Item>The density {m`p(x,t)`} evolves via the <i>Fokker-Planck equation</i>:
                {M`\partial_t p(x,t) = - \nabla \cdot (fp) +\frac{1}{2}\nabla \cdot (D\nabla p)`}
                where {m`D=gg^\top`}
              </Item>
            </List>
          </Item>
          <Item name={<span className="text-green">Resulting Form (Conditioned on {m`x_0`})</span>}>
            <List>
              <Item>For many SDEs (e.g. VP), the conditional distribution is Gaussian:
                {M`p(x,t|x_0) = \mathcal{N}(\mu(t)x_0, \sigma^2(t)\mathbf{I})`}
              </Item>
            </List>
          </Item>
        </List>
      </Slide>
      <TitleSlide title="Example - The Variance Preserving SDE"></TitleSlide>
      <Slide steps={[1, 2, 3, 4]}>
        <List step={step}>
          <Item name={<span className="text-green">  VP SDE (Variance Preserving)</span>}>
            <Morph display>
              {step < 1
                ? ''
                : step === 1
                  ? String.raw`\g0{\D X_t = }\g1{f(x,t)} \D t + \g2{g(t)} \g4{\D B_t}`
                  : String.raw`\g0{\D X_t = }\g1{-\frac{1}{2}\beta(t)X_t} \D t + \g2{\sqrt{\beta(t)}} \g4{\D B_t}`}</Morph>
            <Show when={step > 2}>
              <List>
                <Item>Progressively smooths {m`p_0(x)`} into {m`\mathcal{N}(0,\mathbf{I})`} over time</Item>
              </List>
            </Show>
          </Item>
          <Show when={step > 3}>
            <Item name={<span className="text-green">  Langevin view at fixed {m`t`}</span>}>
              {M`\D X_t = -\frac{1}{2}\nabla U_t(x) \D t + \sqrt{\beta(t)} \D B_t,\qquad U_t(x) = \frac{1}{2} \beta(t)||x||^2`}
              <List>
                <Item> At fixed {m`t`}, this process would converge to {m`\mathcal{N}(0,\mathbf{I})`} if run indefinitely</Item>
                <Item> But since {m`\beta(t)`} varies, the overall process is <i>non-stationary</i> </Item>
              </List>
            </Item>
          </Show>
        </List>
        <Notes>
          The variance preserving SDE is a forward noising process that:
          <List>
            <Item>reduces the signal (i.e., damps the original data over time), and</Item>
            <Item>increases the noise (adds Gaussian noise over time), </Item>
            <Item>all while preserving the total variance of the sample at each time {m`t`}</Item>
          </List>
        </Notes>
      </Slide>
      <TitleSlide title="Why Time-Varying Noise?"></TitleSlide>
      <Slide steps={[1, 2]}>
        <List>
          <Show when={step > 0}>
            <Item name={<span className="text-green">Motivation for varying {m`\beta(t)`}</span>}></Item>
            <List>
              Slower noising (small {m`\beta(t)`} early):
              <List>
                - Preserves more signal<br />
                - Easier learning — high SNR
              </List>
              Faster noising later:
              <List>
                - Reaches isotropic Gaussian {m`\mathcal{N}(0,\mathbf{I})`}<br />
                - Enables simple prior for sampling
              </List>
            </List>
          </Show>
          <Show when={step > 1}>
            <Item name={<span className="text-green">Tradeoff: Signal-to-Noise Curriculum</span>}></Item>
            <List>
              Time-varying {m`\beta(t)`} creates a <i>curriculum</i>
              <List>
                - Learn to denoise from easy to hard
              </List>
              Better training stability and sample quality
            </List>
          </Show>
        </List>
        <Notes>
          <List>
            <Item>
              A time-varying noise schedule like β(t) lets the noising be gentle at the beginning (preserving more signal early on) and stronger near the end (so we end up close to Gaussian noise).
            </Item>
            <Item>
              This progressive degradation ensures intermediate states still contain useful structure — crucial for training score networks.
            </Item>
          </List>
        </Notes>
      </Slide>

      <TitleSlide title="Noise Schedules"></TitleSlide>
      <Slide>
        <div className="flex w-full h-full gap-0">
          {/* Left column */}
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-2">Variance Preserving (VP) SDE</h2>
            <List>
              <Item name={<span className="text-green">Foward SDE:</span>}
                style={{ transform: 'scale(0.75)', transformOrigin: 'left' }}><br />
                {m`\D x = -\frac{1}{2} \beta(t) x \D t + \sqrt{\beta(t)}\D w`}
              </Item>
              <Item name={<span className="text-green">Noise Schedule:</span>}
                style={{ transform: 'scale(0.75)', transformOrigin: 'left' }}><br />
                {m`\sigma^2(t) = 1- \exp(-\beta_{min}t - \frac{1}{2}(\beta_{max} - \beta_{min})t^2)`}
              </Item>
              <Item name={<span className="text-green">Signal-to-Noise Ratio (SNR):</span>}
                style={{ transform: 'scale(0.75)', transformOrigin: 'left' }}><br />
                {m`SNR(t) = \frac{\alpha(t)^2}{1 - \alpha(t)^2},\quad \alpha(t)^2 = \exp\left(-\beta_{min}t - \frac{1}{2}(\beta_{max} - \beta_{min})t^2\right)`}
              </Item><br />
              <figure className="flex flex-col items-left origin-left scale-[0.95]">
                {/* Row of two figures */}
                <div className="flex justify-left items-start gap-0">
                  <img
                    src="/figures/vpsdenoisesched.svg"
                    width="100%"
                    style={{ maxWidth: "400px" }}
                  />
                  <img
                    src="/figures/vpsdesnr.svg"
                    width="100%"
                    style={{ maxWidth: "400px" }}
                  />
                </div>

                {/* Shared caption */}
                <figcaption className="mt-2 text-sm text-gray-400 italic text-center max-w-[240px]">
                  (left) VP Schedule, (right) SNR
                </figcaption>
              </figure>

              <Item name={<span className="text-green">Properties/Caveats:</span>}
                style={{ transform: 'scale(0.75)', transformOrigin: 'left' }}>
                <List>
                  <Item name="-">Signal decays smoothly to 0 over time</Item>
                  <Item name="-">At {m`t=1`}, {m`x \sim \mathcal{N}(0,\mathbf{I})`}</Item>
                  <Item name="-">Allows analytic expression for {m`p(x_t|x_0)`}</Item>
                  <Item name="-">Low-SNR regions ({m`t\approx 1`}) are hard to learn.</Item>
                  <Item name="-">Requires careful handling of score network near final noise levels.</Item>
                </List>
              </Item>
              <Item name={<span className="text-green">Caveats:</span>}
                style={{ transform: 'scale(0.75)', transformOrigin: 'left' }}>
                <List>
                </List>
              </Item>

            </List>
          </div>

          {/* Right column */}
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-2">Variance Exploding (VE) SDE</h2>
            <List>
              <Item name={<span className="text-green">Foward SDE:</span>}
                style={{ transform: 'scale(0.75)', transformOrigin: 'left' }}><br />
                {m`\D x= \sigma(t) \D w`}
              </Item>
              <Item name={<span className="text-green">Noise Schedule:</span>}
                style={{ transform: 'scale(0.75)', transformOrigin: 'left' }}><br />
                {m`\sigma^2(t)= \sigma^2_{min}\left(\frac{\sigma_{max}}{\sigma_{min}}\right)^{2t}`}
              </Item>
              <Item name={<span className="text-green">Signal-to-Noise Ratio (SNR):</span>}
                style={{ transform: 'scale(0.75)', transformOrigin: 'left' }}><br />
                {m`SNR(t) = \frac{1}{\sigma^2(t)}`}
              </Item>
              <br />
              <figure className="flex flex-col items-left origin-left scale-[0.95]">
                {/* Row of two figures */}
                <div className="flex justify-left items-start">
                  <img
                    src="/figures/vesdenoisesched.svg"
                    width="100%"
                    style={{ maxWidth: "400px" }}
                  />
                </div>

                {/* Shared caption */}
                <figcaption className="mt-2 text-sm text-gray-400 italic text-center" style={{ width: '400px' }}>
                  VE Schedule
                </figcaption>
              </figure>
              <Item name={<span className="text-green">Properties/Caveats:</span>}
                style={{ transform: 'scale(0.75)', transformOrigin: 'left' }}>
                <List>
                  <Item name="-">Signal remains constant.</Item>
                  <Item name="-" className="whitespace-nowrap">Noise grows over time -- becomes extremely large as {m`t\rightarrow 1`}</Item>
                  <Item name="-">Allows for training with score matching</Item>
                  <Item name="-">Extremely high variance near {m`t=1`} can cause numerical instability.</Item>
                  <Item name="-">Sampling requires care to avoid exploding trajectories.</Item>
                </List>
              </Item>
            </List>
          </div>
        </div>
        <Notes>
          <List>
            <Item>The VE SDE leads to an unnormalized Gaussian:
              {M`x_t \sim \mathcal{N}(x_0, \sigma(t)\mathbf{I})`}
            </Item>
            <Item>
              This makes score matching loss very simple, as you can analytically compute the ground-truth score.
            </Item>
            <Item>
              The VE SDE leads naturally to a Langevin-based reverse process.
            </Item>
            <Item>It avoids complications from drift terms.</Item>
          </List>
        </Notes>
      </Slide>

      <TitleSlide title="Time Reversal of Diffusion Process">
        <img src="/figures/reversedognoising.svg" style={{ display: "block", margin: "0 auto", width: '100%' }} />
      </TitleSlide>
      <Slide>
        <Item name={<span className="text-green">Reverse process:</span>}> Learn how to reverse the noise -- from {m`x_t\rightarrow x_0`}<br />
          To do this, we need to construct a <i>reverse SDE</i>, which requires:
          {M`f_{rev}(X_t,t) = f(X_t,t) - g(t)^2 \nabla_{x_t} \log p(X_t)`}
        </Item>
        <Item name={<span className="text-green">Reverse-time SDE:</span>}>{m`T_F >0`} and {m`\overset{\leftarrow} X_0 \overset{d}{=} X_{T_F}`}<br />
          {M`\D \overset{\leftarrow}{X}_t = [f(\overset{\leftarrow}{X}_t,t) - g(t)^2\nabla \log p_{T_F - t}(\overset{\leftarrow}{X}_t)]\D t + g(t) dB_t`}
        </Item>
        <Box>Learning the score function of the noised distribution {m`p_{T_F-t}(\overset{\leftarrow}{X}_t)`} is the central learning target</Box><br />
        <Item >The score function {m`\nabla p(X_t)`} points in the direction of higher probability mass</Item>
        <Item >Learning the score function allows us to estimate grandients that push samples back toward data</Item>
        <Item>Undoes the noise added during the forward process </Item>
        <Item>Constructs a valid reverse-time SDE or ODE to generate data</Item>
        <Notes>
          The reverse SDE aims to generate samples from the data distribution by:
          <List>
            <Item>Starting from pure noise {m`x_T \sim \mathcal(0,\mathbf{I})`}</Item>
            <Item>Progressively denoising using the score function</Item>
            <Item>Ending with an approximation to clean data {m`x_0 \sim p_0(x)`}</Item>
          </List>
          In other words:
          <List>
            <Item>The reverse SDE is a learned denoising process, where the score {m`\nabla \log p(x_t)`}<br />
              tells us how to nudge each noisy sample back toward higher-likelihood regions — i.e., toward the data manifold.
            </Item>
          </List>
        </Notes>
      </Slide>

      <TitleSlide title="How to Learn the Score Function"></TitleSlide>
      <Slide>
        <u>We need to learn the score {m`\nabla \log p(X_t)`} but {m`p(X_t)`} is intractable.</u>
        <List>
          <Item>We do not have a closed-form expression for {m`p(X_t)`}, sinces it's a complicated convolution of the data distribution and noise:
            {M`p(x_t) = \int p(x_t|x_0)p_{data}(x_0)\D x_0`}
          </Item>
          <Item name={<span className="text-green">Trick: Use the Score of the Conditional</span>}>{m`\log p(x_t|x_0)`}<br /><br />
          </Item>
          <Item>This identity gives the relation
            {M`\nabla \log p(x_t) = \mathbb{E}_{x_0|x_t}[\nabla \log p(x_t|x_0)]`}
            The marginal score is the <i>expected conditional score</i>, averaged over the unknown posterior {m`p(x_0|x_t)`}.<br /><br />
            While we can't compute {m`p(x_0|x_t)`}, we can train {m`s_{\theta}(x_t,t)`} to match conditional score, under the joint {m`(x_0,x_t)\sim p_{data}(x_0)p(x_t|x_0)`}<br /><br />
            In expectation, this approximates the marginal score: {m`s_{\theta}(x_t,t)\sim \nabla \log p(x_t)`}
          </Item>
          <br /><br />
          <Item> Define a Denoising Score Maching Loss using the <i>conditional score</i>
            {M`\mathbb{E}_{x_0 \sim p_{data}}\mathbb{E}_{x_t \sim p(x_t|x_0)}\left[||s_{\theta}(x_t,t)-\nabla \log p(x_t|x_0)||^2\right]`}
          </Item>

        </List>
      </Slide>

      <TitleSlide title="Loss Function in Diffusion Models"></TitleSlide>
      <Slide>
        <Item name={<span className="text-green">Denoising Score Matching Loss</span>}>
          {M`\mathcal{L}_{DSM} = \mathbb{E}_t\mathbb{E}_{x_0\sim p_{data}} \mathbb{E}_{x_t|x_0}\left[\lambda(t) ||s_{\theta}(x_t,t) - \nabla\log p_t(x_t|x_0)||^2\right]`}
        </Item><br />
        <Item>In VP SDE, we know:
          {M`x_t = \alpha(t)x_0 + \sigma(t)\epsilon, \qquad \epsilon \sim \mathcal{N}(0,\mathbf{I})`}
          <List>
            and the conditional {m`p(x_t|x_0)`} is Gaussian, so:
            {M`\boxed{\nabla \log p(x_t|x_0)} = -\frac{1}{\sigma(t)^2}(x_t - \alpha(t)x_0) = \boxed{-\frac{1}{\sigma(t)} \epsilon}`}
            So, the conditional score is proportional to the <i>true noise</i> {m`\epsilon`}
          </List>
        </Item>
        <br />
        <Item name={<span className="text-green">Simplified Loss for VP SDE</span>}>
          {M`\mathcal{L}_{simple} = \mathbb{E}_{t,x_0,\epsilon \sim \mathcal{N}(0,\mathbf{I})}\left[\lambda(t)||\epsilon - \epsilon_{\theta}(x_t,t)||^2\right]`}
        </Item>
      </Slide>

      <TitleSlide title="Training"></TitleSlide>
      <Slide>
        <Item name={<span className="text-green">Training Algorithm</span>}></Item>
        <Figure>
          <img src="/figures/trainingalg.svg" style={{ display: "block", margin: "0 auto", width: '100%', transform: "scale(0.7)" }} />
        </Figure>

      </Slide>

      <TitleSlide title="Sampling Reverse SDE/ODE"></TitleSlide>
      <Slide>
        <Item name={<span className="text-green">Sampling Reverse SDE/ODE</span>}></Item>
        <div className="flex justify-center items-start gap-20 w-full" style={{ transform: "translateY(300px)" }}>
          <Figure>
            <img src="/figures/EMsampling.svg" style={{ display: "block", margin: "0 auto", width: '100%', transform: "scale(1.5)" }} />
          </Figure>
          <div></div>
          <Figure>
            <img src="/figures/EMsamplingODE.svg" style={{ display: "block", margin: "0 auto", width: '100%', transform: "scale(1.5)" }} />
          </Figure>
        </div>
        <Notes>
          <List>
            <Item>
              We use Euler-Maruyama to numericaly integrate and solve the reverse-time SDE step by step.
              Euler–Maruyama is the stochastic analog of the Euler method for ODEs, used to integrate Stochastic Differential Equations (SDEs)
            </Item>
            <Item>
              We use Runge–Kutta (RK) methods which are deterministic numerical integration algorithms used to solve for the ODE case
            </Item>
          </List>
        </Notes>
      </Slide>

      <Slide>
        <Item name={<span className="text-green">Predictor-Corrector Sampling</span>}></Item>
        <Figure>
          <img src="/figures/PCSampling.svg" style={{ display: "block", margin: "0 auto", width: '100%', transform: "scale(0.7)" }} />
        </Figure>
        <Notes>
          Predictor-Corrector (PC) sampling in score-based diffusion models is a method that combines:
          <List>
            <Item>
              a predictor step: integrates the reverse-time SDE (typically using something like Euler or Heun), and
            </Item>
            <Item>a corrector step: applies Langevin dynamics to refine the sample by nudging it closer to the correct distribution at each time {m`t`}</Item>
          </List>
          This approach is used to improve sampling quality without retraining the model.
        </Notes>
      </Slide>
      <TitleSlide title="Recap"></TitleSlide>
      {/* First slide */}
      <Slide steps={[1, 2, 3, 4, 5, 6, 7]}>
        <div style={{
          width: "100%",
          display: "flex",
          justifyContent: "center"
        }}>
          <AnimateSVG src="/figures/forward_reverse_sde.svg" width="100%"
            step={sdestep[step < 7 ? 0 : 1]} style={{ width: "80%", maxWidth: "1200px" }} />
        </div>
        {/* <img  style={{ display: "block", margin: "0 auto", width: '50%' }} /> */}
        <List step={step}>
          <Item> Construct a diffusion process {m`\{\mathbf{x}(t)\}_{t=0}^T`} modeled as solution to a stochastic differential equation (SDE)</Item>
          <Item> Data distribution: {m`\mathbf{x}(0) \sim p_0`}</Item>
          <Item> Unstructured prior distribution: {m`\mathbf{x}(T) \sim p_T`}, e.g. {m`\mathbf{x}(T) \sim \mathcal{N}(\mu,\sigma)`}</Item>
          <Item> Vector-valued drift: {m`\mathbf{f}(\mathbf{x},t)`}</Item>
          <Item> Scalar diffusion: {m`g(t)`}</Item>
          <Item> Brownian motion: {m`B_t`}</Item>
          <Box title="Reverse of a diffusion process is also a diffusion process (Reverse SDE)" style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              {m`\D \overset{\leftarrow}{\mathbf{x}} = [\mathbf{f}(\overset{\leftarrow}{\mathbf{x}},t) - g^2(t) \nabla_{\mathbf{x}} \log p_t(\overset{\leftarrow}{\mathbf{x}})]\;\D t + g(t)\D B_t`}
            </div>
          </Box>
        </List>
      </Slide>

      <Slide steps={[1, 2, 3, 4]}>
        <Box title="Reverse of a diffusion process is also a diffusion process (Reverse SDE)" style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {m`\D \overset{\leftarrow}{\mathbf{x}} = [\mathbf{f}(\overset{\leftarrow}{\mathbf{x}},t) - g^2(t) \nabla_{\mathbf{x}} \log p_t(\overset{\leftarrow}{\mathbf{x}})]\;\D t + g(t)\D B_t`}
          </div>
        </Box>
        <List step={step - 1}>
          <Item>
            Once score {m`\nabla_{\mathbf{x}} \log p_t(\mathbf{x})`} is known for all {m`t`}, we can derive the reverse process, and simulate to sample from {m`p_0`}
            <div style={{
              width: "100%",
              display: "flex",
              justifyContent: "center"
            }}>
              <AnimateSVG src="/figures/sde_fin,al.svg" width="100%"
                step={forwardbackstep[0]}
                style={{ width: "100%", maxWidth: "1200px" }} />
            </div>
            {/* <Figure>
              <img src="/figures/sde_final.svg" style={{ display: "block", margin: "0 auto", width: '75%' }} />
            </Figure> */}
          </Item>

          <Item>
            We can assume a Gaussian diffusion process:
            {M`p(\mathbf{x}_t|\mathbf{x}_0) = \mathcal{N}(\mathbf{x}; \alpha_t \mathbf{x}_0, \sigma_t^2 \mathbf{I})`}
            with time-dependent signal scaling {m`\alpha_t`} and noise scaling {m`\sigma_t`}.
          </Item>
          <Box title="Variance Preserving Schedule Forward SDE" style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              {m`\D \mathbf{x} = -\frac{1}{2}\beta_t\mathbf{x}\D t + \sqrt{\beta_t}\D \mathbf{w} \qquad \sigma^2_t = 1 - \alpha_t^2 \qquad \frac{\alpha'_t}{\alpha_t}\triangleq -\frac{1}{2} \beta_t`}
            </div>
          </Box>

        </List>
      </Slide>

      <Slide steps={[1, 2, 3, 4, 5, 6, 7, 8]}>
        <Box title="Forward SDE" style={{ display: "flex", justifyContent: "center", textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {/* {m`\bm{\mathbf{dx} = -\frac{1}{2}\beta_t\mathbf{x}\mathbf{d}t + \sqrt{\beta_t}\mathbf{dw}} `({ style: { transform: 'translateY(0.5em)' } })} */}
            <Morph inline>
              {step < 1
                ? ''
                : step === 1
                  ? forwardsde[0]
                  : forwardsde[1]}</Morph>
          </div>
        </Box>
        <Show when={step > 2}>
          <Box title="Reverse SDE" style={{ display: "flex", justifyContent: "center", textAlign: "center", marginTop: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Morph inline>
                {step < 3
                  ? ''
                  : step === 3
                    ? reversesde[0]
                    : reversesde[1]}</Morph>

            </div>
          </Box>
        </Show>
        <List step={step - 4}>
          <Item>
            To estimate {m`\nabla_{\mathbf{x}} \log p_t(\mathbf{x})`}, we can train a time-dependent score-based model {m`s_\theta(\mathbf{x},t)`}:

            <div style={{ display: "flex", justifyContent: "center" }}>
              <Morph inline>
                {step < 5
                  ? ''
                  : step === 5
                    ? loss[0]
                    : loss[1]}</Morph>
            </div>
          </Item>
        </List>
        <List step={step - 6}>
          <Item>
            Turns out that: {M`\nabla_{\mathbf{x}} \log p_t(\mathbf{x}_t) = \frac{\alpha_t \hat{\mathbf{x}}_\theta (\mathbf{x}_t,t) - \mathbf{x}_0}{\sigma_t^2}`}
          </Item>
          <Item>
            Alternatively we can train a time-dependent denoising model {m`\hat{\mathbf{x}}_\theta(\mathbf{x}_t,t)`}:
            {M`\theta^* = \arg\min\limits_\theta \mathbb{E}_{p(t)} \left\{\lambda(t)\mathbb{E}_{p(\mathbf{x}_0)}\mathbb{E}_{p(\mathbf{x}_t|\mathbf{x}_0)}\left[\left\Vert \hat{\mathbf{x}}_\theta(\mathbf{x}_t,t) - \mathbf{x}_0\right\Vert_2^2\right] \right\}`}
          </Item>
        </List>
      </Slide>

      <SectionSlide section="Structure Representation"></SectionSlide>


      <Slide steps={[0, 1, 2, 3, 4, 5]}>
        <div className="flex flex-row justify-center items-start space-x-4">

          <figure className="flex flex-col items-center w-1/2">
            <AnimateSVG
              src="/figures/atoms.svg"
              width="100%"
              step={atomstep[step]}
              style={{ width: "70%", maxWidth: "700px" }}
            />
            <figcaption className="mt-2 text-sm text-gray-400 italic text-center">
              Atom positions.
            </figcaption>
          </figure>

          {/* <AnimateSVG src="/figures/forward_reverse_sde.svg" width="100%"
            step={sdestep[step < 7 ? 0 : 1]} style={{ width: "80%", maxWidth: "1200px" }} /> */}
          <Show when={step > 1}>
            <figure className="flex flex-col items-center w-1/2">
              <AnimateSVG
                src="/figures/torsions_final.svg"
                width="100%"
                step={torsionstep[step - 2]}
                style={{ width: "70%", maxWidth: "700px" }}
              />
              <figcaption className="mt-2 text-sm text-gray-400 italic text-center">
                Backbone dihedral ({m`\omega,\;\phi,\;\psi`}), and side-chain torsion ({m`\chi`}) angles
              </figcaption>
            </figure>

          </Show>
        </div>
        <Show when={step > 4}>
          <div className="flex justify-center mt-12">

            <figure className="w-3/4 flex flex-col items-center">
              <img src="/figures/frames2.svg" alt="residue frames" className="w-auto h-auto max-w-none" style={{ width: '1300px' }} />
              <figcaption className="mt-2 text-sm text-gray-400 italic text-center">
              </figcaption>
            </figure>
          </div>
          <Item>{m`N`} residue backbone parameterized by {m`N`} rigid frames. </Item>
          <Item>Each frame is mapped from fixed coordinates {m`N^*, C^*_\alpha, C^*, O^* \in \mathbb{R}^3`} centered on {m`C^*_\alpha=(0,0,0)`}</Item>
          <Item>Atom coordinates of n-th residue: {m`[N_n, C_n, (C_\alpha)_n] =  T_n \cdot [N^*, C^*, C^*_\alpha]`}</Item>
          <Item>Mapping: {m`T_n \cdot v = r_n v +x_n`}</Item>
        </Show>
        <Notes>
          <List>
            <Item><u>Backbone residue rotations</u>lie in {m`SO(3)`}, which is the group of all 3D rotation matrices. Each element {m`\mathbf{R} \in SO(3)`} corresponds to a rotation about some axis by some angle.</Item>
            <Item><u>Residue rotation/translations</u>lie in {m`SE(3)`}. {m`SE(3)`} is the Special Euclidean Group in 3 dimensions — the mathematical group that describes all rigid transformations in 3D space: rotations + translations</Item>
            <Item><u>Side chain rotations</u> lie in {m`SO(2)`} which is the Special Orthogonal Group in 2 dimensions — the group of all 2D rotation matrices that preserve distances, angles, and orientation.
            </Item>
          </List>
        </Notes>
      </Slide>

      {/* <TitleSlide title="Model Architecture & Data"></TitleSlide> */}
      <SectionSlide section="Model Architecture & Data"></SectionSlide>
      <Slide>
        <Item name={<span className="text-green">Model Architecture & Data</span>}></Item>
        <br />
        <figure className="flex flex-col items-center">
          <img src="/figures/architecture.svg" alt="architecture" className="max-w-full h-auto" />
          {/* <figcaption className="mt-2 text-sm text-gray-400 italic text-center">
              Trp cage (PDB ID = 2JOF) artificially split into two chains
            </figcaption> */}
        </figure>
        <List>
          <Item>Input: target structure and epitope information + non-designed Ab residues
          </Item>
          <Item>Multi-track architecture that reasons over primary sequence (1D), residue pair (2D), and structure (3D) levels of proteins
          </Item>
          <Item>1D track includes “embeddings” from large protein language models such as ESM2
          </Item>
          <Item>Train on Ab-Ag complexes ({m`N \sim 5,000`}) and general PPI dataset ({m`N\sim 500K`})
          </Item>
        </List>
      </Slide>

      <Slide>
        <Item name={<span className="text-green">Model Architecture & Data</span>}></Item>
        <br />
        <figure className="flex flex-col items-center">
          <img src="/figures/pairformer.svg" alt="pairformer" className="max-w-full h-auto" width="1000px" />
          <br />
          <img src="/figures/gnn.svg" alt="gnn" className="max-w-full h-auto" width="1000px" />
          <figcaption className="mt-2 text-sm text-gray-400 italic text-center">
            AF2/AF3 Pairformer
          </figcaption>
        </figure>
        <List>
          <Item>Input conditioner: 1D/2D embedding + AF3-like pairformer stack
            <List>
              <Item>Implemented {m`O(N^2 k)`} version of triangle blocks (default {m`O(N^3)`}) via on the fly random graph</Item>
            </List>
          </Item>
          <Item>Diffusion module:
            <List>
              <Item>Equivariant neural network predicts scores or denoised estimates for all six types of dofs</Item>
              <Item>{m`O(Nk)`} random graph: {m`\sim 10`} ms per call for Ab size system→ {m`\sim 40`} ms for Ab structure prediction using denoising model
              </Item>
            </List>
          </Item>

        </List>
      </Slide>

      <SectionSlide section="Degrees of Freedom and Noise Schedules"></SectionSlide>
      <Slide>
        <div className="flex my-5 gap-8 items-start">
          {/* Left side: list with box and label */}
          <div className="relative w-1/2">
            Model learns to denoise six types of degrees of freedom (dofs) from their corrupted states:
            {/* Label above the box */}
            <div className="absolute top-12 left-10 text-sm text-gray-200 mx-50">
              Intra-CoM group dofs
            </div>

            {/* Rounded box around first four items */}
            <div
              className="absolute top-10 left-5 p-4 border rounded-lg border-gray-500 pointer-events-none my-8"
              style={{ width: '50%', height: '28%' }}
            ></div>

            {/* The entire list underneath */}
            <List className="relative space-y-1 my-8">
              <Item name="1.">Backbone translations</Item>
              <Item name="2.">Backbone rotations</Item>
              <Item name="3.">Sidechain torsions</Item>
              <Item name="4.">Residue identities</Item>
              <Item name="5.">CoM translations</Item>
              <Item name="6.">CoM rotations</Item>
            </List>
            Center-of-mass (CoM) "groups"
            <List>
              <Item>Consists of one or more chains</Item>
              <Item>Can be assigned a different noising schedule for each (intra-group) dof</Item>
            </List>
          </div>

          {/* Right side: figure */}
          <figure className="w-1/2 flex flex-col items-center">
            <img src="/figures/molec.png" alt="molecular structure" className="max-w-full h-auto" />
            <figcaption className="mt-2 text-sm text-gray-400 italic text-center">
              Trp cage (PDB ID = 2JOF) artificially split into two chains
            </figcaption>
          </figure>
        </div>

      </Slide>


      <Slide steps={[1, 2, 3, 4, 5]}>
        <div className="relative -top-10">
          {/* t label */}
          <div className="absolute top-10 left-0 p-2 bg-gray-900 text-gray-50 rounded">
            {step === 1 && "t = 1.0"}
            {step === 2 && "t = 0.75"}
            {step === 3 && "t = 0.5"}
            {step === 4 && "t = 0.25"}
            {step === 5 && "t = 0"}
          </div>

          {/* STEP 1 */}
          <Show when={step === 1}>
            <div className="absolute top-0 left-0 grid grid-cols-3 gap-0">
              {/* Row 1 */}
              {[
                "Backbone translations",
                "Backbone rotations",
                "Sidechain torsions",
              ].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <img src={`/figures/molec_1_1_${idx + 1}.png`} width="30%" className="w-full h-auto" />
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-0.5 bg-gray-900 text-gray-50 text-xs rounded">
                    {label}
                  </span>
                </div>
              ))}

              {/* Row 2 */}
              {[
                "Residue identities",
                "CoM translations",
                "CoM rotations",
              ].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <img src={`/figures/molec_1_2_${idx + 1}.png`} width="30%" className="w-full h-auto" />
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-0.5 bg-gray-900 text-gray-50 text-xs rounded">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </Show>

          {/* STEP 2 */}
          <Show when={step === 2}>
            <div className="absolute top-0 left-0 grid grid-cols-3 gap-0">
              {/* Row 1 */}
              {[
                "Backbone translations",
                "Backbone rotations",
                "Sidechain torsions",
              ].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <img src={`/figures/molec_2_1_${idx + 1}.png`} width="30%" className="w-full h-auto" />
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-0.5 bg-gray-900 text-gray-50 text-xs rounded">
                    {label}
                  </span>
                </div>
              ))}

              {/* Row 2 */}
              {[
                "Residue identities",
                "CoM translations",
                "CoM rotations",
              ].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <img src={`/figures/molec_2_2_${idx + 1}.png`} width="30%" className="w-full h-auto" />
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-0.5 bg-gray-900 text-gray-50 text-xs rounded">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </Show>

          {/* STEP 3 */}
          <Show when={step === 3}>
            <div className="absolute top-0 left-0 grid grid-cols-3 gap-0">
              {/* Row 1 */}
              {[
                "Backbone translations",
                "Backbone rotations",
                "Sidechain torsions",
              ].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <img src={`/figures/molec_3_1_${idx + 1}.png`} width="30%" className="w-full h-auto" />
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-0.5 bg-gray-900 text-gray-50 text-xs rounded">
                    {label}
                  </span>
                </div>
              ))}

              {/* Row 2 */}
              {[
                "Residue identities",
                "CoM translations",
                "CoM rotations",
              ].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <img src={`/figures/molec_3_2_${idx + 1}.png`} width="30%" className="w-full h-auto" />
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-0.5 bg-gray-900 text-gray-50 text-xs rounded">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </Show>

          {/* STEP 4 */}
          <Show when={step === 4}>
            <div className="absolute top-0 left-0 grid grid-cols-3 gap-0">
              {/* Row 1 */}
              {[
                "Backbone translations",
                "Backbone rotations",
                "Sidechain torsions",
              ].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <img src={`/figures/molec_4_1_${idx + 1}.png`} width="30%" className="w-full h-auto" />
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-0.5 bg-gray-900 text-gray-50 text-xs rounded">
                    {label}
                  </span>
                </div>
              ))}

              {/* Row 2 */}
              {[
                "Residue identities",
                "CoM translations",
                "CoM rotations",
              ].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <img src={`/figures/molec_4_2_${idx + 1}.png`} width="30%" className="w-full h-auto" />
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-0.5 bg-gray-900 text-gray-50 text-xs rounded">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </Show>

          {/* STEP 5 */}
          <Show when={step === 5}>
            <div className="absolute top-0 left-0 grid grid-cols-3 gap-0">
              {/* Row 1 */}
              {[
                "Backbone translations",
                "Backbone rotations",
                "Sidechain torsions",
              ].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <img src={`/figures/molec_5_1_1.png`} width="30%" className="w-full h-auto" />
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-0.5 bg-gray-900 text-gray-50 text-xs rounded">
                    {label}
                  </span>
                </div>
              ))}

              {/* Row 2 */}
              {[
                "Residue identities",
                "CoM translations",
                "CoM rotations",
              ].map((label, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <img src={`/figures/molec_5_1_1.png`} width="30%" className="w-full h-auto" />
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 p-0.5 bg-gray-900 text-gray-50 text-xs rounded">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </Show>

        </div>
      </Slide>
      {/* <Slide steps={[1, 2]}>

        Axes
        <AnimateSVG src="/figures/axes.svg" width="300pt" height="300pt"
          step={axissteps[step - 1]} />
      </Slide> */}

      <Slide className="bg-black">
        <Item name={<span className="text-green">Noise Backbone (BB) and Torsion DOFs</span>}></Item>
        <div className="flex flex-row items-start justify-center gap-4">
          <Figure>
            <img
              src="/figures/all_sticks_schedule2.png"
              style={{
                display: "block",
                width: "100%",
                maxWidth: "800px",
                marginTop: "200px"  // adjust as needed
              }}
            />
          </Figure>

          <video
            width="800"
            controls
            autoPlay
            loop
            muted
            style={{ borderRadius: '12px' }}
          >
            <source src="/videos/all_sticks.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </Slide>

      <Slide className="bg-black">
        <Item name={<span className="text-green">Noise Center-of-Mass DOFs only</span>}></Item>
        <div className="flex flex-row items-start justify-center gap-4">
          <Figure >
            <img
              src="/figures/global_ab_com_sticks_schedule2.png"
              style={{
                display: "block",
                width: "100%",
                maxWidth: "800px",
                marginTop: "200px"  // adjust as needed
              }}
            />
          </Figure>

          <video
            width="800"
            controls
            autoPlay
            loop
            muted
            style={{ borderRadius: '12px' }}
          >
            <source src="/videos/global_ab_com_sticks.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </Slide>

      <Slide className="bg-black">
        <Item name={<span className="text-green">Noise All Structural DOFs</span>}></Item>
        <div className="flex flex-row items-start justify-center gap-4">
          <Figure >
            <img
              src="/figures/global_ab_all_sticks_schedule2.png"
              style={{
                display: "block",
                width: "100%",
                maxWidth: "800px",
                marginTop: "200px"  // adjust as needed
              }}
            />
          </Figure>

          <video
            width="800"
            controls
            autoPlay
            loop
            muted
            style={{ borderRadius: '12px' }}
          >
            <source src="/videos/global_ab_all_sticks.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </Slide>
      <Slide className="bg-black">
        <Item name={<span className="text-green">Polymer Diffusion</span>}>
          <div className="flex gap-12" style={{ transform: 'scale(0.75)' }}>
            {m`\D X_t = -\frac{1}{2}\beta_t X_t \D t +  \sqrt{\beta_t} \boxed{\mathbf{R}} \D B_t\qquad\D \overset{\leftarrow}{X}_t = \left(-\frac{1}{2} \overset{\leftarrow}{X}_t - \boxed{\mathbf{R}\mathbf{R}^\top} \nabla \log p_t(\overset{\leftarrow}{X}_t)\right)\beta_t \D t + \sqrt{\beta_t}\boxed{\mathbf{R}}\D B_t`}
            {/* Reverse SDE: {m``} */}
          </div>
        </Item>
        <div className="flex flex-row items-start justify-center gap-4">
          <video
            width="800"
            controls
            autoPlay
            loop
            muted
            style={{ borderRadius: '12px' }}
          >
            <source src="/videos/global_ab_all_polymer_cartoon.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <video
            width="800"
            controls
            autoPlay
            loop
            muted
            style={{ borderRadius: '12px' }}
          >
            <source src="/videos/global_ab_all_polymer_sticks.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </Slide>
      <TitleSlide title="Guidance"></TitleSlide>
      <Slide>
        <Item name={<span className="text-green">Without Guidance</span>}>
          <List>
            <Item name=" ">The diffusion model learns or samples from {m`p(x_0) \sim p_{data}(x_0)`}
            </Item>
            <Item name=" ">The reverse SDE/ODE uses a learned score function {m`s_{\theta}(x_t,t)\sim \nabla_{x_t}\log p_t(x_t)`}
            </Item>
          </List>
        </Item>

        <Item name={<span className="text-green">With Guidance</span>}>
          <List>
            <Item name=" ">Sample from a modified joint target distribution
              {M`p_{target}(x_0)\propto \underbrace{p_{data}(x_0)}_{\text{from training}} \cdot \boxed{p_{guide}(x_0)}`}
              {/* {m`p_{guide}(x_0)`} reflects your <i>external conditioning</i> — e.g., harmonic constraints, known docking interface regions, distances between protein subunits, etc. */}
              <List>
                <Item>DOFs (degrees of freedom): the raw coordinates (e.g., positions, orientations)</Item>
                <Item> Guidance: soft preferences over a function of DOFs (e.g. {m`f(x_0) \sim f^*`})</Item>
              </List>

            </Item>
            <br /><br />
            The modified score becomes
            {M`\nabla \log p_{target}(x_t) = \nabla \log p_{data}(x_t) + \boxed{\nabla \log p_{guide}(x_t)}`}
          </List>
        </Item>


      </Slide >
      <Slide>
        <Item name={<span className="text-green">Harmonic Guidance</span>}></Item>
        Used template based harmonic potential to guide the generation, to encourage generated sample backbone structure to not deviate significantly from the ground truth.
        {M`\text{Guidance force} \propto - k \nabla_{x_t} \left[ \frac{1}{2} \left\| f(x_t) - f^* \right\|^2 \right]
,\qquad \tilde{s}_\theta(x_t, t) = s_\theta(x_t, t) + \nabla_{x_t} \log p_{\text{guide}}(x_t)
`}
        <div style={{ transform: 'scale(0.8)' }}>
          <List>
            <Item>{m`x_t`}: current sample (e.g. residue positions, poses)</Item>
            <Item>{m`f(x_t)`}: function extracting distance/orientation feature from current config</Item>
            <Item>{m`f^*`}: target or reference value</Item>
            <Item>{m`k`}: stiffness coefficient controlling strength of guidance</Item>
          </List>
        </div>
        <div className="flex flex-row items-start justify-center gap-40 mt-6">
          <div>
            <Item name={<span className="text-white"><u>Without guidance</u></span>}></Item>
            <Figure>
              <img
                src="/figures/harmonic_guidance_wo.svg"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "800px",
                  // marginTop: "200px"  // adjust as needed
                }}
              />
            </Figure>
          </div>
          <div>
            <Item name={<span className="text-white"><u>With guidance</u></span>}></Item>
            <Figure>
              <img
                src="/figures/harmonic_guidance_with.svg"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "800px",
                  // marginTop: "200px"  // adjust as needed
                }}
              />
            </Figure>
          </div>
        </div>
        <Notes>
          In protein or molecule generation, steric clashes, bond-length violations, and unrealistic torsion angles often emerge when:
          <List>
            <Item>
              The model samples from regions of the distribution that match training data, but
            </Item>
            <Item>Do not satisfy physics constraints that weren’t explicitly enforced during training
            </Item>
          </List>
          Guidance can help by:
          <List>
            <Item>Biasing the score field toward physically realistic regions of space</Item>
            <Item>Using auxiliary potentials, such as:
              <List>
                <Item>Clash penalties</Item>
                <Item>Ramachandran priors</Item>
                <Item>Bond length / angle distributions</Item>
                <Item>Energy or force fields (e.g., Rosetta score)</Item>
              </List>
            </Item>
          </List>
          Self-conditioning can also help resolve physical violations
        </Notes>
      </Slide>

      <SectionSlide section="Sample Generation and Design"></SectionSlide>
      <TitleSlide title="Walk-diffuse Sampling"></TitleSlide>
      <Slide >
        <Item name={<span className="text-green"><u>Walk-Diffuse sampling</u></span>}></Item>
        Access to score functions across multiple noise scales provides an opportunity to test alternative sampling strategies to standard denoising diffusion, e.g., walk-diffuse.
        <List>
          <Item> Can perform structure prediction or structure-sequence co-design</Item>
          <Item> <span className='text-blue-500'>Start from noise to design from scratch</span></Item>
          <Item> <span className='text-green'>Start from seed for sequence diversification</span></Item>
        </List>
        <img
          src="/figures/molec3.gif"
          alt="animated gif"
          className="absolute w-32 h-auto"
          style={{ transform: "translate(950px,100px) scale(0.70) " }}
        />
        <div className="flex flex-row items-start justify-center gap-20"
          style={{ transform: "translate(-100px,-100px)" }}>
          <Figure>
            <img
              src="/figures/editdistplot.png"
              style={{
                display: "block",
                width: "100%",
                maxWidth: "550px",
                marginTop: "200px"  // adjust as needed
              }}
            />
          </Figure>
          <Figure>
            <img
              src="/figures/walkdiffuse.svg"
              style={{
                display: "block",
                width: "100%",
                maxWidth: "800px",
                marginTop: "260px"  // adjust as needed
              }}
            />
          </Figure>
        </div>
      </Slide>

      <Slide >
        <Item name={<span className="text-green"><u>Walk-Diffuse sampling</u></span>}></Item>
        <List>
          <Item> Want to sample at sufficiently high noise level to promote faster mixing, but not too high to make denoising more difficult
          </Item>
          <Item> Tend to encounter transition regions where typical fluctuations are on the order of the scale of features, which provides a rough heuristic of where to start
          </Item>
        </List>
        <div className="flex flex-row items-start justify-center gap-20"
          style={{ transform: "translate(-100px,-100px)" }}>
          <Figure>
            <img
              src="/figures/gtprob.svg"
              style={{
                display: "block",
                width: "100%",
                maxWidth: "550px",
                marginTop: "200px"  // adjust as needed
              }}
            />
          </Figure>
          <Figure>
            <img
              src="/figures/walkdiffuse_denoise.svg"
              style={{
                display: "block",
                width: "100%",
                maxWidth: "800px",
                marginTop: "200px"  // adjust as needed
              }}
            />
          </Figure>
        </div>
      </Slide>

      <Slide >
        <Item name={<span className="text-green"><u>Walk-Diffuse sampling</u></span>}></Item>
        Access to score functions across multiple noise scales provides an opportunity to test alternative sampling strategies to standard denoising diffusion, e.g., walk-diffuse.
        <List>
          <Item> <span className='text-green'>Sequence diversification from initial seed</span></Item>
        </List>
        <div className="flex flex-row items-start justify-center gap-10"
          style={{ transform: "translate(-100px,40px)" }}>
          <div className="flex flex-row items-start justify-center gap-2">
            <Figure>
              <img
                src="/figures/editdistplot.png"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "450px",
                  marginTop: "200px"  // adjust as needed
                }}
              />
            </Figure>
            <Figure>
              <img
                src="/figures/rmsdplot.png"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "460px",
                  marginTop: "200px"  // adjust as needed
                }}
              />
            </Figure>
          </div>
          <Figure>
            <img
              src="/figures/seqeditdist3.svg"
              style={{
                display: "block",
                width: "100%",
                maxWidth: "400px",
                marginTop: "0px"  // adjust as needed
              }}
            />
          </Figure>
        </div>
      </Slide>
      <TitleSlide title="Molecular Dynamics with Learned Model"></TitleSlide>
      <Slide>
        <Item name={<span className="text-green"><u>Can learn to generate diverse conformational ensembles</u></span>}></Item>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Figure>
            <img
              src="/figures/molecdynamics.svg"
              style={{
                display: "block",
                justifyContent: "center",
                width: "100%",
                maxWidth: "1600px",
                marginTop: "100px"  // adjust as needed
              }}
            />
          </Figure>
        </div>
      </Slide>
      <TitleSlide title="Sequence Co-generation"></TitleSlide>
      <Slide>
        <Item name={<span className="text-green"><u>Sequence (and Structure) Co-geneneration</u></span>}></Item>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Figure>
            <img
              src="/figures/sequencecogen.png"
              style={{
                display: "block",
                justifyContent: "center",
                width: "100%",
                maxWidth: "1100px",
                marginTop: "0px"  // adjust as needed
              }}
            />
          </Figure>
        </div>
      </Slide>
    </Presentation >
  );
}

export default App;
