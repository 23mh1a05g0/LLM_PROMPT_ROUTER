# 🧠 LLM Prompt Router — Multi-Domain AI Assistant

## 📌 Project Overview

This project implements an LLM-based prompt routing system that:

1. Classifies user intent
2. Routes queries to specialized expert prompts
3. Generates domain-specific responses using a cloud-hosted LLM

The system supports multiple domains including:

- 👨‍💻 Programming
- 📊 Data & Analytics
- ✍️ Writing Assistance
- 💼 Career Guidance
- 🤔 General Queries

---

## 🏗️ Architecture

User Input  
↓  
Intent Classifier (LLM)  
↓  
Prompt Router  
↓  
Domain Expert Prompt  
↓  
Final Response  

---

## ⚙️ Technologies Used

- Python
- Groq LLM API (Llama-3.1)
- Prompt Engineering
- Docker
- dotenv

---


---


---

## 🚀 How It Works

1. User enters a query
2. The classifier determines the intent using an LLM
3. The router selects an appropriate expert prompt
4. The expert generates a domain-specific response
5. The response is displayed to the user

---

## 🧪 Demo Mode

When the application starts:

1. Predefined test questions run automatically
2. System demonstrates responses across domains
3. Interactive mode starts for user input

---

## 🔑 API Key Setup

This project uses the Groq cloud LLM service.

### Create `.env` file in project root:


> ⚠️ Replace with your actual Groq API key.

---

# 🐳 Run with Docker Compose

## ✅ Prerequisites

Install:

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Internet connection

Docker Compose is included with Docker Desktop.

---

## ▶️ Build and Start Application

From the project root directory:

docker compose up --build

## Testing the Application

After startup, the system will:

Automatically run predefined demo questions
Display responses for each domain
Enter interactive mode

## You will see:

LLM Prompt Router is READY
Ask anything (type 'exit' to quit)

## 👤 You:

Type any question and press Enter.

## 🧪 Example Queries

You can test different domains:

## 👨‍💻 Programming
How do I reverse a list in Python?
## 📊 Data
What is a pivot table?
## ✍️ Writing
Rewrite this sentence to be more professional.
## 💼 Career
How should I prepare for interviews?
## 🤔 General
Hello

## 📚 Use Cases

This architecture can be applied to:
Intelligent chat assistants
Enterprise helpdesk systems
Multi-domain AI copilots
Educational tools
Customer support automation

## ⭐ Key Features

✔ LLM-based intent classification
✔ Dynamic prompt routing
✔ Domain-specific expert responses
✔ Multi-domain support
✔ Automated demo testing
✔ Interactive terminal interface
✔ Cloud-based inference
✔ Fully containerized deployment