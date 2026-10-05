# Emotion index

This directory is a many-to-many classification index for poetry and, later, other material in the syllabus repository.

The initial labels follow the Poetry Foundation emotion vocabulary already documented in `../poetry-foundation/topics-and-emotions.md`:

- Anger
- Anxiety & Insecurity
- Blame & Guilt
- Boredom
- Disappointment
- Gratitude
- Grief
- Humor
- Joy & Contentment
- Melancholy & Despair
- Optimism
- Passion

Canonical texts stay in their normal location. Emotion directories contain **Git symbolic links**, so one work may belong to several emotional categories without duplicating the work.

This is deliberately classifier-shaped: later automated or machine-learned classification can add or remove symbolic links while leaving canonical source files untouched. Human corrections should remain possible because the directory structure itself is the label set.

## Initial classification

`Jack London – Ode to a Scab.md` is linked under **Anger** and **Blame & Guilt**. The poem is an openly accusatory attack on strikebreaking; these labels describe the work's emotional/rhetorical posture rather than the feelings of every reader.
