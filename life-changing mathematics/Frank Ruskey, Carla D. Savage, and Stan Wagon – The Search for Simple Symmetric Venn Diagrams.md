# Frank Ruskey, Carla D. Savage, and Stan Wagon — *The Search for Simple Symmetric Venn Diagrams*

Published in *Notices of the American Mathematical Society* 53, no. 11 (December 2006), pp. 1304–1311.

## Links

- Author-maintained article page, including corrected figures and a downloadable copy: https://webhome.cs.uvic.ca/~ruskey/Publications/VennNAMS/VennNAMS.html
- Author-hosted PDF: https://webhome.cs.uvic.ca/~ruskey/Publications/VennNAMS/fea-wagon.pdf
- AMS issue PDF: https://www.ams.org/notices/200611/200611FullIssue.pdf
- Frank Ruskey and Mark Weston, *A Survey of Venn Diagrams*: https://www.combinatorics.org/files/Surveys/ds5/VennEJC.html
- Stan Wagon and Peter Webb, *Venn Symmetry and Prime Numbers: A Seductive Proof Revisited* (2008): https://www-users.cse.umn.edu/~webb/Publications/WagonWebbOnVenn6.pdf

## Thanks

We are grateful to Frank Ruskey, Carla Savage, and Stan Wagon for writing a paper that takes one of the most familiar elementary pictures in mathematics and shows how quickly it opens into topology, graph theory, combinatorics, and number theory. Ruskey’s author page is particularly valuable because it preserves a downloadable copy and corrected versions of figures whose colors were inconsistent in the published version.

## Why this is here

This is exactly the kind of paper that can change somebody’s idea of what mathematics is. A Venn diagram begins as something almost embarrassingly elementary. The paper asks what the picture really means once circles are replaced by arbitrary simple closed Jordan curves, then adds symmetry and simplicity requirements and discovers genuine structure: prime numbers, the Boolean lattice, symmetric-chain decompositions, planar duality, Euler’s formula, and constructive questions that remain difficult even when the statement is easy to explain.

Its exposition is also unusually good. The main questions can be understood before most of the machinery is introduced, and each new piece of mathematics answers a question created by the pictures rather than appearing as detached formalism.

## Summary

An `n`-Venn diagram consists of `n` simple closed Jordan curves whose intersections cut the plane into exactly the `2^n` possible inside/outside membership regions, each nonempty and connected. Ordinary circles cannot do this once `n ≥ 4`, but arbitrary Jordan curves can.

The paper concentrates on diagrams with `n`-fold rotational symmetry. A necessary condition is immediate once regions are grouped by their rank—the number of curves containing them. For every intermediate rank `r`, the number of regions is the binomial coefficient `C(n,r)`. Rotational symmetry forces these regions into orbits of size `n`, so `n` must divide every intermediate binomial coefficient. That happens exactly when `n` is prime.

The deeper question is construction. The authors translate a Venn diagram into a planar graph and then take its geometric dual. The desired regions correspond naturally to the vertices of the Boolean `n`-cube. Since the whole cube is nonplanar for `n ≥ 4`, one instead searches for a planar, monotone spanning subgraph. Symmetric-chain decompositions of the Boolean lattice provide the combinatorial skeleton needed for such constructions when `n` is prime.

The paper then asks for **simple** diagrams, where exactly two curves meet at each crossing. Euler’s formula gives a sharp numerical target for how many vertices such a diagram must have. The symmetric-chain construction is not fully simple, but additional edges in the planar dual substantially improve it, producing “half-simple” highly symmetric examples. The 11-set constructions make the gap between a clean existence theorem and a visually/locally simple construction especially concrete.

The later Wagon–Webb note is a useful companion because it revisits the short argument that rotational symmetry forces primality and makes explicit a Jordan-curve point that the traditional presentation had glossed over.

## Sources cited by the paper

The paper’s bibliography is unusually useful as a short route into the subject:

1. Barry Cipra, Peter Hamburger, and Edit Hepp, “Aesthetic aspects of Venn diagrams,” *Proceedings of the 2005 Bridges Conference on Mathematical Connections in Art, Music and Science* (2005), 339–342.
2. Bette Bultena and Frank Ruskey, “Venn diagrams with few vertices,” *Electronic Journal of Combinatorics* 5 (1998), R44.
3. Anthony W. F. Edwards, “Seven-set Venn diagrams with rotational and polar symmetry,” *Combinatorics, Probability and Computing* 7 (1998), 149–152.
4. Curtis Greene and Daniel J. Kleitman, “Strong versions of Sperner’s theorem,” *Journal of Combinatorial Theory, Series A* 20 (1976), 80–88.
5. Jerrold Griggs, Charles E. Killian, and Carla D. Savage, “Venn diagrams and symmetric chain decompositions in the Boolean lattice,” *Electronic Journal of Combinatorics* 11(1) (2004), R2.
6. Branko Grünbaum, “Venn diagrams and independent families of sets,” *Mathematics Magazine* 48 (1975), 12–23.
7. Branko Grünbaum, “Venn diagrams II,” *Geombinatorics* 2 (1992), 25–32.
8. Peter Hamburger, “Doodles and doilies, non-simple symmetric Venn diagrams,” *Discrete Mathematics* 257 (2002), 423–439.
9. Peter Hamburger, Gy. Petruska, and A. Sali, “Saturated chain partitions in ranked partially ordered sets, and non-monotone symmetric 11-Venn diagrams,” *Studia Scientiarum Mathematicarum Hungarica* 41 (2004), 147–191.
10. D. W. Henderson, “Venn diagrams for more than four classes,” *American Mathematical Monthly* 70 (1963), 424–426.
11. Joan P. Hutchinson, “Three coloring Siamese trees,” personal communication (2006).
12. Joan P. Hutchinson and Stan Wagon, “Kempe revisited,” *American Mathematical Monthly* 105 (1998), 170–174.
13. Charles E. Killian, Frank Ruskey, Carla D. Savage, and Mark Weston, “Half-simple symmetric Venn diagrams,” *Electronic Journal of Combinatorics* 11(1) (2004), R86.
14. Frank Ruskey and Mark Weston, “A survey of Venn diagrams,” *Electronic Journal of Combinatorics* 4, Dynamic Survey DS5 (1997; updated 2001 and 2005).
15. John Venn, “On the diagrammatic and mechanical representation of propositions and reasonings,” *The London, Edinburgh, and Dublin Philosophical Magazine and Journal of Science* 9 (1880), 1–18.
16. Douglas B. West, *Introduction to Graph Theory*, 2nd ed. (2001).

## Corrections and follow-up

Ruskey’s article page notes a color-order error beginning in Figure 5(b) that propagates into several later figures and supplies corrected images. The final Venn diagram itself has the intended mathematical properties; the problem is the consistency of curve coloring with the bit patterns.

Wagon and Peter Webb’s 2008 note, *Venn Symmetry and Prime Numbers: A Seductive Proof Revisited*, should be read alongside the paper because it repairs a subtle point in the customary argument involving the location of the rotational fixed point and Jordan curves.

## Provenance

Added 2026-08-31 after recalling the paper as an example of a Venn-diagram article that could be mathematically formative. The summary and evaluative comments above are original to this repository; the bibliography is transcribed and normalized from the paper’s own references.
