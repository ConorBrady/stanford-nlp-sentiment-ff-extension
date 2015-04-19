A Firefox add-on leveraging the Stanford CoreNLP sentiment library.

### Configuration

A variable of `host` may be set to a custom server at the top of
`data/content-script.js`. Currently it is set to `stanford-nlp.conorbrady.com`.
Any server running the code found on
[this repo](https://github.com/ConorBrady/stanford-nlp-sentiment-api) will suffice.

### Installation

Run `./package` from the root directory with `cfx` installed this will produce
an .xpi Firefox extension that can be installed by dragging and dropping onto
a running Firefox browser.

### Features

On page load the extension will find content such as articles and analyse it
with Stanford's CoreNLP sentiment engine and highlight the text the colour of
the sentiment.
