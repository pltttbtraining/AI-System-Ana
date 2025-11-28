/**
 * ui.js
 * * ไฟล์นี้จัดการการแสดงผลของส่วนประกอบ UI ทั้งหมด
 * * รวมถึงการสลับ Panel, การแสดงผลลัพธ์, Dashboard, และ Modal
 */

// ----------------------------------------------------------------------
// 1. GLOBALi UI HELPERS
// ----------------------------------------------------------------------

// ฟังก์ชันย่อสำหรับเข้าถึง Element By ID
const $ = (id) => document.getElementById(id);

// ตัวแปรสำหรับเก็บ ID ของเคสที่กำลังเปิดอยู่ใน Modal
let currentViewingCaseId = null;

/**
 * สลับแสดงผล Panel ต่างๆ ในหน้าจอหลัก
 * @param {string} panelId - ID ของ Panel ที่ต้องการแสดง (e.g., 'panel-input', 'panel-search')
 */
const showPanel = (panelId) => {
    // ซ่อนทุก Panel
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.add('hidden');
    });

    // แสดง Panel ที่ต้องการ
    const activePanel = $(panelId);
    if (activePanel) {
        activePanel.classList.remove('hidden');
    }

    // อัปเดตสถานะ Active ใน Sidebar (Desktop)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-white/10', 'text-primary', 'active');
        // ใช้ panelId ในการค้นหา nav item ที่ตรงกัน
        if (item.getAttribute('onclick').includes(panelId)) {
            item.classList.add('active'); // active is used for mobile nav css
            // เพิ่ม class เฉพาะสำหรับ Desktop Sidebar
            if (item.closest('#sidebar')) {
                 item.classList.add('bg-white/10', 'text-primary');
            }
        }
        // Mobile nav only needs 'active' class which is handled above
    });

    // โหลดข้อมูลที่จำเป็นเมื่อสลับ Panel
    if (panelId === 'panel-search') {
        renderCaseList(customers); // โหลดรายการเคสทั้งหมด (customers มาจาก storage.js)
    } else if (panelId === 'panel-report') {
        // ซ่อนเนื้อหา Report จนกว่าจะล็อกอิน (Admin)
        $('report-content').classList.add('hidden');
        $('admin-login-prompt').classList.remove('hidden');
        $('admin-passcode-input').value = '';
    }
};

/**
 * จัดการการแสดงผลของ Step-by-Step Form
 * @param {number} step - หมายเลข Step ที่ต้องการแสดง
 */
const showStep = (step) => {
    // ซ่อนทุก Step
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
    
    // แสดง Step ที่ต้องการ
    $(`step-${step}`).classList.remove('hidden');

    // อัปเดต Indicator
    document.querySelectorAll('.flex > div[class*="w-1/4"]').forEach((indicator, index) => {
        const stepNum = index + 1;
        const circle = indicator.querySelector('div');
        
        // Remove all state classes first
        circle.classList.remove('bg-gray-300', 'text-gray-600', 'bg-primary', 'text-white', 'bg-green-500');
        
        if (stepNum < step) {
            // Completed step
            circle.classList.add('bg-green-500', 'text-white');
            circle.innerHTML = '<i class="fas fa-check"></i>';
        } else if (stepNum === step) {
            // Current step
            circle.classList.add('bg-primary', 'text-white');
            circle.innerHTML = stepNum;
        } else {
            // Pending step
            circle.classList.add('bg-gray-300', 'text-gray-600');
            circle.innerHTML = stepNum;
        }
    });
};

/**
 * เปิด Modal และกำหนด ID เคสที่กำลังดู (เรียกใช้โดย main.js)
 * @param {string} modalId - ID ของ Modal (e.g., 'profile-modal')
 * @param {string} caseId - ID ของเคสที่ต้องการแสดง
 */
const openModal = (modalId, caseId) => {
    currentViewingCaseId = caseId;
    $(modalId).classList.remove('hidden');
};

/**
 * ปิด Modal
 * @param {string} modalId - ID ของ Modal
 */
const closeModal = (modalId) => {
    currentViewingCaseId = null;
    $(modalId).classList.add('hidden');
};


// ----------------------------------------------------------------------
// 2. ANALYSIS RESULT RENDERING (แสดงผลการวิเคราะห์)
// ----------------------------------------------------------------------

/**
 * แสดงผลการวิเคราะห์ความเสี่ยงและผลิตภัณฑ์ที่แนะนำ
 * @param {Array<object>} risks - ผลลัพธ์จาก runAI(data)
 */
const renderAnalysisResult = (risks) => {
    const output = $('analysis-result-output');
    output.innerHTML = '';
    
    if (!risks || risks.length === 0) {
        output.innerHTML = '<p class="text-lg text-green-600 font-semibold"><i class="fas fa-check-circle mr-2"></i> ไม่พบความเสี่ยงระดับสูง ลูกค้ามีความมั่นคงสูง</p>';
        $('save-case-btn').disabled = false;
        showStep(4);
        return;
    }

    let html = '<h3 class="text-xl font-bold mb-4 text-gray-800">ผลการวิเคราะห์ความเสี่ยง 3 อันดับแรก</h3>';
    
    risks.forEach((risk, index) => {
        const levelClass = `risk-tag-${risk.level}`;
        const icon = risk.level === 'Critical' ? 'fa-triangle-exclamation' : (risk.level === 'High' ? 'fa-circle-exclamation' : 'fa-circle-info');

        html += `
            <div class="card p-4 mb-4 border-l-4 ${risk.level === 'Critical' ? 'border-risk-critical' : (risk.level === 'High' ? 'border-risk-high' : 'border-risk-medium')}">
                <div class="flex items-center mb-2">
                    <i class="fas ${icon} mr-2 text-lg ${risk.level === 'Critical' ? 'text-risk-critical' : (risk.level === 'High' ? 'text-risk-high' : 'text-risk-medium')}"></i>
                    <p class="text-lg font-bold">${index + 1}. ${risk.name}</p>
                    <span class="risk-tag ${levelClass} ml-3">${risk.level}</span>
                </div>
                
                <p class="text-gray-600 mb-3 ml-6">${risk.why}</p>
                
                <div class="ml-6 mt-3 p-3 bg-secondary rounded-lg">
                    <p class="font-medium text-primary mb-2">ผลิตภัณฑ์ที่แนะนำ:</p>
                    <ul class="list-disc list-inside text-gray-700">
                        ${risk.products.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    });

    output.innerHTML = html;
    // เปิด Step 4 และเปิดใช้งานปุ่มบันทึก
    showStep(4);
    $('save-case-btn').disabled = false;
};


// ----------------------------------------------------------------------
// 3. CASE LIST RENDERING (แสดงผลรายการเคส)
// ----------------------------------------------------------------------

/**
 * แสดงรายการเคสในหน้าค้นหา
 * @param {Array<object>} caseList - รายการเคสที่ผ่านการกรองแล้ว
 */
const renderCaseList = (caseList) => {
    const tbody = $('case-list-body');
    tbody.innerHTML = ''; // เคลียร์รายการเก่า

    if (caseList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">ไม่พบเคสที่ตรงตามเงื่อนไข</td></tr>';
        return;
    }

    caseList.forEach(c => {
        const riskCount = c.analysis.length;
        const commentsCount = c.comments.length;

        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-50', 'transition', 'duration-150');
        row.innerHTML = `
            <td class="p-4 whitespace-nowrap text-sm font-medium text-gray-900">${c.cust.name || 'N/A'}</td>
            <td class="p-4 whitespace-nowrap text-sm text-gray-500">${c.emp.name || 'N/A'} (${c.emp.id || 'N/A'})</td>
            <td class="p-4 whitespace-nowrap text-sm text-gray-500">${c.emp.rh || 'N/A'}</td>
            <td class="p-4 whitespace-nowrap text-sm font-semibold">
                <span class="inline-block px-3 py-1 text-xs rounded-full ${riskCount > 0 ? 'bg-risk-critical text-white' : 'bg-green-100 text-green-800'}">
                    ${riskCount} ความเสี่ยง
                </span>
            </td>
            <td class="p-4 whitespace-nowrap text-sm text-gray-500">${commentsCount} ความเห็น</td>
            <td class="p-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="openModal('${c.id}')" class="text-primary hover:text-blue-800 ml-2">
                    <i class="fas fa-eye mr-1"></i> ดูรายละเอียด
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
};


// ----------------------------------------------------------------------
// 4. PROFILE MODAL RENDERING (แสดงผลรายละเอียดเคสใน Modal)
// ----------------------------------------------------------------------

/**
 * แสดงรายละเอียดเคสลูกค้าทั้งหมดใน Modal
 * @param {object} caseData - ข้อมูลเคสลูกค้า
 */
const renderProfileModal = (caseData) => {
    if (!caseData) return;
    
    // อัปเดตชื่อลูกค้า
    $('modal-cust-name').innerText = `เคสลูกค้า: ${caseData.cust.name || 'N/A'}`;

    const content = $('profile-content');
    
    // 1. ส่วนข้อมูลพื้นฐาน (พนักงาน, ลูกค้า, การเงิน)
    let profileHTML = `
        <div id="pdf-export-area">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="card">
                    <h4 class="text-lg font-bold text-primary border-b pb-2 mb-3">ข้อมูลลูกค้าและครอบครัว</h4>
                    <p><strong>ชื่อ:</strong> ${caseData.cust.name}</p>
                    <p><strong>อายุ:</strong> ${caseData.cust.age} ปี</p>
                    <p><strong>อาชีพ:</strong> ${caseData.cust.job}</p>
                    <p><strong>รายได้ต่อเดือน:</strong> ${caseData.cust.income.toLocaleString()} บาท</p>
                    <p class="mt-2"><strong>ข้อมูลครอบครัว:</strong></p>
                    <ul class="list-disc list-inside ml-4 text-sm">
                        <li>มีบุตร: ${caseData.fam.hasChild ? 'ใช่' : 'ไม่'}</li>
                        ${caseData.fam.hasChild && caseData.fam.childAges.length > 0 ? `<li>อายุบุตร: ${caseData.fam.childAges.join(', ')} ปี</li>` : ''}
                    </ul>
                </div>

                <div class="card">
                    <h4 class="text-lg font-bold text-primary border-b pb-2 mb-3">ข้อมูลการเงินและธุรกิจ</h4>
                    <p><strong>สินทรัพย์สภาพคล่อง (ออม/ประจำ):</strong> ${(caseData.fin.saving + caseData.fin.fixed).toLocaleString()} บาท</p>
                    <p><strong>หนี้สินรวม (กู้):</strong> ${(caseData.fin.home + caseData.fin.car + caseData.fin.personal).toLocaleString()} บาท</p>
                    <p><strong>สัดส่วนหุ้นธุรกิจ:</strong> ${caseData.biz.share}%</p>
                    <p class="mt-2"><strong>พนักงานที่รับผิดชอบ:</strong> ${caseData.emp.name} (RH: ${caseData.emp.rh})</p>
                    <p><strong>วันที่วิเคราะห์:</strong> ${new Date(caseData.createdAt).toLocaleDateString('th-TH')}</p>
                </div>
            </div>
            
            <div class="mb-6">
                <h3 class="text-xl font-bold text-primary mb-3 border-b pb-2">ผลการวิเคราะห์ความเสี่ยงที่แนะนำ</h3>
                ${renderAnalysisResultHTML(caseData.analysis)}
            </div>
        </div>

        <button onclick="exportCaseProfileToPDF('${caseData.cust.name}')" class="btn-primary mb-6"><i class="fas fa-file-pdf mr-2"></i> Export Profile เป็น PDF</button>

        `;

    content.innerHTML = profileHTML;

    // ต้องเรียกใช้ renderComments(caseData.comments) ใน main.js หลัง renderProfileModal
};

/**
 * ฟังก์ชันเฉพาะสำหรับใช้ใน renderProfileModal เพื่อส่ง HTML ของผลวิเคราะห์กลับไป
 */
const renderAnalysisResultHTML = (risks) => {
    if (!risks || risks.length === 0) {
        return '<p class="text-lg text-green-600 font-semibold"><i class="fas fa-check-circle mr-2"></i> ไม่พบความเสี่ยงระดับสูง ลูกค้ามีความมั่นคงสูง</p>';
    }

    let html = '';
    risks.forEach((risk, index) => {
        const levelClass = `risk-tag-${risk.level}`;
        const icon = risk.level === 'Critical' ? 'fa-triangle-exclamation' : (risk.level === 'High' ? 'fa-circle-exclamation' : 'fa-circle-info');

        html += `
            <div class="card p-4 mb-4 border-l-4 ${risk.level === 'Critical' ? 'border-risk-critical' : (risk.level === 'High' ? 'border-risk-high' : 'border-risk-medium')}">
                <div class="flex items-center mb-2">
                    <i class="fas ${icon} mr-2 text-lg ${risk.level === 'Critical' ? 'text-risk-critical' : (risk.level === 'High' ? 'text-risk-high' : 'text-risk-medium')}"></i>
                    <p class="text-lg font-bold">${index + 1}. ${risk.name}</p>
                    <span class="risk-tag ${levelClass} ml-3">${risk.level}</span>
                </div>
                
                <p class="text-gray-600 mb-3 ml-6">${risk.why}</p>
                
                <div class="ml-6 mt-3 p-3 bg-secondary rounded-lg">
                    <p class="font-medium text-primary mb-2">ผลิตภัณฑ์ที่แนะนำ:</p>
                    <ul class="list-disc list-inside text-gray-700">
                        ${risk.products.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    });
    return html;
};


// ----------------------------------------------------------------------
// 5. COMMENTS RENDERING (แสดงผลความเห็น)
// ----------------------------------------------------------------------

/**
 * แสดงรายการคอมเมนต์ใน Modal
 * @param {Array<object>} comments - รายการคอมเมนต์ของเคส
 */
const renderComments = (comments) => {
    const commentsListDiv = $('comments-list');
    commentsListDiv.innerHTML = '';

    if (comments.length === 0) {
        commentsListDiv.innerHTML = '<p class="text-gray-500">ยังไม่มีความเห็นจากที่ปรึกษา</p>';
        return;
    }

    comments.forEach(comment => {
        const timestamp = new Date(comment.timestamp).toLocaleString('th-TH');
        commentsListDiv.innerHTML += `
            <div class="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p class="font-semibold text-primary">${comment.author}</p>
                <p class="text-gray-700 mt-1">${comment.text}</p>
                <p class="text-xs text-gray-400 text-right mt-1">${timestamp}</p>
            </div>
        `;
    });
};


// ----------------------------------------------------------------------
// 6. REPORT/DASHBOARD RENDERING (แสดงผลรายงาน)
// ----------------------------------------------------------------------

let activityChart = null; // ตัวแปรสำหรับเก็บ instance ของ Chart.js

/**
 * แสดง Dashboard รายงานสรุป
 * @param {Array<object>} allCases - ข้อมูลเคสทั้งหมด
 */
const renderReportDashboard = (allCases) => {
    const contentDiv = $('report-content');
    contentDiv.classList.remove('hidden');
    $('admin-login-prompt').classList.add('hidden');

    if (allCases.length === 0) {
        contentDiv.innerHTML = '<p class="text-center text-lg text-gray-500">ไม่มีข้อมูลเคสในระบบ</p>';
        return;
    }

    const totalCases = allCases.length;
    const totalRisks = allCases.reduce((sum, c) => sum + (c.analysis.length || 0), 0);
    const topPerformer = calculateTopPerformer(allCases);
    
    // สร้างโครงสร้าง HTML สำหรับ Dashboard
    contentDiv.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="card border-l-4 border-primary">
                <p class="text-sm text-gray-500">จำนวนเคสทั้งหมด</p>
                <p class="text-3xl font-bold text-gray-800">${totalCases.toLocaleString()}</p>
            </div>
            <div class="card border-l-4 border-risk-critical">
                <p class="text-sm text-gray-500">ความเสี่ยงที่ถูกระบุรวม</p>
                <p class="text-3xl font-bold text-gray-800">${totalRisks.toLocaleString()}</p>
            </div>
            <div class="card border-l-4 border-green-500">
                <p class="text-sm text-gray-500">พนักงานสร้างเคสมากสุด</p>
                <p class="text-xl font-bold text-gray-800">${topPerformer.name} (${topPerformer.count} เคส)</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="card">
                <h4 class="text-lg font-bold mb-3">Activity Chart (จำนวนเคสรายเดือน)</h4>
                <canvas id="activityChart"></canvas>
            </div>
            <div class="card">
                <h4 class="text-lg font-bold mb-3">Risk Distribution (การกระจายตัวของความเสี่ยง)</h4>
                <canvas id="riskDistributionChart"></canvas>
            </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-lg">
            <h3 class="text-xl font-medium mb-4">เครื่องมือผู้ดูแลระบบ</h3>
            <button onclick="deleteData('month')" class="btn-danger-outline mr-4"><i class="fas fa-trash-alt mr-2"></i> ลบข้อมูลเก่ากว่าเดือนนี้</button>
            <button onclick="exportData('excel')" class="btn-success-outline"><i class="fas fa-file-excel mr-2"></i> Export Excel ทั้งหมด</button>
            <button onclick="handleChangeConsultantCode()" class="btn-secondary mt-4"><i class="fas fa-key mr-2"></i> เปลี่ยนรหัสที่ปรึกษา 4 หลัก</button>
            <div class="mt-4 text-sm text-red-500">**คำเตือน:** การลบข้อมูลไม่สามารถย้อนกลับได้</div>
        </div>
    `;

    // วาด Chart
    drawActivityChart(allCases);
    drawRiskDistributionChart(allCases);
};

// Helper function: วาด Chart กิจกรรม
const drawActivityChart = (allCases) => {
    // Logic: นับจำนวนเคสรายเดือน/ปี
    const monthlyCounts = {};
    allCases.forEach(c => {
        const date = new Date(c.createdAt);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(monthlyCounts).sort();
    const labels = sortedKeys.map(key => {
        const [year, month] = key.split('-');
        return `${month}/${year.substring(2)}`;
    });
    const data = sortedKeys.map(key => monthlyCounts[key]);

    if (activityChart) {
        activityChart.destroy();
    }
    activityChart = new Chart($('activityChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนเคสที่สร้าง',
                data: data,
                backgroundColor: 'rgba(13, 71, 161, 0.8)', // Primary color
                borderColor: 'rgba(13, 71, 161, 1)',
                borderWidth: 1
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
};

// Helper function: วาด Chart การกระจายความเสี่ยง
const drawRiskDistributionChart = (allCases) => {
    // Logic: นับจำนวนความเสี่ยง (Critical, High, Medium)
    const riskCounts = { 'Critical': 0, 'High': 0, 'Medium': 0 };
    allCases.forEach(c => {
        (c.analysis || []).forEach(risk => {
            if (risk.level in riskCounts) {
                riskCounts[risk.level]++;
            }
        });
    });

    const chartData = [riskCounts.Critical, riskCounts.High, riskCounts.Medium];
    const chartLabels = ['Critical', 'High', 'Medium'];

    // ทำลาย Chart เก่าถ้ามี
    const existingChart = Chart.getChart('riskDistributionChart');
    if (existingChart) {
        existingChart.destroy();
    }
    
    new Chart($('riskDistributionChart'), {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: [
                    '#D32F2F', // Critical
                    '#FFC107', // High
                    '#0288D1'  // Medium
                ],
                hoverOffset: 4
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
};

/**
 * คำนวณหาพนักงานที่สร้างเคสมากที่สุด
 */
const calculateTopPerformer = (allCases) => {
    const counts = {};
    let maxCount = 0;
    let topName = 'N/A';
    
    allCases.forEach(c => {
        const empName = c.emp.name || 'Unknown';
        counts[empName] = (counts[empName] || 0) + 1;
        if (counts[empName] > maxCount) {
            maxCount = counts[empName];
            topName = empName;
        }
    });

    return { name: topName, count: maxCount };
};

 * ui.js
 * * ไฟล์นี้จัดการการแสดงผลของส่วนประกอบ UI ทั้งหมด
 * * รวมถึงการสลับ Panel, การแสดงผลลัพธ์, Dashboard, และ Modal
 */

// ----------------------------------------------------------------------
// 1. GLOBALi UI HELPERS
// ----------------------------------------------------------------------

// ฟังก์ชันย่อสำหรับเข้าถึง Element By ID
const $ = (id) => document.getElementById(id);

// ตัวแปรสำหรับเก็บ ID ของเคสที่กำลังเปิดอยู่ใน Modal
let currentViewingCaseId = null;

/**
 * สลับแสดงผล Panel ต่างๆ ในหน้าจอหลัก
 * @param {string} panelId - ID ของ Panel ที่ต้องการแสดง (e.g., 'panel-input', 'panel-search')
 */
const showPanel = (panelId) => {
    // ซ่อนทุก Panel
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.add('hidden');
    });

    // แสดง Panel ที่ต้องการ
    const activePanel = $(panelId);
    if (activePanel) {
        activePanel.classList.remove('hidden');
    }

    // อัปเดตสถานะ Active ใน Sidebar (Desktop)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-white/10', 'text-primary', 'active');
        // ใช้ panelId ในการค้นหา nav item ที่ตรงกัน
        if (item.getAttribute('onclick').includes(panelId)) {
            item.classList.add('active'); // active is used for mobile nav css
            // เพิ่ม class เฉพาะสำหรับ Desktop Sidebar
            if (item.closest('#sidebar')) {
                 item.classList.add('bg-white/10', 'text-primary');
            }
        }
        // Mobile nav only needs 'active' class which is handled above
    });

    // โหลดข้อมูลที่จำเป็นเมื่อสลับ Panel
    if (panelId === 'panel-search') {
        renderCaseList(customers); // โหลดรายการเคสทั้งหมด (customers มาจาก storage.js)
    } else if (panelId === 'panel-report') {
        // ซ่อนเนื้อหา Report จนกว่าจะล็อกอิน (Admin)
        $('report-content').classList.add('hidden');
        $('admin-login-prompt').classList.remove('hidden');
        $('admin-passcode-input').value = '';
    }
};

/**
 * จัดการการแสดงผลของ Step-by-Step Form
 * @param {number} step - หมายเลข Step ที่ต้องการแสดง
 */
const showStep = (step) => {
    // ซ่อนทุก Step
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
    
    // แสดง Step ที่ต้องการ
    $(`step-${step}`).classList.remove('hidden');

    // อัปเดต Indicator
    document.querySelectorAll('.flex > div[class*="w-1/4"]').forEach((indicator, index) => {
        const stepNum = index + 1;
        const circle = indicator.querySelector('div');
        
        // Remove all state classes first
        circle.classList.remove('bg-gray-300', 'text-gray-600', 'bg-primary', 'text-white', 'bg-green-500');
        
        if (stepNum < step) {
            // Completed step
            circle.classList.add('bg-green-500', 'text-white');
            circle.innerHTML = '<i class="fas fa-check"></i>';
        } else if (stepNum === step) {
            // Current step
            circle.classList.add('bg-primary', 'text-white');
            circle.innerHTML = stepNum;
        } else {
            // Pending step
            circle.classList.add('bg-gray-300', 'text-gray-600');
            circle.innerHTML = stepNum;
        }
    });
};

/**
 * เปิด Modal และกำหนด ID เคสที่กำลังดู (เรียกใช้โดย main.js)
 * @param {string} modalId - ID ของ Modal (e.g., 'profile-modal')
 * @param {string} caseId - ID ของเคสที่ต้องการแสดง
 */
const openModal = (modalId, caseId) => {
    currentViewingCaseId = caseId;
    $(modalId).classList.remove('hidden');
};

/**
 * ปิด Modal
 * @param {string} modalId - ID ของ Modal
 */
const closeModal = (modalId) => {
    currentViewingCaseId = null;
    $(modalId).classList.add('hidden');
};


// ----------------------------------------------------------------------
// 2. ANALYSIS RESULT RENDERING (แสดงผลการวิเคราะห์)
// ----------------------------------------------------------------------

/**
 * แสดงผลการวิเคราะห์ความเสี่ยงและผลิตภัณฑ์ที่แนะนำ
 * @param {Array<object>} risks - ผลลัพธ์จาก runAI(data)
 */
const renderAnalysisResult = (risks) => {
    const output = $('analysis-result-output');
    output.innerHTML = '';
    
    if (!risks || risks.length === 0) {
        output.innerHTML = '<p class="text-lg text-green-600 font-semibold"><i class="fas fa-check-circle mr-2"></i> ไม่พบความเสี่ยงระดับสูง ลูกค้ามีความมั่นคงสูง</p>';
        $('save-case-btn').disabled = false;
        showStep(4);
        return;
    }

    let html = '<h3 class="text-xl font-bold mb-4 text-gray-800">ผลการวิเคราะห์ความเสี่ยง 3 อันดับแรก</h3>';
    
    risks.forEach((risk, index) => {
        const levelClass = `risk-tag-${risk.level}`;
        const icon = risk.level === 'Critical' ? 'fa-triangle-exclamation' : (risk.level === 'High' ? 'fa-circle-exclamation' : 'fa-circle-info');

        html += `
            <div class="card p-4 mb-4 border-l-4 ${risk.level === 'Critical' ? 'border-risk-critical' : (risk.level === 'High' ? 'border-risk-high' : 'border-risk-medium')}">
                <div class="flex items-center mb-2">
                    <i class="fas ${icon} mr-2 text-lg ${risk.level === 'Critical' ? 'text-risk-critical' : (risk.level === 'High' ? 'text-risk-high' : 'text-risk-medium')}"></i>
                    <p class="text-lg font-bold">${index + 1}. ${risk.name}</p>
                    <span class="risk-tag ${levelClass} ml-3">${risk.level}</span>
                </div>
                
                <p class="text-gray-600 mb-3 ml-6">${risk.why}</p>
                
                <div class="ml-6 mt-3 p-3 bg-secondary rounded-lg">
                    <p class="font-medium text-primary mb-2">ผลิตภัณฑ์ที่แนะนำ:</p>
                    <ul class="list-disc list-inside text-gray-700">
                        ${risk.products.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    });

    output.innerHTML = html;
    // เปิด Step 4 และเปิดใช้งานปุ่มบันทึก
    showStep(4);
    $('save-case-btn').disabled = false;
};


// ----------------------------------------------------------------------
// 3. CASE LIST RENDERING (แสดงผลรายการเคส)
// ----------------------------------------------------------------------

/**
 * แสดงรายการเคสในหน้าค้นหา
 * @param {Array<object>} caseList - รายการเคสที่ผ่านการกรองแล้ว
 */
const renderCaseList = (caseList) => {
    const tbody = $('case-list-body');
    tbody.innerHTML = ''; // เคลียร์รายการเก่า

    if (caseList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">ไม่พบเคสที่ตรงตามเงื่อนไข</td></tr>';
        return;
    }

    caseList.forEach(c => {
        const riskCount = c.analysis.length;
        const commentsCount = c.comments.length;

        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-50', 'transition', 'duration-150');
        row.innerHTML = `
            <td class="p-4 whitespace-nowrap text-sm font-medium text-gray-900">${c.cust.name || 'N/A'}</td>
            <td class="p-4 whitespace-nowrap text-sm text-gray-500">${c.emp.name || 'N/A'} (${c.emp.id || 'N/A'})</td>
            <td class="p-4 whitespace-nowrap text-sm text-gray-500">${c.emp.rh || 'N/A'}</td>
            <td class="p-4 whitespace-nowrap text-sm font-semibold">
                <span class="inline-block px-3 py-1 text-xs rounded-full ${riskCount > 0 ? 'bg-risk-critical text-white' : 'bg-green-100 text-green-800'}">
                    ${riskCount} ความเสี่ยง
                </span>
            </td>
            <td class="p-4 whitespace-nowrap text-sm text-gray-500">${commentsCount} ความเห็น</td>
            <td class="p-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="openModal('${c.id}')" class="text-primary hover:text-blue-800 ml-2">
                    <i class="fas fa-eye mr-1"></i> ดูรายละเอียด
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
};


// ----------------------------------------------------------------------
// 4. PROFILE MODAL RENDERING (แสดงผลรายละเอียดเคสใน Modal)
// ----------------------------------------------------------------------

/**
 * แสดงรายละเอียดเคสลูกค้าทั้งหมดใน Modal
 * @param {object} caseData - ข้อมูลเคสลูกค้า
 */
const renderProfileModal = (caseData) => {
    if (!caseData) return;
    
    // อัปเดตชื่อลูกค้า
    $('modal-cust-name').innerText = `เคสลูกค้า: ${caseData.cust.name || 'N/A'}`;

    const content = $('profile-content');
    
    // 1. ส่วนข้อมูลพื้นฐาน (พนักงาน, ลูกค้า, การเงิน)
    let profileHTML = `
        <div id="pdf-export-area">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="card">
                    <h4 class="text-lg font-bold text-primary border-b pb-2 mb-3">ข้อมูลลูกค้าและครอบครัว</h4>
                    <p><strong>ชื่อ:</strong> ${caseData.cust.name}</p>
                    <p><strong>อายุ:</strong> ${caseData.cust.age} ปี</p>
                    <p><strong>อาชีพ:</strong> ${caseData.cust.job}</p>
                    <p><strong>รายได้ต่อเดือน:</strong> ${caseData.cust.income.toLocaleString()} บาท</p>
                    <p class="mt-2"><strong>ข้อมูลครอบครัว:</strong></p>
                    <ul class="list-disc list-inside ml-4 text-sm">
                        <li>มีบุตร: ${caseData.fam.hasChild ? 'ใช่' : 'ไม่'}</li>
                        ${caseData.fam.hasChild && caseData.fam.childAges.length > 0 ? `<li>อายุบุตร: ${caseData.fam.childAges.join(', ')} ปี</li>` : ''}
                    </ul>
                </div>

                <div class="card">
                    <h4 class="text-lg font-bold text-primary border-b pb-2 mb-3">ข้อมูลการเงินและธุรกิจ</h4>
                    <p><strong>สินทรัพย์สภาพคล่อง (ออม/ประจำ):</strong> ${(caseData.fin.saving + caseData.fin.fixed).toLocaleString()} บาท</p>
                    <p><strong>หนี้สินรวม (กู้):</strong> ${(caseData.fin.home + caseData.fin.car + caseData.fin.personal).toLocaleString()} บาท</p>
                    <p><strong>สัดส่วนหุ้นธุรกิจ:</strong> ${caseData.biz.share}%</p>
                    <p class="mt-2"><strong>พนักงานที่รับผิดชอบ:</strong> ${caseData.emp.name} (RH: ${caseData.emp.rh})</p>
                    <p><strong>วันที่วิเคราะห์:</strong> ${new Date(caseData.createdAt).toLocaleDateString('th-TH')}</p>
                </div>
            </div>
            
            <div class="mb-6">
                <h3 class="text-xl font-bold text-primary mb-3 border-b pb-2">ผลการวิเคราะห์ความเสี่ยงที่แนะนำ</h3>
                ${renderAnalysisResultHTML(caseData.analysis)}
            </div>
        </div>

        <button onclick="exportCaseProfileToPDF('${caseData.cust.name}')" class="btn-primary mb-6"><i class="fas fa-file-pdf mr-2"></i> Export Profile เป็น PDF</button>

        `;

    content.innerHTML = profileHTML;

    // ต้องเรียกใช้ renderComments(caseData.comments) ใน main.js หลัง renderProfileModal
};

/**
 * ฟังก์ชันเฉพาะสำหรับใช้ใน renderProfileModal เพื่อส่ง HTML ของผลวิเคราะห์กลับไป
 */
const renderAnalysisResultHTML = (risks) => {
    if (!risks || risks.length === 0) {
        return '<p class="text-lg text-green-600 font-semibold"><i class="fas fa-check-circle mr-2"></i> ไม่พบความเสี่ยงระดับสูง ลูกค้ามีความมั่นคงสูง</p>';
    }

    let html = '';
    risks.forEach((risk, index) => {
        const levelClass = `risk-tag-${risk.level}`;
        const icon = risk.level === 'Critical' ? 'fa-triangle-exclamation' : (risk.level === 'High' ? 'fa-circle-exclamation' : 'fa-circle-info');

        html += `
            <div class="card p-4 mb-4 border-l-4 ${risk.level === 'Critical' ? 'border-risk-critical' : (risk.level === 'High' ? 'border-risk-high' : 'border-risk-medium')}">
                <div class="flex items-center mb-2">
                    <i class="fas ${icon} mr-2 text-lg ${risk.level === 'Critical' ? 'text-risk-critical' : (risk.level === 'High' ? 'text-risk-high' : 'text-risk-medium')}"></i>
                    <p class="text-lg font-bold">${index + 1}. ${risk.name}</p>
                    <span class="risk-tag ${levelClass} ml-3">${risk.level}</span>
                </div>
                
                <p class="text-gray-600 mb-3 ml-6">${risk.why}</p>
                
                <div class="ml-6 mt-3 p-3 bg-secondary rounded-lg">
                    <p class="font-medium text-primary mb-2">ผลิตภัณฑ์ที่แนะนำ:</p>
                    <ul class="list-disc list-inside text-gray-700">
                        ${risk.products.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    });
    return html;
};


// ----------------------------------------------------------------------
// 5. COMMENTS RENDERING (แสดงผลความเห็น)
// ----------------------------------------------------------------------

/**
 * แสดงรายการคอมเมนต์ใน Modal
 * @param {Array<object>} comments - รายการคอมเมนต์ของเคส
 */
const renderComments = (comments) => {
    const commentsListDiv = $('comments-list');
    commentsListDiv.innerHTML = '';

    if (comments.length === 0) {
        commentsListDiv.innerHTML = '<p class="text-gray-500">ยังไม่มีความเห็นจากที่ปรึกษา</p>';
        return;
    }

    comments.forEach(comment => {
        const timestamp = new Date(comment.timestamp).toLocaleString('th-TH');
        commentsListDiv.innerHTML += `
            <div class="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p class="font-semibold text-primary">${comment.author}</p>
                <p class="text-gray-700 mt-1">${comment.text}</p>
                <p class="text-xs text-gray-400 text-right mt-1">${timestamp}</p>
            </div>
        `;
    });
};


// ----------------------------------------------------------------------
// 6. REPORT/DASHBOARD RENDERING (แสดงผลรายงาน)
// ----------------------------------------------------------------------

let activityChart = null; // ตัวแปรสำหรับเก็บ instance ของ Chart.js

/**
 * แสดง Dashboard รายงานสรุป
 * @param {Array<object>} allCases - ข้อมูลเคสทั้งหมด
 */
const renderReportDashboard = (allCases) => {
    const contentDiv = $('report-content');
    contentDiv.classList.remove('hidden');
    $('admin-login-prompt').classList.add('hidden');

    if (allCases.length === 0) {
        contentDiv.innerHTML = '<p class="text-center text-lg text-gray-500">ไม่มีข้อมูลเคสในระบบ</p>';
        return;
    }

    const totalCases = allCases.length;
    const totalRisks = allCases.reduce((sum, c) => sum + (c.analysis.length || 0), 0);
    const topPerformer = calculateTopPerformer(allCases);
    
    // สร้างโครงสร้าง HTML สำหรับ Dashboard
    contentDiv.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="card border-l-4 border-primary">
                <p class="text-sm text-gray-500">จำนวนเคสทั้งหมด</p>
                <p class="text-3xl font-bold text-gray-800">${totalCases.toLocaleString()}</p>
            </div>
            <div class="card border-l-4 border-risk-critical">
                <p class="text-sm text-gray-500">ความเสี่ยงที่ถูกระบุรวม</p>
                <p class="text-3xl font-bold text-gray-800">${totalRisks.toLocaleString()}</p>
            </div>
            <div class="card border-l-4 border-green-500">
                <p class="text-sm text-gray-500">พนักงานสร้างเคสมากสุด</p>
                <p class="text-xl font-bold text-gray-800">${topPerformer.name} (${topPerformer.count} เคส)</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="card">
                <h4 class="text-lg font-bold mb-3">Activity Chart (จำนวนเคสรายเดือน)</h4>
                <canvas id="activityChart"></canvas>
            </div>
            <div class="card">
                <h4 class="text-lg font-bold mb-3">Risk Distribution (การกระจายตัวของความเสี่ยง)</h4>
                <canvas id="riskDistributionChart"></canvas>
            </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-lg">
            <h3 class="text-xl font-medium mb-4">เครื่องมือผู้ดูแลระบบ</h3>
            <button onclick="deleteData('month')" class="btn-danger-outline mr-4"><i class="fas fa-trash-alt mr-2"></i> ลบข้อมูลเก่ากว่าเดือนนี้</button>
            <button onclick="exportData('excel')" class="btn-success-outline"><i class="fas fa-file-excel mr-2"></i> Export Excel ทั้งหมด</button>
            <button onclick="handleChangeConsultantCode()" class="btn-secondary mt-4"><i class="fas fa-key mr-2"></i> เปลี่ยนรหัสที่ปรึกษา 4 หลัก</button>
            <div class="mt-4 text-sm text-red-500">**คำเตือน:** การลบข้อมูลไม่สามารถย้อนกลับได้</div>
        </div>
    `;

    // วาด Chart
    drawActivityChart(allCases);
    drawRiskDistributionChart(allCases);
};

// Helper function: วาด Chart กิจกรรม
const drawActivityChart = (allCases) => {
    // Logic: นับจำนวนเคสรายเดือน/ปี
    const monthlyCounts = {};
    allCases.forEach(c => {
        const date = new Date(c.createdAt);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(monthlyCounts).sort();
    const labels = sortedKeys.map(key => {
        const [year, month] = key.split('-');
        return `${month}/${year.substring(2)}`;
    });
    const data = sortedKeys.map(key => monthlyCounts[key]);

    if (activityChart) {
        activityChart.destroy();
    }
    activityChart = new Chart($('activityChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนเคสที่สร้าง',
                data: data,
                backgroundColor: 'rgba(13, 71, 161, 0.8)', // Primary color
                borderColor: 'rgba(13, 71, 161, 1)',
                borderWidth: 1
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
};

// Helper function: วาด Chart การกระจายความเสี่ยง
const drawRiskDistributionChart = (allCases) => {
    // Logic: นับจำนวนความเสี่ยง (Critical, High, Medium)
    const riskCounts = { 'Critical': 0, 'High': 0, 'Medium': 0 };
    allCases.forEach(c => {
        (c.analysis || []).forEach(risk => {
            if (risk.level in riskCounts) {
                riskCounts[risk.level]++;
            }
        });
    });

    const chartData = [riskCounts.Critical, riskCounts.High, riskCounts.Medium];
    const chartLabels = ['Critical', 'High', 'Medium'];

    // ทำลาย Chart เก่าถ้ามี
    const existingChart = Chart.getChart('riskDistributionChart');
    if (existingChart) {
        existingChart.destroy();
    }
    
    new Chart($('riskDistributionChart'), {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: [
                    '#D32F2F', // Critical
                    '#FFC107', // High
                    '#0288D1'  // Medium
                ],
                hoverOffset: 4
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
};

/**
 * คำนวณหาพนักงานที่สร้างเคสมากที่สุด
 */
const calculateTopPerformer = (allCases) => {
    const counts = {};
    let maxCount = 0;
    let topName = 'N/A';
    
    allCases.forEach(c => {
        const empName = c.emp.name || 'Unknown';
        counts[empName] = (counts[empName] || 0) + 1;
        if (counts[empName] > maxCount) {
            maxCount = counts[empName];
            topName = empName;
        }
    });

    return { name: topName, count: maxCount };
};
