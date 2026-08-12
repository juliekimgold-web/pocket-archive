"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import AuthAccountButton from "./auth-account-button";
import KakaoAddressSearch, { type DeliveryAddress } from "./kakao-address-search";
import { getSupabaseBrowserClient } from "./supabase-client";
import TossPayment from "./toss-payment";

type Category = "전체" | "토이" | "캐릭터" | "문구" | "리빙" | "빈티지 식기";

type Product = {
  id: number;
  name: string;
  englishName: string;
  category: Exclude<Category, "전체">;
  year: string;
  price: number;
  condition: string;
  badge?: string;
  image: string;
  position?: string;
  soldOut?: boolean;
};

type ReviewFilter = "all" | "photo" | "five";

type CheckoutAddress = DeliveryAddress & {
  id: number;
  label: string;
  recipient: string;
  phone: string;
  isDefault: boolean;
};

type Review = {
  id: string;
  productId: number;
  author: string;
  date: string;
  rating: number;
  text: string;
  image: string;
  position?: string;
  helpful: number;
};

const products: Product[] = [
  {
    id: 1,
    name: "아토믹 틴 로봇",
    englishName: "Atomic Wind-up Robot",
    category: "토이",
    year: "1960s · Japan",
    price: 238000,
    condition: "Very Good",
    badge: "1점 입고",
    image: "/products/atomic-robot-composition-v2.png",
    position: "43% 50%",
  },
  {
    id: 2,
    name: "밤비 프린트 글라스",
    englishName: "Bambi Lemon Glass",
    category: "빈티지 식기",
    year: "1980s · Korea",
    price: 42000,
    condition: "Excellent",
    badge: "미사용",
    image: "/products/fawn-glass-composition-v2.png",
    position: "56% 50%",
    soldOut: true,
  },
  {
    id: 3,
    name: "컴포지션 노트 세트",
    englishName: "Old School Desk Set",
    category: "문구",
    year: "1990s · USA",
    price: 36000,
    condition: "New Old Stock",
    image: "/products/composition-desk-set-v2.png",
    position: "50% 50%",
  },
  {
    id: 4,
    name: "손뜨개 프렌즈 인형",
    englishName: "Crochet Pocket Friends",
    category: "캐릭터",
    year: "1990s · Handmade",
    price: 54000,
    condition: "Very Good",
    badge: "에디터 픽",
    image: "/products/crochet-friends-composition-v2.png",
    position: "50% 50%",
  },
  {
    id: 5,
    name: "브라스 메모 클립",
    englishName: "Brass Memo Clip",
    category: "문구",
    year: "1970s · England",
    price: 28000,
    condition: "Good",
    image: "/products/brass-memo-clip-composition-v2.png",
    position: "62% 50%",
    soldOut: true,
  },
  {
    id: 6,
    name: "스페이스 미키 보틀",
    englishName: "Space Character Bottle",
    category: "빈티지 식기",
    year: "1987 · Korea",
    price: 68000,
    condition: "Excellent",
    badge: "희귀",
    image: "/products/space-character-bottle-v2.png",
    position: "42% 50%",
  },
  {
    id: 7,
    name: "미니 테디 컬렉션",
    englishName: "Tiny Teddy Pair",
    category: "토이",
    year: "1980s · Germany",
    price: 89000,
    condition: "Good",
    image: "/products/teddy-pair-composition-v2.png",
    position: "44% 50%",
  },
  {
    id: 8,
    name: "레트로 포스트카드 팩",
    englishName: "Little Postcard Archive",
    category: "문구",
    year: "1970–90s · Mixed",
    price: 18000,
    condition: "Very Good",
    image: "/products/retro-postcard-flatlay-v2.png",
    position: "50% 50%",
  },
  {
    id: 9,
    name: "선물박스 포장 · 쇼핑백",
    englishName: "Gift Box & Shopping Bag",
    category: "리빙",
    year: "Pocket Archive · Service",
    price: 1000,
    condition: "Test Payment",
    badge: "결제 테스트",
    image: "/products/gift-wrap-test.png",
    position: "50% 50%",
  },
];

const categories: Category[] = ["전체", "토이", "캐릭터", "문구", "빈티지 식기", "리빙"];

const seedReviews: Review[] = [
  {
    id: "review-1",
    productId: 1,
    author: "윤＊＊",
    date: "2026.08.02",
    rating: 5,
    text: "태엽을 감았을 때 나는 작은 소리까지 너무 근사해요. 세월의 흔적이 사진보다 자연스럽고, 포장도 오래된 물건을 존중하는 느낌이라 좋았습니다.",
    image: "/products/atomic-robot.png",
    position: "50% 50%",
    helpful: 18,
  },
  {
    id: "review-2",
    productId: 3,
    author: "서＊＊",
    date: "2026.07.26",
    rating: 5,
    text: "종이 색과 모서리의 사용감이 정말 예뻐요. 실제 상태를 상세하게 안내해 주셔서 안심하고 구매했습니다. 책상 위에 두니 분위기가 완전히 달라졌어요.",
    image: "/products/composition-desk-set.png",
    position: "50% 50%",
    helpful: 12,
  },
  {
    id: "review-3",
    productId: 2,
    author: "민＊＊",
    date: "2026.07.18",
    rating: 4,
    text: "프린트 색감이 선명하게 남아 있고 작은 스크래치도 미리 본 사진과 같았어요. 지금은 품절이라 더 특별한 물건처럼 느껴집니다.",
    image: "/products/fawn-glass.png",
    position: "50% 50%",
    helpful: 9,
  },
  {
    id: "review-4",
    productId: 7,
    author: "한＊＊",
    date: "2026.07.11",
    rating: 5,
    text: "표정과 털의 결이 제각각이라 정말 한 점뿐인 친구 같아요. 작은 사이즈라 선반 어디에 두어도 잘 어울립니다.",
    image: "/products/teddy-pair.png",
    position: "50% 50%",
    helpful: 21,
  },
];

const drawerCollections: Array<{
  category: Exclude<Category, "전체">;
  number: string;
  title: string;
  accent: string;
  description: string;
  image: string;
  position?: string;
}> = [
  { category: "캐릭터", number: "01", title: "Character", accent: "Goods", description: "컵, 인형과 작은 기념품", image: "/products/crochet-friends.png", position: "50% 48%" },
  { category: "문구", number: "02", title: "Paper &", accent: "Stationery", description: "쓰고 기록하고 간직하는 물건", image: "/products/composition-desk-set.png", position: "50% 52%" },
  { category: "토이", number: "03", title: "Toys &", accent: "Friends", description: "오래된 놀이 친구들", image: "/products/atomic-robot.png", position: "50% 44%" },
  { category: "빈티지 식기", number: "04", title: "Vintage", accent: "Tableware", description: "시간이 담긴 컵과 작은 식기", image: "/products/fawn-glass.png", position: "50% 50%" },
];

const money = new Intl.NumberFormat("ko-KR");

function useOpenSourceMotion() {
  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let removeMotion: (() => void) | undefined;

    const startMotion = () => {
      if (cancelled) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const progress = document.querySelector<HTMLElement>(".scroll-progress");
      const updateProgress = () => {
        if (!progress) return;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
        progress.style.transform = `scaleX(${ratio})`;
      };
      window.addEventListener("scroll", updateProgress, { passive: true });
      updateProgress();

      if (reducedMotion) {
        document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
          element.style.opacity = "1";
          element.style.transform = "none";
        });
        removeMotion = () => window.removeEventListener("scroll", updateProgress);
        return;
      }

      const animeApi = (window as Window & { anime?: any }).anime;
      if (!animeApi) return;
      const { animate, stagger } = animeApi;

      animate(".announcement", {
        opacity: { from: 0 },
        y: { from: -14 },
        duration: 700,
        ease: "outExpo",
      });
      animate(".site-header", {
        opacity: { from: 0 },
        y: { from: -22 },
        duration: 900,
        delay: 120,
        ease: "outExpo",
      });
      animate(".shop-sign", {
        opacity: { from: 0 },
        y: { from: -28 },
        scale: { from: 0.97 },
        duration: 1050,
        delay: 180,
        ease: "outExpo",
      });
      animate(".window-copy .scene-hint, .window-copy .eyebrow, .hero-line, .scene-action", {
        opacity: { from: 0 },
        y: { from: 34 },
        duration: 1000,
        delay: stagger(105, { start: 260 }),
        ease: "outExpo",
      });
      animate(".scene-wrap", {
        opacity: { from: 0 },
        scale: { from: 0.94 },
        duration: 1300,
        delay: 260,
        ease: "outExpo",
      });
      animate(".scroll-note", {
        opacity: { from: 0 },
        y: { from: 14 },
        duration: 800,
        delay: 1250,
        ease: "outExpo",
      });

      const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
      revealItems.forEach((element) => {
        element.style.opacity = "0";
        element.style.transform = "translateY(42px)";
      });

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target as HTMLElement;
            observer?.unobserve(element);
            animate(element, {
              opacity: 1,
              y: 0,
              duration: Number(element.dataset.duration || 980),
              delay: Number(element.dataset.delay || 0),
              ease: element.dataset.ease || "outExpo",
            });
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
      );
      revealItems.forEach((element) => observer?.observe(element));

      const magneticElements = Array.from(document.querySelectorAll<HTMLElement>(".button, .checkout"));
      const magneticCleanups = magneticElements.map((element) => {
        const move = (event: PointerEvent) => {
          if (event.pointerType === "touch") return;
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - rect.left - rect.width / 2) * 0.13;
          const y = (event.clientY - rect.top - rect.height / 2) * 0.16;
          animate(element, { x, y, duration: 420, ease: "outExpo", composition: "replace" });
        };
        const leave = () => animate(element, { x: 0, y: 0, duration: 650, ease: "outElastic(1, .45)", composition: "replace" });
        element.addEventListener("pointermove", move);
        element.addEventListener("pointerleave", leave);
        return () => {
          element.removeEventListener("pointermove", move);
          element.removeEventListener("pointerleave", leave);
        };
      });

      removeMotion = () => {
        observer?.disconnect();
        magneticCleanups.forEach((cleanup) => cleanup());
        window.removeEventListener("scroll", updateProgress);
      };
    };

    if ((window as Window & { anime?: any }).anime) {
      startMotion();
    } else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-anime]");
      if (existing) existing.addEventListener("load", startMotion, { once: true });
      else {
        const script = document.createElement("script");
        script.src = "/vendor/anime.umd.min.js";
        script.async = true;
        script.dataset.anime = "true";
        script.addEventListener("load", startMotion, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      removeMotion?.();
    };
  }, []);
}

function PhotorealWindowScene({
  onSelectCategory,
}: {
  onSelectCategory: (category: Exclude<Category, "전체">) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const buildScene = () => {
      if (cancelled || !mountRef.current) return;
      const T = (window as Window & { THREE?: any }).THREE;
      if (!T) return;

      const mount = mountRef.current;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(34, 1, 0.1, 40);
      camera.position.set(0, 0, 5);

      const renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      renderer.setClearColor(0x102e26, 0);
      if (T.SRGBColorSpace) renderer.outputColorSpace = T.SRGBColorSpace;
      if (T.ACESFilmicToneMapping) renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.03;
      mount.appendChild(renderer.domElement);

      const pointerTarget = new T.Vector2(0, 0);
      const pointer = new T.Vector2(0, 0);
      const uniforms = {
        uMap: { value: null },
        uMaskA: { value: null },
        uMaskB: { value: null },
        uMaskCup: { value: null },
        uCrop: { value: new T.Vector4(0.18, 0.91, 0.11, 0.721) },
        uTime: { value: 0 },
        uPointer: { value: pointer },
        uScroll: { value: 0 },
        uReveal: { value: reducedMotion ? 1 : 0 },
        uHover: { value: 0 },
        uHoverStrength: { value: 0 },
      };

      const vertexShader = `
        varying vec2 vUv;
        uniform float uReveal;
        uniform float uScroll;
        void main() {
          vUv = uv;
          vec3 p = position;
          p *= mix(0.94, 1.0, uReveal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `;

      const fragmentShader = `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uMap;
        uniform sampler2D uMaskA;
        uniform sampler2D uMaskB;
        uniform sampler2D uMaskCup;
        uniform vec4 uCrop;
        uniform vec2 uPointer;
        uniform float uTime;
        uniform float uScroll;
        uniform float uReveal;
        uniform float uHover;
        uniform float uHoverStrength;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float objectMask(vec2 imageUv, float selected) {
          vec4 maskA = texture2D(uMaskA, imageUv);
          if (selected > 0.5 && selected < 1.5) return maskA.r;
          if (selected > 1.5 && selected < 2.5) return maskA.g;
          if (selected > 2.5 && selected < 3.5) return maskA.b;
          if (selected > 3.5 && selected < 4.5) return texture2D(uMaskB, imageUv).r;
          if (selected > 4.5 && selected < 5.5) return texture2D(uMaskB, imageUv).g;
          if (selected > 5.5 && selected < 6.5) return texture2D(uMaskCup, imageUv).r;
          return 0.0;
        }

        vec2 objectCenter(float selected) {
          if (selected > 0.5 && selected < 1.5) return vec2(0.302, 0.33);
          if (selected > 1.5 && selected < 2.5) return vec2(0.455, 0.23);
          if (selected > 2.5 && selected < 3.5) return vec2(0.545, 0.22);
          if (selected > 3.5 && selected < 4.5) return vec2(0.63, 0.22);
          if (selected > 4.5 && selected < 5.5) return vec2(0.776, 0.18);
          if (selected > 5.5 && selected < 6.5) return vec2(0.363, 0.22);
          return vec2(0.5);
        }

        vec2 liftedObjectUv(vec2 outputUv) {
          vec2 center = objectCenter(uHover);
          float bob = (3.2 + sin(uTime * 2.2) * 1.4) / 941.0 * uHoverStrength;
          float angle = uPointer.x * 0.038 * uHoverStrength;
          float cosine = cos(-angle);
          float sine = sin(-angle);
          mat2 inverseRotation = mat2(cosine, -sine, sine, cosine);
          vec2 local = outputUv - center - vec2(0.0, bob);
          local.x /= 1.0 + uHoverStrength * 0.012;
          local.x -= local.y * uPointer.x * 0.035 * uHoverStrength;
          return center + inverseRotation * local;
        }

        float liftedObjectMask(vec2 outputUv) {
          return objectMask(liftedObjectUv(outputUv), uHover);
        }

        void main() {
          vec2 uv = vec2(
            mix(uCrop.x, uCrop.y, vUv.x),
            mix(uCrop.z, uCrop.w, vUv.y)
          );
          vec3 probe = texture2D(uMap, uv).rgb;
          float luma = dot(probe, vec3(0.299, 0.587, 0.114));
          float foreground = smoothstep(0.22, 0.78, luma) * 0.55 + smoothstep(0.15, 0.92, 1.0 - uv.y) * 0.28;
          uv = clamp(uv, uCrop.xz, uCrop.yw);

          vec3 color = texture2D(uMap, uv).rgb;
          float lampPulse = sin(uTime * 1.35) * 0.5 + 0.5;
          float lampGlow = smoothstep(0.28, 0.0, distance(uv, vec2(0.711, 0.505)));
          color += vec3(1.0, 0.49, 0.14) * lampGlow * (0.025 + lampPulse * 0.018);

          float sweepPosition = fract(uTime * 0.035) * 1.45 - 0.22;
          float sweep = 1.0 - smoothstep(0.0, 0.075, abs((uv.x + uv.y * 0.14) - sweepPosition));
          sweep *= smoothstep(0.28, 0.7, uv.y) * 0.075;
          color += vec3(0.95, 0.87, 0.7) * sweep;

          float grain = hash(gl_FragCoord.xy + uTime * 31.0) - 0.5;
          color += grain * 0.018;
          float vignette = smoothstep(0.88, 0.22, distance(vUv, vec2(0.5)));
          color *= 0.9 + vignette * 0.12;

          vec2 pixel = vec2(1.0 / 1672.0, 1.0 / 941.0);
          float baseObject = objectMask(uv, uHover);
          vec2 liftedUv = liftedObjectUv(uv);
          float objectFill = objectMask(liftedUv, uHover);
          float roundedFill = objectFill;
          float closeMask = max(
            max(liftedObjectMask(uv + vec2(pixel.x * 1.5, 0.0)), liftedObjectMask(uv - vec2(pixel.x * 1.5, 0.0))),
            max(liftedObjectMask(uv + vec2(0.0, pixel.y * 1.5)), liftedObjectMask(uv - vec2(0.0, pixel.y * 1.5)))
          );
          float diagonalMask = max(
            max(liftedObjectMask(uv + pixel), liftedObjectMask(uv - pixel)),
            max(liftedObjectMask(uv + vec2(pixel.x, -pixel.y)), liftedObjectMask(uv + vec2(-pixel.x, pixel.y)))
          );
          float softMask = (
            liftedObjectMask(uv + vec2(pixel.x * 8.0, 0.0)) + liftedObjectMask(uv - vec2(pixel.x * 8.0, 0.0)) +
            liftedObjectMask(uv + vec2(0.0, pixel.y * 8.0)) + liftedObjectMask(uv - vec2(0.0, pixel.y * 8.0)) +
            liftedObjectMask(uv + pixel * 5.5) + liftedObjectMask(uv - pixel * 5.5) +
            liftedObjectMask(uv + vec2(pixel.x, -pixel.y) * 5.5) + liftedObjectMask(uv + vec2(-pixel.x, pixel.y) * 5.5)
          ) * 0.125;
          float wideMask = (
            liftedObjectMask(uv + vec2(pixel.x * 20.0, 0.0)) + liftedObjectMask(uv - vec2(pixel.x * 20.0, 0.0)) +
            liftedObjectMask(uv + vec2(0.0, pixel.y * 20.0)) + liftedObjectMask(uv - vec2(0.0, pixel.y * 20.0)) +
            liftedObjectMask(uv + pixel * 14.0) + liftedObjectMask(uv - pixel * 14.0) +
            liftedObjectMask(uv + vec2(pixel.x, -pixel.y) * 14.0) + liftedObjectMask(uv + vec2(-pixel.x, pixel.y) * 14.0)
          ) * 0.125;
          float silhouetteOutline = smoothstep(0.08, 0.72, clamp(max(closeMask, diagonalMask) - roundedFill, 0.0, 1.0));
          float softGlow = clamp(softMask - roundedFill * 0.22, 0.0, 1.0) * (1.0 - roundedFill * 0.62);
          float wideGlow = clamp(wideMask - roundedFill * 0.1, 0.0, 1.0) * (1.0 - roundedFill * 0.76);
          float pulse = 0.86 + sin(uTime * 3.0) * 0.14;
          float floatingShadow = clamp(liftedObjectMask(uv + vec2(pixel.x * 5.0, pixel.y * 8.0)) - objectFill, 0.0, 1.0);
          color *= 1.0 - floatingShadow * uHoverStrength * 0.16;
          color = mix(color, color * 0.95, baseObject * uHoverStrength * 0.08);
          float tiltLight = clamp(1.04 + (uv.x - objectCenter(uHover).x) * uPointer.x * 2.1, 0.94, 1.14);
          vec3 liftedColor = texture2D(uMap, liftedUv).rgb * tiltLight;
          color = mix(color, liftedColor, objectFill * uHoverStrength * 0.96);
          color += vec3(1.0, 0.9, 0.68) * silhouetteOutline * uHoverStrength * 0.44;
          color += vec3(1.0, 0.66, 0.3) * softGlow * uHoverStrength * 0.64 * pulse;
          color += vec3(1.0, 0.4, 0.1) * wideGlow * uHoverStrength * 0.3 * pulse;
          color *= mix(0.8, 1.0, uReveal);
          gl_FragColor = vec4(color, 1.0);
        }
      `;

      const geometry = new T.PlaneGeometry(1, 1, 72, 36);
      const material = new T.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
      const imagePlane = new T.Mesh(geometry, material);
      scene.add(imagePlane);

      const dustGeometry = new T.BufferGeometry();
      const count = window.innerWidth < 700 ? 70 : 150;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 7;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3.8;
        positions[i * 3 + 2] = 0.2 + Math.random() * 1.2;
      }
      dustGeometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      const dustMaterial = new T.PointsMaterial({
        color: 0xffd69a,
        size: 0.018,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        blending: T.AdditiveBlending,
      });
      const dust = new T.Points(dustGeometry, dustMaterial);
      scene.add(dust);

      const textureLoader = new T.TextureLoader();
      const texture = textureLoader.load(
        "/og.png",
        (loaded: any) => {
          if (T.SRGBColorSpace) loaded.colorSpace = T.SRGBColorSpace;
          loaded.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          uniforms.uMap.value = loaded;
          resize();
          mount.dataset.ready = "true";
        },
      );
      const maskA = textureLoader.load("/window-object-masks-a.png?v=5", (loaded: any) => {
        uniforms.uMaskA.value = loaded;
      });
      const maskB = textureLoader.load("/window-object-masks-b.png?v=5", (loaded: any) => {
        uniforms.uMaskB.value = loaded;
      });
      const maskCup = textureLoader.load("/window-object-mask-cup.png?v=1", (loaded: any) => {
        uniforms.uMaskCup.value = loaded;
      });

      const resize = () => {
        const width = Math.max(mount.clientWidth, 1);
        const height = Math.max(mount.clientHeight, 1);
        if (window.innerWidth <= 760) uniforms.uCrop.value.set(0.18, 0.91, 0.035, 0.82);
        else uniforms.uCrop.value.set(0.18, 0.91, 0.11, 0.721);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
        const visibleWidth = visibleHeight * camera.aspect;
        imagePlane.scale.set(visibleWidth, visibleHeight, 1);
      };

      const raycaster = new T.Raycaster();
      const ndc = new T.Vector2();
      const hoverTargets = [
        { center: [0.302, 0.33], radius: [0.051, 0.196] },
        { center: [0.455, 0.23], radius: [0.072, 0.098] },
        { center: [0.545, 0.22], radius: [0.066, 0.11] },
        { center: [0.63, 0.22], radius: [0.063, 0.122] },
        { center: [0.776, 0.18], radius: [0.11, 0.067] },
        { center: [0.363, 0.22], radius: [0.038, 0.095] },
      ];
      const categoryTargets: Array<Exclude<Category, "전체">> = ["토이", "문구", "토이", "문구", "토이", "빈티지 식기"];
      const isTouchOnly = window.matchMedia("(hover: none), (pointer: coarse)").matches;
      let activeTouchTarget = 0;
      let touchStart: { x: number; y: number } | null = null;

      const resolveTarget = (clientX: number, clientY: number) => {
        const rect = mount.getBoundingClientRect();
        pointerTarget.x = ((clientX - rect.left) / rect.width - 0.5) * 2;
        pointerTarget.y = -((clientY - rect.top) / rect.height - 0.5) * 2;
        ndc.set(pointerTarget.x, pointerTarget.y);
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObject(imagePlane, false)[0];
        let hovered = 0;
        if (hit?.uv) {
          const crop = uniforms.uCrop.value;
          const imageUv = {
            x: crop.x + (crop.y - crop.x) * hit.uv.x,
            y: crop.z + (crop.w - crop.z) * hit.uv.y,
          };
          const cupTarget = hoverTargets[5];
          const cupDx = (imageUv.x - cupTarget.center[0]) / cupTarget.radius[0];
          const cupDy = (imageUv.y - cupTarget.center[1]) / cupTarget.radius[1];
          if (cupDx * cupDx + cupDy * cupDy <= 1) hovered = 6;
          for (let index = 0; hovered === 0 && index < hoverTargets.length - 1; index += 1) {
            const target = hoverTargets[index];
            const dx = (imageUv.x - target.center[0]) / target.radius[0];
            const dy = (imageUv.y - target.center[1]) / target.radius[1];
            if (dx * dx + dy * dy <= 1) {
              hovered = index + 1;
              break;
            }
          }
        }
        return hovered;
      };

      const pointerMove = (event: PointerEvent) => {
        if (isTouchOnly || event.pointerType === "touch") return;
        const hovered = resolveTarget(event.clientX, event.clientY);
        uniforms.uHover.value = hovered;
        mount.style.cursor = hovered ? "pointer" : "crosshair";
      };
      const pointerLeave = () => {
        if (isTouchOnly) return;
        pointerTarget.set(0, 0);
        uniforms.uHover.value = 0;
        mount.style.cursor = "crosshair";
      };
      const pointerDown = (event: PointerEvent) => {
        if (isTouchOnly || event.pointerType === "touch") {
          touchStart = { x: event.clientX, y: event.clientY };
        }
      };
      const activateObject = (event: PointerEvent) => {
        if ((isTouchOnly || event.pointerType === "touch") && touchStart) {
          const travel = Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y);
          touchStart = null;
          if (travel > 12) return;
        }
        const target = resolveTarget(event.clientX, event.clientY);
        if (isTouchOnly || event.pointerType === "touch") {
          event.preventDefault();
          if (!target) {
            activeTouchTarget = 0;
            uniforms.uHover.value = 0;
            mount.removeAttribute("data-touch-active");
            return;
          }
          if (activeTouchTarget !== target) {
            activeTouchTarget = target;
            uniforms.uHover.value = target;
            mount.dataset.touchActive = "true";
            mount.setAttribute("aria-label", "선택한 오브제가 빛나고 있습니다. 같은 오브제를 한 번 더 탭하면 카테고리로 이동합니다.");
            return;
          }
        } else {
          uniforms.uHover.value = target;
        }
        const index = Math.round(uniforms.uHover.value) - 1;
        if (index >= 0 && categoryTargets[index]) onSelectCategory(categoryTargets[index]);
      };
      const scrollScene = () => {
        const rect = mount.getBoundingClientRect();
        uniforms.uScroll.value = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
      };

      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      mount.addEventListener("pointermove", pointerMove);
      mount.addEventListener("pointerleave", pointerLeave);
      mount.addEventListener("pointerdown", pointerDown);
      mount.addEventListener("pointerup", activateObject);
      window.addEventListener("scroll", scrollScene, { passive: true });
      resize();
      scrollScene();

      let raf = 0;
      const started = performance.now();
      const render = () => {
        const t = (performance.now() - started) / 1000;
        uniforms.uTime.value = t;
        const hoverGoal = uniforms.uHover.value > 0 ? 1 : 0;
        uniforms.uHoverStrength.value += (hoverGoal - uniforms.uHoverStrength.value) * 0.12;
        if (!reducedMotion) {
          pointer.lerp(pointerTarget, 0.042);
          uniforms.uReveal.value += (1 - uniforms.uReveal.value) * 0.035;
          dust.rotation.y = t * 0.012 + pointer.x * 0.04;
          dust.position.y = Math.sin(t * 0.12) * 0.025;
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };
      render();

      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        mount.removeEventListener("pointermove", pointerMove);
        mount.removeEventListener("pointerleave", pointerLeave);
        mount.removeEventListener("pointerdown", pointerDown);
        mount.removeEventListener("pointerup", activateObject);
        window.removeEventListener("scroll", scrollScene);
        geometry.dispose();
        material.dispose();
        dustGeometry.dispose();
        dustMaterial.dispose();
        texture.dispose();
        maskA.dispose();
        maskB.dispose();
        maskCup.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    };

    if ((window as Window & { THREE?: any }).THREE) buildScene();
    else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-three]");
      if (existing) existing.addEventListener("load", buildScene, { once: true });
      else {
        const script = document.createElement("script");
        script.src = "/vendor/three.min.js";
        script.async = true;
        script.dataset.three = "true";
        script.addEventListener("load", buildScene, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [onSelectCategory]);

  return (
    <div
      ref={mountRef}
      className="photoreal-window"
      role="img"
      aria-label="햇살이 비치는 빈티지 쇼윈도. 모바일에서는 오브제를 한 번 탭해 강조하고 같은 오브제를 다시 탭해 카테고리로 이동합니다."
    />
  );
}

function WindowScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const buildScene = () => {
      if (cancelled || !mountRef.current) return;
      const T = (window as Window & { THREE?: any }).THREE;
      if (!T) return;

      const mount = mountRef.current;
      const scene = new T.Scene();
      scene.fog = new T.FogExp2(0x153b31, 0.055);

      const camera = new T.PerspectiveCamera(37, 1, 0.1, 100);
      camera.position.set(0, 0.15, 8.5);

      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.setClearColor(0x173f34, 0);
      mount.appendChild(renderer.domElement);

      const root = new T.Group();
      scene.add(root);

      const wood = new T.MeshStandardMaterial({ color: 0x70412e, roughness: 0.82 });
      const darkWood = new T.MeshStandardMaterial({ color: 0x3d241b, roughness: 0.9 });
      const cream = new T.MeshStandardMaterial({ color: 0xf4dfb9, roughness: 0.65 });
      const red = new T.MeshStandardMaterial({ color: 0xb64a30, roughness: 0.5, metalness: 0.15 });
      const brass = new T.MeshStandardMaterial({ color: 0xd29a3a, roughness: 0.35, metalness: 0.7 });
      const green = new T.MeshStandardMaterial({ color: 0x285f48, roughness: 0.72 });
      const blue = new T.MeshStandardMaterial({ color: 0x4e7d8c, roughness: 0.55, metalness: 0.15 });

      const box = (w: number, h: number, d: number, material: any) =>
        new T.Mesh(new T.BoxGeometry(w, h, d), material);

      const back = box(6.6, 4.5, 0.16, green);
      back.position.z = -1.15;
      root.add(back);

      [-1.45, 0.05, 1.55].forEach((y) => {
        const shelf = box(6.25, 0.18, 1.2, wood);
        shelf.position.set(0, y, -0.2);
        root.add(shelf);
      });

      const robot = new T.Group();
      const robotBody = box(0.92, 1.05, 0.58, blue);
      const robotHead = box(0.72, 0.65, 0.58, cream);
      robotHead.position.y = 0.86;
      robot.add(robotBody, robotHead);
      [-0.21, 0.21].forEach((x) => {
        const eye = new T.Mesh(new T.SphereGeometry(0.085, 14, 14), red);
        eye.position.set(x, 0.94, 0.31);
        robot.add(eye);
      });
      [-0.63, 0.63].forEach((x) => {
        const arm = box(0.25, 0.86, 0.25, brass);
        arm.position.set(x, 0.08, 0);
        arm.rotation.z = x > 0 ? -0.18 : 0.18;
        robot.add(arm);
      });
      [-0.25, 0.25].forEach((x) => {
        const leg = box(0.27, 0.45, 0.34, red);
        leg.position.set(x, -0.75, 0);
        robot.add(leg);
      });
      const antenna = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.42, 10), brass);
      antenna.position.y = 1.38;
      const antennaTip = new T.Mesh(new T.SphereGeometry(0.075, 12, 12), red);
      antennaTip.position.y = 1.62;
      robot.add(antenna, antennaTip);
      robot.position.set(-1.8, -0.62, 0.35);
      robot.rotation.y = 0.2;
      root.add(robot);

      const notebook = new T.Group();
      const pages = box(1.45, 0.13, 1.08, cream);
      const cover = box(1.5, 0.07, 1.12, red);
      cover.position.y = 0.1;
      notebook.add(pages, cover);
      notebook.position.set(0.05, 0.29, 0.25);
      notebook.rotation.y = -0.3;
      root.add(notebook);

      const cup = new T.Group();
      const cupBody = new T.Mesh(new T.CylinderGeometry(0.42, 0.34, 0.82, 28), cream);
      const handle = new T.Mesh(new T.TorusGeometry(0.27, 0.07, 10, 24, Math.PI * 1.55), cream);
      handle.rotation.z = -0.78;
      handle.position.set(0.39, 0.05, 0);
      cup.add(cupBody, handle);
      cup.position.set(1.88, 0.62, 0.28);
      root.add(cup);

      const pencilCup = new T.Mesh(new T.CylinderGeometry(0.34, 0.29, 0.75, 20), red);
      pencilCup.position.set(-0.35, -2.01, 0.18);
      root.add(pencilCup);
      [-0.18, 0, 0.17].forEach((x, i) => {
        const pencil = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1.25, 8), i === 1 ? green : brass);
        pencil.position.set(-0.35 + x, -1.46, 0.22);
        pencil.rotation.z = (i - 1) * 0.12;
        root.add(pencil);
      });

      const train = new T.Group();
      const trainBody = box(1.4, 0.55, 0.62, red);
      const cabin = box(0.58, 0.55, 0.56, blue);
      cabin.position.set(0.28, 0.5, 0);
      train.add(trainBody, cabin);
      [-0.43, 0.43].forEach((x) => {
        const wheel = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.12, 18), darkWood);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, -0.36, 0.34);
        train.add(wheel);
      });
      train.position.set(1.5, -1.83, 0.3);
      root.add(train);

      const glass = new T.MeshPhysicalMaterial({ color: 0xf4ead2, transparent: true, opacity: 0.12, roughness: 0.08 });
      const pane = box(7.1, 4.8, 0.04, glass);
      pane.position.z = 1.25;
      root.add(pane);

      scene.add(new T.HemisphereLight(0xffe4b0, 0x17372f, 2.1));
      const warm = new T.PointLight(0xffb85c, 55, 10, 1.4);
      warm.position.set(2.4, 2.5, 3.4);
      scene.add(warm);
      const fill = new T.PointLight(0xfff1d2, 25, 8, 1.8);
      fill.position.set(-3, 1.2, 2.4);
      scene.add(fill);

      const dustGeo = new T.BufferGeometry();
      const dustPositions = new Float32Array(180 * 3);
      for (let i = 0; i < dustPositions.length; i += 3) {
        dustPositions[i] = (Math.random() - 0.5) * 8;
        dustPositions[i + 1] = (Math.random() - 0.5) * 5;
        dustPositions[i + 2] = Math.random() * 4 - 0.5;
      }
      dustGeo.setAttribute("position", new T.BufferAttribute(dustPositions, 3));
      const dust = new T.Points(
        dustGeo,
        new T.PointsMaterial({ color: 0xffd99d, size: 0.025, transparent: true, opacity: 0.55 }),
      );
      scene.add(dust);

      let pointerX = 0;
      let pointerY = 0;
      let scrollProgress = 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let revealProgress = reducedMotion ? 1 : 0;
      let raf = 0;

      const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };

      const pointerMove = (event: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.24;
        pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.16;
      };

      const scrollScene = () => {
        const rect = mount.getBoundingClientRect();
        scrollProgress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
      };

      const started = performance.now();
      const render = () => {
        const t = (performance.now() - started) / 1000;
        revealProgress += (1 - revealProgress) * 0.035;
        const revealEase = 1 - Math.pow(1 - revealProgress, 3);
        camera.position.z = 10.6 - 2.1 * revealEase + scrollProgress * 0.5;
        root.scale.setScalar(0.86 + revealEase * 0.14);
        root.position.y = -0.14 * (1 - revealEase) + scrollProgress * 0.23;
        if (!reducedMotion) {
          root.rotation.y += (pointerX - root.rotation.y) * 0.035;
          root.rotation.x += (-pointerY - root.rotation.x) * 0.035;
          robot.position.y = -0.62 + Math.sin(t * 1.25) * 0.04;
          robot.rotation.y = 0.2 + Math.sin(t * 0.55) * 0.08;
          robotHead.rotation.y = Math.sin(t * 0.72) * -0.11;
          cup.rotation.z = Math.sin(t * 0.58) * 0.012;
          train.position.x = 1.5 + Math.sin(t * 0.42) * 0.045;
          dust.rotation.y = t * 0.018;
          warm.intensity = 52 + Math.sin(t * 1.8) * 3;
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };

      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      mount.addEventListener("pointermove", pointerMove);
      window.addEventListener("scroll", scrollScene, { passive: true });
      resize();
      scrollScene();
      render();
      mount.dataset.ready = "true";

      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        mount.removeEventListener("pointermove", pointerMove);
        window.removeEventListener("scroll", scrollScene);
        renderer.dispose();
        dustGeo.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    };

    if ((window as Window & { THREE?: any }).THREE) {
      buildScene();
    } else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-three]");
      if (existing) {
        existing.addEventListener("load", buildScene, { once: true });
      } else {
        const script = document.createElement("script");
        script.src = "/vendor/three.min.js";
        script.async = true;
        script.dataset.three = "true";
        script.addEventListener("load", buildScene, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="three-window"
      role="img"
      aria-label="따뜻한 조명 아래 로봇, 노트, 컵과 장난감 기차가 진열된 움직이는 빈티지 쇼윈도"
    />
  );
}

function ProductCard({
  product,
  favorite,
  onFavorite,
  onAdd,
  onOpen,
  index,
}: {
  product: Product;
  favorite: boolean;
  onFavorite: () => void;
  onAdd: () => void;
  onOpen: () => void;
  index: number;
}) {
  return (
    <article className={`product-card ${product.soldOut ? "is-sold-out" : ""}`} data-reveal data-delay={Math.min(index * 65, 260)}>
      <div className="product-media">
        <button className="media-button" onClick={onOpen} aria-label={`${product.name} 상세 보기`}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            style={{ objectPosition: product.position }}
          />
        </button>
        {product.badge && <span className="paper-badge">{product.badge}</span>}
        {product.soldOut && <span className="sold-out-stamp">SOLD OUT</span>}
        <button
          className={`favorite ${favorite ? "is-active" : ""}`}
          onClick={onFavorite}
          aria-label={favorite ? `${product.name} 찜 해제` : `${product.name} 찜하기`}
          aria-pressed={favorite}
        >
          {favorite ? "♥" : "♡"}
        </button>
        <button className="quick-add" onClick={onAdd} disabled={product.soldOut}>
          {product.soldOut ? "품절된 상품입니다" : "장바구니 담기"}
        </button>
      </div>
      <button className="product-copy" onClick={onOpen}>
        <span className="product-meta">{product.year}</span>
        <strong>{product.name}</strong>
        <span className="product-en">{product.englishName}</span>
        <span className="product-bottom">
          <span className="condition">{product.condition}</span>
          <b>₩{money.format(product.price)}</b>
        </span>
      </button>
    </article>
  );
}

export default function Home() {
  useOpenSourceMotion();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [category, setCategory] = useState<Category>("전체");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [cart, setCart] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMemo, setDeliveryMemo] = useState("");
  const [orderReady, setOrderReady] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({ zonecode: "", address: "", detail: "", extra: "" });
  const [savedAddresses, setSavedAddresses] = useState<CheckoutAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressNotice, setAddressNotice] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState(products[0].id);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewImage, setReviewImage] = useState("");
  const [openingDrawer, setOpeningDrawer] = useState<Exclude<Category, "전체"> | null>(null);
  const drawerPointerStart = useRef({ x: 0, y: 0 });
  const drawerNavigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectSceneCategory = useCallback((nextCategory: Exclude<Category, "전체">) => {
    const slugs: Record<Exclude<Category, "전체">, string> = {
      토이: "toys",
      캐릭터: "characters",
      문구: "stationery",
      리빙: "living",
      "빈티지 식기": "tableware",
    };
    setCategory(nextCategory);
    window.history.pushState(null, "", `#new/${slugs[nextCategory]}`);
    requestAnimationFrame(() => document.querySelector("#new")?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  useEffect(() => () => {
    if (drawerNavigationTimer.current) clearTimeout(drawerNavigationTimer.current);
  }, []);

  const openCategoryDrawer = useCallback((nextCategory: Exclude<Category, "전체">) => {
    setOpeningDrawer(nextCategory);
    if (drawerNavigationTimer.current) clearTimeout(drawerNavigationTimer.current);
    drawerNavigationTimer.current = setTimeout(() => {
      selectSceneCategory(nextCategory);
      setOpeningDrawer(null);
    }, 220);
  }, [selectSceneCategory]);

  const startDrawerTap = (event: ReactPointerEvent<HTMLButtonElement>, nextCategory: Exclude<Category, "전체">) => {
    drawerPointerStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setOpeningDrawer(nextCategory);
  };

  const finishDrawerTap = (event: ReactPointerEvent<HTMLButtonElement>, nextCategory: Exclude<Category, "전체">) => {
    const travel = Math.hypot(event.clientX - drawerPointerStart.current.x, event.clientY - drawerPointerStart.current.y);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (travel <= 12) openCategoryDrawer(nextCategory);
    else setOpeningDrawer(null);
  };

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "전체" || product.category === category;
      const matchesQuery =
        !normalized ||
        `${product.name} ${product.englishName} ${product.category} ${product.year}`
          .toLowerCase()
          .includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const visibleReviews = useMemo(() => {
    const allReviews = [...userReviews, ...seedReviews];
    if (reviewFilter === "five") return allReviews.filter((review) => review.rating === 5);
    if (reviewFilter === "photo") return allReviews.filter((review) => Boolean(review.image));
    return allReviews;
  }, [reviewFilter, userReviews]);

  const cartProducts = cart.map((id) => products.find((product) => product.id === id)).filter(Boolean) as Product[];
  const cartTotal = cartProducts.reduce((sum, product) => sum + product.price, 0);

  const applySavedAddress = useCallback((item: CheckoutAddress) => {
    setSelectedAddressId(item.id);
    setRecipient(item.recipient);
    setPhone(item.phone);
    setDeliveryAddress({ zonecode: item.zonecode, address: item.address, detail: item.detail, extra: item.extra });
    setOrderReady(false);
  }, []);

  const loadSavedAddresses = useCallback(async () => {
    if (!supabase) return;
    setAddressLoading(true);
    setAddressNotice("");
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      setAddressLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("addresses")
      .select("id, label, recipient, phone, zonecode, address, extra, detail, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      setAddressNotice("저장된 배송지를 불러오지 못했습니다. 직접 입력할 수 있어요.");
    } else {
      const loaded = (data || []).map((item) => ({
        id: Number(item.id),
        label: String(item.label),
        recipient: String(item.recipient),
        phone: String(item.phone),
        zonecode: String(item.zonecode),
        address: String(item.address),
        extra: String(item.extra || ""),
        detail: String(item.detail),
        isDefault: Boolean(item.is_default),
      }));
      setSavedAddresses(loaded);
      const preferred = loaded.find((item) => item.isDefault) || loaded[0];
      if (preferred) applySavedAddress(preferred);
    }
    setAddressLoading(false);
  }, [applySavedAddress, supabase]);

  const toggleFavorite = (id: number) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addToCart = (id: number) => {
    if (products.find((product) => product.id === id)?.soldOut) return;
    setCart((current) => [...current, id]);
    setCartOpen(true);
  };

  const submitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewText.trim()) return;
    setUserReviews((current) => [
      {
        id: `review-user-${Date.now()}`,
        productId: reviewProductId,
        author: "나의 리뷰",
        date: new Intl.DateTimeFormat("ko-KR").format(new Date()),
        rating: reviewRating,
        text: reviewText.trim(),
        image: reviewImage || products.find((product) => product.id === reviewProductId)?.image || "",
        position: reviewImage ? "center" : products.find((product) => product.id === reviewProductId)?.position,
        helpful: 0,
      },
      ...current,
    ]);
    setReviewFilter("all");
    setReviewText("");
    setReviewImage("");
    setReviewRating(5);
    setReviewOpen(false);
    requestAnimationFrame(() => document.querySelector("#reviews")?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <div className="site-shell">
      <div className="scroll-progress" aria-hidden="true" />
      <div className="announcement">
        <span>매주 금요일 오후 8시, 새로운 오래된 물건이 도착합니다.</span>
        <span className="announcement-side">국내 7만원 이상 무료배송</span>
      </div>

      <header className="site-header">
        <a href="#top" className="brand" aria-label="Pocket Archive 홈">
          <img src="/pocket-archive-sign-cropped.png" alt="Pocket Archive" />
        </a>
        <nav className={menuOpen ? "nav is-open" : "nav"} aria-label="주요 메뉴">
          <a href="#new" onClick={() => setMenuOpen(false)}>NEW IN</a>
          <a href="#collections" onClick={() => setMenuOpen(false)}>COLLECTIONS</a>
          <a href="#reviews" onClick={() => setMenuOpen(false)}>REVIEWS</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>OUR STORY</a>
          <a href="#journal" onClick={() => setMenuOpen(false)}>JOURNAL</a>
        </nav>
        <div className="header-actions">
          <button onClick={() => setSearchOpen((open) => !open)} aria-label="검색 열기">검색</button>
          <button aria-label={`찜한 상품 ${favorites.size}개`}>찜 {favorites.size || ""}</button>
          <button onClick={() => setCartOpen(true)} aria-label={`장바구니 ${cart.length}개`}>
            장바구니 <span className="cart-count">{cart.length}</span>
          </button>
          <AuthAccountButton />
          <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="메뉴 열기">
            {menuOpen ? "닫기" : "메뉴"}
          </button>
        </div>
        {searchOpen && (
          <div className="search-panel">
            <label htmlFor="site-search">어떤 오래된 물건을 찾고 있나요?</label>
            <input
              id="site-search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="로봇, 캐릭터 컵, 노트…"
            />
            <a href="#new" onClick={() => setSearchOpen(false)}>검색 결과 보기 →</a>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero">
          <div className="brick-glow" aria-hidden="true" />
          <div className="shop-sign">
            <img src="/pocket-archive-sign-cropped.png" alt="Pocket Archive" />
          </div>
          <div className="hero-window">
            <div className="scene-wrap">
              <PhotorealWindowScene onSelectCategory={selectSceneCategory} />
              <div className="window-reflection" aria-hidden="true" />
            </div>
            <div className="window-copy">
              <span className="scene-hint"><span className="desktop-hint">POCKET ARCHIVE · MOVE CURSOR · DISCOVER OBJECTS</span><span className="touch-hint">OBJECT를 한 번 탭해 빛내고 · 다시 탭해 둘러보세요</span></span>
              <div>
                <span className="eyebrow">A TINY SHOP OF OLD TREASURES</span>
                <h1><span className="hero-line">Small things,</span><span className="hero-line"><i>old stories.</i></span></h1>
              </div>
              <p className="scene-action">빛나는 오브제를 클릭하면 컬렉션으로 이어집니다. <span>→</span></p>
            </div>
          </div>
          <a className="scroll-note" href="#new">SCROLL TO BROWSE <span>↓</span></a>
        </section>

        <section className="products-section" id="new">
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow green">JUST ARRIVED</span>
              <h2>오늘 들어온 물건</h2>
            </div>
            <p>시간의 흔적까지 매력적인 물건을 하나씩 살펴보고 기록했습니다.</p>
          </div>

          <div className="filter-row" aria-label="상품 카테고리">
            {categories.map((item) => (
              <button
                key={item}
                className={category === item ? "active" : ""}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
            <span className="result-count">{visibleProducts.length} ITEMS</span>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="product-grid">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  favorite={favorites.has(product.id)}
                  onFavorite={() => toggleFavorite(product.id)}
                  onAdd={() => addToCart(product.id)}
                  onOpen={() => setSelected(product)}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">아직 이 서랍에는 물건이 없어요. 다른 검색어를 입력해 보세요.</div>
          )}
        </section>

        <section className="reviews-section" id="reviews">
          <div className="reviews-head" data-reveal>
            <div>
              <span className="eyebrow green">PURCHASE REVIEWS</span>
              <h2>구매 후기</h2>
              <p className="reviews-intro">포켓 아카이브의 물건을 먼저 받아본 분들의 이야기입니다.</p>
            </div>
            <div className="review-score" aria-label="구매 후기 평균 별점 4.9점">
              <strong>4.9</strong>
              <div><span className="review-stars">★★★★★</span><small>구매 후기 {seedReviews.length + userReviews.length}개</small></div>
            </div>
          </div>

          <div className="review-toolbar" data-reveal>
            <div className="review-tabs" role="tablist" aria-label="리뷰 필터">
              {([
                ["all", "전체 리뷰"],
                ["photo", "포토 리뷰"],
                ["five", "별점 5점"],
              ] as Array<[ReviewFilter, string]>).map(([value, label]) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={reviewFilter === value}
                  className={reviewFilter === value ? "active" : ""}
                  onClick={() => setReviewFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="review-write" onClick={() => setReviewOpen(true)}>리뷰 작성하기</button>
          </div>

          <div className="review-grid">
            {visibleReviews.map((review, index) => {
              const reviewProduct = products.find((product) => product.id === review.productId)!;
              const markedHelpful = helpfulReviews.has(review.id);
              return (
                <article className="review-card" key={review.id} data-reveal data-delay={Math.min(index * 70, 260)}>
                  <button className="review-photo" onClick={() => setSelected(reviewProduct)} aria-label={`${reviewProduct.name} 상세 보기`}>
                    <img src={review.image} alt={`${reviewProduct.name} 구매 후기 사진`} style={{ objectPosition: review.position }} />
                    {reviewProduct.soldOut && <span>SOLD OUT ARCHIVE</span>}
                  </button>
                  <div className="review-body">
                    <div className="review-rating-row">
                      <span className="review-stars" aria-label={`별점 ${review.rating}점`}>
                        {"★".repeat(review.rating)}<i>{"★".repeat(5 - review.rating)}</i>
                      </span>
                      <time>{review.date}</time>
                    </div>
                    <button className="review-product" onClick={() => setSelected(reviewProduct)}>
                      <span>{reviewProduct.category} · {reviewProduct.year}</span>
                      <strong>{reviewProduct.name}</strong>
                    </button>
                    <p>{review.text}</p>
                    <div className="review-foot">
                      <span>구매 인증 · {review.author}</span>
                      <button
                        className={markedHelpful ? "is-helpful" : ""}
                        aria-pressed={markedHelpful}
                        onClick={() => setHelpfulReviews((current) => {
                          const next = new Set(current);
                          if (next.has(review.id)) next.delete(review.id);
                          else next.add(review.id);
                          return next;
                        })}
                      >
                        ♡ 도움돼요 {review.helpful + (markedHelpful ? 1 : 0)}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="collections" id="collections">
          <div className="section-heading compact" data-reveal>
            <div>
              <span className="eyebrow cream">BROWSE THE CABINETS</span>
              <h2>어느 서랍부터 열어볼까요?</h2>
            </div>
            <p>수집을 시작하기 좋은 네 가지 선반을 준비했습니다.</p>
          </div>
          <div className="drawer-cabinet">
            {drawerCollections.map((drawer, index) => {
              return (
                <article className={`drawer-unit ${openingDrawer === drawer.category ? "is-open" : ""}`} key={drawer.category} data-reveal data-delay={index * 70}>
                  <div className="drawer-interior">
                    <img src={drawer.image} alt="" style={{ objectPosition: drawer.position }} />
                    <div>
                      <span>INSIDE DRAWER {drawer.number}</span>
                      <strong>{drawer.description}</strong>
                      <button onClick={() => selectSceneCategory(drawer.category)}>{drawer.category} 보기 →</button>
                    </div>
                  </div>
                  <button
                    className="drawer-front"
                    onPointerDown={(event) => startDrawerTap(event, drawer.category)}
                    onPointerUp={(event) => finishDrawerTap(event, drawer.category)}
                    onPointerCancel={() => setOpeningDrawer(null)}
                    onClick={(event) => { if (event.detail === 0) openCategoryDrawer(drawer.category); }}
                    aria-label={`${drawer.category} 상품 카테고리 보기`}
                  >
                    <span className="drawer-number">{drawer.number}</span>
                    <span className="drawer-title">{drawer.title}<br /><i>{drawer.accent}</i></span>
                    <span className="drawer-handle"><b /></span>
                    <span className="drawer-command">VIEW CATEGORY</span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="editorial" id="story">
          <div className="editorial-photo" data-reveal data-duration="1200">
            <img src="/references/storefront-day.png" alt="햇살이 비치는 벽돌 건물의 작은 빈티지 숍" />
            <span className="photo-caption">A little shop, somewhere familiar.</span>
          </div>
          <div className="editorial-copy" data-reveal data-delay="100">
            <span className="eyebrow green">THE SHOPKEEPER&apos;S NOTE</span>
            <h2>낡았다는 건,<br />그만큼 오래 사랑받았다는 것.</h2>
            <p>
              포켓 아카이브는 반짝이는 새것보다 손때 묻은 물건에 마음이 갑니다.
              제조 시기와 각인, 작은 흠집까지 직접 살피고 다음 주인이 알아야 할 이야기를 정직하게 기록합니다.
            </p>
            <dl>
              <div><dt>01</dt><dd>실제 상품을 직접 촬영합니다.</dd></div>
              <div><dt>02</dt><dd>흠집과 변색을 숨김없이 기록합니다.</dd></div>
              <div><dt>03</dt><dd>한 점씩 안전하게 포장합니다.</dd></div>
            </dl>
            <a href="#journal" className="underlined">우리의 수집 이야기를 읽어보세요 →</a>
          </div>
        </section>

        <section className="journal" id="journal">
          <div className="journal-title" data-reveal>
            <span className="eyebrow">FROM THE JOURNAL · ISSUE 08</span>
            <h2>책상 위 작은 박물관</h2>
            <p>오래된 클립과 노트, 연필 한 자루로 시작하는 빈티지 문구 수집 안내서.</p>
            <a href="#new" className="button light">이야기 읽기</a>
          </div>
          <div className="journal-image" data-reveal data-delay="120" data-duration="1200">
            <img src="/references/stationery-desk.png" alt="빈티지 문구로 꾸민 나무 책상" />
            <span>STATIONERY<br />COLLECTOR&apos;S GUIDE</span>
          </div>
        </section>

        <section className="newsletter">
          <div data-reveal>
            <span className="eyebrow green">FRIDAY, 8 PM</span>
            <h2>새로운 오래된 물건이<br />도착하면 알려드릴게요.</h2>
          </div>
          <form data-reveal data-delay="100" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="email">입고 소식을 받을 이메일</label>
            <div>
              <input id="email" type="email" placeholder="hello@example.com" required />
              <button type="submit">소식 받기 →</button>
            </div>
            <small>월 2–3회, 좋은 물건이 있을 때만 편지를 보냅니다.</small>
          </form>
        </section>
      </main>

      <footer>
        <a href="#top" className="footer-brand" aria-label="Pocket Archive 홈"><img src="/pocket-archive-sign-cropped.png" alt="Pocket Archive" /></a>
        <div className="footer-links">
          <div><b>SHOP</b><a href="#new">새로 들어온 물건</a><a href="#collections">카테고리</a><a href="#reviews">구매 후기</a></div>
          <div><b>HELP</b><a href="#story">배송과 포장</a><a href="#story">상태 등급 안내</a><a href="#story">문의하기</a></div>
          <div><b>VISIT</b><span>서울시 성동구 작은 골목 17</span><span>WED–SUN · 12–19</span><span>@pocket.archive</span></div>
        </div>
        <div className="footer-bottom"><span>© 2026 POCKET ARCHIVE</span><a href="https://github.com/juliangarnier/anime" target="_blank" rel="noreferrer">ANIME.JS + THREE.JS · MIT</a><span>OLD THINGS, NEW STORIES.</span></div>
      </footer>

      {cartOpen && (
        <div className="overlay" onMouseDown={() => setCartOpen(false)}>
          <aside className="cart-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="장바구니">
            <div className="drawer-head"><div><span>YOUR DRAWER</span><h2>장바구니</h2></div><button onClick={() => setCartOpen(false)}>닫기 ×</button></div>
            {cartProducts.length === 0 ? (
              <div className="drawer-empty"><span>아직 서랍이 비어 있어요.</span><button onClick={() => setCartOpen(false)}>물건 둘러보기</button></div>
            ) : (
              <>
                <div className="cart-items">
                  {cartProducts.map((product, index) => (
                    <div className="cart-item" key={`${product.id}-${index}`}>
                      <img src={product.image} alt="" style={{ objectPosition: product.position }} />
                      <div><span>{product.year}</span><b>{product.name}</b><strong>₩{money.format(product.price)}</strong></div>
                      <button aria-label={`${product.name} 삭제`} onClick={() => setCart((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button>
                    </div>
                  ))}
                </div>
                <div className="cart-total"><span>합계</span><b>₩{money.format(cartTotal)}</b></div>
                <button className="checkout" onClick={() => { setCartOpen(false); setCheckoutOpen(true); setOrderReady(false); void loadSavedAddresses(); }}>주문서 작성하기</button>
                <small className="cart-help">모든 상품은 한 점만 보유하고 있어요. 결제 완료 시 재고가 확정됩니다.</small>
              </>
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="overlay modal-overlay checkout-overlay" onMouseDown={() => setCheckoutOpen(false)}>
          <form
            className="shipping-modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              if (!deliveryAddress.zonecode || !deliveryAddress.detail.trim()) return;
              setOrderReady(true);
            }}
          >
            <button type="button" className="modal-close" onClick={() => setCheckoutOpen(false)} aria-label="배송지 입력 닫기">×</button>
            <div className="shipping-heading">
              <span>DELIVERY NOTE · SEOUL</span>
              <h2>어디로 보내드릴까요?</h2>
              <p>오래된 물건이 새로운 이야기를 시작할 주소를 알려주세요.</p>
            </div>

            {orderReady ? (
              <div className="order-ready-card" aria-live="polite">
                <span>ADDRESS CONFIRMED</span>
                <h3>배송지가 확인되었습니다.</h3>
                <p>{recipient} · {phone}</p>
                <address>
                  [{deliveryAddress.zonecode}] {deliveryAddress.address} {deliveryAddress.extra}<br />
                  {deliveryAddress.detail}
                </address>
                {deliveryMemo && <small>배송 메모 · {deliveryMemo}</small>}
                <div><span>주문 금액</span><b>₩{money.format(cartTotal)}</b></div>
                <TossPayment
                  amount={cartTotal}
                  items={cartProducts.map(({ name, price }) => ({ name, price }))}
                  recipient={recipient}
                  phone={phone}
                  address={`[${deliveryAddress.zonecode}] ${deliveryAddress.address} ${deliveryAddress.extra} ${deliveryAddress.detail}`.trim()}
                />
                <button type="button" className="checkout checkout-secondary" onClick={() => setOrderReady(false)}>배송지 수정하기</button>
              </div>
            ) : (
              <>
                {addressLoading && <p className="saved-address-notice" aria-live="polite">저장된 배송지를 불러오고 있어요.</p>}
                {!addressLoading && savedAddresses.length > 0 && (
                  <section className="checkout-address-book" aria-label="저장된 배송지 선택">
                    <div><span>MY ADDRESS BOOK</span><strong>저장된 배송지</strong></div>
                    <div className="checkout-address-options">
                      {savedAddresses.map((item) => (
                        <button
                          type="button"
                          className={selectedAddressId === item.id ? "is-selected" : ""}
                          aria-pressed={selectedAddressId === item.id}
                          onClick={() => applySavedAddress(item)}
                          key={item.id}
                        >
                          <span>{item.label}{item.isDefault && <em>기본</em>}</span>
                          <small>{item.recipient} · [{item.zonecode}] {item.address} {item.detail}</small>
                        </button>
                      ))}
                    </div>
                    <a href="/mypage#addresses">배송지 관리</a>
                  </section>
                )}
                {addressNotice && <p className="saved-address-notice" role="status">{addressNotice}</p>}
                <div className="recipient-grid">
                  <label>
                    <span>받는 분</span>
                    <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="이름" required autoComplete="name" />
                  </label>
                  <label>
                    <span>연락처</span>
                    <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="010-0000-0000" required inputMode="tel" autoComplete="tel" />
                  </label>
                </div>
                <KakaoAddressSearch value={deliveryAddress} onChange={setDeliveryAddress} />
                <label className="delivery-memo">
                  <span>배송 메모</span>
                  <select value={deliveryMemo} onChange={(event) => setDeliveryMemo(event.target.value)}>
                    <option value="">배송 메모를 선택해주세요.</option>
                    <option value="문 앞에 놓아주세요.">문 앞에 놓아주세요.</option>
                    <option value="배송 전 연락 부탁드립니다.">배송 전 연락 부탁드립니다.</option>
                    <option value="경비실에 맡겨주세요.">경비실에 맡겨주세요.</option>
                  </select>
                </label>
                <div className="shipping-total"><span>{cartProducts.length}개의 빈티지 물건</span><b>₩{money.format(cartTotal)}</b></div>
                <button className="checkout" type="submit" disabled={!deliveryAddress.zonecode}>배송지 확인하기</button>
                <small className="kakao-notice">마이페이지에 등록된 기본 배송지는 다음 주문에 자동으로 불러옵니다. 새 주소는 카카오 우편번호 서비스로 검색할 수 있어요.</small>
              </>
            )}
          </form>
        </div>
      )}

      {selected && (
        <div className="overlay modal-overlay" onMouseDown={() => setSelected(null)}>
          <div className="quick-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="상세 보기 닫기">×</button>
            <div className="modal-image"><img src={selected.image} alt={selected.name} style={{ objectPosition: selected.position }} /></div>
            <div className="modal-copy">
              <span className="eyebrow green">{selected.category} · {selected.year}</span>
              <h2>{selected.name}</h2>
              <p className="modal-en">{selected.englishName}</p>
              <strong className="modal-price">₩{money.format(selected.price)}</strong>
              <p>세월에 따른 미세한 사용감이 있지만 전체적인 프린트와 형태가 아름답게 보존된 제품입니다. 상세 상태는 주문 전 다시 한번 안내드립니다.</p>
              <div className="detail-table"><span>상태</span><b>{selected.condition}</b><span>재고</span><b className={selected.soldOut ? "sold-out-text" : ""}>{selected.soldOut ? "SOLD OUT" : "1점"}</b><span>배송</span><b>{selected.soldOut ? "판매 완료된 아카이브" : "2–3 영업일"}</b></div>
              <button className="checkout" disabled={selected.soldOut} onClick={() => { addToCart(selected.id); setSelected(null); }}>
                {selected.soldOut ? "품절된 상품입니다" : "장바구니 담기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewOpen && (
        <div className="overlay modal-overlay" onMouseDown={() => setReviewOpen(false)}>
          <form className="review-modal" onSubmit={submitReview} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setReviewOpen(false)} aria-label="리뷰 작성 닫기">×</button>
            <span className="eyebrow green">SHARE A NEW STORY</span>
            <h2>구매 후기를 남겨주세요.</h2>
            <label>
              리뷰 상품
              <select value={reviewProductId} onChange={(event) => setReviewProductId(Number(event.target.value))}>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </label>
            <fieldset>
              <legend>별점</legend>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    type="button"
                    key={rating}
                    className={rating <= reviewRating ? "active" : ""}
                    onClick={() => setReviewRating(rating)}
                    aria-label={`${rating}점`}
                  >★</button>
                ))}
              </div>
            </fieldset>
            <label>
              상품평
              <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="물건의 상태, 포장, 새 자리에서의 이야기를 들려주세요." required />
            </label>
            <label className="photo-upload">
              사진 첨부
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setReviewImage(String(reader.result || ""));
                  reader.readAsDataURL(file);
                }}
              />
              <span>{reviewImage ? "사진이 준비되었습니다 ✓" : "상품 사진 선택하기"}</span>
            </label>
            <button className="checkout" type="submit">리뷰 등록하기</button>
          </form>
        </div>
      )}
    </div>
  );
}
