"use client";
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../supabase-client";
import "./admin.css";

type AdminOrder = {
  order_id: string;
  amount: number;
  order_name: string;
  recipient: string;
  phone: string;
  address: string;
  items: Array<{ name?: string; price?: number }>;
  status: "READY" | "DONE" | "FAILED";
  payment_method: string | null;
  approved_at: string | null;
  fulfillment_status: FulfillmentStatus;
  tracking_number: string;
  admin_note: string;
  created_at: string;
  updated_at: string;
};

type FulfillmentStatus = "NEW" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

type AdminMember = {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  marketingConsent: boolean;
  addressCount: number;
  joinedAt: string;
  lastSignInAt: string | null;
};

type DashboardData = {
  metrics: {
    orderCount: number;
    paidOrderCount: number;
    totalRevenue: number;
    actionNeededCount: number;
    memberCount: number;
    addressCount: number;
  };
  orders: AdminOrder[];
  members: AdminMember[];
  generatedAt: string;
};

type View = "overview" | "orders" | "members";
type Gate = "loading" | "signed-out" | "unauthorized" | "ready" | "error";

const fulfillmentLabels: Record<FulfillmentStatus, string> = {
  NEW: "신규 주문",
  PREPARING: "상품 준비 중",
  SHIPPED: "발송 완료",
  DELIVERED: "배송 완료",
  CANCELLED: "처리 취소",
};

const paymentLabels = { READY: "결제 대기", DONE: "결제 완료", FAILED: "결제 실패" } as const;
const money = new Intl.NumberFormat("ko-KR");

function shortDate(value: string | null) {
  if (!value) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function userName(user: User | null) {
  return String(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "관리자");
}

async function functionErrorMessage(error: unknown) {
  const context = (error as { context?: Response })?.context;
  if (context?.json) {
    try {
      const payload = await context.json();
      if (payload?.message) return String(payload.message);
    } catch {
      // The response body can be unavailable after the client has consumed it.
    }
  }
  return error instanceof Error ? error.message : "관리자 서버에 연결하지 못했습니다.";
}

export default function AdminPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [gate, setGate] = useState<Gate>(supabase ? "loading" : "error");
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [query, setQuery] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [notice, setNotice] = useState(supabase ? "" : "Supabase 환경 설정을 확인해 주세요.");
  const [orderDrafts, setOrderDrafts] = useState<Record<string, Pick<AdminOrder, "fulfillment_status" | "tracking_number" | "admin_note">>>({});

  const loadDashboard = useCallback(async (currentUser: User) => {
    if (!supabase) {
      setGate("error");
      setNotice("Supabase 환경 설정을 확인해 주세요.");
      return;
    }
    setUser(currentUser);
    setGate("loading");
    const { data: dashboard, error } = await supabase.functions.invoke("admin-dashboard", { method: "GET" });
    if (error) {
      const message = await functionErrorMessage(error);
      setNotice(message);
      setGate(message.includes("권한") ? "unauthorized" : "error");
      return;
    }
    const nextData = dashboard as DashboardData;
    setData(nextData);
    setOrderDrafts(Object.fromEntries(nextData.orders.map((order) => [order.order_id, {
      fulfillment_status: order.fulfillment_status,
      tracking_number: order.tracking_number || "",
      admin_note: order.admin_note || "",
    }])));
    setNotice("");
    setGate("ready");
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!active) return;
      const currentUser = sessionData.session?.user ?? null;
      if (!currentUser) {
        setGate("signed-out");
        return;
      }
      void loadDashboard(currentUser);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === "INITIAL_SESSION") return;
      if (!session?.user) {
        setUser(null);
        setGate("signed-out");
      }
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadDashboard, supabase]);

  const signIn = async () => {
    if (!supabase) return;
    setGate("loading");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin/` },
    });
    if (error) {
      setGate("signed-out");
      setNotice("Google 로그인을 시작하지 못했습니다.");
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setGate("signed-out");
  };

  const updateDraft = (orderId: string, field: "fulfillment_status" | "tracking_number" | "admin_note", value: string) => {
    setOrderDrafts((current) => ({
      ...current,
      [orderId]: { ...current[orderId], [field]: value },
    }));
  };

  const saveOrder = async (orderId: string) => {
    const draft = orderDrafts[orderId];
    if (!supabase || !draft) return;
    setBusyOrderId(orderId);
    setNotice("");
    const { data: response, error } = await supabase.functions.invoke("admin-dashboard", {
      body: {
        action: "update_order",
        orderId,
        fulfillmentStatus: draft.fulfillment_status,
        trackingNumber: draft.tracking_number,
        adminNote: draft.admin_note,
      },
    });
    if (error) {
      setNotice(await functionErrorMessage(error));
    } else {
      const saved = response.order as Partial<AdminOrder>;
      setData((current) => current ? {
        ...current,
        orders: current.orders.map((order) => order.order_id === orderId ? { ...order, ...saved } : order),
      } : current);
      setNotice(`${orderId} 주문의 배송 정보를 저장했습니다.`);
    }
    setBusyOrderId("");
  };

  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const filteredOrders = (data?.orders || []).filter((order) => !normalizedQuery || [order.order_id, order.order_name, order.recipient, order.phone].some((value) => value.toLocaleLowerCase("ko-KR").includes(normalizedQuery)));
  const filteredMembers = (data?.members || []).filter((member) => !normalizedQuery || [member.displayName, member.email, member.phone].some((value) => value.toLocaleLowerCase("ko-KR").includes(normalizedQuery)));

  if (gate !== "ready" || !data) {
    return (
      <main className="admin-gate">
        <a className="admin-gate-logo" href="/"><img src="/pocket-archive-sign-cropped.png" alt="Pocket Archive" /></a>
        <section className="admin-gate-card">
          <span>POCKET ARCHIVE · STAFF ONLY</span>
          {gate === "loading" ? (
            <><div className="admin-loader"><i /><i /><i /></div><h1>운영실을 여는 중입니다</h1><p>관리자 권한과 최신 주문 기록을 안전하게 확인하고 있어요.</p></>
          ) : gate === "signed-out" ? (
            <><h1>관리자 로그인이<br />필요합니다</h1><p>승인된 Google 계정으로 로그인하면 주문과 회원 정보를 관리할 수 있습니다.</p><button type="button" onClick={signIn}><b>G</b> Google로 관리자 로그인</button></>
          ) : gate === "unauthorized" ? (
            <><em>ACCESS DENIED</em><h1>관리자 권한이 없는<br />계정입니다</h1><p>{notice || "일반 회원 계정으로는 운영 데이터에 접근할 수 없습니다."}</p><div className="admin-gate-actions"><button type="button" onClick={signOut}>다른 계정으로 로그인</button><a href="/">쇼핑몰로 돌아가기</a></div></>
          ) : (
            <><em>CONNECTION ERROR</em><h1>운영실을 불러오지<br />못했습니다</h1><p>{notice}</p><div className="admin-gate-actions"><button type="button" onClick={() => user && loadDashboard(user)}>다시 시도</button><a href="/">쇼핑몰로 돌아가기</a></div></>
          )}
        </section>
      </main>
    );
  }

  const navItems: Array<{ id: View; number: string; label: string; count?: number }> = [
    { id: "overview", number: "01", label: "운영 요약" },
    { id: "orders", number: "02", label: "주문 · 배송", count: data.metrics.actionNeededCount },
    { id: "members", number: "03", label: "회원", count: data.metrics.memberCount },
  ];

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/"><img src="/pocket-archive-sign-cropped.png" alt="Pocket Archive" /></a>
        <div className="admin-room-label"><span>PRIVATE OFFICE</span><strong>상점 운영실</strong><small>ADMINISTRATION</small></div>
        <nav aria-label="관리자 메뉴">
          {navItems.map((item) => (
            <button type="button" className={view === item.id ? "is-active" : ""} key={item.id} onClick={() => { setView(item.id); setQuery(""); }}>
              <span>{item.number}</span><b>{item.label}</b>{item.count !== undefined && <em>{item.count}</em>}
            </button>
          ))}
        </nav>
        <div className="admin-shortcuts"><span>QUICK LINKS</span><a href="/">쇼핑몰 보기 ↗</a><a href="/journal/">아티클 보기 ↗</a><a href="/mypage/">마이페이지 ↗</a></div>
        <button className="admin-signout" type="button" onClick={signOut}>로그아웃</button>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div><span>POCKET ARCHIVE · SEOUL</span><b>{shortDate(data.generatedAt)} 기준</b></div>
          <div className="admin-profile"><span>{userName(user).slice(0, 1)}</span><div><b>{userName(user)}</b><small>Administrator</small></div></div>
        </header>

        {notice && <div className="admin-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")}>닫기</button></div>}

        {view === "overview" && (
          <div className="admin-view">
            <div className="admin-title"><div><span>DAILY STORE REPORT</span><h1>오늘의 상점 운영</h1><p>주문과 회원 현황을 한눈에 확인하고, 필요한 작업부터 처리하세요.</p></div><button type="button" onClick={() => user && loadDashboard(user)}>새로고침 ↻</button></div>
            <div className="metric-grid">
              <article className="metric-card is-featured"><span>결제 완료 금액</span><strong>₩ {money.format(data.metrics.totalRevenue)}</strong><small>{data.metrics.paidOrderCount}건의 테스트 결제</small></article>
              <article className="metric-card"><span>전체 주문</span><strong>{String(data.metrics.orderCount).padStart(2, "0")}</strong><small>저장된 주문 기록</small></article>
              <article className="metric-card"><span>처리 필요</span><strong>{String(data.metrics.actionNeededCount).padStart(2, "0")}</strong><small>신규 배송 작업</small></article>
              <article className="metric-card"><span>가입 회원</span><strong>{String(data.metrics.memberCount).padStart(2, "0")}</strong><small>배송지 {data.metrics.addressCount}개 등록</small></article>
            </div>
            <div className="overview-grid">
              <section className="admin-paper recent-orders">
                <div className="paper-heading"><div><span>RECENT ORDERS</span><h2>최근 주문</h2></div><button type="button" onClick={() => setView("orders")}>전체 보기 →</button></div>
                {data.orders.slice(0, 5).map((order) => <button className="order-summary-row" type="button" key={order.order_id} onClick={() => setView("orders")}><span className={`fulfillment-dot is-${order.fulfillment_status.toLocaleLowerCase()}`} /><div><b>{order.order_name}</b><small>{order.recipient} · {shortDate(order.created_at)}</small></div><strong>{money.format(order.amount)}원</strong><em>{fulfillmentLabels[order.fulfillment_status]}</em></button>)}
                {!data.orders.length && <div className="admin-empty">아직 저장된 주문이 없습니다.</div>}
              </section>
              <section className="admin-paper workflow-board">
                <div className="paper-heading"><div><span>FULFILLMENT</span><h2>배송 진행판</h2></div></div>
                {(Object.keys(fulfillmentLabels) as FulfillmentStatus[]).slice(0, 4).map((status) => {
                  const count = data.orders.filter((order) => order.fulfillment_status === status).length;
                  return <div className="workflow-row" key={status}><span>{fulfillmentLabels[status]}</span><div><i style={{ width: `${data.orders.length ? Math.max(8, count / data.orders.length * 100) : 0}%` }} /></div><b>{count}</b></div>;
                })}
              </section>
            </div>
          </div>
        )}

        {view === "orders" && (
          <div className="admin-view">
            <div className="admin-title"><div><span>ORDER DESK</span><h1>주문 · 배송 관리</h1><p>결제 내역을 확인하고 배송 단계와 운송장 정보를 기록할 수 있습니다.</p></div></div>
            <label className="admin-search"><span>SEARCH</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="주문번호, 상품명, 구매자 검색" /><b>{filteredOrders.length}건</b></label>
            <div className="order-admin-list">
              {filteredOrders.map((order) => {
                const draft = orderDrafts[order.order_id];
                return <article className="order-admin-card" key={order.order_id}>
                  <div className="order-card-head"><div><span>{order.order_id}</span><h2>{order.order_name}</h2><small>{shortDate(order.created_at)}</small></div><div><em className={`payment-badge is-${order.status.toLocaleLowerCase()}`}>{paymentLabels[order.status]}</em><strong>{money.format(order.amount)}원</strong></div></div>
                  <div className="order-card-body">
                    <dl><div><dt>받는 분</dt><dd>{order.recipient}</dd></div><div><dt>연락처</dt><dd>{order.phone}</dd></div><div><dt>배송지</dt><dd>{order.address}</dd></div><div><dt>결제 수단</dt><dd>{order.payment_method || "—"}</dd></div></dl>
                    <div className="order-items"><span>ORDER ITEMS</span>{Array.isArray(order.items) && order.items.length ? order.items.map((item, index) => <p key={`${order.order_id}-${index}`}><b>{item.name || "상품"}</b><em>{money.format(Number(item.price || 0))}원</em></p>) : <p><b>{order.order_name}</b><em>{money.format(order.amount)}원</em></p>}</div>
                  </div>
                  {draft && <div className="fulfillment-editor">
                    <label><span>배송 상태</span><select value={draft.fulfillment_status} onChange={(event) => updateDraft(order.order_id, "fulfillment_status", event.target.value)}>{(Object.keys(fulfillmentLabels) as FulfillmentStatus[]).map((status) => <option key={status} value={status}>{fulfillmentLabels[status]}</option>)}</select></label>
                    <label><span>운송장 번호</span><input value={draft.tracking_number} onChange={(event) => updateDraft(order.order_id, "tracking_number", event.target.value)} placeholder="발송 후 입력" /></label>
                    <label className="note-field"><span>내부 메모</span><input value={draft.admin_note} onChange={(event) => updateDraft(order.order_id, "admin_note", event.target.value)} placeholder="고객에게 보이지 않는 운영 메모" /></label>
                    <button type="button" onClick={() => saveOrder(order.order_id)} disabled={busyOrderId === order.order_id}>{busyOrderId === order.order_id ? "저장 중…" : "변경 저장"}</button>
                  </div>}
                </article>;
              })}
              {!filteredOrders.length && <div className="admin-empty">검색 조건에 맞는 주문이 없습니다.</div>}
            </div>
          </div>
        )}

        {view === "members" && (
          <div className="admin-view">
            <div className="admin-title"><div><span>MEMBER LEDGER</span><h1>회원 장부</h1><p>가입 계정, 최근 접속, 저장된 배송지 현황을 확인할 수 있습니다.</p></div></div>
            <label className="admin-search"><span>SEARCH</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="회원명, 이메일, 연락처 검색" /><b>{filteredMembers.length}명</b></label>
            <section className="member-ledger admin-paper">
              <div className="member-ledger-head"><span>회원</span><span>연락처</span><span>배송지</span><span>최근 접속</span><span>가입일</span></div>
              {filteredMembers.map((member) => <article key={member.id}><div><i>{member.displayName.slice(0, 1)}</i><p><b>{member.displayName}</b><small>{member.email}</small></p></div><span>{member.phone || "미등록"}</span><span>{member.addressCount}개</span><span>{shortDate(member.lastSignInAt)}</span><span>{shortDate(member.joinedAt)}</span></article>)}
              {!filteredMembers.length && <div className="admin-empty">검색 조건에 맞는 회원이 없습니다.</div>}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
