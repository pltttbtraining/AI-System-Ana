/**
 * storage.js
 * * ไฟล์นี้รับผิดชอบในการจัดการ Local Storage สำหรับฐานข้อมูลลูกค้า (Case Database)
 */

// ----------------------------------------------------------------------
// 1. DATA STRUCTURE & INITIALIZATION
// ----------------------------------------------------------------------

// ชื่อ Key สำหรับเก็บข้อมูลใน Local Storage
const STORAGE_KEY = 'ASI_CUSTOMER_CASES_DB';

// ตัวแปรสำหรับเก็บข้อมูลลูกค้าทั้งหมดในหน่วยความจำ (In-Memory Database)
let customers = []; 

// ----------------------------------------------------------------------
// 2. CORE STORAGE FUNCTIONS
// ----------------------------------------------------------------------

/**
 * โหลดข้อมูลลูกค้าจาก Local Storage เข้าสู่ตัวแปร customers
 */
const loadDB = () => {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            // โหลดและจัดเรียงข้อมูล: ข้อมูลใหม่จะอยู่ด้านบน
            customers = JSON.parse(storedData).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
            customers = [];
        }
    } catch (error) {
        console.error("Error loading data from Local Storage:", error);
        customers = []; // หากเกิดข้อผิดพลาดให้เริ่มด้วย Array ว่าง
    }
};

/**
 * บันทึกข้อมูลลูกค้าทั้งหมดจากตัวแปร customers ลง Local Storage
 */
const saveDB = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
        console.log(`[Storage] Saved ${customers.length} cases successfully.`);
    } catch (error) {
        console.error("Error saving data to Local Storage:", error);
        // แจ้งเตือนหากพื้นที่เก็บข้อมูลเต็ม
        alert("ไม่สามารถบันทึกข้อมูลได้: พื้นที่จัดเก็บข้อมูลเต็มหรือเกิดข้อผิดพลาด");
    }
};

/**
 * เพิ่มเคสลูกค้าใหม่เข้าสู่ฐานข้อมูล
 * @param {object} newCaseData - ออบเจกต์ข้อมูลเคสใหม่
 * @returns {string} ID ของเคสที่ถูกเพิ่ม
 */
const addCase = (newCaseData) => {
    const newId = Date.now().toString(); // ใช้ Timestamp เป็น Unique ID
    const caseObject = {
        id: newId,
        createdAt: new Date().toISOString(),
        comments: [], // เริ่มต้นด้วย Array คอมเมนต์ว่าง
        ...newCaseData,
    };

    // เพิ่มเคสใหม่เข้าไปที่ด้านหน้าของ Array (เพื่อให้เคสใหม่สุดแสดงก่อน)
    customers.unshift(caseObject); 
    saveDB();
    return newId;
};

/**
 * ค้นหาเคสลูกค้าด้วย ID
 * @param {string} id - ID ของเคส
 * @returns {object|undefined} ออบเจกต์เคสลูกค้า หรือ undefined ถ้าไม่พบ
 */
const findCaseById = (id) => {
    return customers.find(c => c.id === id);
};

// ----------------------------------------------------------------------
// 3. COMMENT MANAGEMENT (การจัดการคอมเมนต์ที่ปรึกษา)
// ----------------------------------------------------------------------

/**
 * เพิ่มคอมเมนต์ใหม่เข้าสู่เคสที่ระบุ
 * @param {string} caseId - ID ของเคส
 * @param {string} author - ชื่อผู้คอมเมนต์ (ที่ปรึกษา)
 * @param {string} text - ข้อความคอมเมนต์
 * @returns {boolean} true ถ้าเพิ่มคอมเมนต์สำเร็จ
 */
const addCommentToCase = (caseId, author, text) => {
    const caseToUpdate = findCaseById(caseId);
    if (caseToUpdate) {
        caseToUpdate.comments.push({
            author: author,
            text: text,
            timestamp: new Date().toISOString(),
        });
        saveDB();
        return true;
    }
    return false;
};

// เรียกใช้ loadDB เมื่อมีการโหลดไฟล์นี้ (Init)
loadDB();
