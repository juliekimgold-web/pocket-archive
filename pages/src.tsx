import React from "react";
import { createRoot } from "react-dom/client";
import Storefront from "../app/page";
import MyPage from "../app/mypage/page";
import JournalPage from "../app/journal/page";
import PaymentResult from "../app/payment-result";
import "../app/globals.css";

const isMyPage = window.location.pathname.replace(/\/+$/, "").endsWith("/mypage");
const normalizedPath = window.location.pathname.replace(/\/+$/, "");
const isJournalPage = normalizedPath.endsWith("/journal");
const isPaymentSuccess = normalizedPath.endsWith("/payment/success");
const isPaymentFail = normalizedPath.endsWith("/payment/fail");
const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      {isPaymentSuccess ? <PaymentResult mode="success" /> : isPaymentFail ? <PaymentResult mode="fail" /> : isMyPage ? <MyPage /> : isJournalPage ? <JournalPage /> : <Storefront />}
    </React.StrictMode>,
  );
}
