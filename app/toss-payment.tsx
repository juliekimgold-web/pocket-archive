"use client";

import { useEffect, useRef, useState } from "react";

type TossWidgets = {
  setAmount: (amount: { currency: "KRW"; value: number }) => Promise<void>;
  renderPaymentMethods: (options: { selector: string; variantKey: string }) => Promise<{ destroy: () => Promise<void> }>;
  renderAgreement: (options: { selector: string; variantKey: string }) => Promise<{ destroy: () => Promise<void> }>;
  requestPayment: (options: {
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
    customerName: string;
    customerMobilePhone: string;
  }) => Promise<void>;
};

type TossPaymentProps = {
  amount: number;
  items: Array<{ name: string; price: number }>;
  recipient: string;
  phone: string;
  address: string;
};

const TOSS_TEST_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const PAYMENT_API_URL = process.env.NEXT_PUBLIC_TOSS_PAYMENT_API_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function makeOrderId() {
  return `PA_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export default function TossPayment({ amount, items, recipient, phone, address }: TossPaymentProps) {
  const widgetsRef = useRef<TossWidgets | null>(null);
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let paymentMethods: { destroy: () => Promise<void> } | undefined;
    let agreement: { destroy: () => Promise<void> } | undefined;

    async function renderWidgets() {
      try {
        setReady(false);
        setError("");
        const { ANONYMOUS, loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const tossPayments = await loadTossPayments(TOSS_TEST_CLIENT_KEY);
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
        widgetsRef.current = widgets as TossWidgets;
        await widgets.setAmount({ currency: "KRW", value: amount });
        [paymentMethods, agreement] = await Promise.all([
          widgets.renderPaymentMethods({ selector: "#toss-payment-methods", variantKey: "DEFAULT" }),
          widgets.renderAgreement({ selector: "#toss-payment-agreement", variantKey: "AGREEMENT" }),
        ]);
        if (active) setReady(true);
      } catch (caught) {
        console.error(caught);
        if (active) setError("테스트 결제 UI를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    }

    void renderWidgets();
    return () => {
      active = false;
      widgetsRef.current = null;
      void paymentMethods?.destroy();
      void agreement?.destroy();
    };
  }, [amount]);

  const requestPayment = async () => {
    if (!widgetsRef.current || !PAYMENT_API_URL || !SUPABASE_KEY) {
      setError("결제 테스트 환경설정이 완료되지 않았습니다.");
      return;
    }

    setPaying(true);
    setError("");
    const orderId = makeOrderId();
    const orderName = items.length > 1 ? `${items[0].name} 외 ${items.length - 1}건` : items[0]?.name || "Pocket Archive 빈티지 상품";

    try {
      const response = await fetch(PAYMENT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ action: "create", orderId, amount, orderName, recipient, phone, address, items }),
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.message || "주문을 준비하지 못했습니다.");

      sessionStorage.setItem(`pocket-archive-order:${orderId}`, JSON.stringify({ amount, orderName }));
      await widgetsRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: recipient,
        customerMobilePhone: phone.replace(/\D/g, ""),
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "결제 요청을 시작하지 못했습니다.";
      if (!message.toLowerCase().includes("cancel")) setError(message);
      setPaying(false);
    }
  };

  return (
    <section className="toss-test-payment" aria-label="토스페이먼츠 테스트 결제">
      <div className="toss-test-heading"><div><span>TEST PAYMENT · SDK V2</span><h3>결제수단을 선택해 주세요</h3></div><em>실제 결제 없음</em></div>
      <div id="toss-payment-methods" className="toss-widget-slot" />
      <div id="toss-payment-agreement" className="toss-widget-slot agreement" />
      {error && <p className="toss-payment-error" role="alert">{error}</p>}
      <div className="toss-payment-total"><span>최종 테스트 결제금액</span><b>₩{amount.toLocaleString("ko-KR")}</b></div>
      <button className="checkout toss-pay-button" type="button" disabled={!ready || paying || amount < 1} onClick={requestPayment}>{paying ? "결제창 연결 중…" : `₩${amount.toLocaleString("ko-KR")} 테스트 결제하기`}</button>
      <small className="toss-test-notice">토스페이먼츠 공식 테스트 키를 사용합니다. 실제 금액은 청구되지 않습니다.</small>
    </section>
  );
}
