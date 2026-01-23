
      <Slide steps={[1, 2, 3, 4, 5, 6, 7, 8]}>
        <Figure>
          <img src="/figures/forward_reverse_sde.svg" style={{ display: "block", margin: "0 auto", width: '50%' }} />
        </Figure>
        <List step={step - 1}>
          <Item> Construct a diffusion process {m`\bm{\{\mathbf{x}(t)\}_{t=0}^T}`({ style: { transform: 'translateY(-0.9em)' } })} modeled as solution to a stochastic differential equation (SDE)</Item>
          <Item> Data distribution: {mOffset`\bm{\mathbf{x}(0) \sim p_0}`()}</Item>
          <Item> Unstructured prior distribution: {mOffset`\bm{\mathbf{x}(T) \sim p_T}`()}, e.g. {mOffset`\bm{\mathbf{x}(T) \sim \mathcal{N}(\mu,\sigma)}`()}</Item>
          <Item> Vector-valued drift: {mOffset`\bm{\mathbf{f}(\mathbf{x},t)}`()}</Item>
          <Item> Scalar diffusion: {mOffset`\bm{g(t)}`()}</Item>
          <Item> Brownian motion: {m`\bm{\mathbf{w}}`({ style: { transform: 'translateY(-0.5em)' } })}</Item>
          <Box title="Reverse of a diffusion process is also a diffusion process (Reverse SDE)" style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              {m`\bm{\mathbf{dx} = [\mathbf{f}(\mathbf{x},t) - g^2(t) \nabla_{\mathbf{x}} \log p_t(\mathbf{x})]\;\mathbf{d}t + g(t)\mathbf{dw}}`({ style: { transform: 'translateY(0.5em)' } })}
            </div>
          </Box>
        </List>
      </Slide>


      <Slide steps={[1, 2, 3, 4]}>
        <Box title="Reverse of a diffusion process is also a diffusion process (Reverse SDE)" style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {m`\bm{\mathbf{dx} = [\mathbf{f}(\mathbf{x},t) - g^2(t) \nabla_{\mathbf{x}} \log p_t(\mathbf{x})]\;\mathbf{d}t + g(t)\mathbf{dw}}`({ style: { transform: 'translateY(0.5em)' } })}
          </div>
        </Box>
        <List step={step - 1}>
          <Item>
            Once score {m`\bm{\nabla_{\mathbf{x}} \log p_t(\mathbf{x})}`({ style: { transform: "translateY(-0.8em)" } })} is known for all {m`\bm{t}`({ style: { transform: "translateY(-0.65em)" } })}, we can derive the reverse process, and simulate to sample from {m`\bm{p_0}`({ style: { transform: "translateY(-0.5em)" } })}
            <Figure>
              <img src="/figures/sde_final.svg" style={{ display: "block", margin: "0 auto", width: '75%' }} />
            </Figure>
          </Item>

          <Item>
            We can assume a Gaussian diffusion process:
            {M`\bm{p(\mathbf{x}_t|\mathbf{x}_0) = \mathcal{N}(\mathbf{x}; \alpha_t \mathbf{x}_0, \sigma_t^2 \mathbf{I})}`()}
            with time-dependent signal scaling {m`\bm{\alpha_t}`({ style: { transform: "translateY(-0.5em" } })} and noise scaling {m`\bm{\sigma_t}`({ style: { transform: "translateY(-0.5em" } })}.
          </Item>
          <Box title="Variance Preserving Schedule Forward SDE" style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              {m`\bm{\mathbf{dx} = -\frac{1}{2}\beta_t\mathbf{x}\mathbf{d}t + \sqrt{\beta_t}\mathbf{dw}} \qquad \bm{\sigma^2_t = 1 - \alpha_t^2 \qquad \frac{\alpha'_t}{\alpha_t}\triangleq -\frac{1}{2} \beta_t}`({ style: { transform: 'translateY(0.5em)' } })}
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
            To estimate {m`\bm{\nabla_{\mathbf{x}} \log p_t(\mathbf{x})}`({ style: { transform: "translateY(-0.8em)" } })}, we can train a time-dependent score-based model {m`\bm{s_\theta(\mathbf{x},t)}`({ style: { transform: "translateY(-0.8em)" } })}:

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
            Turns out that {m`\bm{\nabla_{\mathbf{x}} \log p_t(\mathbf{x}_t) = (\alpha_t \hat{\mathbf{x}}_\theta (\mathbf{x}_t,t) - \mathbf{x}_0)/\sigma_t^2}`({ style: { transform: "translateY(-0.8em)" } })}
          </Item>
          <Item>
            Alternatively we can train a time-dependent denoising model {m`\bm{\hat{\mathbf{x}}_\theta(\mathbf{x}_t,t)}`({ style: { transform: "translateY(-0.8em)" } })}:
            {M`\bm{\theta^* = \arg\min\limits_\theta \mathbb{E}_{p(t)} \left\{\lambda(t)\mathbb{E}_{p(\mathbf{x}_0)}\mathbb{E}_{p(\mathbf{x}_t|\mathbf{x}_0)}\left[\left\Vert \hat{\mathbf{x}}_\theta(\mathbf{x}_t,t) - \mathbf{x}_0\right\Vert_2^2\right] \right\}}`()}
          </Item>
        </List>
      </Slide>

      <Slide>
        <figure className="w-3/4 flex flex-col items-center">
          <img src="/figures/frames2.svg" alt="residue frames" className="w-auto h-auto max-w-none" style={{ width: '1200px' }} />
          <figcaption className="mt-2 text-sm text-gray-400 italic text-center">
          </figcaption>
        </figure>
        <Item>{m`\bm{N}`({ style: { transform: "translateY(-0.7em)" } })} residue backbone parameterized by {m`\bm{N}`({ style: { transform: "translateY(-0.7em)" } })} rigid frames. </Item>
        <Item>Each frame is mapped from fixed coordinates {m`\bm{N^*, C^*_\alpha, C^*, O^* \in \mathbb{R}^3}`({ style: { transform: "translateY(-0.9em)" } })} centered on {m`\bm{C^*_\alpha=(0,0,0)}`({ style: { transform: "translateY(-0.7em)" } })}</Item>
        <Item>Atom coordinates of n-th residue: {m`\bm{[N_n, C_n, (C_\alpha)_n] =  T_n \cdot [N^*, C^*, C^*_\alpha]}`({ style: { transform: "translateY(-0.8em)" } })}</Item>
        <Item>Mapping: {m`\bm{T_n \cdot v = r_n v +x_n}`({ style: { transform: "translateY(-0.8em)" } })}</Item>
      </Slide>

      <Slide>
        <figure className="w-3/4 flex flex-col items-center">
          <img src="/figures/torsions_final.svg" alt="molecular structure" className="w-auto h-auto max-w-none" style={{ width: '500px' }} />
          <figcaption className="mt-2 text-sm text-gray-400 italic text-center">
            Backbone dihedral ({m`\bm{\omega,\;\phi,\;\psi}`({ style: { transform: "translateY(-0.8em)" } })}), and side-chain torsion ({m`\bm{\chi}`({ style: { transform: "translateY(-0.7em)" } })}) angles
          </figcaption>
        </figure>
      </Slide>


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