"use client";
import { useCallback, useEffect, useState } from "react";
import { questionApi } from "@/app/lib/api";
import { useToast } from "@/app/components/ToastProvider";

type Question = { questionId: number; courseTitle: string; studentName: string; title: string; content: string; status: string; answer?: string; createdAt: string };

export default function InstructorQuestions() {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [open, setOpen] = useState(true);
  const load = useCallback(async () => { try { const data = await questionApi.getInstructorQuestions(); setQuestions(data.items || []); } catch (error: any) { showToast(error.message || "질문을 불러오지 못했습니다.", "error"); } }, [showToast]);
  useEffect(() => { load(); }, [load]);
  const answer = async (id: number) => {
    const value = answers[id]?.trim();
    if (!value) return showToast("답변 내용을 입력해주세요.", "error");
    try { await questionApi.answer(id, value); showToast("학생에게 답변을 보냈습니다.", "success"); setAnswers((current) => ({ ...current, [id]: "" })); load(); }
    catch (error: any) { showToast(error.message || "답변 등록에 실패했습니다.", "error"); }
  };
  return <section className="card panel" style={{ marginBottom: 30 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><div><div className="eyebrow">Student Q&A</div><h2 className="section-title">수강생 질의응답</h2></div><button className="btn btn-soft btn-small" onClick={() => setOpen(!open)}>{open ? "접기" : `질문 ${questions.length}건 보기`}</button></div>
    {open && <div className="grid" style={{ marginTop: 18 }}>{questions.length === 0 ? <div className="empty">아직 등록된 질문이 없습니다.</div> : questions.map((question) => <article key={question.questionId} style={{ padding: 18, border: "1px solid var(--line)", borderRadius: 14 }}>
      <div className="actions"><span className={`badge ${question.status === "ANSWERED" ? "badge-done" : "badge-open"}`}>{question.status === "ANSWERED" ? "답변 완료" : "답변 대기"}</span><span className="muted">{question.courseTitle} · {question.studentName}</span></div>
      <h3 style={{ marginTop: 10 }}>{question.title}</h3><p className="page-copy">{question.content}</p>
      {question.answer ? <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "#fff4df" }}><strong>내 답변</strong><p>{question.answer}</p></div> : <div className="field" style={{ marginTop: 14 }}><label htmlFor={`answer-${question.questionId}`}>답변</label><textarea id={`answer-${question.questionId}`} value={answers[question.questionId] || ""} onChange={(e) => setAnswers((current) => ({ ...current, [question.questionId]: e.target.value }))} placeholder="학생이 이해하기 쉽게 답변해주세요." /><button className="btn btn-primary" onClick={() => answer(question.questionId)}>답변 등록</button></div>}
    </article>)}</div>}
  </section>;
}
