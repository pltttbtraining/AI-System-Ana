/**
 * auth.js
 * * ไฟล์นี้จัดการตรรกะด้านการตรวจสอบสิทธิ์ (Authentication) และการอนุญาต (Authorization)
 * * รวมถึงการตรวจสอบรหัสพิเศษ (Passcode) และการจำกัดสิทธิ์การเข้าถึงเคส
 */

// ----------------------------------------------------------------------
// 1. CONFIGURATION
// ----------------------------------------------------------------------

// รหัสพิเศษ 4 หลักสำหรับผู้ดูแลระบบ (Admin)
const ADMIN_PASSCODE = '0229'; 

// Key สำหรับเก็บรหัสที่ปรึกษาใน Local Storage
const CONSULTANT_CODE_KEY = 'ASI_CONSULTANT_CODE';

// รหัสโค้ด 4 หลักสำหรับที่ปรึกษา (Consultant Code)
let consultantCode = '1111'; // รหัสตั้งต้น 4 หลัก


// ----------------------------------------------------------------------
// 2. INITIALIZATION & CODE MANAGEMENT
// ----------------------------------------------------------------------

/**
 * โหลดรหัสที่ปรึกษาจาก Local Storage (ถ้ามี)
 */
const loadConsultantCode = () => {
    const storedCode = localStorage.getItem(CONSULTANT_CODE_KEY);
    if (storedCode) {
        consultantCode = storedCode;
    }
    console.log(`[Auth] Consultant Code loaded: ${consultantCode}`);
};

/**
 * เปลี่ยนรหัสโค้ด 4 หลักสำหรับที่ปรึกษา
 * @param {string} newCode - รหัสใหม่ 4 หลัก
 * @returns {boolean} true ถ้าเปลี่ยนสำเร็จ
 */
const updateConsultantCode = (newCode) => {
    // ตรวจสอบว่าเป็นเลข 4 หลักเท่านั้น
    if (/^\d{4}$/.test(newCode)) {
        consultantCode = newCode;
        localStorage.setItem(CONSULTANT_CODE_KEY, newCode);
        console.log(`[Auth] Consultant Code updated to: ${newCode}`);
        return true;
    }
    return false;
};

// เรียกใช้เมื่อโหลดไฟล์
loadConsultantCode();


// ----------------------------------------------------------------------
// 3. ACCESS CHECK FUNCTIONS
// ----------------------------------------------------------------------

/**
 * ตรวจสอบรหัสพิเศษ (Admin Passcode)
 * @param {string} inputCode - รหัสที่ผู้ใช้ป้อนเข้ามา
 * @returns {boolean} true ถ้าตรงกับ ADMIN_PASSCODE
 */
const checkAdminPasscode = (inputCode) => {
    return inputCode === ADMIN_PASSCODE;
};

/**
 * ตรวจสอบว่าผู้ใช้ปัจจุบันมีสิทธิ์ดูเคสนี้หรือไม่
 * @param {object} caseData - ข้อมูลเคสลูกค้า
 * @param {string} empId - รหัสพนักงานที่ต้องการตรวจสอบ (จาก Input Field/Session)
 * @returns {boolean} true ถ้ามีสิทธิ์
 */
const canViewCase = (caseData, empId) => {
    // 1. ตรวจสอบสิทธิ์ของพนักงานเจ้าของเคส
    if (caseData.emp.id === empId) {
        return true; 
    }
    
    // 2. ตรวจสอบสิทธิ์ของที่ปรึกษา (ใช้ Consultant Code)
    if (empId === consultantCode) {
        return true; // ผู้ที่มี Consultant Code สามารถดูได้ทุกเคส
    }

    return false; 
};


// ----------------------------------------------------------------------
// 4. ADMIN/CONSULTANT UI LOGIC (การแจ้งเตือน)
// ----------------------------------------------------------------------

// ฟังก์ชันสำหรับแจ้งเตือน
const sendNotification = (message) => {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification('ASI System Notification', {
                body: message,
                icon: '/icon.png'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
    console.log(`[Notification] ${message}`);
};

// ฟังก์ชันสำหรับเรียกใช้การแจ้งเตือนเมื่อมีการคอมเมนต์ใหม่
const notifyNewComment = (caseId, author) => {
    // ต้องเรียกใช้ findCaseById จาก storage.js
    const caseData = findCaseById(caseId); 
    if (caseData) {
        const empName = caseData.emp.name;
        const custName = caseData.cust.name;
        const message = `ที่ปรึกษา ${author} ได้ให้คำแนะนำในเคสของลูกค้า: ${custName} (พนักงาน: ${empName})`;
        sendNotification(message);
    }
};
