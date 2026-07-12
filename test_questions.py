"""
Test questions for the LLM Prompt Router.

Covers clear intents, ambiguous inputs, short inputs, typos,
multi-intent messages, and off-topic requests.
"""

TEST_QUESTIONS = [
    # ── Code (clear) ──────────────────────────────────────────────────
    "how do i sort a list of objects in python?",
    "explain this sql query for me",
    "fxi thsi bug pls: for i in range(10) print(i)",
    "I need to write a function that takes a user id and returns their profile.",

    # ── Data (clear) ─────────────────────────────────────────────────
    "what's the average of these numbers: 12, 45, 23, 67, 34",
    "what is a pivot table",

    # ── Writing (clear) ──────────────────────────────────────────────
    "This paragraph sounds awkward, can you help me fix it?",
    "Rewrite this sentence to be more professional.",
    "My boss says my writing is too verbose.",

    # ── Career (clear) ───────────────────────────────────────────────
    "I'm preparing for a job interview, any tips?",
    "How do I structure a cover letter?",
    "I'm not sure what to do with my career.",

    # ── Unclear / Edge cases ─────────────────────────────────────────
    "Help me make this better.",
    "hey",
    "Can you write me a poem about clouds?",

    # ── Multi-intent ─────────────────────────────────────────────────
    "I need to write a function that takes a user id and returns their profile, but also i need help with my resume.",
]