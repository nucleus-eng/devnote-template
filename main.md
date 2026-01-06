---
abstract: |
  The abstract should briefly describe what this DevNote is about in a few sentences. If it's describing an experiment, it should answer the questions what did you do? what did you find? You can safely assume that the reader is well versed in the PURE system and synthetic cells. An example: "We implemented an energy module based on the bifunctional PPK2 enzyme that converts polyphosphate (PolyP) into ATP. We found that it increases the performance of Base Cytosol by 25% when the concentration of magnesium is optimized".
---

# Overview

Use this the overview section to introduce any important or useful contextualizing information. This shouldn't be a broad survey of the literature. It should include information that will help readers understand what you did and why you did it. A schematic {ref}`fig:FA_metabolism` is often useful for quickly communicating what you did it. This figure will also be the one to appear in the index on the DevNote site and when it's shared via URL (i.e. social and link previews).

DevNotes are intended to be engineering tools. They are designed to communicate interesting results and thoughts effectively and usefully. 

It can also be a space to express musings, concerns, etc. For example, a template describing other types of DevNotes should probably exist. In the future, we plan to address this. 

:::{figure} ./general/schematic-FA_metabolism.png
:label: fig:FA_metabolism
:width: 75%
Reaction pathway for the production of 10-formyl-THF from Folinic acid by MTHFS. The formyl group used in fMet synthesis is highlighted in yellow. We highlight a nonchanging portion of the molecule in blue for visual convenience.
:::

## Section headings are not fixed

Not every DevNote has to look the same. If additional sections help you to communicate, feel free to include them. We find that the following high-level sections capture most use cases:

- Overview
- Results
  - Result 1
  - Result 2
  - Result 3
- Conclusions and next steps

Also, feel free to make use of bullet points, they provide a quick way of communicating important information.

# Results

## My first result

The centerpiece of most results sections are going to be figures and tables. Figures can be created by 1) referencing a path to a figure in your project or 2) by referencing the output of a jupyter notebook cell directly. If the figure is the output of a jupyter notebook cell, we recommend referencing the cell directory.

In order to make sure the particular jupyter notebook is known to the project, the specific file must be referenced in the file `curvenote.yml`:

```
toc:
    - file: main.md
    - file: experiments/experiment-01/20250220-analysis.ipynb
    - file: experiments/experiment-02/yet-another-jupyter-notebook.ipynb
```

The main thing to keep in mind is that the first file should be `main.md`. If the jupyter notebook is not properly referenced, the figure will not render. Another thing to keep in mind is that the first line of your jupyter notebook should be labelled thoughtfully. For example, the first line should be something like `# Analysis YYYY-MM-DD` since this is what will appear in the supporting documents menu. 

Now that your jupyter notebook has been linked to the project by including a reference to it in the `curvenote.yml` file, let's take a look at a common scenario for presenting data from a fluorescent platereader experiment. We have decided to include a detailed [table](table-experimental-params) describing the experimental parameters {ref}`table-experimental-params`. Notice the two different ways to create a reference to this same table, they both make use of the `label` option within the table. These patterns also work for figures.

Following the table, we've made use of a feature called tabsets that allow us to present two different figures side by side. Think of it as a way to create panels without having to open up Illustrator or Powerpoint. The basic syntax pattern goes like this:

```
:::::{tab-set}

::::{tab-item} name-of-tab-01
:::{figure} reference-to-figure
My caption.
:::
::::

::::{tab-item} name-of-tab-02
:::{figure} reference-to-figure
My caption.
:::
::::

:::::

```

Now, notice in the two figures included in the tab set how the first figure with label "Time series" references a figure using `#fig:kinetcs`. This is referring to a specific jupyter notebook cell that has been so labelled. If you open the file `experiments/experiment-01/20250220-analysis.ipynb` you can see that some of the cells have something like `#| label: fig:kinetics` in their very first line. This allows them to be referenced in this document by appending a `#` to the label. Meanwhile, the second figure with label "End point" is created by referencing a similar output that was saved as a `.png` file, specifically `/experiments/experiment-01/MTHFS_endpoint.png`. Note that other items like tables can also be included in tab sets. 


:::{table} Description of experimental parameters
:label: table-experimental-params
:align: center

| Condition | Description |
| --- | --- |
| No Folinic Acid  | Energy mix made without folinic acid. |
| Folinic  | Folinic acid dissolved in water, added to energy mix. |
| Folinic + MTHFS  | Folinic acid dissolved in water, added to energy mix + 0.07 µg/uL MTHFS supplemented to PURE reaction.  |
| 5,10-methenyl-THF | Folinic acid pre-converted using Shimizu’s method. |
| Positive Control | Standard NEB PURExpress reaction. |
| Negative Control | NEB PURExpress without input DNA. |

:::

:::::{tab-set}

::::{tab-item} Time series
:::{figure} #fig:kinetics
:name: fig-kinetics
:align: center
:width: 50%

Steady state fluorescence measurements comparing PURE system performance across different folinic acid preparations and MTHFS enzyme concentrations. 
:::
::::

::::{tab-item} End point
:::{figure} ./experiments/experiment-01//MTHFS_endpoint.png
:name: fig-endpoint
:align: center
:width: 50%

Translation kinetics of PURE system reactions under different folinic acid conditions and MTHFS supplementation. The graph shows plamGFP fluorescence measurements over time.
:::
::::

:::::

## My second result

This section is left to you to fill in with your own data. As a final point, it's very simple to reference existing literature by DOI. For example, the original PURE [paper](https://doi.org/10.1038/90802) by Shimizu can be found here [](https://doi.org/10.1038/90802). Again notice the two different ways of referencing the paper and how they are reflected in the rendered output. The same syntax can be used for other [URLs](https://devnotes.bnext.bio/). However, these will generally not offer a [tooltip](https://en.wikipedia.org/wiki/Tooltip), unless it's from wikipedia 😉. Note that all links to DOI citations will be included at the end of the Developer Note in a Reference section where they will appear as formatted citations. 

# Conclusions and next steps

In this Developer Note we've discussed a few important points for writing your first DevNote:

- Include a schematic at the start, it shows up when you share the link to it with others.
- How to prepare figures and tables, panels of figures with `{tab-item}`, and how to create figures from linked jupyter notebook cells. 
- How to include internal references to tables and figures in your document using `label` and `[]()` syntax as well as how to create external references to papers by DOI using similar syntax. 

As a next step, consider examining the file `example.md` as an example of an actual [DevNote](
https://doi.org/10.63765/hrvh2868). Also consider looking at existing DevNotes that are published, many of those containing experimental data have an active `Launch Jupyter` button in the upper right corner that will allow you to explore the entire project directory, this [one](https://doi.org/10.63765/djnv7772) gives a nice example.

We look forward to receiving your DevNote submission! 🚀 🧬