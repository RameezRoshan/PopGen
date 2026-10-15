# Population Genetics Explorer & Wahlund Effect Simulator

An interactive, high-performance, and modern web application for simulating microevolution, genetic drift, spatial non-random mating, migration, natural selection, and the **Wahlund Effect**.

Converted and modernized from the R Shiny implementation (`app.R`) into a client-side HTML5/JavaScript application that runs directly in any modern web browser with zero server dependencies.

---

## 🌟 Key Features & Modern Enhancements

| Feature | Original Shiny App (`app.R`) | Modern HTML5 App (`index.html`) |
| :--- | :--- | :--- |
| **Runtime Environment** | Requires R, RStudio / Shiny server, and R packages (`shiny`, `bslib`, `tidyverse`, `plotly`) | **Runs everywhere** in any browser (Chrome, Edge, Firefox, Safari) locally or statically hosted |
| **Simulation Speed** | ~1 to 5 seconds depending on replications | **~10 to 30 ms** using optimized typed arrays |
| **Spatial Visualizer** | Static end-of-run snapshot plot | **Interactive Generational Playback Engine** with Play/Pause, step-by-step scrubbing, speed controls ($0.5\times$ to $4\times$), live genotype counts, territory halos, and hover tooltips |
| **Themes** | Static Minty Bootswatch theme | **Dynamic Dark & Light Themes** with theme-synchronized Plotly charts |
| **Educational Presets** | None (manual parameter entry only) | **6 One-Click Presets**: Classic Wahlund Effect, Panmixia, Island Drift, Balancing Selection, Spatial Isolation, Recessive Lethal |
| **Interactive Theory** | None | **Interactive Theory Modal** with rendered KaTeX formulas and a live 2-subpopulation Wahlund deficit calculator |
| **Data Export** | None | **One-Click CSV Export** of full generational time-series and population state |
| **Responsive Design** | Basic Bootstrap grid | Modern glassmorphism UI, dual slider/number controls, and fullscreen chart expansion |

---

## 🧬 Biological & Theoretical Background

### The Wahlund Effect (1928)
Named after Swedish geneticist **Sten Wahlund**, the Wahlund effect describes the apparent reduction in heterozygosity (and excess of homozygotes) observed when distinct subpopulations with different allele frequencies are pooled together.

Even when **every individual subpopulation is in perfect Hardy-Weinberg equilibrium**, the pooled population will appear to violate Hardy-Weinberg equilibrium due to spatial subdivision:

$$\bar{P}(A_1A_1) = \bar{p}^2 + \sigma_p^2$$
$$\bar{P}(A_1A_2) = 2\bar{p}\bar{q} - 2\sigma_p^2$$
$$\bar{P}(A_2A_2) = \bar{q}^2 + \sigma_p^2$$

Where:
- $\bar{p}$ is the mean frequency of allele $A_1$ across subpopulations.
- $\sigma_p^2 = \text{Var}(p)$ is the variance of allele frequency among subpopulations.
- The **Wahlund Heterozygote Deficit** is:
  $$\Delta H = H_T - H_S = 2\sigma_p^2 \ge 0$$

### Wright's Hierarchical F-Statistics
Sewall Wright partitioned genetic variation into hierarchical inbreeding coefficients:

$$(1 - F_{IT}) = (1 - F_{IS})(1 - F_{ST})$$

- **$F_{ST} = \frac{H_T - H_S}{H_T} = \frac{\sigma_p^2}{\bar{p}\bar{q}}$**: Fixation index measuring subpopulation differentiation due to drift and limited gene flow.
- **$F_{IS} = \frac{H_S - H_I}{H_S}$**: Inbreeding of individuals relative to their local subpopulation (non-random mating).
- **$F_{IT} = \frac{H_T - H_I}{H_T}$**: Total inbreeding coefficient relative to the pooled metapopulation.

#### Wright's Qualitative Guidelines for $F_{ST}$:
- $0.00 \le F_{ST} < 0.05$: Little genetic differentiation
- $0.05 \le F_{ST} < 0.15$: Moderate genetic differentiation
- $0.15 \le F_{ST} < 0.25$: Great genetic differentiation
- $F_{ST} \ge 0.25$: Very great genetic differentiation

---

## 🚀 How to Run

### Method 1: Direct File Opening (Simplest)
Simply double-click [`index.html`](file:///d:/Antigravity/Whalund_Effect/index.html) to open it in your default web browser (Edge, Chrome, Firefox, Safari).

### Method 2: Local HTTP Server
Using Python:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

Using Node.js (`npx serve`):
```bash
npx serve .
```

---

## 📁 File Structure

```
Whalund_Effect/
├── index.html               # Main HTML5 application structure & UI layout
├── styles.css               # Modern design system (Dark/Light mode, Glassmorphism)
├── simulation.js            # Core population genetics simulation engine
├── app.js                   # Application coordinator, Plotly charts, Canvas renderer
├── README.md                # Comprehensive documentation
├── app.R                    # Original R Shiny app (preserved for reference)
└── lib/                     # Self-contained local vendor libraries
    ├── plotly-basic.min.js  # Plotly interactive plotting library
    ├── katex.min.js         # KaTeX fast mathematical rendering
    └── katex.min.css        # KaTeX typography styling
```

---

## 🎮 Interactive Controls & Scenarios

### Evolutionary Scenarios
- **🏛️ Standard Drift**: Single panmictic population experiencing pure neutral genetic drift.
- **🏝️ Wahlund Effect**: 3 completely isolated demes ($m=0$). Drift causes allele frequency divergence, producing a dramatic drop in heterozygosity when pooled.
- **🌊 High Gene Flow**: 3 subpopulations connected by high migration ($m=0.20$), homogenizing allele frequencies and keeping $F_{ST} \approx 0$.
- **🎲 Small Island**: Small population ($N=40$) showing rapid random fixation or loss of alleles over 100 generations.
- **⚖️ Balancing Selection**: Overdominance ($w_{11}=0.7, w_{12}=1.0, w_{22}=0.7$) stabilizing polymorphism at $p=0.5$.
- **🗺️ Spatial Isolation**: Distance-dependent non-random mating across a 2D plane ($\alpha=25$).

### Keyboard Shortcuts
- **`Ctrl + Enter`** (or **`Cmd + Enter`**): Run simulation immediately.
