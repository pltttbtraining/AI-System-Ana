/**
 * analysis.js
 * * ไฟล์นี้รับผิดชอบในการวิเคราะห์ความเสี่ยงทางการเงินของลูกค้า 7 ด้าน
 * * โดยใช้เกณฑ์ Rule-Based System
 */

const RISK_LEVELS = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low'
};

/**
 * ฟังก์ชันหลักในการวิเคราะห์ความเสี่ยง 7 ด้าน
 * @param {object} data - ข้อมูลลูกค้าที่รวบรวมจากฟอร์ม
 * @returns {Array<object>} รายการความเสี่ยงที่ตรวจพบ (จัดเรียงตามระดับความรุนแรง)
 */
const runAI = (data) => {
    const risks = [];
    // คำนวณค่าหลัก
    const annualIncome = data.cust.income * 12;
    const totalDebt = data.fin.home + data.fin.car + data.fin.personal;
    const totalLiquidAssets = data.fin.saving + data.fin.fixed;
    const totalInvestedAssets = data.fin.fund;
    const totalPortfolio = totalLiquidAssets + totalInvestedAssets;
    
    // ดึงค่าเบี้ยประกันรวมต่อปี (สมมติว่า data.policies[0].premium มีข้อมูล)
    // เนื่องจาก input policies-premium เป็นช่องเดียว เราจะสมมติว่ามันคือเบี้ยประกันรวม
    const totalPremium = parseFloat(data.policies[0] ? data.policies[0].premium : 0); 
    
    // --- 1. DEBT RISK (ความเสี่ยงหนี้สิน) ---
    // เกณฑ์: หนี้สินรวมเกิน 3 เท่าของรายได้ต่อปี (36 เท่าของรายได้ต่อเดือน)
    if (totalDebt > annualIncome * 3) {
        risks.push({
            level: RISK_LEVELS.CRITICAL,
            name: 'ความเสี่ยงหนี้สินสูงเกินควบคุม (Excessive Debt)',
            why: `หนี้สินรวม ${totalDebt.toLocaleString()} บาท คิดเป็น ${Math.round(totalDebt / annualIncome)} เท่าของรายได้ต่อปี ซึ่งสูงกว่าเกณฑ์มาตรฐาน 3 เท่าอย่างมาก`,
            products: ['สินเชื่อรวมหนี้ (Debt Consolidation)', 'ประกันคุ้มครองวงเงินสินเชื่อ']
        });
    }

    // --- 2. LIQUIDITY RISK (ความเสี่ยงสภาพคล่อง) ---
    // เกณฑ์: ภาระเบี้ยประกันต่อปีสูงเกิน 15% ของรายได้ต่อปี
    if (annualIncome > 0 && (totalPremium / annualIncome) > 0.15) {
        risks.push({
            level: RISK_LEVELS.HIGH,
            name: 'ความเสี่ยงต่อสภาพคล่องจากภาระเบี้ยประกัน',
            why: `เบี้ยประกันรวมต่อปี ${totalPremium.toLocaleString()} บาท สูงถึง ${(totalPremium / annualIncome * 100).toFixed(1)}% ของรายได้ต่อปี (เกณฑ์มาตรฐานไม่เกิน 15%)`,
            products: ['ผลิตภัณฑ์ Unit Linked (ปรับลดเบี้ยแต่เพิ่มมูลค่าเงินสด)', 'ประกันสุขภาพลดหย่อนภาษี']
        });
    }

    // --- 3. INFLATION RISK (ความเสี่ยงจากเงินเฟ้อ) ---
    // เกณฑ์: เงินฝาก/สภาพคล่องสูงเกิน 5 เท่าของรายได้ต่อปี (60 เท่าของรายได้ต่อเดือน)
    if (totalLiquidAssets > annualIncome * 5) {
        risks.push({
            level: RISK_LEVELS.HIGH,
            name: 'ความเสี่ยงเงินเฟ้อ (Too Much Cash)',
            why: `มีสินทรัพย์สภาพคล่องสูงถึง ${totalLiquidAssets.toLocaleString()} บาท ซึ่งเกินความจำเป็นสำรองสภาพคล่อง (ประมาณ 3-6 เดือน) ทำให้เสียโอกาสในการเติบโต`,
            products: ['กองทุนความเสี่ยงต่ำ-ปานกลาง', 'ประกันควบการลงทุน (Unit Linked)']
        });
    }

    // --- 4. INVESTMENT RISK (ความเสี่ยงพอร์ตการลงทุนอนุรักษ์นิยม) ---
    // เกณฑ์: สัดส่วนสินทรัพย์สภาพคล่อง (เงินฝาก) ในพอร์ตลงทุนรวมสูงกว่า 70%
    if (totalPortfolio > 0 && (totalLiquidAssets / totalPortfolio) > 0.70 && totalInvestedAssets > 0) {
        risks.push({
            level: RISK_LEVELS.MEDIUM,
            name: 'ความเสี่ยงพอร์ตลงทุนเติบโตช้า',
            why: `พอร์ตลงทุนมีสัดส่วนสินทรัพย์สภาพคล่องสูงเกิน 70% ซึ่งอาจทำให้ผลตอบแทนระยะยาวไม่เป็นไปตามเป้าหมายเงินเฟ้อ`,
            products: ['กองทุนผสม/หุ้น (เพื่อสร้างการเติบโต)', 'ผลิตภัณฑ์ Unit Linked เน้นการลงทุน']
        });
    }

    // --- 5. BUSINESS RISK (ความเสี่ยงเจ้าของกิจการ/Key Man) ---
    // เกณฑ์: อาชีพเป็นเจ้าของกิจการ และมีสัดส่วนหุ้น > 50%
    const isBusinessOwner = data.cust.job.toLowerCase().includes('กิจการ') || data.cust.job.toLowerCase().includes('เจ้าของ');
    if (isBusinessOwner && data.biz.share > 50) {
        risks.push({
            level: RISK_LEVELS.CRITICAL,
            name: 'ความเสี่ยงบุคคลสำคัญทางธุรกิจ (Key Man Risk)',
            why: `ลูกค้าเป็นเจ้าของกิจการที่มีสัดส่วนหุ้นสูง การขาดลูกค้าจะกระทบต่อธุรกิจและครอบครัวอย่างรุนแรง จำเป็นต้องวางแผนการคุ้มครองและโอนย้ายมรดก`,
            products: ['ประกันชีวิตเพื่อธุรกิจ (Key Man Insurance)', 'ประกันวางแผนมรดก']
        });
    }
    
    // --- 6. RETIREMENT RISK (ความเสี่ยงเกษียณ) ---
    // เกณฑ์: อายุเกิน 45 ปี และไม่มีสินทรัพย์ลงทุน (กองทุน)
    if (data.cust.age >= 45 && totalInvestedAssets === 0) {
        risks.push({
            level: RISK_LEVELS.HIGH,
            name: 'ความเสี่ยงวางแผนเกษียณล่าช้า',
            why: `อายุอยู่ในช่วงเร่งสร้างความมั่งคั่ง (45 ปีขึ้นไป) แต่ยังไม่มีสินทรัพย์ลงทุนระยะยาวเพื่อรองรับการเกษียณ`,
            products: ['กองทุน RMF (เพื่อการเกษียณ)', 'ประกันบำนาญ']
        });
    }

    // --- 7. EDUCATION RISK (ความเสี่ยงการศึกษาบุตร) ---
    // เกณฑ์: มีบุตรที่อยู่ในช่วง 1-18 ปี
    const hasChildForEducation = data.fam.hasChild && data.fam.childAges.some(age => age >= 1 && age <= 18);
    if (hasChildForEducation) {
        risks.push({
            level: RISK_LEVELS.MEDIUM,
            name: 'ความเสี่ยงภาระค่าใช้จ่ายการศึกษาบุตร',
            why: `มีบุตรที่ต้องดูแลการศึกษา ${data.fam.childAges.join(', ')} ปี ซึ่งเป็นภาระค่าใช้จ่ายก้อนใหญ่ในอนาคตที่ต้องเตรียมพร้อม`,
            products: ['กองทุนเพื่อการศึกษาบุตร', 'ประกันชีวิตสะสมทรัพย์เพื่อการศึกษา']
        });
    }

    // จัดเรียงความเสี่ยง: Critical > High > Medium
    const order = { [RISK_LEVELS.CRITICAL]: 1, [RISK_LEVELS.HIGH]: 2, [RISK_LEVELS.MEDIUM]: 3 };
    risks.sort((a, b) => order[a.level] - order[b.level]);

    return risks;
};

