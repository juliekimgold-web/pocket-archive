"use client";

import { useEffect, useRef, useState } from "react";

type KakaoMapProps = {
  address: string;
  detail?: string;
  label?: string;
  compact?: boolean;
};

type KakaoWindow = Window & {
  kakao?: {
    maps: {
      load: (callback: () => void) => void;
      Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
        setCenter: (position: unknown) => void;
        relayout: () => void;
      };
      LatLng: new (latitude: number, longitude: number) => unknown;
      Marker: new (options: { map: unknown; position: unknown }) => unknown;
      services: {
        Status: { OK: string };
        Geocoder: new () => {
          addressSearch: (
            address: string,
            callback: (result: Array<{ x: string; y: string }>, status: string) => void,
          ) => void;
        };
      };
    };
  };
};

const SCRIPT_ID = "kakao-map-sdk";

function loadKakaoMapSdk(appKey: string) {
  return new Promise<void>((resolve, reject) => {
    const kakaoWindow = window as KakaoWindow;
    if (kakaoWindow.kakao?.maps?.services) {
      kakaoWindow.kakao.maps.load(resolve);
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => {
      const sdk = (window as KakaoWindow).kakao;
      if (!sdk) {
        reject(new Error("Kakao Maps SDK was not initialized."));
        return;
      }
      sdk.maps.load(resolve);
    };

    if (existing) {
      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener("error", () => reject(new Error("Kakao Maps SDK failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("Kakao Maps SDK failed to load.")), { once: true });
    document.head.appendChild(script);
  });
}

export default function KakaoMap({ address, detail = "", label = "배송지", compact = false }: KakaoMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(address ? "loading" : "idle");
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY;

  useEffect(() => {
    let active = true;
    if (!address || !mapElement.current) {
      setState("idle");
      return () => { active = false; };
    }
    if (!appKey) {
      setState("error");
      return () => { active = false; };
    }

    setState("loading");
    loadKakaoMapSdk(appKey)
      .then(() => {
        if (!active || !mapElement.current) return;
        const kakao = (window as KakaoWindow).kakao;
        if (!kakao) throw new Error("Kakao Maps SDK is unavailable.");

        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
          if (!active || !mapElement.current) return;
          if (status !== kakao.maps.services.Status.OK || !result[0]) {
            setState("error");
            return;
          }

          const position = new kakao.maps.LatLng(Number(result[0].y), Number(result[0].x));
          const map = new kakao.maps.Map(mapElement.current, { center: position, level: compact ? 4 : 3 });
          new kakao.maps.Marker({ map, position });
          map.setCenter(position);
          window.requestAnimationFrame(() => map.relayout());
          setState("ready");
        });
      })
      .catch(() => active && setState("error"));

    return () => { active = false; };
  }, [address, appKey, compact]);

  const fullAddress = [address, detail].filter(Boolean).join(" ");

  return (
    <section className={`kakao-map-card${compact ? " is-compact" : ""}`} aria-label={`${label} 지도`}>
      <div className="kakao-map-heading">
        <div><span>KAKAO MAP</span><strong>{label}</strong></div>
        {address && (
          <a href={`https://map.kakao.com/link/search/${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">
            큰 지도로 보기 ↗
          </a>
        )}
      </div>
      <div className="kakao-map-stage">
        <div className="kakao-map-canvas" ref={mapElement} />
        {state !== "ready" && (
          <div className={`kakao-map-message is-${state}`}>
            {state === "idle" && <><span>주소를 검색하면</span><b>지도가 이곳에 표시됩니다.</b></>}
            {state === "loading" && <><i /><b>주소 위치를 찾고 있습니다.</b></>}
            {state === "error" && <><span>지도를 불러오지 못했습니다.</span><b>주소 또는 카카오맵 설정을 확인해 주세요.</b></>}
          </div>
        )}
      </div>
      {fullAddress && <p className="kakao-map-address">{fullAddress}</p>}
    </section>
  );
}
