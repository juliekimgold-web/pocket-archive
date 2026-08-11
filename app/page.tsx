"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Category = "전체" | "토이" | "캐릭터" | "문구" | "리빙";

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
    image:
      "https://images.unsplash.com/photo-1671490289904-f7b8e0da9e82?auto=format&fit=crop&w=1200&q=88",
  },
  {
    id: 2,
    name: "밤비 프린트 글라스",
    englishName: "Bambi Lemon Glass",
    category: "캐릭터",
    year: "1980s · Korea",
    price: 42000,
    condition: "Excellent",
    badge: "미사용",
    image: "/references/character-glass.png",
    position: "27% 54%",
  },
  {
    id: 3,
    name: "컴포지션 노트 세트",
    englishName: "Old School Desk Set",
    category: "문구",
    year: "1990s · USA",
    price: 36000,
    condition: "New Old Stock",
    image: "/references/stationery-desk.png",
    position: "54% 50%",
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
    image: "/references/shop-interior.png",
    position: "12% 42%",
  },
  {
    id: 5,
    name: "브라스 메모 클립",
    englishName: "Brass Memo Clip",
    category: "문구",
    year: "1970s · England",
    price: 28000,
    condition: "Good",
    image:
      "https://www.poooliprint.com/cdn/shop/files/SKU-_-Edited_1a46ca0b-8928-44db-a5ef-7f4bfc70b80e.jpg?v=1730176805&width=800",
  },
  {
    id: 6,
    name: "스페이스 미키 보틀",
    englishName: "Space Character Bottle",
    category: "리빙",
    year: "1987 · Korea",
    price: 68000,
    condition: "Excellent",
    badge: "희귀",
    image: "/references/character-glass.png",
    position: "57% 48%",
  },
  {
    id: 7,
    name: "미니 테디 컬렉션",
    englishName: "Tiny Teddy Pair",
    category: "토이",
    year: "1980s · Germany",
    price: 89000,
    condition: "Good",
    image: "/references/shop-interior.png",
    position: "73% 63%",
  },
  {
    id: 8,
    name: "레트로 포스트카드 팩",
    englishName: "Little Postcard Archive",
    category: "문구",
    year: "1970–90s · Mixed",
    price: 18000,
    condition: "Very Good",
    image: "/references/shop-interior.png",
    position: "82% 25%",
  },
];

const categories: Category[] = ["전체", "토이", "캐릭터", "문구", "리빙"];

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
      animate(".window-copy .eyebrow, .hero-line, .window-copy p, .hero-buttons", {
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
      animate(".scene-note", {
        opacity: { from: 0 },
        y: { from: 18 },
        rotate: { from: -9 },
        duration: 850,
        delay: stagger(180, { start: 920 }),
        ease: "outBack",
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
    <article className="product-card" data-reveal data-delay={Math.min(index * 65, 260)}>
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
        <button
          className={`favorite ${favorite ? "is-active" : ""}`}
          onClick={onFavorite}
          aria-label={favorite ? `${product.name} 찜 해제` : `${product.name} 찜하기`}
          aria-pressed={favorite}
        >
          {favorite ? "♥" : "♡"}
        </button>
        <button className="quick-add" onClick={onAdd}>장바구니 담기</button>
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
  const [category, setCategory] = useState<Category>("전체");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [cart, setCart] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const cartProducts = cart.map((id) => products.find((product) => product.id === id)).filter(Boolean) as Product[];
  const cartTotal = cartProducts.reduce((sum, product) => sum + product.price, 0);

  const toggleFavorite = (id: number) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addToCart = (id: number) => {
    setCart((current) => [...current, id]);
    setCartOpen(true);
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
          <span className="brand-small">THE LITTLE OLD THINGS</span>
          <span>POCKET ARCHIVE</span>
        </a>
        <nav className={menuOpen ? "nav is-open" : "nav"} aria-label="주요 메뉴">
          <a href="#new" onClick={() => setMenuOpen(false)}>NEW IN</a>
          <a href="#collections" onClick={() => setMenuOpen(false)}>COLLECTIONS</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>OUR STORY</a>
          <a href="#journal" onClick={() => setMenuOpen(false)}>JOURNAL</a>
        </nav>
        <div className="header-actions">
          <button onClick={() => setSearchOpen((open) => !open)} aria-label="검색 열기">검색</button>
          <button aria-label={`찜한 상품 ${favorites.size}개`}>찜 {favorites.size || ""}</button>
          <button onClick={() => setCartOpen(true)} aria-label={`장바구니 ${cart.length}개`}>
            장바구니 <span className="cart-count">{cart.length}</span>
          </button>
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
            <span>TOYS · CHARACTER GOODS · STATIONERY</span>
            <b>POCKET ARCHIVE</b>
            <span>HAPPINESS IN EVERY DRAWER</span>
          </div>
          <div className="hero-window">
            <div className="window-copy">
              <span className="eyebrow">A TINY SHOP OF OLD TREASURES</span>
              <h1><span className="hero-line">Small things,</span><span className="hero-line"><i>old stories.</i></span></h1>
              <p>
                한때 누군가의 책상과 선반을 빛냈던 물건들.<br />
                오래될수록 더 사랑스러운 작은 보물을 소개합니다.
              </p>
              <div className="hero-buttons">
                <a className="button primary" href="#new">오늘의 입고품</a>
                <a className="button text" href="#collections">상점 둘러보기 <span>→</span></a>
              </div>
            </div>
            <div className="scene-wrap">
              <WindowScene />
              <div className="window-reflection" aria-hidden="true" />
              <span className="scene-note note-one">1960s<br />TIN ROBOT</span>
              <span className="scene-note note-two">NEW<br />OLD STOCK</span>
              <span className="scene-hint">마우스를 천천히 움직여보세요</span>
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

        <section className="collections" id="collections">
          <div className="section-heading compact" data-reveal>
            <div>
              <span className="eyebrow cream">BROWSE THE CABINETS</span>
              <h2>어느 서랍부터 열어볼까요?</h2>
            </div>
            <p>수집을 시작하기 좋은 네 가지 선반을 준비했습니다.</p>
          </div>
          <div className="collection-grid">
            <button className="collection-card tall" data-reveal data-duration="1150" onClick={() => { setCategory("캐릭터"); location.hash = "new"; }}>
              <img src="/references/character-glass.png" alt="빈티지 캐릭터 유리잔" />
              <span className="collection-number">01</span>
              <span className="collection-title">Character<br /><i>Goods</i></span>
              <span className="collection-link">컵, 인형과 작은 기념품 →</span>
            </button>
            <button className="collection-card" data-reveal data-delay="90" data-duration="1150" onClick={() => { setCategory("문구"); location.hash = "new"; }}>
              <img src="/references/stationery-desk.png" alt="오래된 노트와 문구가 놓인 책상" />
              <span className="collection-number">02</span>
              <span className="collection-title">Paper &amp;<br /><i>Stationery</i></span>
              <span className="collection-link">쓰고 간직하는 물건 →</span>
            </button>
            <button className="collection-card" data-reveal data-delay="160" data-duration="1150" onClick={() => { setCategory("토이"); location.hash = "new"; }}>
              <img src="/references/shop-interior.png" alt="인형과 장난감으로 가득한 빈티지 숍" />
              <span className="collection-number">03</span>
              <span className="collection-title">Toys &amp;<br /><i>Friends</i></span>
              <span className="collection-link">오래된 놀이 친구들 →</span>
            </button>
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
        <a href="#top" className="footer-brand">POCKET<br /><i>ARCHIVE</i></a>
        <div className="footer-links">
          <div><b>SHOP</b><a href="#new">새로 들어온 물건</a><a href="#collections">카테고리</a><a href="#new">모든 상품</a></div>
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
                <button className="checkout">주문서 작성하기</button>
                <small className="cart-help">모든 상품은 한 점만 보유하고 있어요. 결제 완료 시 재고가 확정됩니다.</small>
              </>
            )}
          </aside>
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
              <div className="detail-table"><span>상태</span><b>{selected.condition}</b><span>재고</span><b>1점</b><span>배송</span><b>2–3 영업일</b></div>
              <button className="checkout" onClick={() => { addToCart(selected.id); setSelected(null); }}>장바구니 담기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
