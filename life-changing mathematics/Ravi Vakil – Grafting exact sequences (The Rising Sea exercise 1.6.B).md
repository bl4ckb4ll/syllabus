# Ravi Vakil — “Grafting exact sequences” (*The Rising Sea*, Exercise 1.6.B)

Status: source-mapping entry for an exercise inside *The Rising Sea*, not a separate paper.

## Exact source

In the July 27, 2024 public pre-publication version of *The Rising Sea: Foundations of Algebraic Geometry*, Exercise **1.6.B** is titled **“Grafting exact sequences, a variant of the Snake Lemma.”** It occurs in the starred section on spectral sequences.

- Vakil’s publications page for *The Rising Sea*: https://math.stanford.edu/~vakil/preprints.html
- Author-hosted July 27, 2024 pre-publication PDF: https://math.stanford.edu/~vakil/216blog/FOAGjul2724public.pdf
- Vakil’s homepage, which identifies *The Rising Sea* as published by Princeton University Press: https://math.stanford.edu/~vakil/

## Mapping note: “shoots-and-ladders”

The requested description also remembered “shoots-and-ladders” material. I did **not** find a Vakil source with that title or phrase in the verified current *Rising Sea* section or in the 2008 standalone spectral-sequence note. The defensible mapping is therefore to Exercise 1.6.B, “Grafting exact sequences,” because it is precisely the exercise that splices two exact rows into a longer exact sequence through kernels and cokernels.

Do not silently rename this exercise “Shoots and Ladders.” If a different Vakil note was intended by that phrase, that identification remains unresolved.

## Why this is here

The exercise is a good example of a small result that changes how a reader sees diagram chasing. It asks the reader to recognize that two exact rows connected by three vertical maps can be sewn together into one exact sequence passing through the kernels and cokernels of those maps. The point is less the final formula than the structural picture: exact sequences can be composed and reorganized rather than chased one element at a time.

Its placement directly after Vakil’s spectral-sequence treatment of the Snake Lemma makes the pedagogical point sharper. The spectral-sequence machinery is being used as a reusable way to see familiar diagram lemmas and their variants.

## Summary

Start with two exact rows in a commuting diagram and three vertical maps `a`, `b`, and `c`. The exercise asks the reader to show that the rows can be “grafted together” into a single exact sequence containing

`… → W → ker a → ker b → ker c → coker a → coker b → coker c → A′ → …`.

This is presented as a variant of the Snake Lemma. The surrounding section uses double complexes and spectral sequences to recover the Snake Lemma and the Five Lemma without ordinary element-by-element diagram chasing.

## Rights / provenance

*The Rising Sea* is copyrighted and published by Princeton University Press. The author hosts a public pre-publication PDF, but free access is not treated here as permission to redistribute the book. This repository links to Vakil’s copy and records only bibliographic facts and original commentary.

Added 2026-08-31 from the requested Ravi Vakil additions. The exact exercise number and current title were checked in Vakil’s July 27, 2024 public pre-publication PDF. The “shoots-and-ladders” wording is intentionally preserved only as an unresolved memory cue, not asserted as a source title.
