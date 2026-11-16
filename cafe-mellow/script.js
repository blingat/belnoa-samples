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

  // ===== 히어로 사진 패럴랙스 (스크롤 연동, 이동량 ±10px — Ken Burns와 중복 금지라 이것만) =====
  // Modern Web Guidance: CSS Scroll-Driven Animations가 정본 — 지원 브라우저는 style.css의
  // @supports 블록(animation-timeline: scroll(root))이 담당하고, 여기 JS는 미지원 브라우저 폴백 전용.
  var sdaOK = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()"));
  var heroFigure = document.querySelector(".hero-photo-g1");
  var heroImg = heroFigure ? heroFigure.querySelector("img") : null;
  if (heroImg && !reduced && !sdaOK) {
    var ticking = false;
    var updateHero = function () {
      ticking = false;
      var r = heroFigure.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= window.innerHeight) return;
      var p = 1 - r.bottom / (window.innerHeight + r.height); // 사진이 화면을 지나는 진행률 0→1
      var y = Math.max(-10, Math.min(10, (p - 0.5) * 20));
      heroImg.style.transform = "translateY(" + y.toFixed(1) + "px) scale(1.08)";
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateHero); }
    }, { passive: true });
    updateHero();
  }

  // ===== 메뉴 카테고리 탭 (해당 그룹으로 이동 + 하이라이트, 나열 구조는 그대로) =====
  var tabs = document.querySelectorAll(".menu-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-pressed", on ? "true" : "false");
      });
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

  // ===== 푸터 연도 =====
  document.getElementById("year").textContent = new Date().getFullYear();
})();
