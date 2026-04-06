from src.agent.ai_agent import ask_agent


question = "How many delivered orders do we have?"

result = ask_agent(question)

print("Question:", result["question"])
print("SQL:", result["sql"])
print("Answer:", result["answer"])
print("Row count:", result["row_count"])
print("Rows:", result["rows"])
