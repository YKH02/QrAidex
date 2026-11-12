
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
    apiKey: "AIzaSyBQYV_UZmgWxCpCwOA_jFfPDQQThGQlP3g",
    authDomain: "qraidex.firebaseapp.com",
    projectId: "qraidex",
    storageBucket: "qraidex.firebasestorage.app",
    messagingSenderId: "602574047794",
    appId: "1:602574047794:web:d4fc8fd8e888f15abbca2b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const reportsContainer = document.getElementById("reports-container");
// Automatically suggest a priority
function calculatePriority(report) {

    const caseType = (report.caseType || "").toLowerCase();

    // Unconscious patient
    if (report.isConscious === false) {
        return "High";
    }

    // Choking or breathing difficulties
    if (
        caseType.includes("اختناق") ||
        caseType.includes("صعوبة التنفس") ||
        caseType.includes("ضيق التنفس") ||
        caseType.includes("choking") ||
        caseType.includes("breathing")
    ) {
        return "High";
    }

    // Default priority
    return "Medium";
}

// Listen for changes in Firestore
onSnapshot(collection(db, "reports"), (snapshot) => {

    reportsContainer.innerHTML = "";

    if (snapshot.empty) {
        reportsContainer.textContent = "لا توجد بلاغات حالياً.";
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

        const report = reportDoc.data();

        // Get existing priority or calculate a new one
        let priority = report.priority;

        if (!priority) {
            priority = calculatePriority(report);

            // Save the automatically assigned priority
            updateDoc(
                firestoreDoc(db, "reports", reportDoc.id),
                { priority: priority }
            ).catch(error => {
                console.error("Error saving priority:", error);
            });
        }

        // Determine report status
        const status = report.status || "غير محدد";

        let statusClass = "pending";
        let nextStatus = null;
        let buttonText = "";

        if (["تم الحل", "مكتمل", "Solved", "Resolved"].includes(status)) {
            statusClass = "resolved";
        }
        else if (["تحت المعالجة", "قيد المعالجة", "In Progress"].includes(status)) {
            statusClass = "in-progress";
            nextStatus = "تم الحل";
            buttonText = "إنهاء الحالة";
        }
        else {
            statusClass = "pending";
            nextStatus = "تحت المعالجة";
            buttonText = "بدء المعالجة";
        }

        // Format timestamp
        const time = report.time?.toDate
            ? report.time.toDate().toLocaleString("ar-SA")
            : "غير محدد";

        // Patient consciousness
        const consciousness = report.isConscious === false
            ? "فاقد الوعي"
            : report.isConscious === true
                ? "واعٍ"
                : "غير محدد";

        // Create report card
        const card = document.createElement("article");
        card.className = "report-card";

        // Report header
        const header = document.createElement("div");
        header.className = "report-header";

        const title = document.createElement("h3");
        title.textContent = report.caseType || "حالة طارئة";

        const statusBadge = document.createElement("span");
        statusBadge.className = `status ${statusClass}`;
        statusBadge.textContent = status;

        header.append(title, statusBadge);

        // Report details
        const details = document.createElement("div");
        details.className = "report-details";

        const fields = [
            ["المقعد:", report.seatNumber || "غير محدد"],
            ["حالة المريض:", consciousness],
            ["وصف الحالة:", report.description || "لا يوجد وصف"],
            ["الوقت:", time]
        ];

        fields.forEach(([label, value]) => {
            const paragraph = document.createElement("p");
            const strong = document.createElement("strong");
            const span = document.createElement("span");

            strong.textContent = label + " ";
            span.textContent = value;

            paragraph.append(strong, span);
            details.appendChild(paragraph);
        });

        // Priority section
        const prioritySection = document.createElement("div");
        prioritySection.className = "priority-section";

        const priorityBadge = document.createElement("span");
        priorityBadge.className = `priority-badge priority-${priority.toLowerCase()}`;

        const priorityNames = {
            High: "أولوية عالية",
            Medium: "أولوية متوسطة",
            Low: "أولوية منخفضة"
        };

        priorityBadge.textContent = priorityNames[priority] || priority;

        prioritySection.appendChild(priorityBadge);

        card.append(header, prioritySection, details);

        // Priority selector
        const prioritySelect = document.createElement("select");
        prioritySelect.className = "priority-select";

        const priorityOptions = [
            { value: "High", text: "أولوية عالية" },
            { value: "Medium", text: "أولوية متوسطة" },
            { value: "Low", text: "أولوية منخفضة" }
        ];

        priorityOptions.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value;
            optionElement.textContent = option.text;

            if (option.value === priority) {
                optionElement.selected = true;
            }

            prioritySelect.appendChild(optionElement);
        });

        prioritySelect.addEventListener("change", async () => {

            prioritySelect.disabled = true;

            try {
                await updateDoc(
                    firestoreDoc(db, "reports", reportDoc.id),
                    { priority: prioritySelect.value }
                );

                console.log("Priority updated successfully.");

            } catch (error) {
                console.error("Error updating priority:", error);
                alert("تعذر تحديث الأولوية.");
            }

            prioritySelect.disabled = false;
        });

        card.appendChild(prioritySelect);

        // Add status update button if case is not resolved
        if (nextStatus) {
            const actionButton = document.createElement("button");
            actionButton.className = "status-action";
            actionButton.textContent = buttonText;

            actionButton.addEventListener("click", async () => {

                actionButton.disabled = true;
                actionButton.textContent = "جاري التحديث...";

                try {
                    await updateDoc(
                        firestoreDoc(db, "reports", reportDoc.id),
                        { status: nextStatus }
                    );

                    console.log("Report status updated successfully.");

                } catch (error) {
                    console.error("Error updating status:", error);
                    actionButton.disabled = false;
                    actionButton.textContent = buttonText;
                    alert("تعذر تحديث حالة البلاغ.");
                }
            });

            card.appendChild(actionButton);
        }

        reportsContainer.appendChild(card);
    });

}, (error) => {
    console.error("Error retrieving reports:", error);
    reportsContainer.textContent = "حدث خطأ أثناء تحميل البلاغات.";
});