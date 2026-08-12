"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabase-client";

function userLabel(user: User) {
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email || "Pocket Archive 회원";
}

export default function AuthAccountButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage("로그인 상태를 불러오지 못했습니다.");
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
      setBusy(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, []);

  const signInWithGoogle = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase와 Google OAuth 키를 연결하면 로그인이 활성화됩니다.");
      setOpen(true);
      return;
    }

    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setMessage("Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setBusy(false);
      setOpen(true);
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) setMessage("로그아웃하지 못했습니다. 다시 시도해 주세요.");
    setBusy(false);
    setOpen(false);
  };

  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="auth-account" ref={rootRef}>
      {user ? (
        <button
          className="account-trigger"
          type="button"
          aria-label={`${userLabel(user)} 계정 메뉴`}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : <span>{userLabel(user).slice(0, 1)}</span>}
          <b>MY</b>
        </button>
      ) : (
        <button className="google-login-trigger" type="button" onClick={signInWithGoogle} disabled={loading || busy}>
          <span aria-hidden="true">G</span>{busy ? "CONNECTING" : "LOGIN"}
        </button>
      )}

      {(open || message) && (
        <div className="account-popover" role="status">
          {user ? (
            <>
              <span className="account-kicker">SIGNED IN WITH GOOGLE</span>
              <strong>{userLabel(user)}</strong>
              <small>{user.email}</small>
              <a className="account-page-link" href="/mypage">마이페이지 열기 →</a>
              <button type="button" onClick={signOut} disabled={busy}>{busy ? "로그아웃 중" : "로그아웃"}</button>
            </>
          ) : (
            <>
              <span className="account-kicker">GOOGLE ACCOUNT</span>
              <strong>로그인 연결 안내</strong>
              <small>{message}</small>
              <button type="button" onClick={() => setOpen(false)}>확인</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
