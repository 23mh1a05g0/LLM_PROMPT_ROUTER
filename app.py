"""
CLI Application – LLM Prompt Router

Runs the test suite then drops into an interactive REPL.
Supports manual intent override via @code, @data, @writing, @career prefix.
"""

from router import process_message
from test_questions import TEST_QUESTIONS


def display_result(message: str, result: dict):
    """Pretty-print a routing result."""
    intent = result["intent"]
    confidence = result["confidence"]
    response = result["response"]

    # Intent → emoji map
    icons = {
        "code": "🧑‍💻",
        "data": "📊",
        "writing": "✍️",
        "career": "💼",
        "unclear": "🤔",
    }
    icon = icons.get(intent, "❓")

    print(f"\n{'─' * 70}")
    print(f"📨  Message:    {message}")
    print(f"{icon}  Intent:     {intent}  (confidence: {confidence:.2f})")
    print(f"{'─' * 70}")
    print(f"\n{response}\n")
    print(f"{'═' * 70}")


def main():
    print("\n" + "═" * 70)
    print("   🚀  LLM PROMPT ROUTER — Intent Classification & Routing")
    print("═" * 70)

    # ── Run predefined test questions ─────────────────────────────────
    print(f"\n📋  Running {len(TEST_QUESTIONS)} test questions...\n")

    for i, question in enumerate(TEST_QUESTIONS, 1):
        print(f"\n[{i}/{len(TEST_QUESTIONS)}]", end="")
        result = process_message(question)
        display_result(question, result)

    # ── Interactive mode ──────────────────────────────────────────────
    print("\n" + "═" * 70)
    print("   💬  Interactive Mode")
    print("   Type a message, or use @code/@data/@writing/@career prefix")
    print("   Type 'exit' or 'quit' to stop")
    print("═" * 70 + "\n")

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye! 👋")
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit"):
            print("Goodbye! 👋")
            break

        result = process_message(user_input)
        display_result(user_input, result)


if __name__ == "__main__":
    main()