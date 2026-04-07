/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stethoscope, 
  Activity, 
  RefreshCw, 
  AlertCircle, 
  ChevronRight,
  User,
  Info,
  CheckCircle2,
  Calculator,
  ClipboardList,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Clinical Content Configuration (แก้ไขข้อความที่นี่ได้เลย) ---
const CLINICAL_CONTENT = {
  STAGES: {
    F0_F1: {
      title: "F0 - F1 (Non or Mild Fibrosis)",
      recommendations: [
        "ติดตามผลเลือด (LFT, Platelet) ทุก 6-12 เดือน",
        "ประเมินความเสี่ยงและระดับ HBV DNA เป็นระยะ"
      ],
      patientWording: "ยินดีด้วยครับ ผลตรวจอยู่ในเกณฑ์ดี พังผืดในตับยังมีน้อยมากครับ หมอแนะนำให้ดูแลสุขภาพทั่วไป หลีกเลี่ยงปัจจัยเสี่ยง และกลับมาตรวจติดตามผลเลือดตามนัดเพื่อเฝ้าระวังอย่างต่อเนื่องครับ"
    },
    F2: {
      title: "F2 (Significant Fibrosis)",
      recommendations: [
        "พิจารณาตรวจ Fibroscan เพิ่มเติมเพื่อยืนยันระยะพังผืด",
        "ติดตามอาการและผลเลือดอย่างใกล้ชิดทุก 3-6 เดือน",
        "ประเมินข้อบ่งชี้ในการรักษาด้วยยาต้านไวรัสตามระดับ HBV DNA และ ALT"
      ],
      patientWording: "ผลเลือดชี้ว่าตับเริ่มมีพังผืดสะสมในระดับที่ต้องเฝ้าระวังครับ แม้จะยังไม่ถึงขั้นตับแข็ง แต่เราจำเป็นต้องติดตามอาการอย่างใกล้ชิดและอาจต้องตรวจเพิ่มเติมบางอย่าง เพื่อวางแผนป้องกันไม่ให้โรคลุกลามไปมากกว่านี้ครับ"
    },
    F3_F4: {
      title: "F3 - F4 (Advanced Fibrosis / Cirrhosis)",
      recommendations: [
        "พิจารณาเริ่มยาต้านไวรัสทันที (หากเข้าเกณฑ์อื่นๆ ร่วมด้วย)",
        "แนะนำตรวจคัดกรองมะเร็งตับ (HCC Screening) ด้วย Ultrasound และ AFP ทุก 6 เดือน",
        "ประเมินภาวะแทรกซ้อนของตับแข็ง เช่น Varices หรือ Ascites"
      ],
      patientWording: "จากการตรวจเลือดพบว่าตับเริ่มมีความแข็งหรือมีพังผืดสะสมค่อนข้างมากครับ หมอแนะนำให้เราเริ่มกระบวนการรักษาด้วยยาและตรวจติดตามมะเร็งตับอย่างสม่ำเสมอทุก 6 เดือน เพื่อป้องกันภาวะแทรกซ้อนและดูแลตับให้ทำงานได้ดีที่สุดครับ"
    }
  },
  FLOWCHART: {
    POS_1: { title: "ALT ≤ ULN | DNA > 20,000", content: "• ยังไม่รักษา\n• ติดตาม ALT ทุก 3-6 เดือน และ HBeAg ทุก 6-12 เดือน" },
    POS_2: { title: "ALT > ULN แต่ < 2xULN | DNA > 20,000", content: "• Exclude สาเหตุอื่น\n• รักษาหากมี significant fibrosis หรือ persistent ALT elevation (โดยเฉพาะอายุ > 40 ปี)" },
    POS_3: { title: "ALT ≥ 2xULN | DNA > 20,000", content: "• รักษา" },
    POS_4: { title: "ALT ≥ 2xULN | DNA 2,000-20,000", content: "• ติดตามทุก 1-3 เดือน\n• เริ่มรักษาหาก ALT persists > 6 เดือน" },
    NEG_1: { title: "ALT ≤ ULN | DNA < 2,000", content: "• ยังไม่รักษา\n• ติดตาม ALT +/- DNA ทุก 3-6 เดือน และ HBsAg ทุก 1 ปี" },
    NEG_2: { title: "ALT ≤ 2xULN | DNA ≥ 2,000", content: "• ติดตาม ALT และ DNA ทุก 3 เดือน\n• รักษาหากมี significant fibrosis หรือ persistent ALT elevation (โดยเฉพาะอายุ > 40 ปี)" },
    NEG_3: { title: "ALT ≥ 2xULN | DNA ≥ 2,000", content: "• รักษา" }
  }
};

// --- Clinical Types ---
interface PatientData {
  age: number;
  ast: number;
  astUln: number;
  alt: number;
  altUln: number;
  platelet: number;
  hbeag?: string;
  hbvDna?: string;
}

interface EvaluationResult {
  apri: number;
  fib4: number;
  apriInterpretation: string;
  fib4Interpretation: string;
  staging: string;
  recommendations: string[];
  patientWording: string;
  hbeag?: string;
  hbvDna?: string;
  age: number;
  alt: number;
  altUln: number;
  activeBoxId: string | null;
}

// --- Calculation Logic ---
function calculateLiverFibrosis(data: PatientData): EvaluationResult {
  const { age, ast, astUln, alt, altUln, platelet, hbeag, hbvDna } = data;

  const apri = ((ast / astUln) / platelet) * 100;
  let apriInterpretation = "";
  if (apri > 2) apriInterpretation = "ภาวะตับแข็ง (Cirrhosis) เทียบเท่าระยะ F4";
  else if (apri >= 0.5) apriInterpretation = "ภาวะพังผืดในตับที่มีนัยสำคัญ (Significant Fibrosis) เทียบเท่าระยะ > F2";
  else apriInterpretation = "ไม่มีพังผืดหรือมีเพียงเล็กน้อย (Non or Mild Fibrosis) เทียบเท่าระยะ < F2";

  const fib4 = (age * ast) / (platelet * Math.sqrt(alt));
  let fib4Interpretation = "";
  if (fib4 > 2.67) fib4Interpretation = "ภาวะพังผืดในตับระยะลุกลาม (Advanced Fibrosis) เทียบเท่าระยะ F3";
  else if (fib4 >= 1.3) fib4Interpretation = "ภาวะพังผืดในตับที่มีนัยสำคัญ (Significant Fibrosis) เทียบเท่าระยะ > F2";
  else fib4Interpretation = "ไม่มีพังผืดหรือมีเพียงเล็กน้อย (Non or Mild Fibrosis) เทียบเท่าระยะ < F2";

  // Determine Stage and Content
  let stageKey: keyof typeof CLINICAL_CONTENT.STAGES = "F0_F1";
  if (apri > 2 || fib4 > 2.67) stageKey = "F3_F4";
  else if (apri >= 0.5 || fib4 >= 1.3) stageKey = "F2";

  const content = CLINICAL_CONTENT.STAGES[stageKey];

  // Flowchart Logic
  let activeBoxId: string | null = null;
  const dnaValue = parseFloat(hbvDna?.replace(/,/g, '') || '0');
  const isPos = hbeag === 'Positive';
  const isNeg = hbeag === 'Negative';

  if (isPos) {
    if (alt <= altUln && dnaValue > 20000) activeBoxId = "pos_1";
    else if (alt > altUln && alt < 2 * altUln && dnaValue > 20000) activeBoxId = "pos_2";
    else if (alt >= 2 * altUln) {
      if (dnaValue > 20000) activeBoxId = "pos_3";
      else if (dnaValue >= 2000 && dnaValue <= 20000) activeBoxId = "pos_4";
    }
  } else if (isNeg) {
    if (alt <= altUln) {
      if (dnaValue < 2000) activeBoxId = "neg_1";
      else if (dnaValue >= 2000) activeBoxId = "neg_2";
    } else if (alt > altUln && alt < 2 * altUln && dnaValue >= 2000) activeBoxId = "neg_2";
    else if (alt >= 2 * altUln) {
      if (dnaValue < 2000) activeBoxId = "neg_2";
      else if (dnaValue >= 2000) activeBoxId = "neg_3";
    }
  }

  return {
    apri,
    fib4,
    apriInterpretation,
    fib4Interpretation,
    staging: content.title,
    recommendations: content.recommendations,
    patientWording: content.patientWording,
    hbeag,
    hbvDna,
    age,
    alt,
    altUln,
    activeBoxId
  };
}

// --- Flowchart Component ---
const GuidelineFlowchart = ({ activeId }: { activeId: string | null }) => {
  const Box = ({ id, title, content, color = "blue" }: { id: string, title: string, content: string, color?: "blue" | "green" | "yellow" }) => {
    const isActive = activeId === id;
    return (
      <div className={cn(
        "p-3 rounded-lg border-2 transition-all text-[11px] leading-tight h-full flex flex-col",
        isActive ? "border-red-500 ring-4 ring-red-100 shadow-lg scale-105 z-10 bg-white" : "border-slate-200 bg-slate-50 opacity-60",
        color === "blue" && !isActive && "bg-blue-50/50",
        color === "green" && !isActive && "bg-green-50/50",
        color === "yellow" && !isActive && "bg-yellow-50/50"
      )}>
        <p className="font-bold mb-1 text-slate-800">{title}</p>
        <p className="text-slate-600 whitespace-pre-line">{content}</p>
        {isActive && (
          <div className="mt-2 text-red-600 font-bold flex items-center gap-1 animate-pulse">
            <CheckCircle2 className="w-3 h-3" />
            ผู้ป่วยอยู่ในกลุ่มนี้
          </div>
        )}
      </div>
    );
  };

  const f = CLINICAL_CONTENT.FLOWCHART;

  return (
    <div className="space-y-8 mt-4 overflow-x-auto pb-4">
      <div className="min-w-[600px]">
        <div className="bg-orange-100 text-orange-800 font-bold py-1 px-4 rounded-full w-fit mx-auto mb-4 text-xs">HBeAg-Positive</div>
        <div className="grid grid-cols-4 gap-3">
          <Box id="pos_1" title={f.POS_1.title} content={f.POS_1.content} />
          <Box id="pos_2" title={f.POS_2.title} content={f.POS_2.content} />
          <Box id="pos_3" title={f.POS_3.title} content={f.POS_3.content} color="green" />
          <Box id="pos_4" title={f.POS_4.title} content={f.POS_4.content} />
        </div>
      </div>

      <div className="min-w-[600px] pt-6 border-t border-slate-200">
        <div className="bg-orange-100 text-orange-800 font-bold py-1 px-4 rounded-full w-fit mx-auto mb-4 text-xs">HBeAg-Negative</div>
        <div className="grid grid-cols-3 gap-3">
          <Box id="neg_1" title={f.NEG_1.title} content={f.NEG_1.content} />
          <Box id="neg_2" title={f.NEG_2.title} content={f.NEG_2.content} />
          <Box id="neg_3" title={f.NEG_3.title} content={f.NEG_3.content} color="green" />
        </div>
      </div>
    </div>
  );
};


export default function App() {
  const [formData, setFormData] = useState<PatientData>({
    age: 0,
    ast: 0,
    astUln: 40,
    alt: 0,
    altUln: 40, // Default ALT ULN
    platelet: 0,
    hbeag: '',
    hbvDna: ''
  });

  const [result, setResult] = useState<EvaluationResult | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hbeag' || name === 'hbvDna' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const evaluation = calculateLiverFibrosis(formData);
    setResult(evaluation);
  };

  const handleReset = () => {
    setFormData({
      age: 0,
      ast: 0,
      astUln: 40,
      alt: 0,
      altUln: 40,
      platelet: 0,
      hbeag: '',
      hbvDna: ''
    });
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-800">HBV Fibrosis Calculator</h1>
          </div>
          <button 
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
            title="Reset"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800 leading-relaxed">
                  เครื่องมือคำนวณ APRI และ FIB-4 พร้อมระบบ Clinical Decision Support ตามแนวทางเวชปฏิบัติ
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 space-y-6">
                  {/* Basic Info Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        อายุ (ปี)
                      </label>
                      <input
                        type="number"
                        name="age"
                        required
                        min="0"
                        max="120"
                        value={formData.age || ''}
                        onChange={handleInputChange}
                        placeholder="เช่น 45"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-400" />
                        AST ULN
                      </label>
                      <input
                        type="number"
                        name="astUln"
                        required
                        value={formData.astUln || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-400" />
                        ALT ULN
                      </label>
                      <input
                        type="number"
                        name="altUln"
                        required
                        value={formData.altUln || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Lab Results Section */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">ผลการตรวจเลือด</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500">AST (IU/L)</label>
                        <input
                          type="number"
                          name="ast"
                          required
                          value={formData.ast || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500">ALT (IU/L)</label>
                        <input
                          type="number"
                          name="alt"
                          required
                          value={formData.alt || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500">Platelet (10⁹/L)</label>
                        <input
                          type="number"
                          name="platelet"
                          required
                          value={formData.platelet || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Section */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">ข้อมูลไวรัส (สำคัญสำหรับการเลือกแผนการรักษา)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500">HBeAg Status</label>
                        <select
                          name="hbeag"
                          value={formData.hbeag}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                        >
                          <option value="">ไม่ระบุ</option>
                          <option value="Positive">Positive</option>
                          <option value="Negative">Negative</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500">HBV DNA (IU/mL)</label>
                        <input
                          type="text"
                          name="hbvDna"
                          value={formData.hbvDna}
                          onChange={handleInputChange}
                          placeholder="เช่น 2000"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-emerald-200 bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    ประเมินและวางแผนการรักษา
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Results Summary Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                    <div className="bg-emerald-100 p-2 rounded-full">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">ผลการประเมินทางคลินิก</h2>
                      <p className="text-sm text-slate-500">คำนวณตามสูตรมาตรฐาน APRI & FIB-4</p>
                    </div>
                  </div>

                  {/* Patient Context Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">อายุ</p>
                      <p className="text-sm font-semibold text-slate-700">{result.age} ปี</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">HBeAg Status</p>
                      <p className="text-sm font-semibold text-slate-700">{result.hbeag || 'ไม่ระบุ'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">HBV DNA</p>
                      <p className="text-sm font-semibold text-slate-700">{result.hbvDna || 'ไม่ระบุ'} IU/mL</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">ALT Level</p>
                      <p className="text-sm font-semibold text-slate-700">{result.alt} ({ (result.alt / result.altUln).toFixed(1) }x ULN)</p>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {/* Scores Section */}
                    <section>
                      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        <Calculator className="w-4 h-4" />
                        ผลการคำนวณ (Calculation Results)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 mb-1">APRI Score</p>
                          <p className="text-2xl font-bold text-emerald-700">{result.apri.toFixed(3)}</p>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{result.apriInterpretation}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 mb-1">FIB-4 Score</p>
                          <p className="text-2xl font-bold text-emerald-700">{result.fib4.toFixed(3)}</p>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{result.fib4Interpretation}</p>
                        </div>
                      </div>
                    </section>

                    {/* Flowchart Section */}
                    <section className="pt-6 border-t border-slate-100">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        <Activity className="w-4 h-4" />
                        แผนภาพการตัดสินใจ (Treatment Algorithm)
                      </h3>
                      <p className="text-xs text-slate-500 mb-4 italic">
                        * ระบบไฮไลท์กรอบสีแดงในช่องที่ตรงกับข้อมูลของผู้ป่วยตามอัลกอริทึม
                      </p>
                      <GuidelineFlowchart activeId={result.activeBoxId} />
                    </section>

                    {/* Recommendations Section */}
                    <section className="pt-6 border-t border-slate-100">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        <ClipboardList className="w-4 h-4" />
                        แผนการดูแลรักษา (Next Steps)
                      </h3>
                      <ul className="space-y-3">
                        {result.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-3 text-slate-700 text-sm leading-relaxed">
                            <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Patient Wording Section */}
                    <section className="pt-6 border-t border-slate-100">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        <MessageSquare className="w-4 h-4" />
                        ชุดคำพูดสำหรับสื่อสารกับผู้ป่วย (Patient Wording)
                      </h3>
                      <div className="p-5 bg-slate-50 rounded-2xl border-l-4 border-emerald-500 italic text-slate-700 leading-loose">
                        "{result.patientWording}"
                      </div>
                    </section>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    เริ่มการประเมินเคสใหม่
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-4 bg-emerald-600 rounded-xl font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    พิมพ์รายงาน
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
