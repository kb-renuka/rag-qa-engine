import { useState, useRef, useEffect } from "react";

const SAMPLE_DOCS = [
  {
    id: 1,
    title: "AI in Healthcare",
    content: `Artificial intelligence is transforming healthcare by enabling faster and more accurate diagnoses. 
    Machine learning models trained on medical imaging data can detect cancers, diabetic retinopathy, and cardiac anomalies 
    with accuracy matching or exceeding human specialists. Deep learning algorithms analyze X-rays, MRIs, and CT scans 
    in seconds. AI-powered drug discovery has reduced the time to identify promising compounds from years to months. 
    Natural language processing extracts insights from millions of clinical notes, helping doctors spot patterns 
    invisible to the human eye. Predictive models forecast patient deterioration hours before it happens, allowing 
    early intervention. Wearables and IoT sensors feed real-time data into AI systems that monitor chronic conditions 
    like diabetes and heart disease continuously. Robotic surgery systems guided by AI achieve sub-millimeter precision.
    AI chatbots handle routine patient queries 24/7, reducing hospital workloads. The global AI in healthcare market 
    is projected to reach $188 billion by 2030.`
  },
  {
    id: 2,
    title: "Climate Change & Renewable Energy",
    content: `Climate change is one of the most urgent challenges of our time. Global temperatures have risen by 
    approximately 1.1°C above pre-industrial levels, driven by greenhouse gas emissions from fossil fuels, 
    deforestation, and agriculture. The Paris Agreement aims to limit warming to 1.5°C. Solar energy costs have 
    fallen 90% in the last decade, making it the cheapest source of electricity in history. Wind power now 
    generates over 2,000 TWh globally per year. Battery storage technology, led by lithium-ion batteries, 
    is enabling grids to store renewable energy for use when the sun isn't shining or the wind isn't blowing. 
    Electric vehicles are replacing internal combustion engines; EV sales surpassed 10 million in 2022. 
    Green hydrogen produced from renewable electricity is emerging as a clean fuel for heavy industry and aviation. 
    Carbon capture technologies are being deployed to remove CO2 directly from the atmosphere. 
    The renewable energy sector now employs over 12 million people worldwide. Nations that transition early 
    stand to gain significant economic advantages in the new clean energy economy.`
  },
  {
    id: 3,
    title: "Quantum Computing",
    content: `Quantum computing harnesses the principles of quantum mechanics to process information in fundamentally 
    different ways than classical computers. While classical bits represent either 0 or 1, quantum bits (qubits) 
    can exist in superposition, representing 0 and 1 simultaneously. Entanglement allows qubits to be correlated 
    across distances, enabling massive parallel computation. Google's quantum processor Sycamore performed in 
    200 seconds a calculation that would take classical supercomputers 10,000 years. IBM has built a 1,000-qubit 
    quantum processor. Quantum computers excel at optimization problems, cryptography, drug simulation, and 
    machine learning. They threaten to break current RSA encryption, driving the development of post-quantum 
    cryptography standards. Quantum error correction remains a major challenge since qubits are fragile and 
    prone to decoherence. Companies like IonQ, Rigetti, and startups worldwide are racing to achieve 
    fault-tolerant quantum computing. Quantum advantage — where quantum computers definitively outperform 
    classical ones on practical problems — is expected to arrive within this decade.`
  }
];

function cosineSimilarity(a, b) {
  const words = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  let dot = 0, magA = 0, magB = 0;
  for (const w of words) {
    const va = a[w] || 0, vb = b[w] || 0;
    dot += va * vb; magA += va * va; magB += vb * vb;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

function toTFVector(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  const tf = {};
  words.forEach(w => { tf[w] = (tf[w] || 0) + 1; });
  return tf;
}

function retrieveContext(query, docs, topK = 2) {
  const qVec = toTFVector(query);
  return docs
    .map(doc => ({ doc, score: cosineSimilarity(qVec, toTFVector(doc.content)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(x => x.score > 0);
}

async function askClaude(query, contextDocs) {
  const contextText = contextDocs.map(({ doc }) =>
    `[Document: ${doc.title}]\n${doc.content}`
  ).join("\n\n");

  const systemPrompt = `You are a precise RAG (Retrieval-Augmented Generation) assistant. 
Answer the user's question ONLY using the provided document context. 
If the answer isn't in the context, say so clearly. 
Be concise and cite which document your answer comes from.
Format: Answer in 2-4 sentences, then add "📄 Source: [Document Title]"`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: `Context:\n${contextText}\n\nQuestion: ${query}` }]
    })
  });
  const data = await response.json();
  return data.content?.[0]?.text || "Unable to get response.";
}

const SUGGESTED = [
  "How does AI help detect diseases?",
  "What is quantum superposition?",
  "How cheap has solar energy become?",
  "What is the Paris Agreement target?",
  "How fast is Google's quantum processor?",
];

export default function RAGApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [retrievedDocs, setRetrievedDocs] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAsk = async (q) => {
    const query = q || input.trim();
    if (!query || loading) return;
    setInput("");

    const retrieved = retrieveContext(query, SAMPLE_DOCS);
    setRetrievedDocs(retrieved.map(r => r.doc.id));

    setMessages(prev => [...prev, { role: "user", text: query }]);
    setLoading(true);

    try {
      const answer = await askClaude(query, retrieved);
      setMessages(prev => [...prev, {
        role: "assistant",
        text: answer,
        sources: retrieved.map(r => r.doc.title)
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "API error. Please check your connection.",
        sources: []
      }]);
    } finally {
      setLoading(false);
      setRetrievedDocs([]);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#e8e8f0",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        borderBottom: "1px solid #1e1e2e",
        padding: "18px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#0d0d15"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>RAG Q&A Engine</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Built by K B Renuka</div>
          </div>
        </div>
        <div style={{
          background: "#12122a", border: "1px solid #2d2d4a",
          borderRadius: 20, padding: "4px 12px",
          fontSize: 11, color: "#7c3aed", fontWeight: 600
        }}>LIVE DEMO</div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{
          width: 240, borderRight: "1px solid #1e1e2e",
          background: "#0d0d15", padding: "20px 16px", overflowY: "auto"
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#4b5563", letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" }}>
            📚 Knowledge Base
          </div>
          {SAMPLE_DOCS.map(doc => (
            <div key={doc.id} onClick={() => setActiveDoc(activeDoc === doc.id ? null : doc.id)}
              style={{
                padding: "10px 12px", borderRadius: 8, marginBottom: 8, cursor: "pointer",
                border: `1px solid ${retrievedDocs.includes(doc.id) ? "#7c3aed" : "#1e1e2e"}`,
                background: retrievedDocs.includes(doc.id) ? "#1a0a2e" : "transparent"
              }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: retrievedDocs.includes(doc.id) ? "#a78bfa" : "#d1d5db" }}>
                {retrievedDocs.includes(doc.id) && "🔍 "}{doc.title}
              </div>
              {activeDoc === doc.id && (
                <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.6, marginTop: 6 }}>
                  {doc.content.slice(0, 150)}…
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Ask anything about the knowledge base</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 32 }}>
                  This RAG system retrieves relevant documents and generates grounded answers.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {SUGGESTED.map((s, i) => (
                    <button key={i} onClick={() => handleAsk(s)} style={{
                      background: "#111120", border: "1px solid #2d2d4a",
                      borderRadius: 20, padding: "8px 14px",
                      fontSize: 12, color: "#a78bfa", cursor: "pointer"
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 16
              }}>
                <div style={{
                  maxWidth: "75%", padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                  background: msg.role === "user" ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "#111120",
                  border: msg.role === "assistant" ? "1px solid #1e1e2e" : "none",
                  fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap"
                }}>
                  {msg.text}
                  {msg.sources?.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #2d2d4a", display: "flex", gap: 6 }}>
                      {msg.sources.map((s, j) => (
                        <span key={j} style={{
                          fontSize: 10, background: "#1a0a2e",
                          border: "1px solid #7c3aed33",
                          borderRadius: 12, padding: "2px 8px", color: "#a78bfa"
                        }}>📄 {s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                  background: "#111120", border: "1px solid #1e1e2e",
                  borderRadius: "4px 16px 16px 16px", padding: "12px 16px",
                  display: "flex", gap: 4
                }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#7c3aed",
                      animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite`
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div style={{ padding: "16px 28px", borderTop: "1px solid #1e1e2e", background: "#0d0d15" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAsk()}
                placeholder="Ask a question about the knowledge base..."
                style={{
                  flex: 1, background: "#111120", border: "1px solid #2d2d4a",
                  borderRadius: 10, padding: "12px 16px",
                  fontSize: 13, color: "#e8e8f0", outline: "none"
                }}/>
              <button onClick={() => handleAsk()} disabled={loading || !input.trim()}
                style={{
                  background: loading || !input.trim() ? "#1e1e2e" : "linear-gradient(135deg, #7c3aed, #3b82f6)",
                  border: "none", borderRadius: 10, padding: "12px 20px",
                  fontSize: 18, cursor: loading || !input.trim() ? "not-allowed" : "pointer"
                }}>➤</button>
            </div>
            <div style={{ fontSize: 10, color: "#4b5563", marginTop: 8, textAlign: "center" }}>
              RAG Pipeline: TF Vector Search → Cosine Similarity Retrieval → Claude LLM Generation
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
    </div>
  );
}
