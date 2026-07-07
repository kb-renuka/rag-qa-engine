# ⚡ RAG Q&A Engine
> Real-time Retrieval-Augmented Generation system built with TF-IDF vectorization, cosine similarity retrieval, and the Claude API.

**Built by K B Renuka** | B.Tech CSE (AI & ML) | IBM AI & Cloud Intern

---

## 🧠 What is RAG?

RAG (Retrieval-Augmented Generation) is the architecture behind most production AI systems today (ChatGPT, Perplexity, enterprise search). Instead of relying on a model's memory alone, it:

1. **Retrieves** relevant documents using vector similarity
2. **Augments** the prompt with that context
3. **Generates** a grounded, accurate answer, with citations back to source

---

## 🚀 Features

- 📄 Knowledge base with multiple documents — add your own on the fly
- 🔍 TF-IDF vectorization + cosine similarity retrieval, computed live in the browser
- 🤖 Optional Claude LLM generation — works with or without an API key
- 🔗 Clickable inline citations — jump straight to the source excerpt
- ⚡ Grounded answers — responses cite retrieved context to minimize hallucination

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Retrieval | TF-IDF Vectors + Cosine Similarity (vanilla JavaScript) |
| Generation | Claude API (Anthropic) — optional, bring your own key |
| Frontend | React (via CDN, no build step) |

---

## 📸 How to Run

No installation or build step required.

1. Clone this repo, or just download `index.html`
2. Open `index.html` directly in any browser
3. Ask a question about the sample document, or add your own
4. *(Optional)* Paste your own Anthropic API key to get a full generated answer instead of the raw retrieved passage

**Try it live:** [kb-renuka-rag-engine.netlify.app]

---

## 👩‍💻 About Me

- 🎓 B.Tech CSE (AI & ML), CGPA 8.63
- 🏢 IBM AI & Cloud Intern
- 🔗 [LinkedIn](https://linkedin.com/in/kb-renuka-3rd7578182b0)
