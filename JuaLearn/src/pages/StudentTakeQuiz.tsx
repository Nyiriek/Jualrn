import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, LinearProgress, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import JuaCompanion from "../components/JuaCompanion";

type Choice = { id: number; text: string };
type Question = { id: number; text: string; type: string; choices: Choice[] };
type AnswerResult = { question_id: number; question_text: string; answer_text: string; correct_answer: string; is_correct: boolean; needs_review: boolean };

const StudentTakeQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [answerResults, setAnswerResults] = useState<AnswerResult[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/quizzes/${quizId}/questions/`);
        setQuestions(response.data);
        setError(null);
      } catch {
        setError("Failed to load quiz questions.");
      } finally { setLoading(false); }
    };
    if (quizId) fetchQuestions();
  }, [quizId]);

  const answeredCount = useMemo(() => questions.filter((question) => question.type === "short-answer" ? Boolean(writtenAnswers[question.id]?.trim()) : Boolean(answers[question.id])).length, [answers, questions, writtenAnswers]);
  const complete = questions.length > 0 && answeredCount === questions.length;

  const handleSubmit = async () => {
    if (!complete) return;
    setSubmitting(true);
    setError(null);
    try {
      const formattedAnswers = questions.map((question) => question.type === "short-answer" ? { question_id: question.id, answer_text: writtenAnswers[question.id] || "" } : { question_id: question.id, choice_id: answers[question.id] });
      const response = await axios.post(`/quizzes/${quizId}/submit/`, { answers: formattedAnswers });
      setResult(response.data.grade);
      setPendingReviewCount(response.data.pending_review_count || 0);
      setAnswerResults(response.data.answer_results || []);
      setSubmitted(true);
    } catch { setError("Failed to submit quiz. Please try again."); } finally { setSubmitting(false); }
  };

  if (loading) return <><Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}><CircularProgress /></Box><JuaCompanion /></>;
  if (error && !questions.length) return <><Box sx={{ maxWidth: 920, mx: "auto", py: 2 }}><Alert severity="error">{error}</Alert></Box><JuaCompanion /></>;
  if (submitted) return <><Box sx={{ maxWidth: 920, mx: "auto", py: { xs: 2, sm: 5 } }}><Card variant="outlined"><CardContent sx={{ p: { xs: 2.5, sm: 4 }, textAlign: "center" }}><CheckCircleOutlineIcon color="success" sx={{ fontSize: 58 }} /><Typography variant="h4" sx={{ mt: 1.5 }}>Quiz submitted</Typography>{result === null ? <Typography color="text.secondary" sx={{ mt: 1 }}>Your responses were submitted and are awaiting teacher review because this quiz has no automatic answer keys.</Typography> : <><Typography variant="h3" color="primary.main" sx={{ mt: 2, fontWeight: 700 }}>{result}%</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>{pendingReviewCount ? `Score from all automatically marked questions. ${pendingReviewCount} response${pendingReviewCount === 1 ? '' : 's'} still need teacher review.` : 'Your score is calculated from the correct answers in the answer repository.'}</Typography></>}</CardContent></Card>{answerResults.length > 0 && <Box sx={{ mt: 2.5 }}><Typography variant="h5" sx={{ mb: 1.25 }}>Answer review</Typography><Stack spacing={1.25}>{answerResults.map((answer, index) => <Card key={answer.question_id} variant="outlined" sx={{ borderLeft: 4, borderLeftColor: answer.needs_review ? "warning.main" : answer.is_correct ? "success.main" : "error.main" }}><CardContent sx={{ p: { xs: 1.5, sm: 2 } }}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}><Box><Typography variant="subtitle2">Question {index + 1}</Typography><Typography sx={{ mt: .25 }}>{answer.question_text}</Typography></Box><Chip size="small" color={answer.needs_review ? "warning" : answer.is_correct ? "success" : "error"} label={answer.needs_review ? "Needs review" : answer.is_correct ? "Correct" : "Incorrect"} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }} /></Stack><Divider sx={{ my: 1.25 }} /><Typography variant="body2" color="text.secondary">Your answer</Typography><Typography sx={{ color: answer.is_correct ? "success.dark" : answer.needs_review ? "text.primary" : "error.main", fontWeight: 600, whiteSpace: "pre-wrap" }}>{answer.answer_text || "No answer provided"}</Typography>{!answer.needs_review && <><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Correct answer</Typography><Typography sx={{ color: "success.dark", fontWeight: 600, whiteSpace: "pre-wrap" }}>{answer.correct_answer}</Typography></>}</CardContent></Card>)}</Stack></Box>}<Box sx={{ textAlign: "center" }}><Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate("/student/quizzes")}>Back to quizzes</Button></Box></Box><JuaCompanion /></>;

  return <><Box sx={{ maxWidth: 920, mx: "auto", pb: 5 }}>
    <Card sx={{ mb: 2, border: 1, borderColor: "divider" }}><CardContent sx={{ p: { xs: 2, sm: 3 } }}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1.5}><Box><Typography variant="h4" sx={{ fontSize: { xs: "1.65rem", sm: "2.125rem" } }}>Take quiz</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Answer every question before submitting your work.</Typography></Box><Stack direction="row" alignItems="center" spacing={1}><Chip color={complete ? "success" : "primary"} label={`${answeredCount} of ${questions.length} answered`} /><Button variant="outlined" color="inherit" onClick={() => setExitDialogOpen(true)}>Exit</Button></Stack></Stack><LinearProgress variant="determinate" value={questions.length ? (answeredCount / questions.length) * 100 : 0} sx={{ mt: 2, height: 8, borderRadius: 5 }} /></CardContent></Card>
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
    {questions.length === 0 ? <Alert severity="info">This quiz does not have questions yet. Please check back later.</Alert> : <Stack spacing={2}>{questions.map((question, index) => <Card key={question.id} variant="outlined"><CardContent sx={{ p: { xs: 1.75, sm: 2.5 } }}><Stack direction="row" gap={1} alignItems="flex-start"><Chip size="small" label={index + 1} color="primary" /><Box sx={{ minWidth: 0 }}><Typography variant="h6" sx={{ whiteSpace: "pre-wrap" }}>{question.text}</Typography><Typography variant="caption" color="text.secondary">{question.type === "short-answer" ? "Written response" : "Choose one answer"}</Typography></Box></Stack><Divider sx={{ my: 1.75 }} />{question.type === "short-answer" ? <TextField id={`quiz-answer-${question.id}`} name={`quiz_answer_${question.id}`} label="Write your answer" fullWidth multiline minRows={5} value={writtenAnswers[question.id] || ""} onChange={(event) => setWrittenAnswers((current) => ({ ...current, [question.id]: event.target.value }))} /> : <FormControl fullWidth><RadioGroup value={answers[question.id] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: Number(event.target.value) }))}>{question.choices.map((choice) => <FormControlLabel key={choice.id} value={choice.id} control={<Radio />} label={choice.text} sx={{ m: 0, mb: .75, px: 1, py: .25, border: 1, borderColor: answers[question.id] === choice.id ? "primary.main" : "divider", borderRadius: 1.5, bgcolor: answers[question.id] === choice.id ? "action.selected" : "transparent", alignItems: "center" }} />)}</RadioGroup></FormControl>}</CardContent></Card>)}</Stack>}
    <Card elevation={3} sx={{ position: "sticky", bottom: 12, mt: 2, border: 1, borderColor: "divider" }}><CardContent sx={{ p: { xs: 1.25, sm: 1.5 } }}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}><Typography variant="body2" color="text.secondary">{complete ? "All answers are ready to submit." : `Answer ${questions.length - answeredCount} more question${questions.length - answeredCount === 1 ? "" : "s"} to submit.`}</Typography><Button variant="contained" onClick={handleSubmit} disabled={submitting || !complete} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>{submitting ? "Submitting…" : "Submit quiz"}</Button></Stack></CardContent></Card>
    <Dialog open={exitDialogOpen} onClose={() => setExitDialogOpen(false)} fullWidth maxWidth="xs"><DialogTitle>Leave quiz?</DialogTitle><DialogContent><Typography>Are you sure you want to leave this page?</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Your answers have not been submitted and will not be saved.</Typography></DialogContent><DialogActions><Button onClick={() => setExitDialogOpen(false)}>Stay on quiz</Button><Button color="error" variant="contained" onClick={() => navigate("/student/quizzes")}>Leave quiz</Button></DialogActions></Dialog>
  </Box><JuaCompanion /></>;
};

export default StudentTakeQuiz;
