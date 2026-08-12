"use client";

import { useEffect, useState } from "react";
import "./journal.css";

type JournalArticle = {
  slug: string;
  category: string;
  issue: string;
  title: string;
  summary: string;
  image: string;
  imagePosition?: string;
  readTime: string;
  intro: string;
  quote: string;
  sections: Array<{ heading: string; body: string }>;
  checklist: string[];
};

const articles: JournalArticle[] = [
  {
    slug: "desk-museum",
    category: "STATIONERY",
    issue: "ISSUE 08",
    title: "책상 위 작은 박물관",
    summary: "오래된 클립과 노트, 연필 한 자루로 시작하는 빈티지 문구 수집 안내서.",
    image: "/journal/desk-archive-editorial.webp",
    readTime: "6분",
    intro: "빈티지 문구는 거창한 진열장 없이도 시작할 수 있는 수집입니다. 매일 쓰는 책상 한쪽에 오래된 클립과 노트 한 권을 두는 순간, 가장 개인적인 작은 박물관이 만들어집니다.",
    quote: "좋은 수집은 물건을 소유하는 일이 아니라, 그 물건을 다시 바라보는 시간을 만드는 일에 가깝습니다.",
    sections: [
      { heading: "연도보다 먼저 볼 것", body: "표지의 인쇄 방식, 제본의 실 색, 금속 부속의 산화 정도를 차례로 살펴보세요. 오래된 물건의 매력은 완벽한 새것이 아니라 서로 다른 재료가 같은 시간을 지나온 흔적에 있습니다." },
      { heading: "사용할 것과 보관할 것", body: "빈 노트는 첫 장만 기록하고 나머지는 보존하거나, 낱장의 편지지와 클립처럼 교체 가능한 물건부터 실제로 사용해보세요. 수집품과 일상이 자연스럽게 이어집니다." },
      { heading: "책상 위에 작은 질서 만들기", body: "자주 쓰는 물건, 계절마다 꺼내볼 물건, 장기 보관할 물건을 세 구역으로 나누면 수집이 쌓여도 부담스럽지 않습니다. 얕은 나무 트레이에는 클립과 스탬프를, 종이 상자에는 노트와 엽서를, 닫힌 서랍에는 빛에 약한 인쇄물을 둡니다. 무엇이 어디에 있는지 짧게 기록한 목록을 함께 보관하면 물건을 찾기 위해 불필요하게 만지는 횟수도 줄어듭니다." },
      { heading: "낡음과 손상의 경계", body: "모서리의 마모나 종이의 자연스러운 변색은 시간의 표정이지만, 가루처럼 떨어지는 종이와 번지는 곰팡이 자국은 진행 중인 손상입니다. 새로 들인 종이 물건은 기존 컬렉션과 바로 섞지 말고 며칠 동안 별도 폴더에 두어 냄새와 얼룩의 변화를 관찰하세요. 보존은 모든 흔적을 지우는 것이 아니라 더 빠른 손상을 멈추는 일입니다." },
    ],
    checklist: ["종이에서 곰팡이 냄새가 나지 않는지", "금속 녹이 종이로 번지고 있지 않은지", "직사광선을 피해 보관할 수 있는지"],
  },
  {
    slug: "clockwork-robot",
    category: "TIN TOYS",
    issue: "ISSUE 07",
    title: "태엽 로봇의 시간을 읽는 법",
    summary: "주석 장난감의 프린트와 태엽 소리에서 제작 시기와 상태를 살피는 방법.",
    image: "/journal/robot-workshop-editorial.webp",
    imagePosition: "43% 52%",
    readTime: "7분",
    intro: "틴 토이는 작은 흠집 하나에도 이동과 놀이의 역사가 남습니다. 태엽을 무리하게 감기 전에 몸체와 관절, 바닥면의 각인을 천천히 관찰하는 것이 좋은 수집의 시작입니다.",
    quote: "작동한다는 사실보다 중요한 것은, 어떤 상태로 여기까지 움직여 왔는지를 읽는 것입니다.",
    sections: [
      { heading: "프린트의 겹을 관찰하기", body: "초기 석판 인쇄는 색면이 아주 미세하게 어긋나는 경우가 많습니다. 지나치게 선명하고 균일한 표면보다는 모서리의 자연스러운 마모와 인쇄층의 순서를 함께 확인하세요." },
      { heading: "태엽은 짧게 시험하기", body: "처음 만난 제품은 한두 바퀴만 천천히 감아 작동음을 확인합니다. 뻑뻑하거나 걸리는 느낌이 들면 즉시 멈추고, 오일을 직접 넣기보다 전문 수리점의 점검을 권합니다." },
      { heading: "복원 흔적을 읽는 순서", body: "나사의 머리와 접합부, 발바닥을 먼저 보면 몸체의 개봉 여부를 짐작할 수 있습니다. 새 나사 하나가 곧 가치 하락을 뜻하지는 않지만, 판매자가 수리 범위와 교체 부품을 설명할 수 있어야 합니다. 강한 조명 아래에서 색이 유난히 매끈한 부분, 마모 위를 덮은 붓 자국, 다른 면과 광택이 다른 도색을 천천히 비교하세요." },
      { heading: "움직임을 기록해두기", body: "구입한 날의 짧은 작동 영상과 태엽을 감은 횟수, 걸음의 방향을 기록하면 이후 상태 변화를 판단하기 쉽습니다. 전시할 때는 바퀴와 발에 하중이 오래 집중되지 않도록 중성지 받침을 사용하고, 한두 달에 한 번 위치를 바꿔줍니다. 움직이는 장난감도 대부분의 시간에는 편히 쉬어야 합니다." },
    ],
    checklist: ["바닥면 제조사 각인", "배터리함 또는 태엽축의 부식", "복원 도색 여부와 원래 나사 상태"],
  },
  {
    slug: "character-glass",
    category: "TABLEWARE",
    issue: "ISSUE 06",
    title: "캐릭터 글라스, 프린트를 오래 지키는 법",
    summary: "빈티지 컵의 전사 프린트와 유리 상태를 확인하고 안전하게 관리하는 요령.",
    image: "/journal/glass-care-editorial.webp",
    readTime: "5분",
    intro: "작은 캐릭터 컵은 시대의 색감과 생활상을 동시에 보여줍니다. 하지만 오래된 전사 프린트는 열과 마찰에 약하므로, 구매 전 상태 확인과 사용 후 관리가 특히 중요합니다.",
    quote: "빈티지 식기는 완벽하게 깨끗한 물건보다, 안전하게 이해하고 조심스럽게 쓰는 물건에 가깝습니다.",
    sections: [
      { heading: "빛을 비춰 림과 바닥 보기", body: "창가의 부드러운 빛에 컵을 비스듬히 돌리면 미세한 칩과 헤어라인을 쉽게 찾을 수 있습니다. 입이 닿는 림의 거친 부분과 바닥의 별 모양 균열은 반드시 확인하세요." },
      { heading: "손세척이 가장 좋은 보존", body: "미지근한 물과 부드러운 스펀지를 사용하고 프린트 면은 문지르지 않습니다. 식기세척기, 표백제, 장시간 물에 담가두는 방식은 피해주세요." },
      { heading: "실사용과 전시를 구분하기", body: "제조 시기와 재료가 명확하지 않거나 금속성 장식이 있는 식기는 음료용보다 전시용으로 두는 편이 안전합니다. 실사용할 컵은 차갑거나 미지근한 음료부터 시작하고 급격한 온도 변화를 피하세요. 작은 트레이에 올려 컵 바닥이 단단한 선반에 직접 부딪히지 않게 하면 미세한 칩을 예방할 수 있습니다." },
      { heading: "프린트의 색을 기록하기", body: "처음 들인 날 자연광에서 앞·뒤·바닥을 촬영해두면 희미한 변화를 객관적으로 비교할 수 있습니다. 촬영할 때마다 같은 창가와 시간대를 이용하고, 강한 조명이나 플래시는 피합니다. 조금씩 흐려지는 프린트를 발견했다면 사용 횟수를 줄이고 빛이 적은 장식장으로 옮기는 신호입니다." },
    ],
    checklist: ["림 부분의 미세 칩", "프린트의 들뜸과 벗겨짐", "뜨거운 음료 사용 가능 여부"],
  },
  {
    slug: "teddy-care",
    category: "PLUSH",
    issue: "ISSUE 05",
    title: "오래된 봉제 친구를 맞이하기 전에",
    summary: "털의 결, 충전재와 봉제선을 살피고 빈티지 인형을 편안하게 보관하는 법.",
    image: "/journal/plush-care-editorial.webp",
    imagePosition: "50% 48%",
    readTime: "6분",
    intro: "빈티지 봉제인형은 표정뿐 아니라 손에 닿는 촉감까지 수집의 일부입니다. 세탁부터 시작하기보다 먼저 재료와 봉제 상태를 파악해야 원래의 모습을 오래 지킬 수 있습니다.",
    quote: "오래된 인형을 돌보는 가장 좋은 손길은, 눈에 띄지 않을 만큼 천천히 움직이는 손길입니다.",
    sections: [
      { heading: "관절과 봉제선부터 확인하기", body: "팔과 다리를 아주 작게 움직여 관절의 헐거움과 안쪽 소리를 확인하세요. 목 뒤, 겨드랑이, 다리 안쪽은 봉제가 먼저 약해지는 곳입니다." },
      { heading: "세탁보다 먼지 제거", body: "부드러운 브러시와 약한 흡입으로 표면 먼지를 제거하고 통풍이 좋은 그늘에 둡니다. 물세탁은 충전재의 종류와 염료 안정성을 확인한 뒤 결정하세요." },
      { heading: "새 식구를 위한 격리 기간", body: "새로 들인 봉제인형은 기존 컬렉션과 바로 맞닿게 두지 말고 깨끗한 면천 위에서 일주일 정도 관찰합니다. 벌레 흔적, 가루, 냄새가 없는지 살피고 맑은 날에는 직사광선을 피해 짧게 환기하세요. 비닐에 밀봉한 채 오래 두면 남아 있던 습기가 빠져나가지 못할 수 있습니다." },
      { heading: "표정을 지키는 받침", body: "앉은 자세의 인형은 엉덩이 아래에 작은 천 받침을 두고, 머리가 무거운 인형은 목 뒤가 아닌 몸통을 지지합니다. 선반에 너무 촘촘하게 세우면 털이 눌리고 염료가 서로 이염될 수 있습니다. 계절마다 위치를 바꾸고 눌린 털은 손끝보다 부드러운 브러시로 결을 정돈하세요." },
    ],
    checklist: ["불쾌한 냄새와 습기", "눈·코 부속의 고정 상태", "충전재가 한쪽으로 뭉쳤는지"],
  },
  {
    slug: "paper-archive",
    category: "PAPER GOODS",
    issue: "ISSUE 04",
    title: "엽서와 카드의 색을 보존하는 작은 습관",
    summary: "빛과 습기에 민감한 종이 수집품을 일상에서 즐기면서 보관하는 방법.",
    image: "/journal/paper-archive-editorial.webp",
    readTime: "4분",
    intro: "오래된 종이는 완전히 감춰두기보다 일정 기간 전시하고 쉬게 하는 방식이 좋습니다. 작은 보관 습관만으로도 인쇄 색과 종이의 질감을 훨씬 오래 즐길 수 있습니다.",
    quote: "종이 수집은 빛을 보여주는 시간과 어둠 속에서 쉬게 하는 시간을 함께 설계하는 일입니다.",
    sections: [
      { heading: "중성 재료를 고르기", body: "PVC가 없는 포켓과 중성지 보드를 사용하세요. 일반 테이프와 접착식 앨범은 시간이 지나며 누렇게 변하고 종이 표면에 자국을 남길 수 있습니다." },
      { heading: "계절마다 전시 교체하기", body: "한 작품을 계속 빛에 노출하기보다 계절마다 전시 카드를 바꿔주세요. 원본은 보관하고 고해상도 복제본을 일상 장식으로 사용하는 것도 좋은 방법입니다." },
      { heading: "한 장씩 정보를 남기기", body: "보관 슬리브 뒷면에 직접 쓰지 말고 별도의 중성지 카드에 구입 시기, 출처, 크기와 눈에 띄는 상태를 적습니다. 앞면과 뒷면을 촬영한 파일명에도 같은 관리 번호를 넣으면 디지털 기록과 실물을 연결하기 쉽습니다. 출처를 모를 때는 추측을 사실처럼 적지 않고 ‘미상’으로 남겨두는 것이 좋습니다." },
      { heading: "습도는 숫자보다 변화가 중요하다", body: "종이에 좋은 습도 범위를 지키는 것도 중요하지만 하루 사이 큰 폭으로 오르내리지 않게 하는 것이 더 중요합니다. 외벽에 붙은 장, 바닥과 가까운 상자는 계절 변화의 영향을 크게 받습니다. 작은 습도계를 보관함 근처에 두고 장마철과 난방철의 변화를 메모해 보관 위치를 조정하세요." },
    ],
    checklist: ["산성 테이프와 접착제 제거", "습도 40–55% 유지", "창가의 직접적인 햇빛 피하기"],
  },
];

const articleFormats = ["COVER STORY", "OBJECT STUDY", "CARE GUIDE", "AT HOME", "ARCHIVE NOTE"];

export default function JournalPage() {
  const [selectedSlug, setSelectedSlug] = useState(articles[0].slug);
  const selected = articles.find((article) => article.slug === selectedSlug) || articles[0];

  useEffect(() => {
    const slug = window.location.hash.replace("#", "");
    if (articles.some((article) => article.slug === slug)) setSelectedSlug(slug);
  }, []);

  const openArticle = (article: JournalArticle) => {
    setSelectedSlug(article.slug);
    window.history.replaceState(null, "", `#${article.slug}`);
    requestAnimationFrame(() => document.querySelector("#article-reader")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="journal-page-shell">
      <header className="journal-header">
        <a href="/" className="journal-brand"><img src="/pocket-archive-sign-cropped.png" alt="Pocket Archive 홈" /></a>
        <span>COLLECTOR&apos;S JOURNAL</span>
        <a href="/#journal" className="journal-back">상점으로 돌아가기 →</a>
      </header>

      <main>
        <section className="journal-hero">
          <div className="journal-hero-image"><img src="/journal/desk-archive-editorial.webp" alt="오래된 종이 수집품을 살피는 수집가의 책상" /><span>FEATURE<br />THE QUIET ART<br />OF KEEPING</span></div>
          <div className="journal-hero-copy">
            <span>VOLUME 01 · AUTUMN 2026</span>
            <h1>오래된 물건을<br />더 오래 사랑하는 법</h1>
            <p>수집의 시작부터 진품을 살피는 눈, 안전한 보관과 일상에서 즐기는 방법까지 기록합니다.</p>
            <div className="journal-hero-meta"><b>POCKET ARCHIVE JOURNAL</b><small>OBJECTS · PEOPLE · CARE</small></div>
          </div>
        </section>

        <section className="journal-library" aria-labelledby="library-title">
          <div className="journal-contents-bar">
            <b>CONTENTS</b>
            <span>VOL. 01</span>
            <nav aria-label="아티클 빠른 이동">
              {articles.map((article, index) => (
                <button key={article.slug} onClick={() => openArticle(article)} aria-label={`${article.title} 읽기`}>
                  {String(index + 1).padStart(2, "0")}
                </button>
              ))}
            </nav>
            <small>FIVE NOTES ON KEEPING OLD THINGS</small>
          </div>
          <div className="journal-section-title">
            <span>THE ARCHIVE INDEX · 01—05</span>
            <h2 id="library-title">수집가의<br />읽을거리</h2>
            <p>관심 있는 주제를 고르면 아래 열람실에서 전문을 읽을 수 있습니다.</p>
          </div>
          <div className="journal-card-grid">
            {articles.map((article, index) => (
              <button className={`journal-card journal-card-${index + 1} ${article.slug === selectedSlug ? "is-selected" : ""}`} key={article.slug} onClick={() => openArticle(article)}>
                <span className="journal-card-image">
                  <img src={article.image} alt="" style={{ objectPosition: article.imagePosition }} />
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <em>{articleFormats[index]}</em>
                </span>
                <span className="journal-card-copy">
                  <small>{article.issue} / {article.category}</small>
                  <strong>{article.title}</strong>
                  <span>{article.summary}</span>
                  <span className="journal-card-line"><i>{article.readTime} READ</i><i>아티클 읽기 ↗</i></span>
                </span>
              </button>
            ))}
          </div>
          <div className="journal-masthead"><span>POCKET ARCHIVE</span><p>수집가의 방과 손끝에서 발견한 보존의 지혜를 기록하는 독립 오브제 매거진</p><b>SEOUL · 2026</b></div>
        </section>

        <article className="journal-reader" id="article-reader" key={selected.slug}>
          <div className="reader-aside">
            <span>{selected.issue}</span>
            <strong>{selected.category}</strong>
            <small>READING TIME · {selected.readTime}</small>
          </div>
          <div className="reader-main">
            <span className="reader-kicker">POCKET ARCHIVE FIELD NOTE</span>
            <h2>{selected.title}</h2>
            <p className="reader-intro">{selected.intro}</p>
            <figure><img src={selected.image} alt={selected.title} style={{ objectPosition: selected.imagePosition }} /><figcaption>물건의 흔적을 지우기보다 이해하는 것이 좋은 수집의 시작입니다.</figcaption></figure>
            <blockquote>{selected.quote}</blockquote>
            {selected.sections.map((section, index) => <section key={section.heading}><span className="article-section-number">{String(index + 1).padStart(2, "0")}</span><h3>{section.heading}</h3><p>{section.body}</p></section>)}
            <aside className="reader-checklist"><span>COLLECTOR&apos;S CHECKLIST</span><h3>구매 전 천천히 확인하세요</h3><ul>{selected.checklist.map((item) => <li key={item}>{item}</li>)}</ul></aside>
          </div>
        </article>

        <section className="journal-ending"><span>NEXT STORY ARRIVES FRIDAY</span><h2>작은 물건에 남은<br />다음 이야기를 준비하고 있어요.</h2><a href="/#new">새로 들어온 물건 보기 →</a></section>
      </main>
    </div>
  );
}
