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

// موقع وهمي للعرض التجريبي فقط. قبل التسليم النهائي: const DEMO_SEAT = "";
const DEMO_SEAT = "A12-R14-S08";

// الموقع من رمز QR: ?seat=A12-R14-S08
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

// إرسال البلاغ إلى Firebase (مجموعة reports)
document.getElementById("fanForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("send");
  const msg = document.getElementById("msg");
  const d = new FormData(e.target);

  btn.disabled = true;
  msg.textContent = "جاري الإرسال...";
  try {
    await db.collection("reports").add({
      seatNumber:  d.get("seatNumber"),
      caseType:    d.get("caseType"),
      isConscious: d.get("conscious") === "true",
      description: document.querySelector(".special").open ? d.get("description").trim() : "",
      status:      "Pending",
      time:        firebase.firestore.FieldValue.serverTimestamp()
    });
    msg.textContent = "تم إرسال البلاغ. ابقَ في مكانك، الفريق في الطريق إليك.";
    e.target.reset();
  } catch (err) {
    console.error(err);
    msg.textContent = "تعذر الإرسال. حاول مرة أخرى.";
  } finally {
    btn.disabled = false;
  }
});
