import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://juliekimgold-web.github.io",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://juliekimgold-web.github.io",
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function reply(req: Request, data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders(req) });
}

function getKeyMap(name: "SUPABASE_PUBLISHABLE_KEYS" | "SUPABASE_SECRET_KEYS") {
  try {
    return JSON.parse(Deno.env.get(name) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function isAuthorized(req: Request) {
  const apiKey = req.headers.get("apikey");
  return Boolean(apiKey && Object.values(getKeyMap("SUPABASE_PUBLISHABLE_KEYS")).includes(apiKey));
}

function adminHeaders() {
  const secretKey = getKeyMap("SUPABASE_SECRET_KEYS").default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secretKey) throw new Error("Supabase server key is not configured.");
  return { "apikey": secretKey, "Content-Type": "application/json" };
}

const orderIdPattern = /^[A-Za-z0-9_-]{6,64}$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return reply(req, { message: "POST 요청만 지원합니다." }, 405);
  if (!isAuthorized(req)) return reply(req, { message: "유효하지 않은 공개 API 키입니다." }, 401);

  try {
    const body = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("Supabase URL is not configured.");

    if (body.action === "create") {
      const amount = Number(body.amount);
      const items = Array.isArray(body.items) ? body.items.slice(0, 30) : [];
      if (!orderIdPattern.test(body.orderId || "") || !Number.isSafeInteger(amount) || amount < 1 || amount > 100000000) {
        return reply(req, { message: "주문번호 또는 결제금액이 올바르지 않습니다." }, 400);
      }
      if (!body.orderName || !body.recipient || !body.phone || !body.address || items.length < 1) {
        return reply(req, { message: "주문 및 배송 정보가 부족합니다." }, 400);
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/test_payment_orders`, {
        method: "POST",
        headers: { ...adminHeaders(), "Prefer": "return=minimal" },
        body: JSON.stringify({
          order_id: body.orderId,
          amount,
          order_name: String(body.orderName).slice(0, 100),
          recipient: String(body.recipient).slice(0, 80),
          phone: String(body.phone).slice(0, 30),
          address: String(body.address).slice(0, 300),
          items: items.map((item: { name?: unknown; price?: unknown }) => ({
            name: String(item.name || "").slice(0, 100),
            price: Number(item.price) || 0,
          })),
        }),
      });
      if (!response.ok) throw new Error(`주문 저장 실패 (${response.status})`);
      return reply(req, { orderId: body.orderId, status: "READY" }, 201);
    }

    if (body.action === "confirm") {
      const amount = Number(body.amount);
      if (!orderIdPattern.test(body.orderId || "") || !body.paymentKey || !Number.isSafeInteger(amount)) {
        return reply(req, { message: "결제 승인 정보가 올바르지 않습니다." }, 400);
      }

      const orderResponse = await fetch(
        `${supabaseUrl}/rest/v1/test_payment_orders?order_id=eq.${encodeURIComponent(body.orderId)}&select=order_id,amount,order_name,status&limit=1`,
        { headers: adminHeaders() },
      );
      if (!orderResponse.ok) throw new Error("주문 정보를 확인하지 못했습니다.");
      const [order] = await orderResponse.json();
      if (!order || order.status !== "READY" || Number(order.amount) !== amount) {
        return reply(req, { message: "저장된 주문금액과 승인금액이 일치하지 않습니다." }, 400);
      }

      const tossSecret = Deno.env.get("TOSS_WIDGET_SECRET_KEY");
      if (!tossSecret) throw new Error("토스페이먼츠 서버 키가 설정되지 않았습니다.");
      const approvalResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${tossSecret}:`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentKey: body.paymentKey, orderId: body.orderId, amount }),
      });
      const payment = await approvalResponse.json();
      if (!approvalResponse.ok) {
        await fetch(`${supabaseUrl}/rest/v1/test_payment_orders?order_id=eq.${encodeURIComponent(body.orderId)}`, {
          method: "PATCH",
          headers: adminHeaders(),
          body: JSON.stringify({ status: "FAILED", updated_at: new Date().toISOString() }),
        });
        return reply(req, { message: payment.message || "토스페이먼츠 결제 승인이 실패했습니다." }, approvalResponse.status);
      }

      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/test_payment_orders?order_id=eq.${encodeURIComponent(body.orderId)}`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({
          status: "DONE",
          payment_key: payment.paymentKey,
          payment_method: payment.method,
          approved_at: payment.approvedAt,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!updateResponse.ok) throw new Error("승인 결과를 저장하지 못했습니다.");
      return reply(req, { orderId: payment.orderId, status: payment.status, method: payment.method, approvedAt: payment.approvedAt });
    }

    return reply(req, { message: "지원하지 않는 결제 작업입니다." }, 400);
  } catch (error) {
    console.error(error);
    return reply(req, { message: error instanceof Error ? error.message : "결제 서버 오류가 발생했습니다." }, 500);
  }
});
