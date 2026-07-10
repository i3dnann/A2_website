import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, Loader2, Send } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import PageShell from "../components/PageShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

type CareerJob = {
  id: string;
  title?: string;
  department?: string;
  description?: string;
  requirements?: string;
  is_open?: boolean | number;
};

type CareerQuestion = {
  id?: string;
  section_id?: string;
  question: string;
  help_text?: string;
  question_type?: string;
  is_required?: boolean | number;
  sort_order?: number;
};

const baseQuestions: CareerQuestion[] = [
  { id: "applicant-name", question: "Name", question_type: "text", is_required: true },
  { id: "applicant-age", question: "Age", question_type: "number", is_required: true },
  { id: "applicant-discord", question: "Discord ID", question_type: "text", is_required: true },
  { id: "why-pick-you", question: "Why should we pick you?", question_type: "long_text", is_required: true },
  { id: "why-role", question: "Why do you want this role?", question_type: "long_text", is_required: true },
  { id: "rp-experience", question: "Do you have previous FiveM or roleplay experience?", question_type: "long_text", is_required: true },
  { id: "weekly-activity", question: "How active can you be weekly?", question_type: "text", is_required: true },
  { id: "conflict", question: "How do you handle conflict with other players?", question_type: "long_text", is_required: true },
  { id: "rules", question: "Do you agree to follow server rules and staff instructions?", question_type: "text", is_required: true },
  { id: "notes", question: "Optional extra notes", question_type: "long_text", is_required: false },
];

function questionKey(question: CareerQuestion, index: number) {
  return question.id || `${question.question}-${index}`;
}

function isLong(question: CareerQuestion) {
  return String(question.question_type || "").includes("long") || question.question.length > 48;
}

function isRequired(question: CareerQuestion) {
  return question.is_required !== false && question.is_required !== 0;
}

export default function CareerApplyPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const [job, setJob] = useState<CareerJob | null>(null);
  const [questions, setQuestions] = useState<CareerQuestion[]>(baseQuestions);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await api<{ job: CareerJob; questions: CareerQuestion[] }>(`/api/public/careers/${id}`);
        if (cancel) return;
        setJob(result.job);
        const seen = new Set(baseQuestions.map((q) => q.question.toLowerCase()));
        const custom = (result.questions || [])
          .filter((q) => q.question && !seen.has(String(q.question).toLowerCase()))
          .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
        setQuestions([...baseQuestions, ...custom]);
      } catch (e: any) {
        if (!cancel) setError(e?.message || "Could not load this position.");
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, [id]);

  const missingRequired = useMemo(
    () => questions.filter((question, index) => isRequired(question) && !String(answers[questionKey(question, index)] || "").trim()),
    [answers, questions]
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!job || missingRequired.length > 0) {
      push({ kind: "error", message: "Please answer all required questions." });
      return;
    }
    setSubmitting(true);
    try {
      const payload = questions.map((question, index) => ({
        section_id: question.section_id || "",
        question_id: question.id || "",
        question: question.question,
        answer: answers[questionKey(question, index)] || "",
      }));
      await api(`/api/player/careers/${job.id}/apply`, { method: "POST", body: { answers: payload, termsVersion: "1.0.0" } });
      push({ kind: "success", message: "Application submitted. You can track it from your dashboard." });
      navigate("/dashboard");
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Could not submit application." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell subtitle="Careers Portal" title={loading ? "Loading Position" : job?.title || "Position Not Found"}>
      <Link to="/careers" className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
        <ArrowLeft size={15} /> Back to careers
      </Link>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">
          <Loader2 size={16} className="animate-spin" /> Loading application...
        </div>
      ) : error || !job ? (
        <div className="rounded-2xl border border-orange-400/20 bg-orange-500/5 p-8 text-center text-orange-100">
          {error || "This position could not be found."}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
              <Briefcase size={22} />
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.22em] text-orange-200">{job.department || "Department"}</p>
            <h2 className="mt-2 font-serif text-2xl text-white">{job.title}</h2>
            {job.description && <p className="mt-4 text-sm leading-6 text-white/55">{job.description}</p>}
            {job.requirements && (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Requirements</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/65">{job.requirements}</p>
              </div>
            )}
          </motion.aside>

          <motion.form initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
            {!user && (
              <div className="mb-5 rounded-xl border border-orange-400/25 bg-orange-500/10 p-4 text-sm text-orange-100">
                You need to log in before submitting. You can still read the questions here.
              </div>
            )}
            <div className="grid gap-4">
              {questions.map((question, index) => {
                const key = questionKey(question, index);
                return (
                  <label key={key} className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/45">
                      {question.question}{isRequired(question) ? " *" : ""}
                    </span>
                    {question.help_text && <span className="mb-2 block text-xs text-white/35">{question.help_text}</span>}
                    {isLong(question) ? (
                      <textarea
                        rows={4}
                        value={answers[key] || ""}
                        onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))}
                        className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-400/50"
                      />
                    ) : (
                      <input
                        type={question.question_type === "number" ? "number" : "text"}
                        value={answers[key] || ""}
                        onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-400/50"
                      />
                    )}
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/40">Required questions are marked with an asterisk.</p>
              <button
                disabled={submitting || !user}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-5 py-3 text-sm font-semibold text-white transition hover:shadow-[0_0_20px_rgba(96,81,155,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? "Submitting..." : user ? "Submit Application" : "Log in to Submit"}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </PageShell>
  );
}
