// 카페 멜로우 — 최소 스크립트 (전화 토스트 · 영업시간 오늘 표시 · 연도 · 헤드라인 페이드인)
(function () {
  // 섹션 헤드라인 페이드인: 화면에 들어올 때만 .in 부여 (CSS 280ms).
  // JS·IO가 없으면 아무것도 숨기지 않는 폴백 (html.js 가드와 짝).
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // 전화 버튼: 샘플이라 실제 번호가 없어 토스트로 안내 (지어낸 번호로 연결하지 않는다)
  var toast = document.getElementById("toast");
  var timer = null;
  document.querySelectorAll(".js-call").forEach(function (btn) {
    btn.addEventListener("click", function () {
      toast.classList.add("show");
      clearTimeout(timer);
      timer = setTimeout(function () { toast.classList.remove("show"); }, 2400);
    });
  });

  // 영업시간: 오늘 요일에 해당하는 행 강조
  var day = new Date().getDay(); // 0=일 ~ 6=토
  var kind = (day === 0 || day === 6) ? "weekend" : "weekday";
  document.querySelectorAll(".hours li").forEach(function (li) {
    if (li.getAttribute("data-days") === kind) li.classList.add("today");
  });

  // 푸터 연도
  document.getElementById("year").textContent = new Date().getFullYear();
})();
