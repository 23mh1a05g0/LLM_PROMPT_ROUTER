
from classifier import classify_intent
from router import generate_response
from test_questions import TEST_QUESTIONS


def process_message(message: str):
    """Runs full AI pipeline for one message"""

    print(f"\n Question: {message}")

    intent_result = classify_intent(message)
    intent = intent_result["intent"]

    print(" Intent:", intent_result)

    final_answer = generate_response(intent, message)

    print("\n AI Response:\n")
    print(final_answer)
    print("\n" + "="*70)

print("\n Running Predefined Test Questions...\n")

for q in TEST_QUESTIONS:
    process_message(q)

print("\n Now you can ask your own questions!")
print("Type 'exit' to quit\n")

while True:
    user_input = input("You: ")

    if user_input.lower() == "exit":
        print("Goodbye!")
        break

    process_message(user_input)