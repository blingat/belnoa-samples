// 카페 멜로우 — 최소 스크립트 (전화 토스트 · 영업시간 오늘 표시 · 연도)
(function () {
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
