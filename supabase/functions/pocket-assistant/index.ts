import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://juliekimgold-web.github.io",
]);

const requestLog = new Map<string, number[]>();

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

function getPublishableKeys() {
  try {
    return Object.values(JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}") as Record<string, string>);
  } catch {
    return [];
  }
}

function isAuthorized(req: Request) {
  const apiKey = req.headers.get("apikey");
  return Boolean(apiKey && getPublishableKeys().includes(apiKey));
}

function isRateLimited(req: Request) {
  const key = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((time) => now - time < 60_000);
  recent.push(now);
  requestLog.set(key, recent);
  return recent.length > 8;
}

const shopContext = `
너는 서울의 빈티지 쇼핑몰 Pocket Archive의 친절하고 간결한 한국어 AI 가이드다.
상품 탐색, 선물 추천, 상품 상태, 배송과 테스트 결제에만 답한다. 모르는 정보는 추측하지 말고 고객센터 확인이 필요하다고 말한다.
현재 상품: 아토믹 틴 로봇 238,000원, 밤비 프린트 글라스 42,000원(품절), 컴포지션 노트 세트 36,000원, 손뜨개 프렌즈 인형 54,000원, 브라스 메모 클립 28,000원(품절), 스페이스 미키 보틀 68,000원, 미니 테디 컬렉션 89,000원, 레트로 포스트카드 팩 18,000원, 선물박스 포장·쇼핑백 1,000원.
모든 빈티지 상품은 한 점 재고이며 상태와 사용감이 다르다. 상품 상세의 상태 안내를 확인하도록 권한다.
일반 배송은 2~3 영업일이며 국내 주문 70,000원 이상은 무료배송이다. 마이페이지에 배송지를 저장할 수 있고 주문 시 기본 배송지가 자동 적용된다.
현재 결제는 토스페이먼츠 테스트 모드이며 실제 금액은 청구되지 않는다.
답변은 4문장 이내로 하고, 필요하면 상품명과 가격을 명확하게 제시한다. 개인정보, 카드번호, 비밀번호 입력을 요청하지 않는다.
`;

type IncomingMessage = { role?: unknown; content?: unknown };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return reply(req, { message: "POST 요청만 지원합니다." }, 405);
  if (!isAuthorized(req)) return reply(req, { message: "유효하지 않은 공개 API 키입니다." }, 401);
  if (isRateLimited(req)) return reply(req, { message: "질문이 잠시 몰렸어요. 1분 뒤 다시 시도해주세요." }, 429);

  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (!groqKey) return reply(req, { message: "AI 상담 키가 아직 서버에 설정되지 않았습니다." }, 503);

  try {
    const body = await req.json();
    const rawMessages = Array.isArray(body.messages) ? body.messages.slice(-6) as IncomingMessage[] : [];
    const messages = rawMessages
      .filter((message) => (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
      .map((message) => ({ role: message.role as "user" | "assistant", content: String(message.content).slice(0, 800) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") return reply(req, { message: "질문을 입력해주세요." }, 400);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: shopContext }, ...messages],
        temperature: 0.35,
        max_completion_tokens: 350,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 429) return reply(req, { message: "무료 AI 사용량이 잠시 제한됐어요. 잠시 후 다시 시도해주세요." }, 429);
      console.error("Groq API error", response.status, result?.error?.code || "unknown");
      return reply(req, { message: "AI 상담이 잠시 쉬고 있어요. 잠시 후 다시 시도해주세요." }, 502);
    }

    const message = result?.choices?.[0]?.message?.content;
    if (typeof message !== "string" || !message.trim()) return reply(req, { message: "답변을 준비하지 못했어요. 다시 질문해주세요." }, 502);
    return reply(req, { message: message.trim() });
  } catch (error) {
    console.error(error);
    return reply(req, { message: "AI 상담 요청을 처리하지 못했습니다." }, 500);
  }
});
