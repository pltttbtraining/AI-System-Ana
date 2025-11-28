/**
 * main.js
 * * ไฟล์ควบคุมหลัก (Controller) ของระบบ ASI
 * * จัดการ Event Listener, Workflow และการเชื่อมโยงฟังก์ชันจากทุกโมดูล
 */

// ----------------------------------------------------------------------
// 1. DATA AND STATE MANAGEMENT (การจัดการสถานะข้อมูล)
// ----------------------------------------------------------------------

// ตัวแปรสำหรับเก็บผลการวิเคราะห์ล่าสุดก่อนบันทึก
let lastAnalysisResult = null;
let currentStep = 1;
let currentEmpId = null; // เก็บ Employee ID ที่ใช้ในการค้นหา/จำกัดสิทธิ์


// ----------------------------------------------------------------------
// 2. FORM AND UI FLOW (การจัดการฟอร์มและขั้นตอน)
// ----------------------------------------------------------------------

/**
 * สลับไปยัง Step ถัดไปของฟอร์ม
 * @param {number} nextStep - หมายเลข Step ถัดไป
 */
const nextStep = (nextStep) => {
    // Basic validation for Step 1 (Employee Info)
    if (currentStep === 1) {
        if (!document.getElementById('emp-name').value || !document.getElementById('emp-id').value) {
            alert('กรุณากรอกชื่อและรหัสพนักงานให้ครบถ้วน');
            return;
        }
    }
    
    // Reset/clear analysis result when going back
    if (nextStep < 4) {
        lastAnalysisResult = null;
        document.getElementById('save-case-btn').disabled = true;
    }

    currentStep = nextStep;
    showStep(currentStep); // showStep มาจาก ui.js
};

/**
 * สลับไปยัง Step ก่อนหน้าของฟอร์ม
 * @param {number} prevStep - หมายเลข Step ก่อนหน้า
 */
const prevStep = (prevStep) => {
    currentStep = prevStep;
    showStep(currentStep); // showStep มาจาก ui.js
};


/**
 * ดึงข้อมูลทั้งหมดจากฟอร์มและจัดโครงสร้าง
 * @returns {object} Object ที่มีโครงสร้างตรงตามที่ analysis.js ต้องการ
 */
const collectFormData = () => {
    // Helper function สำหรับแปลงค่าเป็นตัวเลข, ถ้าว่างให้เป็น 0
    const parseNum = (id) => parseFloat(document.getElementById(id).value) || 0;
    const $ = (id) => document.getElementById(id); // ใช้ $ สำหรับ shorthand ในฟังก์ชันนี้

    const childAgesInput = $('fam-child-ages').value;
    let childAgesArray = [];
    if (childAgesInput) {
        childAgesArray = childAgesInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    }
    
    // เบี้ยประกันรวมต่อปี (ใช้ค่าเดียวจาก Input)
    const policiesPremium = parseNum('policies-premium'); 

    return {
        emp: {
            name: $('emp-name').value,
            id: $('emp-id').value, // รหัสพนักงาน (ใช้เป็น Lock/Key)
            rh: $('emp-rh').value,
            zone: $('emp-zone').value,
        },
        cust: {
            name: $('cust-name').value,
            age: parseNum('cust-age'),
            job: $('cust-job').value,
            income: parseNum('cust-income'), // รายได้ต่อเดือน
        },
        fam: {
            hasChild: $('fam-has-child').checked,
            childAges: childAgesArray,
        },
        biz: {
            share: parseNum('biz-share'), // สัดส่วนหุ้น
        },
        fin: {
            saving: parseNum('fin-saving'),
            fixed: parseNum('fin-fixed'),
            fund: parseNum('fin-fund'),
            home: parseNum('fin-home'),
            car: parseNum('fin-car'),
            personal: parseNum('fin-personal'),
        },
        // ใส่เบี้ยประกันรวมเป็น array เพื่อให้ analysis.js อ่านได้ง่าย
        policies: [{ name: 'Total Premium', premium: policiesPremium }],
    };
};

/**
 * จัดการการ Submit ฟอร์มวิเคราะห์ความเสี่ยง
 * @param {Event} e - Event object
 */
const handleAnalysisSubmit = (e) => {
    e.preventDefault();
    
    const formData = collectFormData();
    
    // 1. เรียกใช้ฟังก์ชันวิเคราะห์จาก analysis.js
    const risks = runAI(formData); // runAI มาจาก analysis.js
    
    // 2. บันทึกผลลัพธ์เพื่อเตรียมบันทึกเคส
    lastAnalysisResult = { 
        ...formData, 
        analysis: risks 
    };

    // 3. แสดงผลลัพธ์ใน Step 4 (UI)
    renderAnalysisResult(risks); // renderAnalysisResult มาจาก ui.js
};

/**
 * จัดการการบันทึกเคสที่วิเคราะห์แล้ว
 */
const handleSaveCase = () => {
    if (!lastAnalysisResult) {
        alert('กรุณาวิเคราะห์ข้อมูลก่อนทำการบันทึก');
        return;
    }
    
    // 1. เพิ่มเคสเข้าสู่ฐานข้อมูล (storage.js)
    const caseId = addCase(lastAnalysisResult); // addCase มาจาก storage.js
    
    alert(`บันทึกเคสลูกค้า: ${lastAnalysisResult.cust.name} เรียบร้อยแล้ว (ID: ${caseId})`);
    
    // 2. รีเซ็ตสถานะ
    lastAnalysisResult = null;
    document.getElementById('analysis-form').reset();
    currentStep = 1;
    showStep(1);
    document.getElementById('save-case-btn').disabled = true;
};


// ----------------------------------------------------------------------
// 3. SEARCH AND ACCESS CONTROL (การค้นหาและการจำกัดสิทธิ์)
// ----------------------------------------------------------------------

/**
 * จัดการการค้นหาเคสในหน้า Panel-Search
 */
const handleSearch = () => {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim().toLowerCase();
    
    // รหัสพนักงานที่ใช้ในการตรวจสอบสิทธิ์ (จาก Input Field)
    currentEmpId = searchInput.value.trim(); 
    
    // customers มาจาก storage.js
    const filteredCases = customers.filter(c => {
        const matchName = (c.cust.name || '').toLowerCase().includes(query);
        const matchEmpId = (c.emp.id || '').toLowerCase().includes(query);
        
        // ใช้ canViewCase เพื่อจำกัดสิทธิ์การแสดงผล (canViewCase มาจาก auth.js)
        const isAuthorized = canViewCase(c, currentEmpId); 
        
        return (matchName || matchEmpId) && isAuthorized;
    });

    renderCaseList(filteredCases); // renderCaseList มาจาก ui.js
};

/**
 * จัดการการแสดงรายละเอียดเคสใน Modal
 * @param {string} caseId - ID ของเคส (ถูกส่งมาจากปุ่มใน renderCaseList)
 */
const handleViewCaseModal = (caseId) => {
    const caseData = findCaseById(caseId); // findCaseById มาจาก storage.js
    if (!caseData) {
        alert('ไม่พบข้อมูลเคส');
        return;
    }

    // แสดงรายละเอียดเคส
    renderProfileModal(caseData); // renderProfileModal มาจาก ui.js
    
    // แสดงรายการคอมเมนต์
    renderComments(caseData.comments); // renderComments มาจาก ui.js

    // แสดง Modal
    openModal('profile-modal', caseId); // openModal มาจาก ui.js
};


/**
 * จัดการการเพิ่มคอมเมนต์/คำแนะนำใน Modal
 */
const handleAddComment = () => {
    const caseId = currentViewingCaseId;
    const author = document.getElementById('comment-author').value.trim();
    const text = document.getElementById('comment-text').value.trim();
    
    if (!author || !text) {
        alert('กรุณากรอกชื่อผู้เขียนและความเห็นให้ครบถ้วน');
        return;
    }

    // addCommentToCase มาจาก storage.js
    if (addCommentToCase(caseId, author, text)) {
        // อัปเดต UI
        const updatedCase = findCaseById(caseId);
        renderComments(updatedCase.comments);
        
        // เคลียร์ Input
        document.getElementById('comment-text').value = '';
        
        // ส่งการแจ้งเตือนไปยังพนักงานเจ้าของเคส
        notifyNewComment(caseId, author); // notifyNewComment มาจาก auth.js
        alert(`ส่งความเห็นเรียบร้อยแล้ว และได้แจ้งเตือนไปยังพนักงานเจ้าของเคส`);
    } else {
        alert('เกิดข้อผิดพลาดในการบันทึกความเห็น');
    }
};


// ----------------------------------------------------------------------
// 4. ADMIN AND REPORTING (ผู้ดูแลระบบและรายงาน)
// ----------------------------------------------------------------------

/**
 * ตรวจสอบรหัสพิเศษ Admin
 */
const checkAdminPasscode = () => {
    const code = document.getElementById('admin-passcode-input').value.trim();
    if (checkAdminPasscode(code)) { // checkAdminPasscode มาจาก auth.js
        renderReportDashboard(customers); // renderReportDashboard มาจาก ui.js
        alert('เข้าสู่ระบบผู้ดูแลระบบเรียบร้อย');
    } else {
        alert('รหัสพิเศษไม่ถูกต้อง');
        document.getElementById('admin-passcode-input').value = '';
    }
};

/**
 * จัดการการลบข้อมูล
 * @param {string} mode - 'month' (เก่ากว่าเดือนนี้) หรือ 'all' (ทั้งหมด)
 */
const handleDeleteData = (mode) => {
    if (!confirm(`ยืนยันการลบข้อมูล (${mode === 'month' ? 'เก่ากว่าเดือนนี้' : 'ทั้งหมด'})? การกระทำนี้ย้อนกลับไม่ได้`)) return;
    
    if (mode === 'all') {
        customers = []; // customers มาจาก storage.js
    } else if (mode === 'month') {
        const now = new Date();
        // กรองเคสที่ใหม่กว่าเดือนปัจจุบัน
        customers = customers.filter(c => {
            const d = new Date(c.createdAt);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
    }
    
    saveDB(); // saveDB มาจาก storage.js
    renderReportDashboard(customers);
    alert('ลบข้อมูลเรียบร้อย');
};

/**
 * จัดการการ Export ข้อมูล
 * @param {string} type - 'excel' หรือ 'pdf'
 */
const handleExportData = (type) => {
    if (type === 'excel') {
        const exportData = customers.map(c => ({
            ID: c.id, 
            Customer_Name: c.cust.name, 
            Employee_ID: c.emp.id, 
            Employee_Name: c.emp.name,
            RH: c.emp.rh, 
            Zone: c.emp.zone, 
            Monthly_Income: c.cust.income, 
            Total_Risks_Found: c.analysis.length,
            Top_Risk: c.analysis[0] ? c.analysis[0].name : 'N/A',
            Date: new Date(c.createdAt).toLocaleDateString('th-TH')
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ASI_Customer_Data');
        XLSX.writeFile(wb, 'ASI_Data_Export.xlsx');
        alert('Export ข้อมูล Excel เรียบร้อย');
    } else {
        alert('สำหรับ PDF กรุณาใช้ปุ่ม Export Profile ในหน้ารายละเอียดลูกค้าแต่ละราย');
    }
};

/**
 * จัดการการ Export รายละเอียดเคสเป็น PDF
 * ใช้ใน Modal (ui.js)
 */
const exportCaseProfileToPDF = (customerName) => {
    const element = document.getElementById('pdf-export-area'); // กำหนดพื้นที่ที่ต้องการ Export
    if (!element) return alert('ไม่พบส่วนที่ต้องการ Export');

    html2pdf(element, {
        margin: 10,
        filename: `ASI_Profile_${customerName.replace(/\s/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    });
};

/**
 * จัดการการเปลี่ยนรหัสที่ปรึกษา 4 หลัก
 */
const handleChangeConsultantCode = () => {
    const newCode = prompt("กรุณาป้อนรหัสที่ปรึกษาใหม่ 4 หลัก:");
    if (newCode === null) return; // ยกเลิก
    
    if (updateConsultantCode(newCode)) { // updateConsultantCode อยู่ใน auth.js
        alert(`เปลี่ยนรหัสที่ปรึกษา (Consultant Code) เป็น ${newCode} เรียบร้อยแล้ว`);
    } else {
        alert('รหัสที่ป้อนต้องเป็นตัวเลข 4 หลักเท่านั้น กรุณาลองใหม่');
    }
};


// ----------------------------------------------------------------------
// 5. EVENT LISTENERS AND INITIALIZATION
// ----------------------------------------------------------------------

const initApp = () => {
    // 1. Initial State
    showPanel('panel-input'); // แสดงหน้าแรก
    showStep(1); // แสดง Step 1
    
    // 2. Event Listeners for Forms and Buttons
    document.getElementById('analysis-form').addEventListener('submit', handleAnalysisSubmit);
    document.getElementById('save-case-btn').addEventListener('click', handleSaveCase);
    document.getElementById('search-input').addEventListener('input', handleSearch);
    
    // Add event listener for the comment button inside the modal
    document.getElementById('profile-modal').addEventListener('click', (e) => {
        if (e.target.id === 'add-comment-btn' || e.target.closest('#add-comment-btn')) {
             handleAddComment();
        }
    });

    // 3. Global Functions (เพื่อให้เรียกใช้จาก HTML ได้)
    window.showPanel = showPanel;
    window.nextStep = nextStep;
    window.prevStep = prevStep;
    window.openModal = handleViewCaseModal; // openModal ใน HTML ถูกเรียกให้เรียก handleViewCaseModal
    window.closeModal = closeModal;
    window.checkAdminPasscode = checkAdminPasscode;
    window.deleteData = handleDeleteData;
    window.exportData = handleExportData;
    window.exportCaseProfileToPDF = exportCaseProfileToPDF;
    window.addComment = handleAddComment; // ให้ปุ่มใน Modal เรียกใช้ได้
    window.handleChangeConsultantCode = handleChangeConsultantCode; 
    
    // 4. Initial Load
    loadDB(); // loadDB มาจาก storage.js
};

// เริ่มต้นแอปพลิเคชันเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', initApp);
