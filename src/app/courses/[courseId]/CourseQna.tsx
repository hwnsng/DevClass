"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { getAuthUser, questionApi } from "@/app/lib/api";
import { useToast } from "@/app/components/ToastProvider";

type Question = { questionId: number; studentName: string; title: string; content: string; status: string; answer?: string };

export default function CourseQna({ courseId }: { courseId: number }) {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const load = useCallback(async () => { try { const data = await questionApi.getCourseQuestions(courseId); setQuestions(data.items || []); } catch {} }, [courseId]);
  useEffect(() => { load(); }, [load]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!getAuthUser()) return showToast("로그인 후 질문을 등록할 수 있습니다.", "error");
    if (form.title.trim().length < 2) return showToast("질문 제목을 2자 이상 입력해주세요.", "error");
    if (form.content.trim().length < 5) return showToast("질문 내용을 5자 이상 입력해주세요.", "error");
    try { await questionApi.create(courseId, { title: form.title.trim(), content: form.content.trim() }); setForm({ title: "", content: "" }); showToast("강사에게 질문을 보냈습니다.", "success"); load(); }
    catch (error: any) { showToast(error.message || "질문 등록에 실패했습니다.", "error"); }
  };
  return <section className="card panel" style={{ gridColumn: "1 / -1", marginTop: 24 }}>
    <div className="eyebrow">Course Q&A</div><h2 className="section-title">강사에게 질문하기</h2><p className="page-copy">이 강의를 수강 중인 학생만 질문을 등록할 수 있습니다.</p>
    <form className="form-grid" style={{ marginTop: 18 }} onSubmit={submit} noValidate><div className="field"><label htmlFor="question-title">질문 제목</label><input id="question-title" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} maxLength={160} /></div><div className="field"><label htmlFor="question-content">질문 내용</label><textarea id="question-content" value={form.content} onChange={(e) => setForm((current) => ({ ...current, content: e.target.value }))} maxLength={4000} /></div><button className="btn btn-primary" style={{ justifySelf: "start" }}>질문 등록</button></form>
    <div className="grid" style={{ marginTop: 24 }}>{questions.map((question) => <article key={question.questionId} style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}><div className="actions"><span className={`badge ${question.status === "ANSWERED" ? "badge-done" : "badge-open"}`}>{question.status === "ANSWERED" ? "답변 완료" : "답변 대기"}</span><span className="muted">{question.studentName}</span></div><h3 style={{ marginTop: 9 }}>{question.title}</h3><p className="page-copy">{question.content}</p>{question.answer && <div style={{ marginTop: 12, background: "#fff0df", borderRadius: 10, padding: 14 }}><strong>강사 답변</strong><p>{question.answer}</p></div>}</article>)}</div>
  </section>;
}
