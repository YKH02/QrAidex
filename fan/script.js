const firebaseConfig = {
  apiKey: "AIzaSyBQYV_UZmgWxCpCwOA_jFfPDQQThGQlP3g",
  authDomain: "qraidex.firebaseapp.com",
  projectId: "qraidex",
  storageBucket: "qraidex.firebasestorage.app",
  messagingSenderId: "602574047794",
  appId: "1:602574047794:web:d4fc8fd8e888f15abbca2b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const pending_status = "بانتظار الاستجابة";

// رقم المقعد يجي من رمز QR فقط: ?seat=A12-R14-S08
const DEMO_SEAT = "";

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

// إرسال البلاغ إلى Firebase ثم الانتقال لصفحة "تم الإرسال"
document.getElementById("fanForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("send");
  const msg = document.getElementById("msg");
  const d = new FormData(e.target);

  const caseType = d.get("caseType");
  const conscious = d.get("conscious");
  const note = document.querySelector(".special").open ? (d.get("description") || "").trim() : "";

  btn.disabled = true;
  msg.textContent = "جاري الإرسال...";

  try {
    await db.collection("reports").add({
      seatNumber:  d.get("seatNumber"),
      caseType:    caseType,
      isConscious: conscious === "true",
      description: note,
      status:      pending_status,
      time:        firebase.firestore.FieldValue.serverTimestamp()
    });

    location.href = "sent.html"
      + "?seat=" + encodeURIComponent(d.get("seatNumber"))
      + "&type=" + encodeURIComponent(caseType)
      + "&c=" + conscious
      + "&note=" + encodeURIComponent(note);

  } catch (err) {
    console.error(err);
    msg.textContent = "تعذر الإرسال. حاول مرة أخرى.";
    btn.disabled = false;
  }
});
