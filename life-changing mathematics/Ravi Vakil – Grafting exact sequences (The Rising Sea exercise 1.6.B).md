# Ravi Vakil — “Grafting exact sequences” (*The Rising Sea*, Exercise 1.6.B)

Status: related source inside *The Rising Sea*; distinct from Vakil’s 3Blue1Brown-hosted *Puzzling through exact sequences*.

## Exact source

In the July 27, 2024 public pre-publication version of *The Rising Sea: Foundations of Algebraic Geometry*, Exercise **1.6.B** is titled **“Grafting exact sequences, a variant of the Snake Lemma.”** It occurs in the starred section on spectral sequences.

- Vakil’s publications page for *The Rising Sea*: https://math.stanford.edu/~vakil/preprints.html
- Author-hosted July 27, 2024 pre-publication PDF: https://math.stanford.edu/~vakil/216blog/FOAGjul2724public.pdf
- Vakil’s homepage, which identifies *The Rising Sea* as published by Princeton University Press: https://math.stanford.edu/~vakil/
- Separate 3Blue1Brown-hosted picturebook, *Puzzling through exact sequences*: https://www.3blue1brown.com/blog/exact-sequence-picturebook/

## Source-mapping correction

This exercise was initially used as a tentative match for a remembered “shoots-and-ladders” exact-sequence item. That mapping was wrong. The user clarified the phrase as **“Chutes and Ladders”** and, decisively, remembered that the item was hosted by **3Blue1Brown**. Those clues identify the separate Vakil work *Puzzling through exact sequences: A Bedtime Story with Pictures*.

Keep this entry only because “Grafting exact sequences” is independently useful related material in *The Rising Sea*. Do not cite it as the source of the “Chutes and Ladders” recollection.

## Why this is here

The exercise is a good example of a small result that changes how a reader sees diagram chasing. It asks the reader to recognize that two exact rows connected by three vertical maps can be sewn together into one exact sequence passing through the kernels and cokernels of those maps. The point is less the final formula than the structural picture: exact sequences can be composed and reorganized rather than chased one element at a time.

Its placement directly after Vakil’s spectral-sequence treatment of the Snake Lemma makes the pedagogical point sharper. The spectral-sequence machinery is being used as a reusable way to see familiar diagram lemmas and their variants.

## Summary

Start with two exact rows in a commuting diagram and three vertical maps `a`, `b`, and `c`. The exercise asks the reader to show that the rows can be “grafted together” into a single exact sequence containing

`… → W → ker a → ker b → ker c → coker a → coker b → coker c → A′ → …`.

This is presented as a variant of the Snake Lemma. The surrounding section uses double complexes and spectral sequences to recover the Snake Lemma and the Five Lemma without ordinary element-by-element diagram chasing.

## Rights / provenance

*The Rising Sea* is copyrighted and published by Princeton University Press. The author hosts a public pre-publication PDF, but free access is not treated here as permission to redistribute the book. This repository links to Vakil’s copy and records only bibliographic facts and original commentary.

Added 2026-08-31 as related Vakil material. Source mapping corrected the same day after the user identified 3Blue1Brown as the host of the separately requested exact-sequence picturebook.