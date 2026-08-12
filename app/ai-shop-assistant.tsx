"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const starter: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "안녕하세요. 포켓 아카이브의 물건, 배송, 결제에 대해 무엇이든 물어보세요.",
};

const quickQuestions = ["선물하기 좋은 상품 추천", "상품 상태 등급 안내", "배송은 얼마나 걸리나요?"];

export default function AiShopAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([starter]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);

  useEffect(() => {
    if (open) requestAnimationFrame(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }));
  }, [messages, open, sending]);

  const ask = async (question: string) => {
    const content = question.trim().slice(0, 500);
    if (!content || sending) return;

    messageIdRef.current += 1;
    const userMessage: ChatMessage = { id: `user-${messageIdRef.current}`, role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    setError("");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !publishableKey) {
      setError("AI 상담 연결이 아직 준비되지 않았습니다.");
      setSending(false);
      return;
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/pocket-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: publishableKey },
        body: JSON.stringify({
          messages: nextMessages.slice(-6).map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "AI 상담 답변을 불러오지 못했습니다.");
      messageIdRef.current += 1;
      setMessages((current) => [...current, {
        id: `assistant-${messageIdRef.current}`,
        role: "assistant",
        content: String(result.message || "답변을 준비하지 못했어요. 다시 질문해주세요."),
      }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI 상담 연결에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(draft);
  };

  return (
    <aside className={`ai-assistant ${open ? "is-open" : ""}`} aria-label="Pocket Archive AI 상담">
      {open && (
        <section className="ai-chat-panel">
          <header className="ai-chat-heading">
            <div className="ai-guide-portrait" aria-hidden="true">
              <img src="/characters/pocket-guide.webp" alt="" />
            </div>
            <div className="ai-guide-title"><span>POCKET GUIDE · AI</span><strong>무엇을 찾아드릴까요?</strong><small>작은 상점지기 포키예요</small></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="AI 상담 닫기">×</button>
          </header>
          <div className="ai-chat-log" ref={logRef} aria-live="polite">
            {messages.map((message) => (
              <div className={`ai-message is-${message.role}`} key={message.id}>
                <span>{message.role === "assistant" ? "GUIDE" : "YOU"}</span>
                <p>{message.content}</p>
              </div>
            ))}
            {sending && <div className="ai-message is-assistant is-typing"><span>GUIDE</span><p><i /><i /><i /></p></div>}
            {error && <p className="ai-chat-error" role="alert">{error}</p>}
          </div>
          {messages.length < 3 && (
            <div className="ai-quick-questions">
              {quickQuestions.map((question) => <button type="button" onClick={() => void ask(question)} key={question}>{question}</button>)}
            </div>
          )}
          <form className="ai-chat-form" onSubmit={submit}>
            <label htmlFor="ai-shop-question">AI에게 질문하기</label>
            <div>
              <input id="ai-shop-question" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder="상품이나 배송에 대해 물어보세요" autoComplete="off" />
              <button type="submit" disabled={sending || !draft.trim()} aria-label="질문 보내기">→</button>
            </div>
          </form>
          <small>AI가 부정확할 수 있습니다. 개인정보·결제정보는 입력하지 마세요.</small>
        </section>
      )}
      <button className="ai-assistant-toggle" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={open ? "AI 상담 닫기" : "AI 상담 열기"}>
        <span className="ai-toggle-character" aria-hidden="true"><img src="/characters/pocket-guide.webp" alt="" /></span>
        <span className="ai-toggle-copy"><small>{open ? "POCKET GUIDE" : "무엇을 도와드릴까요?"}</small><b>{open ? "CLOSE" : "AI GUIDE"}</b></span>
      </button>
    </aside>
  );
}
