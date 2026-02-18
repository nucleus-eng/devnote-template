# README

[Developer Notes](https://devnotes.nucleus.engineering/) (DevNotes) are a concise form of scientific communication designed to rapidly share insights and results of interest to the Nucleus and broader synthetic cell communities. Since they are built on top of Jupyter Notebooks, DevNotes can easily integrate code and a variety of file types, bundling an entire research workflow into a discrete package.

If you are new to DevNotes, begin by reading the documentation for getting started with [Nucleus Hub](https://docs.nucleus.engineering/guides/nucleus-hub/nucleus-hub/) and writing your first [DevNote](https://docs.nucleus.engineering/guides/developer-notes/developer-notes/). DevNotes are the primary vehicle through which Covered Source for Nucleus will be distributed, pursuant to the Notice below. Results and insights that are highly useful and/or relevant to the Nucleus community will be integrated into the [Nucleus Distribution](https://docs.nucleus.engineering/) by the Core Development Team at b.next.

## Getting started

This template is intended to be accessed from [Nucleus Hub](https://nucleus.engineering/hub/).

## How to use this template

This template contains a few markdown `.md` template files to help you get started writing a DevNote:

- `main.md` is a "meta" DevNote: a DevNote that describes how to write a DevNote.
- `template-blank.md` is a (nearly) blank DevNote that let's the more experienced developer get started on a new project quickly.
- `template-example.md` is an actual that can be [viewed](https://devnotes.bnext.bio/articles/cytosol-module-mthfs) on Developer Notes and provides an example of a complete contribution.

The typical workflow for creating a DevNote that includes experimental data will involve populating the `./experiments/` directory with experimental directories. An experiment is typically at the scale of a single well plate or less. An example experimental directory is included in this template project:

- `./experiments/experiment-01/` is the experimental directory supporting the contribution described in `template-example.md`.

## Website

Visit the Nucleus Ecosystem at https://nucleus.engineering/.


## How to cite

Please cite Developer Notes as *Author(s), Title, Year, URL/DOI*.


## Notice

The contents of this DevNote are Covered Source and licensed under the CERN-OHL-P-2.0 (see LICENSE.md). The non-executable text (e.g. main.md) of this Developer Note is available under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/deed.en) and may be reused with appropriate attribution. This DevNote may make use of the [Nucleus CDK](https://pypi.org/project/nucleus-cdk/) which is available under the [MIT license](https://opensource.org/license/mit). 

## Thanks

All contributors to the project are listed at https://nucleus.bnext.bio/collaborators.

## Contact

If you have problems, questions, ideas, or suggestions, please contact us at build@bnext.bio.