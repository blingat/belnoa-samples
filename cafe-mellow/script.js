// 카페 멜로우 — 인터랙션 (리빌 stagger · 히어로 패럴랙스 · 메뉴 탭 · 스크롤스파이 · 전화 토스트 · 영업시간 오늘 표시 · 연도)
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  // ===== 스크롤 리빌 (stagger) =====
  // 지연 규칙: data-rv-delay="ms" 명시값 우선, data-rv-group="base" 컨테이너 자식은 base + 순서×100ms.
  // 지연은 CSS 변수 --rvd로만 주입하고, 등장 완료 뒤 제거해 이후 트랜지션(호버 등)에 새지 않게 한다.
  document.querySelectorAll("[data-rv-group]").forEach(function (group) {
    var base = parseInt(group.getAttribute("data-rv-group"), 10) || 0;
    group.querySelectorAll(".reveal").forEach(function (el, i) {
      if (!el.hasAttribute("data-rv-delay")) {
        el.setAttribute("data-rv-delay", String(base + i * 100));
      }
    });
  });
  var revealEls = document.querySelectorAll(".reveal");
  revealEls.forEach(function (el) {
    var d = parseInt(el.getAttribute("data-rv-delay") || "0", 10);
    if (d > 0) el.style.setProperty("--rvd", d + "ms");
  });
  if (reduced || !hasIO) {
    // 모션 최소화 설정이거나 IO가 없으면 숨기지 않고 전부 표시 (폴백 안전)
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var d = parseInt(el.getAttribute("data-rv-delay") || "0", 10);
        el.classList.add("in");
        io.unobserve(el);
        setTimeout(function () { el.style.removeProperty("--rvd"); }, d + 600);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // ===== 히어로 패럴랙스 (스크롤 연동, 이동량 ±10px — 대상은 figure, img는 Ken Burns 전담이라 transform 충돌 없음) =====
  // Modern Web Guidance: CSS Scroll-Driven Animations가 정본 — 지원 브라우저는 style.css의
  // @supports 블록(animation-timeline: scroll(root))이 담당하고, 여기 JS는 미지원 브라우저 폴백 전용.
  var sdaOK = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()"));
  var heroFigure = document.querySelector(".hero-photo-g1");
  if (heroFigure && !reduced && !sdaOK) {
    var ticking = false;
    var updateHero = function () {
      ticking = false;
      var r = heroFigure.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= window.innerHeight) return;
      var p = 1 - r.bottom / (window.innerHeight + r.height); // 사진이 화면을 지나는 진행률 0→1
      var y = Math.max(-10, Math.min(10, (p - 0.5) * 20));
      heroFigure.style.transform = "translateY(" + y.toFixed(1) + "px)";
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateHero); }
    }, { passive: true });
    updateHero();
  }

  // ===== 메뉴 카테고리 탭 (해당 그룹으로 이동 + 하이라이트, 나열 구조는 그대로) =====
  // 장치 레이어: 다크 필 인디케이터가 활성 탭 아래로 슬라이드한다 (위치·너비만 transform/width로 — 레이아웃 무영향)
  var tabsBox = document.querySelector(".menu-tabs");
  var tabInd = tabsBox ? tabsBox.querySelector(".menu-tab-ind") : null;
  var moveInd = function (tab) {
    if (!tabInd || !tab) return;
    tabInd.style.width = tab.offsetWidth + "px";
    tabInd.style.height = tab.offsetHeight + "px";
    tabInd.style.transform = "translate(" + tab.offsetLeft + "px, " + tab.offsetTop + "px)";
  };
  var tabs = document.querySelectorAll(".menu-tab");
  if (tabsBox && tabInd && tabs.length) {
    tabsBox.classList.add("tabs-js");
    var placeInd = function () { moveInd(tabsBox.querySelector(".menu-tab.is-active")); };
    requestAnimationFrame(placeInd);
    window.addEventListener("load", placeInd);
    window.addEventListener("resize", placeInd);
  }
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-pressed", on ? "true" : "false");
      });
      moveInd(tab);
      var target = document.querySelector('.menu-group[data-cat="' + tab.getAttribute("data-cat") + '"]');
      if (!target) return;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      if (!reduced) {
        target.classList.remove("flash");
        void target.offsetWidth; // 같은 탭 재클릭 시에도 애니메이션 재시작
        target.classList.add("flash");
        target.addEventListener("animationend", function () {
          target.classList.remove("flash");
        }, { once: true });
      }
    });
  });

  // ===== 헤더 내비 스크롤스파이 (화면 중앙을 지나는 섹션의 링크 강조) =====
  var navLinks = document.querySelectorAll(".header-nav a");
  if (hasIO && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["about", "menu", "info"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  // ===== 전화 버튼: 샘플이라 실제 번호가 없어 토스트로 안내 (지어낸 번호로 연결하지 않는다) =====
  var toast = document.getElementById("toast");
  var timer = null;
  document.querySelectorAll(".js-call").forEach(function (btn) {
    btn.addEventListener("click", function () {
      toast.classList.add("show");
      clearTimeout(timer);
      timer = setTimeout(function () { toast.classList.remove("show"); }, 2400);
    });
  });

  // ===== 영업시간: 오늘 요일에 해당하는 행 강조 =====
  var day = new Date().getDay(); // 0=일 ~ 6=토
  var kind = (day === 0 || day === 6) ? "weekend" : "weekday";
  document.querySelectorAll(".hours li").forEach(function (li) {
    if (li.getAttribute("data-days") === kind) li.classList.add("today");
  });

  // ===== 전환 장치: 히어로를 지나면(past-hero) 헤더 CTA 강조 + 하단 바 등장 + 맨 위로 버튼 표시 =====
  var header = document.querySelector(".site-header");
  var toTop = document.getElementById("toTop");
  var heroSection = document.querySelector(".hero");
  var setPastHero = function (past) {
    document.body.classList.toggle("past-hero", past);
    if (header) header.classList.toggle("is-scrolled", past);
    if (toTop) {
      toTop.hidden = false;
      toTop.classList.toggle("show", past);
    }
  };
  if (heroSection && hasIO) {
    var heroWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { setPastHero(!entry.isIntersecting); });
    }, { threshold: 0 });
    heroWatch.observe(heroSection);
  } else {
    setPastHero(true); // IO가 없으면 전환 장치를 전부 켠 상태로 둔다 (숨김 고착 방지)
  }
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  // ===== 피처드 카드 틸트 (데스크톱 정밀 포인터만, 최대 ±5도 — transform만 사용) =====
  var featurePhoto = document.querySelector(".menu-feature-photo");
  if (featurePhoto && !reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var tiltRaf = false;
    featurePhoto.addEventListener("mousemove", function (e) {
      if (tiltRaf) return;
      tiltRaf = true;
      var ev = e;
      requestAnimationFrame(function () {
        tiltRaf = false;
        var r = featurePhoto.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        featurePhoto.style.transform = "perspective(900px) rotateX(" + (-py * 5).toFixed(2) + "deg) rotateY(" + (px * 5).toFixed(2) + "deg)";
      });
    });
    featurePhoto.addEventListener("mouseleave", function () {
      featurePhoto.style.transform = "";
    });
  }

  // ===== 라이트박스 (네이티브 dialog — ESC·포커스 트랩은 브라우저 기본, 방향키는 여기서 연결) =====
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbCount = document.getElementById("lbCount");
  var lbDots = document.getElementById("lbDots");
  var igBtns = Array.prototype.slice.call(document.querySelectorAll(".ig-open"));
  if (lightbox && lbImg && igBtns.length && typeof lightbox.showModal === "function") {
    var lbIndex = 0;
    var lbItems = igBtns.map(function (btn) {
      var img = btn.querySelector("img");
      return { src: img.getAttribute("src"), alt: img.getAttribute("alt") || "" };
    });
    lbItems.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "lb-dot";
      dot.setAttribute("aria-label", (i + 1) + "번 사진 보기");
      dot.addEventListener("click", function () { lbShow(i); });
      lbDots.appendChild(dot);
    });
    var lbShow = function (i) {
      lbIndex = (i + lbItems.length) % lbItems.length;
      lbImg.setAttribute("src", lbItems[lbIndex].src);
      lbImg.setAttribute("alt", lbItems[lbIndex].alt);
      lbCap.textContent = lbItems[lbIndex].alt;
      lbCount.textContent = (lbIndex + 1) + " / " + lbItems.length;
      lbDots.querySelectorAll(".lb-dot").forEach(function (d, di) {
        d.classList.toggle("is-active", di === lbIndex);
      });
    };
    igBtns.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        lbShow(i);
        lightbox.showModal();
      });
    });
    document.getElementById("lbPrev").addEventListener("click", function () { lbShow(lbIndex - 1); });
    document.getElementById("lbNext").addEventListener("click", function () { lbShow(lbIndex + 1); });
    document.getElementById("lbClose").addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); lbShow(lbIndex - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); lbShow(lbIndex + 1); }
    });
    // 배경(다이얼로그 자체) 클릭 시 닫기 — 내부 요소 클릭과 구분해 좌표가 dialog 박스 밖일 때만
    lightbox.addEventListener("click", function (e) {
      var r = lightbox.getBoundingClientRect();
      var outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (outside) lightbox.close();
    });
  }

  // ===== FAQ 아코디언 (한 번에 하나만 열기, aria-expanded 동기화) =====
  var faqBtns = document.querySelectorAll(".faq-q");
  faqBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var willOpen = !item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (it) {
        it.classList.remove("open");
        it.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  // ===== 오늘 배지: 오늘 요일 + 오늘 영업시간 + 지금 영업 중 여부 (전부 페이지 표기 기반 동적 계산) =====
  var badge = document.getElementById("todayBadge");
  if (badge) {
    var now = new Date();
    var dow = now.getDay();
    var dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var isWeekend = (dow === 0 || dow === 6);
    var openH = isWeekend ? 10 : 8;
    var closeH = 21;
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var isOpen = nowMin >= openH * 60 && nowMin < closeH * 60;
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    badge.innerHTML = '<span class="today-dot" aria-hidden="true"></span><span>오늘 ' + dayNames[dow] +
      " · " + (isWeekend ? "주말" : "평일") + " " + pad(openH) + ":00–" + pad(closeH) + ":00 · " +
      (isOpen ? "지금 영업 중" : "영업 시간 아님") + "</span>";
    badge.classList.toggle("is-open", isOpen);
    badge.hidden = false;
  }

  // ===== 푸터 연도 =====
  document.getElementById("year").textContent = new Date().getFullYear();
})();
