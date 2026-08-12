"use client";

import { useEffect, useState } from "react";

type PaymentState = "confirming" | "success" | "fail";

export default function PaymentResult({ mode }: { mode: "success" | "fail" }) {
  const [state, setState] = useState<PaymentState>(mode === "fail" ? "fail" : "confirming");
  const [message, setMessage] = useState(mode === "fail" ? "결제가 취소되었거나 인증에 실패했습니다." : "결제 정보를 안전하게 확인하고 있습니다.");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextOrderId = params.get("orderId") || "";
    const nextAmount = Number(params.get("amount") || 0);
    setOrderId(nextOrderId);
    setAmount(nextAmount);

    if (mode === "fail") {
      const code = params.get("code");
      setMessage(code === "PAY_PROCESS_CANCELED" ? "결제 과정을 취소했습니다. 주문서에서 다시 시도할 수 있어요." : params.get("message") || "결제 인증에 실패했습니다.");
      return;
    }

    const paymentKey = params.get("paymentKey");
    const apiUrl = process.env.NEXT_PUBLIC_TOSS_PAYMENT_API_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const saved = sessionStorage.getItem(`pocket-archive-order:${nextOrderId}`);
    const expected = saved ? JSON.parse(saved) as { amount: number } : null;
    if (!paymentKey || !nextOrderId || !nextAmount || !apiUrl || !publicKey || expected?.amount !== nextAmount) {
      setState("fail");
      setMessage("주문 금액을 확인할 수 없어 결제를 승인하지 않았습니다.");
      return;
    }

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: publicKey },
      body: JSON.stringify({ action: "confirm", paymentKey, orderId: nextOrderId, amount: nextAmount }),
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "테스트 결제 승인에 실패했습니다.");
      sessionStorage.removeItem(`pocket-archive-order:${nextOrderId}`);
      setState("success");
      setMessage("토스페이먼츠 테스트 결제가 정상적으로 승인되었습니다.");
    }).catch((error: Error) => {
      setState("fail");
      setMessage(error.message);
    });
  }, [mode]);

  return (
    <main className={`payment-result-page is-${state}`}>
      <a className="payment-result-logo" href="/"><img src="/pocket-archive-sign-cropped.png" alt="Pocket Archive" /></a>
      <section className="payment-result-card">
        <span>{state === "confirming" ? "VERIFYING PAYMENT" : state === "success" ? "TEST PAYMENT COMPLETE" : "PAYMENT NOT COMPLETED"}</span>
        <div className="payment-result-symbol">{state === "confirming" ? <i /> : state === "success" ? "✓" : "!"}</div>
        <h1>{state === "confirming" ? "결제를 확인하고 있어요" : state === "success" ? "테스트 결제가 완료됐어요" : "결제를 완료하지 못했어요"}</h1>
        <p>{message}</p>
        {orderId && <dl><div><dt>주문번호</dt><dd>{orderId}</dd></div>{amount > 0 && <div><dt>결제금액</dt><dd>₩{amount.toLocaleString("ko-KR")}</dd></div>}</dl>}
        <a className="payment-result-button" href={state === "success" ? "/" : "/#new"}>{state === "success" ? "쇼핑 계속하기" : "주문서로 돌아가기"}</a>
        <small>TEST MODE · 실제 금액은 청구되지 않습니다.</small>
      </section>
    </main>
  );
}
