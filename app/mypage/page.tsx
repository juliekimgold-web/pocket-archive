"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import KakaoAddressSearch, { type DeliveryAddress } from "../kakao-address-search";
import KakaoMap from "../kakao-map";
import { getSupabaseBrowserClient } from "../supabase-client";
import "./mypage.css";

type MemberProfile = {
  displayName: string;
  phone: string;
  marketingConsent: boolean;
};

type SavedAddress = {
  id: number;
  label: string;
  recipient: string;
  phone: string;
  zonecode: string;
  address: string;
  extra: string;
  detail: string;
  is_default: boolean;
};

type AddressDraft = DeliveryAddress & {
  label: string;
  recipient: string;
  phone: string;
  isDefault: boolean;
};

const emptyDeliveryAddress: DeliveryAddress = { zonecode: "", address: "", detail: "", extra: "" };
const emptyAddressDraft: AddressDraft = {
  ...emptyDeliveryAddress,
  label: "우리 집",
  recipient: "",
  phone: "",
  isDefault: false,
};

function userName(user: User) {
  return String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Pocket Archive 회원");
}

export default function MyPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState<MemberProfile>({ displayName: "", phone: "", marketingConsent: false });
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [draft, setDraft] = useState<AddressDraft>(emptyAddressDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [mapAddressId, setMapAddressId] = useState<number | null>(null);

  const loadMemberData = async (currentUser: User) => {
    if (!supabase) return;
    setLoading(true);
    const [profileResult, addressResult] = await Promise.all([
      supabase.from("profiles").select("display_name, phone, marketing_consent").eq("user_id", currentUser.id).maybeSingle(),
      supabase.from("addresses").select("id, label, recipient, phone, zonecode, address, extra, detail, is_default").eq("user_id", currentUser.id).order("is_default", { ascending: false }).order("created_at", { ascending: true }),
    ]);

    if (profileResult.error || addressResult.error) {
      setNotice("회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } else {
      setProfile({
        displayName: profileResult.data?.display_name || userName(currentUser),
        phone: profileResult.data?.phone || "",
        marketingConsent: Boolean(profileResult.data?.marketing_consent),
      });
      setAddresses((addressResult.data || []) as SavedAddress[]);
      const loadedAddresses = (addressResult.data || []) as SavedAddress[];
      setMapAddressId((current) => current ?? loadedAddresses.find((item) => item.is_default)?.id ?? loadedAddresses[0]?.id ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      if (!data.session?.user) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      if (!session?.user) setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (user) void loadMemberData(user);
  }, [user]);

  const signIn = async () => {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/mypage` },
    });
    if (error) {
      setNotice("Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.");
      setBusy(false);
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user || !profile.displayName.trim()) return;
    setBusy(true);
    setNotice("");

    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      display_name: profile.displayName.trim(),
      phone: profile.phone.trim(),
      marketing_consent: profile.marketingConsent,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (!error) {
      await supabase.auth.updateUser({ data: { full_name: profile.displayName.trim() } });
      setNotice("회원정보를 저장했습니다.");
    } else {
      setNotice("회원정보를 저장하지 못했습니다.");
    }
    setBusy(false);
  };

  const resetAddressForm = () => {
    setEditingId(null);
    setDraft({ ...emptyAddressDraft, recipient: profile.displayName, phone: profile.phone });
  };

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user || !draft.zonecode || !draft.detail.trim()) return;
    setBusy(true);
    setNotice("");

    const shouldBeDefault = draft.isDefault || addresses.length === 0;
    if (shouldBeDefault) {
      const { error } = await supabase.from("addresses").update({ is_default: false, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      if (error) {
        setNotice("기본 배송지 설정을 변경하지 못했습니다.");
        setBusy(false);
        return;
      }
    }

    const payload = {
      user_id: user.id,
      label: draft.label.trim(),
      recipient: draft.recipient.trim(),
      phone: draft.phone.trim(),
      zonecode: draft.zonecode,
      address: draft.address,
      extra: draft.extra,
      detail: draft.detail.trim(),
      is_default: shouldBeDefault,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase.from("addresses").update(payload).eq("id", editingId).eq("user_id", user.id)
      : await supabase.from("addresses").insert(payload);

    if (result.error) {
      setNotice("배송지를 저장하지 못했습니다. 입력 내용을 확인해주세요.");
    } else {
      setNotice(editingId ? "배송지를 수정했습니다." : "새 배송지를 저장했습니다.");
      resetAddressForm();
      await loadMemberData(user);
    }
    setBusy(false);
  };

  const editAddress = (item: SavedAddress) => {
    setEditingId(item.id);
    setDraft({
      label: item.label,
      recipient: item.recipient,
      phone: item.phone,
      zonecode: item.zonecode,
      address: item.address,
      extra: item.extra,
      detail: item.detail,
      isDefault: item.is_default,
    });
    document.querySelector("#address-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setDefaultAddress = async (id: number) => {
    if (!supabase || !user) return;
    setBusy(true);
    const cleared = await supabase.from("addresses").update({ is_default: false, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    const selected = cleared.error
      ? cleared
      : await supabase.from("addresses").update({ is_default: true, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
    setNotice(selected.error ? "기본 배송지를 변경하지 못했습니다." : "기본 배송지를 변경했습니다.");
    await loadMemberData(user);
    setBusy(false);
  };

  const deleteAddress = async (id: number) => {
    if (!supabase || !user) return;
    setBusy(true);
    const deleting = addresses.find((item) => item.id === id);
    const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      setNotice("배송지를 삭제하지 못했습니다.");
    } else {
      const remaining = addresses.filter((item) => item.id !== id);
      if (deleting?.is_default && remaining.length) {
        await supabase.from("addresses").update({ is_default: true, updated_at: new Date().toISOString() }).eq("id", remaining[0].id).eq("user_id", user.id);
      }
      setNotice("배송지를 삭제했습니다.");
      if (editingId === id) resetAddressForm();
      await loadMemberData(user);
    }
    setBusy(false);
  };

  if (!supabase) {
    return <main className="mypage-gate"><div><span>ACCOUNT CONFIGURATION</span><h1>마이페이지를 연결할 수 없습니다.</h1><p>Supabase 환경설정을 확인해주세요.</p><a href="/">홈으로 돌아가기</a></div></main>;
  }

  if (loading) {
    return <main className="mypage-gate"><div className="account-loading"><span /><span /><span /></div></main>;
  }

  if (!user) {
    return (
      <main className="mypage-gate">
        <a className="mypage-logo" href="/"><img src="/pocket-archive-sign-cropped.png" alt="Pocket Archive 홈" /></a>
        <div className="login-ledger">
          <span>MEMBER'S ARCHIVE</span>
          <h1>당신의 작은 서랍을<br />열어보세요.</h1>
          <p>회원정보와 배송지를 안전하게 보관하고 다음 주문을 더 편하게 준비할 수 있어요.</p>
          <button type="button" onClick={signIn} disabled={busy}><b>G</b>{busy ? "연결 중..." : "Google로 로그인"}</button>
          {notice && <small>{notice}</small>}
        </div>
      </main>
    );
  }

  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const joinedAt = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(new Date(user.created_at));
  const mappedAddress = addresses.find((item) => item.id === mapAddressId) ?? null;

  return (
    <main className="mypage-shell">
      <header className="mypage-header">
        <a href="/" className="mypage-brand"><img src="/pocket-archive-sign-cropped.png" alt="Pocket Archive 홈" /></a>
        <div><span>MEMBER'S ARCHIVE</span><a href="/">쇼핑 계속하기 →</a></div>
      </header>

      <section className="member-hero">
        <div className="member-avatar">{avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : profile.displayName.slice(0, 1)}</div>
        <div><span>WELCOME BACK · {joinedAt} 가입</span><h1>{profile.displayName || userName(user)}님의<br /><i>개인 보관함</i></h1></div>
        <dl><div><dt>LOGIN</dt><dd>Google</dd></div><div><dt>ADDRESSES</dt><dd>{String(addresses.length).padStart(2, "0")}</dd></div><div><dt>MEMBER</dt><dd>Archive</dd></div></dl>
      </section>

      <div className="mypage-layout">
        <aside className="account-nav">
          <span>MY DRAWERS</span>
          <a href="#profile"><b>01</b> 회원정보</a>
          <a href="#addresses"><b>02</b> 배송지 관리 <em>{addresses.length}</em></a>
          <a href="/#reviews"><b>03</b> 나의 리뷰</a>
          <button type="button" onClick={() => supabase.auth.signOut()}>로그아웃</button>
        </aside>

        <div className="account-content">
          {notice && <div className="mypage-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")}>×</button></div>}

          <section id="profile" className="account-panel">
            <div className="panel-heading"><div><span>DRAWER 01 · MEMBER CARD</span><h2>회원정보</h2></div><p>주문과 배송 안내에 사용하는 기본 정보입니다.</p></div>
            <form className="profile-form" onSubmit={saveProfile}>
              <label><span>이름</span><input value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} required /></label>
              <label><span>이메일</span><input value={user.email || ""} readOnly /></label>
              <label><span>연락처</span><input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="010-0000-0000" inputMode="tel" /></label>
              <label className="consent-row"><input type="checkbox" checked={profile.marketingConsent} onChange={(event) => setProfile({ ...profile, marketingConsent: event.target.checked })} /><span>새 입고와 작은 전시 소식을 이메일로 받을게요.</span></label>
              <button className="ledger-button" type="submit" disabled={busy}>회원정보 저장</button>
            </form>
          </section>

          <section id="addresses" className="account-panel address-panel">
            <div className="panel-heading"><div><span>DRAWER 02 · ADDRESS BOOK</span><h2>저장된 배송지</h2></div><button type="button" onClick={resetAddressForm}>＋ 새 배송지</button></div>
            {addresses.length ? (
              <div className="saved-address-list">
                {addresses.map((item, index) => (
                  <article className={item.is_default ? "is-default" : ""} key={item.id}>
                    <span className="address-index">{String(index + 1).padStart(2, "0")}</span>
                    <div className="address-copy">
                      <div><strong>{item.label}</strong>{item.is_default && <em>기본 배송지</em>}</div>
                      <b>{item.recipient} · {item.phone}</b>
                      <p>[{item.zonecode}] {item.address} {item.extra}<br />{item.detail}</p>
                    </div>
                    <div className="address-actions">
                      <button type="button" className={mapAddressId === item.id ? "is-map-active" : ""} onClick={() => setMapAddressId(item.id)}>지도 보기</button>
                      {!item.is_default && <button type="button" disabled={busy} onClick={() => setDefaultAddress(item.id)}>기본 설정</button>}
                      <button type="button" disabled={busy} onClick={() => editAddress(item)}>수정</button>
                      <button type="button" disabled={busy} onClick={() => deleteAddress(item.id)}>삭제</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-address"><span>아직 저장된 배송지가 없습니다.</span><p>자주 받는 곳을 저장하면 다음 주문이 간단해져요.</p></div>
            )}

            {mappedAddress && (
              <KakaoMap
                address={mappedAddress.address}
                detail={mappedAddress.detail}
                label={`${mappedAddress.label} · ${mappedAddress.recipient}`}
              />
            )}

            <form id="address-editor" className="address-editor" onSubmit={saveAddress}>
              <div><span>{editingId ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}</span><h3>{editingId ? "배송지 수정" : "새 배송지 저장"}</h3></div>
              <div className="address-meta-grid">
                <label><span>배송지 이름</span><input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} placeholder="우리 집" required /></label>
                <label><span>받는 분</span><input value={draft.recipient} onChange={(event) => setDraft({ ...draft, recipient: event.target.value })} required /></label>
                <label><span>연락처</span><input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="010-0000-0000" inputMode="tel" required /></label>
              </div>
              <KakaoAddressSearch
                value={{ zonecode: draft.zonecode, address: draft.address, extra: draft.extra, detail: draft.detail }}
                onChange={(next) => setDraft({ ...draft, ...next })}
              />
              <KakaoMap address={draft.address} detail={draft.detail} label="새 배송지 미리보기" compact />
              <label className="default-check"><input type="checkbox" checked={draft.isDefault} onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })} /><span>기본 배송지로 사용</span></label>
              <div className="editor-actions"><button className="ledger-button" type="submit" disabled={busy || !draft.zonecode}>{editingId ? "배송지 수정 저장" : "배송지 저장"}</button>{editingId && <button type="button" onClick={resetAddressForm}>취소</button>}</div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
