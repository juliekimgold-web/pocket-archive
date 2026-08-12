"use client";

import { useEffect, useRef, useState } from "react";

export type DeliveryAddress = {
  zonecode: string;
  address: string;
  detail: string;
  extra: string;
};

type KakaoPostcodeResult = {
  addressType: "R" | "J";
  bname: string;
  buildingName: string;
  jibunAddress: string;
  roadAddress: string;
  userSelectedType: "R" | "J";
  zonecode: string;
};

type KakaoPostcodeConstructor = new (options: {
  oncomplete: (data: KakaoPostcodeResult) => void;
  width?: string | number;
  height?: string | number;
}) => { open: () => void };

declare global {
  interface Window {
    daum?: { Postcode: KakaoPostcodeConstructor };
  }
}

const SCRIPT_ID = "kakao-postcode-script";
const SCRIPT_SOURCE = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type KakaoAddressSearchProps = {
  value: DeliveryAddress;
  onChange: (next: DeliveryAddress) => void;
};

export default function KakaoAddressSearch({ value, onChange }: KakaoAddressSearchProps) {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("카카오 주소 검색을 준비하고 있어요.");
  const detailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.daum?.Postcode) {
      setReady(true);
      setMessage("주소 검색 버튼을 눌러 배송지를 찾아주세요.");
      return;
    }

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => {
      setReady(Boolean(window.daum?.Postcode));
      setMessage("주소 검색 버튼을 눌러 배송지를 찾아주세요.");
    };
    const handleError = () => setMessage("주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);
      return () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SOURCE;
    script.async = true;
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, []);

  const openSearch = () => {
    if (!window.daum?.Postcode) {
      setMessage("주소 검색을 아직 준비 중입니다. 잠시 후 다시 눌러주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        const selectedAddress = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        const extraParts = data.addressType === "R" ? [data.bname, data.buildingName].filter(Boolean) : [];
        const extra = extraParts.length ? `(${extraParts.join(", ")})` : "";

        onChange({ zonecode: data.zonecode, address: selectedAddress, detail: "", extra });
        setMessage("주소를 확인한 뒤 상세 주소를 입력해주세요.");
        requestAnimationFrame(() => detailRef.current?.focus());
      },
      width: "100%",
      height: "100%",
    }).open();
  };

  return (
    <fieldset className="kakao-address-fieldset">
      <legend>배송지 주소</legend>
      <div className="postcode-row">
        <label>
          <span>우편번호</span>
          <input value={value.zonecode} placeholder="우편번호" readOnly aria-label="우편번호" />
        </label>
        <button type="button" onClick={openSearch} disabled={!ready}>
          <span className="kakao-mark" aria-hidden="true">K</span>
          카카오 주소 검색
        </button>
      </div>
      <label className="address-input">
        <span>기본 주소</span>
        <input
          value={[value.address, value.extra].filter(Boolean).join(" ")}
          placeholder="검색한 주소가 여기에 표시됩니다."
          readOnly
          aria-label="기본 주소"
        />
      </label>
      <label className="address-input">
        <span>상세 주소</span>
        <input
          ref={detailRef}
          value={value.detail}
          onChange={(event) => onChange({ ...value, detail: event.target.value })}
          placeholder="동·호수 또는 상세 주소를 입력해주세요."
          disabled={!value.zonecode}
          required
          aria-label="상세 주소"
        />
      </label>
      <p className="address-status" aria-live="polite">{message}</p>
    </fieldset>
  );
}
