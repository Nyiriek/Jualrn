import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, LinearProgress,
  List, ListItemButton, ListItemIcon, ListItemText, Stack, TextField, Typography,
} from "@mui/material";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import WifiOffIcon from "@mui/icons-material/WifiOff";

type Lesson = {
  id: string;
  module: string;
  title: string;
  minutes: number;
  kind: "video" | "reading" | "practice";
  summary: string;
  notes: string[];
  activity?: string;
  question: { prompt: string; options: string[]; answer: number; feedback: string };
  videoUrl?: string;
  videoCredit?: string;
};

const lessons: Lesson[] = [
  {
    id: "objective", module: "1. Plan for learning", title: "Start with one clear learning goal", minutes: 12, kind: "reading",
    summary: "Turn a broad syllabus topic into an observable goal, a short learning activity and evidence that students understood.",
    notes: ["Start with the end: What should learners be able to explain, solve, create or compare by the end of the lesson?", "Use one action word: describe, calculate, identify, justify or analyse. Avoid vague goals such as ‘understand’. ", "Plan one check for understanding before the final five minutes—not only at the end."],
    activity: "Pick a topic you will teach this week. Write a one-sentence objective beginning: ‘By the end of the lesson, students can…’ Then list the evidence you will collect.",
    question: { prompt: "Which objective is most observable?", options: ["Students will understand ecosystems.", "Students will enjoy Biology.", "Students can explain two ways organisms depend on one another.", "Students will listen carefully."], answer: 2, feedback: "A strong objective names an observable action and the learning content." },
  },
  {
    id: "active-learning", module: "1. Plan for learning", title: "Use active learning with simple materials", minutes: 14, kind: "practice",
    summary: "Create participation without relying on devices, printed worksheets or expensive materials.",
    notes: ["Use think–pair–share: give quiet thinking time first, then pairs discuss, then invite a few voices to share.", "Make examples local and familiar: a market, rainfall, crops, transport, football results or household measurements.", "Ask students to show a response with fingers, a short sentence, a drawing or a worked example—not only by raising hands."],
    activity: "Redesign one teacher-talk moment in your next lesson. Add a two-minute pair task and write the exact question students will discuss.",
    question: { prompt: "What makes think–pair–share useful?", options: ["Only confident students answer first.", "Students have time to form an idea before speaking publicly.", "It replaces all direct teaching.", "It needs internet access."], answer: 1, feedback: "Quiet thinking and partner talk help more learners prepare a response." },
  },
  {
    id: "assessment", module: "2. Check and respond", title: "Check understanding while teaching", minutes: 15, kind: "reading",
    summary: "Use quick evidence to decide whether to continue, reteach or give an extension task.",
    notes: ["Ask one focused question linked to the objective. ‘Any questions?’ is too broad to guide your next step.", "Look for patterns, not perfection. If several learners choose the same wrong method, address that misconception for everyone.", "Give feedback that names the next action: ‘Your evidence is relevant; now explain how it supports your conclusion.’"],
    activity: "Create a three-question exit check for one class. Include one recall question, one application question and one ‘what is still unclear?’ question.",
    question: { prompt: "What is the best use of an exit check?", options: ["To punish incomplete work.", "To decide what to revisit or extend in the next lesson.", "To replace every assessment.", "To rank students publicly."], answer: 1, feedback: "Short checks help teachers make the next lesson more responsive." },
  },
  {
    id: "inclusive-video", module: "3. Include every learner", title: "Create an inclusive learning environment", minutes: 16, kind: "video",
    summary: "Build routines that help learners participate safely, including girls, displaced learners and students with disabilities or lower confidence.",
    notes: ["Use names and examples respectfully. Do not ask a learner to represent an entire group or personal experience.", "Offer more than one way to contribute: speak, write, point, draw, work with a partner or demonstrate.", "Set class agreements: listen without laughing at mistakes, ask before helping, and keep personal information private."],
    activity: "Choose one participation routine you will use tomorrow. Write how you will invite quieter learners without putting anyone on the spot.",
    question: { prompt: "Which routine best supports inclusion?", options: ["Call only on the fastest students.", "Require every learner to speak in front of the whole class immediately.", "Give thinking time and allow paired, written or spoken responses.", "Ignore mistakes to avoid discussion."], answer: 2, feedback: "Flexible, low-pressure ways to respond make participation more possible for everyone." },
    videoUrl: "https://www.youtube-nocookie.com/embed/rfWhQUz2J70",
    videoCredit: "Inclusive Education and Children with Disabilities — UNICEF (external video)",
  },
  {
    id: "reflection", module: "4. Put it into practice", title: "Reflect, adapt and try again", minutes: 10, kind: "practice",
    summary: "Use a short reflection cycle to turn a training idea into a classroom improvement.",
    notes: ["After class, record one moment that worked, one learner response that surprised you and one adjustment for next time.", "Keep the next experiment small. Change one question, one activity or one feedback routine—not everything at once.", "Share one useful observation with another teacher and ask what they noticed in a similar lesson."],
    activity: "Write a 3–2–1 reflection: 3 things students did, 2 pieces of evidence you saw, and 1 change you will try next lesson.",
    question: { prompt: "What is a practical next step after reflection?", options: ["Change every part of the lesson at once.", "Choose one small improvement to test in the next lesson.", "Wait until the end of the year.", "Compare learners publicly."], answer: 1, feedback: "Small, specific changes are easier to test and improve." },
  },
];

const progressKey = "jualearn-teacher-training-progress";
const notesKey = "jualearn-teacher-training-notes";

const iconFor = (kind: Lesson["kind"]) => kind === "video" ? <PlayCircleOutlineIcon /> : kind === "practice" ? <AssignmentTurnedInOutlinedIcon /> : <ArticleOutlinedIcon />;

const TeacherTraining = () => {
  const [selectedId, setSelectedId] = useState(lessons[0].id);
  const [completed, setCompleted] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [answer, setAnswer] = useState<number | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

  const lesson = lessons.find((item) => item.id === selectedId) || lessons[0];
  const moduleGroups = useMemo(() => Array.from(new Set(lessons.map((item) => item.module))).map((module) => ({ module, lessons: lessons.filter((item) => item.module === module) })), []);
  const progress = Math.round((completed.length / lessons.length) * 100);
  const selectedIndex = lessons.findIndex((item) => item.id === lesson.id);

  useEffect(() => {
    try {
      const savedProgress = JSON.parse(localStorage.getItem(progressKey) || "[]");
      const savedNotes = JSON.parse(localStorage.getItem(notesKey) || "{}");
      if (Array.isArray(savedProgress)) setCompleted(savedProgress);
      if (savedNotes && typeof savedNotes === "object") setNotes(savedNotes);
    } catch {
      localStorage.removeItem(progressKey); localStorage.removeItem(notesKey);
    }
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  useEffect(() => { setAnswer(null); }, [selectedId]);

  const updateNotes = (value: string) => {
    const next = { ...notes, [lesson.id]: value };
    setNotes(next); localStorage.setItem(notesKey, JSON.stringify(next));
  };
  const markComplete = () => {
    const next = completed.includes(lesson.id) ? completed : [...completed, lesson.id];
    setCompleted(next); localStorage.setItem(progressKey, JSON.stringify(next));
  };
  const downloadTemplate = () => {
    const text = `JuaLearn Teacher Training — ${lesson.title}\n\nLearning goal:\n\nActivity / learner task:\n\nQuick check for understanding:\n\nWhat I noticed:\n\nOne adjustment for next lesson:\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a"); link.href = url; link.download = "jualearn-teaching-reflection-template.txt"; link.click(); URL.revokeObjectURL(url);
  };
  const goNext = () => setSelectedId(lessons[Math.min(selectedIndex + 1, lessons.length - 1)].id);

  return <Box sx={{ maxWidth: 1320, mx: "auto" }}>
    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h4">Teacher Training</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Practical, self-paced professional learning for secondary classrooms.</Typography></Box>
      <Box sx={{ minWidth: { xs: "100%", md: 260 } }}><Stack direction="row" justifyContent="space-between" sx={{ mb: .5 }}><Typography variant="body2" fontWeight={700}>{completed.length} of {lessons.length} lessons complete</Typography><Typography variant="body2" color="text.secondary">{progress}%</Typography></Stack><LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 99 }} /></Box>
    </Stack>

    {!online && <Alert severity="info" icon={<WifiOffIcon />} sx={{ mb: 2 }}>You are offline. Training notes, activities and your saved reflections still work; the external video needs a connection.</Alert>}

    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "290px minmax(0, 1fr)" }, gap: 2.5, alignItems: "start" }}>
      <Card variant="outlined" sx={{ position: { lg: "sticky" }, top: { lg: 88 }, maxHeight: { lg: "calc(100vh - 110px)" }, overflowY: "auto" }}>
        <CardContent sx={{ p: 1 }}><Typography variant="subtitle2" sx={{ px: 1, pt: 1, pb: .5 }}>Course content</Typography>
          {moduleGroups.map((group) => <Box key={group.module} sx={{ mb: 1 }}><Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 1, py: .5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{group.module}</Typography><List disablePadding>{group.lessons.map((item) => <ListItemButton key={item.id} selected={item.id === lesson.id} onClick={() => setSelectedId(item.id)} sx={{ borderRadius: 1, py: .75 }}><ListItemIcon sx={{ minWidth: 34, color: completed.includes(item.id) ? "success.main" : "primary.main" }}>{completed.includes(item.id) ? <CheckCircleIcon fontSize="small" /> : iconFor(item.kind)}</ListItemIcon><ListItemText primary={item.title} secondary={`${item.minutes} min · ${item.kind === "video" ? "Video & notes" : item.kind === "practice" ? "Practice" : "Reading"}`} primaryTypographyProps={{ variant: "body2", fontWeight: item.id === lesson.id ? 700 : 500 }} secondaryTypographyProps={{ variant: "caption" }} /></ListItemButton>)}</List></Box>)}
        </CardContent>
      </Card>

      <Stack spacing={2.5}>
        <Card><CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start"><Box><Chip size="small" icon={iconFor(lesson.kind)} label={`${lesson.module} · ${lesson.minutes} min`} sx={{ mb: 1.5 }} /><Typography variant="h5">{lesson.title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{lesson.summary}</Typography></Box>{completed.includes(lesson.id) && <Chip icon={<CheckCircleIcon />} label="Complete" color="success" size="small" />}</Stack>
          {lesson.videoUrl && <Box sx={{ mt: 3 }}><Box sx={{ position: "relative", aspectRatio: "16 / 9", bgcolor: "common.black", borderRadius: 2, overflow: "hidden" }}>{online ? <iframe width="100%" height="100%" src={lesson.videoUrl} title={lesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ border: 0, position: "absolute", inset: 0 }} /> : <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", color: "common.white", p: 2, textAlign: "center" }}><WifiOffIcon /><Typography sx={{ mt: 1 }}>Video is available when you are online.</Typography></Stack>}</Box><Typography variant="caption" color="text.secondary" sx={{ mt: .5, display: "block" }}>{lesson.videoCredit}. Use the notes below if video access is limited.</Typography></Box>}
        </CardContent></Card>

        <Card variant="outlined"><CardContent sx={{ p: { xs: 2, sm: 3 } }}><Typography variant="h6">Teaching notes</Typography><Typography color="text.secondary" variant="body2" sx={{ mt: .5 }}>Read these first, or use them as a low-data alternative to video.</Typography><Box component="ol" sx={{ pl: 2.5, mb: 0 }}>{lesson.notes.map((note) => <Box component="li" key={note} sx={{ mt: 1.25 }}><Typography>{note}</Typography></Box>)}</Box></CardContent></Card>

        {lesson.activity && <Card variant="outlined"><CardContent sx={{ p: { xs: 2, sm: 3 } }}><Stack direction="row" gap={1} alignItems="center"><AssignmentTurnedInOutlinedIcon color="primary" /><Typography variant="h6">Try it in your classroom</Typography></Stack><Typography sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>{lesson.activity}</Typography><Button startIcon={<DownloadOutlinedIcon />} sx={{ mt: 1.5 }} onClick={downloadTemplate}>Download reflection template</Button></CardContent></Card>}

        <Card variant="outlined"><CardContent sx={{ p: { xs: 2, sm: 3 } }}><Typography variant="h6">Quick check</Typography><Typography sx={{ mt: 1 }}>{lesson.question.prompt}</Typography><Stack spacing={1} sx={{ mt: 2 }}>{lesson.question.options.map((option, index) => <Button key={option} variant={answer === index ? "contained" : "outlined"} color={answer === index && index !== lesson.question.answer ? "error" : "primary"} onClick={() => setAnswer(index)} sx={{ justifyContent: "flex-start", textAlign: "left" }}>{String.fromCharCode(65 + index)}. {option}</Button>)}</Stack>{answer !== null && <Alert severity={answer === lesson.question.answer ? "success" : "info"} sx={{ mt: 2 }}>{answer === lesson.question.answer ? `Correct. ${lesson.question.feedback}` : `Not quite. ${lesson.question.feedback}`}</Alert>}</CardContent></Card>

        <Card variant="outlined"><CardContent sx={{ p: { xs: 2, sm: 3 } }}><Typography variant="h6">My private teaching notes</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Write a plan, observation or question. This stays on this device and is saved automatically.</Typography><TextField id="training-reflection" name="training_reflection" multiline minRows={5} fullWidth value={notes[lesson.id] || ""} onChange={(event) => updateNotes(event.target.value)} placeholder="What will I try? What did my learners do? What will I change next time?" sx={{ mt: 2 }} /></CardContent></Card>

        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}><Button variant={completed.includes(lesson.id) ? "outlined" : "contained"} startIcon={<CheckCircleIcon />} onClick={markComplete} disabled={completed.includes(lesson.id)}>{completed.includes(lesson.id) ? "Lesson completed" : "Mark lesson complete"}</Button><Button endIcon={<NavigateNextIcon />} onClick={goNext} disabled={selectedIndex === lessons.length - 1}>Next lesson</Button></Stack>
      </Stack>
    </Box>
  </Box>;
};

export default TeacherTraining;
