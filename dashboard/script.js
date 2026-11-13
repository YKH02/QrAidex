import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
    getFirestore,
    collection,
    onSnapshot,
    updateDoc,
    doc as firestoreDoc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQYV_UZmgWxCpCwOA_jFfPDThGQlP3g",
    authDomain: "qraidex.firebaseapp.com",
    projectId: "qraidex",
    storageBucket: "qraidex.firebasestorage.app",
    messagingSenderId: "602574047794",
    appId: "1:602574047794:web:d4fc8fd8e888f15abbca2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const reportsContainer = document.getElementById("reports-container");

// Automatically suggest a priority.
// These are the same criteria already used in the dashboard.
function calculatePriority(report) {
    const caseType = (report.caseType || "").toLowerCase();

    if (report.isConscious === false) {
        return "High";
    }

    if (
        caseType.includes("اختناق") ||
        caseType.includes("صعوبة التنفس") ||
        caseType.includes("ضيق التنفس") ||
        caseType.includes("choking") ||
        caseType.includes("breathing")
    ) {
        return "High";
    }

    return "Medium";
}

const resolvedStatuses = ["تم الحل", "مكتمل", "Solved", "Resolved"];
const inProgressStatuses = ["تحت المعالجة", "قيد المعالجة", "In Progress"];

function getStatusInfo(status) {
    if (resolvedStatuses.includes(status)) {
        return { className: "resolved", nextStatus: null, buttonText: "" };
    }

    if (inProgressStatuses.includes(status)) {
        return {
            className: "in-progress",
            nextStatus: "تم الحل",
            buttonText: "إنهاء الحالة"
        };
    }

    return {
        className: "pending",
        nextStatus: "تحت المعالجة",
        buttonText: "بدء المعالجة"
    };
}

// Update dashboard statistics from the current Firestore snapshot.
function updateStatistics(docs) {
    let total = docs.length;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;

    docs.forEach((reportDoc) => {
        const report = reportDoc.data();
        const status = report.status || "Pending";

        if (resolvedStatuses.includes(status)) {
            resolved++;
        } else if (inProgressStatuses.includes(status)) {
            inProgress++;
        } else {
            pending++;
        }
    });

    document.getElementById("total-reports").textContent = total;
    document.getElementById("pending-reports").textContent = pending;
    document.getElementById("progress-reports").textContent = inProgress;
    document.getElementById("resolved-reports").textContent = resolved;
}

function createDetail(label, value, extraClass = "") {
    const paragraph = document.createElement("p");
    if (extraClass) paragraph.className = extraClass;

    const strong = document.createElement("strong");
    strong.textContent = label;

    const span = document.createElement("span");
    span.textContent = value;

    paragraph.append(strong, span);
    return paragraph;
}

function createReportCard(reportDoc) {
    const report = reportDoc.data();
    const reportRef = firestoreDoc(db, "reports", reportDoc.id);

    // Use the existing Firestore case type; do not substitute sample types.
    const caseType = report.caseType || "حالة طارئة";
    let priority = report.priority || calculatePriority(report);

    if (!report.priority) {
        updateDoc(reportRef, { priority }).catch((error) => {
            console.error("Error saving priority:", error);
        });
    }

    const status = report.status || "بانتظار الاستجابة";
    const statusInfo = getStatusInfo(status);

    const time = report.time?.toDate
        ? report.time.toDate().toLocaleString("ar-SA")
        : "غير محدد";

    const consciousness = report.isConscious === false
        ? "فاقد الوعي"
        : report.isConscious === true
            ? "واعٍ"
            : "غير محدد";

    const card = document.createElement("article");
    card.className = "report-card";

    // Card heading: case type and current status.
    const header = document.createElement("div");
    header.className = "report-header";

    const title = document.createElement("h3");
    title.textContent = caseType;

    const statusBadge = document.createElement("span");
    statusBadge.className = `status ${statusInfo.className}`;
    statusBadge.textContent = status;

    header.append(title, statusBadge);

    // Seat and submission time.
    const meta = document.createElement("div");
    meta.className = "report-meta";
    meta.append(
        createDetail("المقعد", report.seatNumber || "غير محدد"),
        createDetail("الوقت", time)
    );

    // Description and consciousness information.
    const details = document.createElement("div");
    details.className = "report-details";
    details.append(
        createDetail("وصف الحالة", report.description || "لا يوجد وصف"),
        createDetail(
            "حالة المريض",
            consciousness,
            report.isConscious === false ? "consciousness-alert" : ""
        )
    );

    // Priority badge and selector.
    const priorityArea = document.createElement("div");
    priorityArea.className = "priority-area";

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `priority-badge priority-${priority.toLowerCase()}`;

    const priorityNames = {
        High: "أولوية عالية",
        Medium: "أولوية متوسطة",
        Low: "أولوية منخفضة"
    };

    priorityBadge.textContent = priorityNames[priority] || priority;

    const prioritySelect = document.createElement("select");
    prioritySelect.className = "priority-select";
    prioritySelect.setAttribute("aria-label", "تغيير أولوية البلاغ");

    const priorityOptions = [
        { value: "High", text: "أولوية عالية" },
        { value: "Medium", text: "أولوية متوسطة" },
        { value: "Low", text: "أولوية منخفضة" }
    ];

    priorityOptions.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        optionElement.selected = option.value === priority;
        prioritySelect.appendChild(optionElement);
    });

    prioritySelect.addEventListener("change", async () => {
        const previousPriority = priority;
        prioritySelect.disabled = true;

        try {
            await updateDoc(reportRef, { priority: prioritySelect.value });
        } catch (error) {
            console.error("Error updating priority:", error);
            prioritySelect.value = previousPriority;
            alert("تعذر تحديث الأولوية.");
        } finally {
            prioritySelect.disabled = false;
        }
    });

    priorityArea.append(priorityBadge, prioritySelect);

    // Status action button (not shown for resolved reports).
    const actions = document.createElement("div");
    actions.className = "report-actions";

    if (statusInfo.nextStatus) {
        const actionButton = document.createElement("button");
        actionButton.className = "status-action";
        actionButton.textContent = statusInfo.buttonText;

        actionButton.addEventListener("click", async () => {
            actionButton.disabled = true;
            actionButton.textContent = "جاري التحديث...";

            try {
                await updateDoc(reportRef, {
                    status: statusInfo.nextStatus
                });
            } catch (error) {
                console.error("Error updating status:", error);
                actionButton.disabled = false;
                actionButton.textContent = statusInfo.buttonText;
                alert("تعذر تحديث حالة البلاغ.");
            }
        });

        actions.appendChild(actionButton);
    } else {
        const resolvedNote = document.createElement("span");
        resolvedNote.className = "resolved-note";
        resolvedNote.textContent = "تم إنهاء الحالة";
        actions.appendChild(resolvedNote);
    }

    card.append(header, meta, details, priorityArea, actions);
    return card;
}

// Listen for live changes in Firestore.
onSnapshot(collection(db, "reports"), (snapshot) => {
    updateStatistics(snapshot.docs);
    reportsContainer.innerHTML = "";

    if (snapshot.empty) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-state";
        emptyMessage.textContent = "لا توجد بلاغات حالياً.";
        reportsContainer.appendChild(emptyMessage);
        return;
    }

    const priorityOrder = {
        High: 1,
        Medium: 2,
        Low: 3
    };

    const sortedReports = [...snapshot.docs].sort((a, b) => {
        const reportA = a.data();
        const reportB = b.data();

        const priorityA = reportA.priority || calculatePriority(reportA);
        const priorityB = reportB.priority || calculatePriority(reportB);

        return (priorityOrder[priorityA] || 2) -
            (priorityOrder[priorityB] || 2);
    });

    sortedReports.forEach((reportDoc) => {
        reportsContainer.appendChild(createReportCard(reportDoc));
    });

}, (error) => {
    console.error("Error retrieving reports:", error);
    reportsContainer.textContent = "حدث خطأ أثناء تحميل البلاغات.";
});