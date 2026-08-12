import React from "react";
import { createRoot } from "react-dom/client";
import Storefront from "../app/page";
import MyPage from "../app/mypage/page";
import "../app/globals.css";

const isMyPage = window.location.pathname.replace(/\/+$/, "").endsWith("/mypage");
const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      {isMyPage ? <MyPage /> : <Storefront />}
    </React.StrictMode>,
  );
}
