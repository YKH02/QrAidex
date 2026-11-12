// موقع وهمي للعرض التجريبي فقط (لما ما يكون فيه QR).
// قبل التسليم النهائي خليه فاضي هكذا: const DEMO_SEAT = "";
const DEMO_SEAT = "A12-R14-S08";

// الموقع يجي من رمز QR: ?seat=A12-R14-S08
const seat = (new URLSearchParams(location.search).get("seat") || DEMO_SEAT).trim().toUpperCase();
const parts = seat.split("-");
if (parts.length === 3 && parts.every(Boolean)) {
  document.getElementById("seatNumber").value = seat;
  document.getElementById("locSection").textContent = parts[0];
  document.getElementById("locRow").textContent = parts[1];
  document.getElementById("locSeat").textContent = parts[2];
  document.getElementById("locGrid").hidden = false;
} else {
  document.getElementById("noSeat").hidden = false;
  document.getElementById("send").disabled = true;
}

// عند الضغط على إرسال: نجمع بيانات البلاغ بنفس أسماء الحقول المتفق عليها
document.getElementById("fanForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  const report = {
    seatNumber:  d.get("seatNumber"),
    caseType:    d.get("caseType"),
    Conscious:   d.get("conscious") === "true",
    description: document.querySelector(".special").open ? d.get("description").trim() : "",
    status:      "Pending"
    // time: يضيفه هتون عند الحفظ في Firebase (serverTimestamp)
  };

  console.log("بيانات البلاغ:", report);

  // هتون: هنا يكون إرسال المتغير report إلى Firebase (مجموعة reports)

  document.getElementById("msg").textContent = "تم إرسال البلاغ. ابقَ في مكانك، الفريق في الطريق إليك.";
});
