import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://juliekimgold-web.github.io",
]);

const fulfillmentStatuses = new Set(["NEW", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://juliekimgold-web.github.io",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

function reply(req: Request, data: unknown, status = 200) {
  return Response.json(data, { status, headers: { ...corsHeaders(req), "Cache-Control": "no-store" } });
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = req.headers.get("Authorization") || "";
    const accessToken = authorization.replace(/^Bearer\s+/i, "");

    if (!supabaseUrl || !serviceRoleKey) throw new Error("관리자 서버 설정을 불러오지 못했습니다.");
    if (!accessToken) return reply(req, { message: "로그인이 필요합니다." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    const user = userData.user;

    if (userError || !user) return reply(req, { message: "로그인 정보를 확인할 수 없습니다." }, 401);
    if (user.app_metadata?.role !== "admin") return reply(req, { message: "관리자 권한이 없습니다." }, 403);

    if (req.method === "POST") {
      const body = await req.json();
      if (body.action !== "update_order") return reply(req, { message: "지원하지 않는 작업입니다." }, 400);

      const orderId = cleanText(body.orderId, 80);
      const fulfillmentStatus = cleanText(body.fulfillmentStatus, 20);
      if (!orderId || !fulfillmentStatuses.has(fulfillmentStatus)) {
        return reply(req, { message: "주문번호 또는 배송 상태가 올바르지 않습니다." }, 400);
      }

      const { data, error } = await admin
        .from("test_payment_orders")
        .update({
          fulfillment_status: fulfillmentStatus,
          tracking_number: cleanText(body.trackingNumber, 100),
          admin_note: cleanText(body.adminNote, 500),
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .select("order_id, fulfillment_status, tracking_number, admin_note, updated_at")
        .single();

      if (error) throw error;
      return reply(req, { order: data });
    }

    if (req.method !== "GET") return reply(req, { message: "지원하지 않는 요청입니다." }, 405);

    const [ordersResult, profilesResult, addressesResult, usersResult] = await Promise.all([
      admin
        .from("test_payment_orders")
        .select("order_id, amount, order_name, recipient, phone, address, items, status, payment_method, approved_at, fulfillment_status, tracking_number, admin_note, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(200),
      admin.from("profiles").select("user_id, display_name, phone, marketing_consent, created_at, updated_at"),
      admin.from("addresses").select("user_id, is_default"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (profilesResult.error) throw profilesResult.error;
    if (addressesResult.error) throw addressesResult.error;
    if (usersResult.error) throw usersResult.error;

    const profiles = new Map((profilesResult.data || []).map((profile) => [profile.user_id, profile]));
    const addressCounts = new Map<string, number>();
    for (const address of addressesResult.data || []) {
      addressCounts.set(address.user_id, (addressCounts.get(address.user_id) || 0) + 1);
    }

    const members = usersResult.data.users.map((member) => {
      const profile = profiles.get(member.id);
      return {
        id: member.id,
        email: member.email || "",
        displayName: profile?.display_name || member.user_metadata?.full_name || member.user_metadata?.name || "이름 미등록",
        phone: profile?.phone || "",
        marketingConsent: Boolean(profile?.marketing_consent),
        addressCount: addressCounts.get(member.id) || 0,
        joinedAt: member.created_at,
        lastSignInAt: member.last_sign_in_at,
      };
    });

    const orders = ordersResult.data || [];
    const paidOrders = orders.filter((order) => order.status === "DONE");
    const metrics = {
      orderCount: orders.length,
      paidOrderCount: paidOrders.length,
      totalRevenue: paidOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0),
      actionNeededCount: orders.filter((order) => order.fulfillment_status === "NEW").length,
      memberCount: members.length,
      addressCount: addressesResult.data?.length || 0,
    };

    return reply(req, { metrics, orders, members, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return reply(req, { message: error instanceof Error ? error.message : "관리자 데이터를 처리하지 못했습니다." }, 500);
  }
});
