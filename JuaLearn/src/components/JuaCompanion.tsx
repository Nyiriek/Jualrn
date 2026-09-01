import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Alert, Box, Button, CircularProgress, Divider, Drawer, Fab, FormControl, IconButton,
  InputLabel, List, ListItem, ListItemButton, ListItemText, MenuItem, Paper, Popper, Select, Stack, TextField, Tooltip, Typography, useMediaQuery,
} from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useAuth } from "../context/AuthContext";
import {
  chatWithCompanion, deleteConversation, getConversation, getConversations,
  type CompanionConversation, type CompanionMessage,
} from "../api/aiCompanion";
import api from "../api/axios";

type Subject = { id: number; name: string };
type Lesson = { id: number; title: string; subject: number };
type ContextType = "subject" | "lesson" | "quiz" | "assignment";

const roleCopy = {
  student: {
    button: "Ask Jua", title: "Jua Companion", subtitle: "Your study helper", 
    prompts: ["Explain this lesson in simpler words.", "Give me an example.", "Create three practice questions.", "Help me understand where I went wrong."],
  },
  teacher: {
    button: "Ask Jua", title: "Jua Teaching Companion", subtitle: "Plan and teach with confidence",
    prompts: ["Help me plan a short lesson.", "Simplify this topic for my class.", "Create three practice questions.", "Suggest a formative assessment."],
  },
  admin: {
    button: "Ask Jua", title: "Jua Platform Companion", subtitle: "Curriculum and platform support",
    prompts: ["Summarise this course for review.", "Suggest a content publishing checklist.", "How can I organise this subject?", "Create a teacher onboarding checklist."],
  },
} as const;

const cacheKey = (userId?: number) => `jua-companion-conversations-${userId || "guest"}`;
const launcherPositionKey = (userId?: number) => `jua-companion-student-launcher-position-${userId || "guest"}`;
const welcomeKey = (userId?: number) => `jua-companion-welcome-${userId || "guest"}`;

const clampLauncherPosition = (position: { x: number; y: number }, width: number, height = 56) => ({
  x: typeof window === "undefined" ? position.x : Math.min(Math.max(8, position.x), Math.max(8, window.innerWidth - width - 8)),
  y: typeof window === "undefined" ? position.y : Math.min(Math.max(8, position.y), Math.max(8, window.innerHeight - height - 8)),
});

const defaultLauncherPosition = (width = 144) => clampLauncherPosition(
  { x: typeof window === "undefined" ? 16 : window.innerWidth - width - 8, y: typeof window === "undefined" ? 16 : window.innerHeight - 64 },
  width,
);

const routeContext = (path: string): { context_type?: ContextType; context_id?: number } => {
  const patterns: Array<[RegExp, ContextType]> = [
    [/\/subject\/(\d+)/, "subject"], [/\/quizzes\/(\d+)/, "quiz"], [/\/assignments\/(\d+)/, "assignment"],
  ];
  for (const [pattern, context_type] of patterns) {
    const match = path.match(pattern);
    if (match) return { context_type, context_id: Number(match[1]) };
  }
  return {};
};

export default function JuaCompanion() {
  const { user, accessToken, isAuthReady } = useAuth();
  const location = useLocation();
  const role = user?.role || "student";
  const isSmallScreen = useMediaQuery("(max-width:599px)");
  const copy = roleCopy[role];
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<CompanionConversation[]>([]);
  const [conversation, setConversation] = useState<CompanionConversation | null>(null);
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [lessonId, setLessonId] = useState<number | "">("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [retryPayload, setRetryPayload] = useState<{ text: string; clientId: string } | null>(null);
  const [launcherPosition, setLauncherPosition] = useState(defaultLauncherPosition);
  const [showWelcome, setShowWelcome] = useState(false);
  const [viewportVersion, setViewportVersion] = useState(0);
  const launcherDragState = useRef<{ pointerId: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const launcherPositionRef = useRef(launcherPosition);
  const ignoreLauncherClick = useRef(false);
  const launcherElementRef = useRef<HTMLButtonElement | null>(null);
  const activeContext = useMemo(() => routeContext(location.pathname), [location.pathname]);
  const visibleLessons = lessons.filter((lesson) => !subjectId || lesson.subject === subjectId);
  const canRequest = Boolean(isAuthReady && user && accessToken);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  useEffect(() => {
    if (role !== "student") return;
    const launcherWidth = isSmallScreen ? 56 : 144;
    const fallback = defaultLauncherPosition(launcherWidth);
    try {
      const saved = JSON.parse(localStorage.getItem(launcherPositionKey(user?.id)) || "null");
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        const visiblePosition = clampLauncherPosition(saved, launcherWidth);
        launcherPositionRef.current = visiblePosition;
        setLauncherPosition(visiblePosition);
      } else {
        launcherPositionRef.current = fallback;
        setLauncherPosition(fallback);
      }
    } catch {
      localStorage.removeItem(launcherPositionKey(user?.id));
      launcherPositionRef.current = fallback;
      setLauncherPosition(fallback);
    }
  }, [isSmallScreen, role, user?.id]);

  useEffect(() => {
    const keepCompanionVisible = () => {
      setViewportVersion((value) => value + 1);
      if (role !== "student") return;
      const width = window.innerWidth <= 599 ? 56 : 144;
      const visiblePosition = clampLauncherPosition(launcherPositionRef.current, width);
      launcherPositionRef.current = visiblePosition;
      setLauncherPosition(visiblePosition);
    };
    window.addEventListener("resize", keepCompanionVisible);
    return () => window.removeEventListener("resize", keepCompanionVisible);
  }, [role]);

  useEffect(() => {
    if (role !== "student" || !user?.id || !isAuthReady) {
      setShowWelcome(false);
      return;
    }
    if (!sessionStorage.getItem(welcomeKey(user.id))) {
      sessionStorage.setItem(welcomeKey(user.id), "shown");
      setShowWelcome(true);
    }
  }, [isAuthReady, role, user?.id]);

  useEffect(() => {
    if (!showWelcome) return;
    const timeout = window.setTimeout(() => setShowWelcome(false), 6500);
    return () => window.clearTimeout(timeout);
  }, [showWelcome]);

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey(user?.id));
    if (cached) {
      try { setConversations(JSON.parse(cached)); } catch { localStorage.removeItem(cacheKey(user?.id)); }
    }
    // Load live data only when the companion is opened and a session is available.
    // This prevents unnecessary 401s while the application is restoring a session.
    if (!open || !online || !canRequest) return;
    getConversations().then((response) => {
      setConversations(response.data);
      localStorage.setItem(cacheKey(user?.id), JSON.stringify(response.data));
    }).catch(() => undefined);
    Promise.all([api.get("/subjects/"), api.get("/lessons/")]).then(([subjectResponse, lessonResponse]) => {
      setSubjects(subjectResponse.data);
      setLessons(lessonResponse.data);
    }).catch(() => undefined);
  }, [open, online, canRequest, user?.id]);

  useEffect(() => {
    if (activeContext.context_type === "subject") setSubjectId(activeContext.context_id || "");
  }, [activeContext.context_id, activeContext.context_type]);

  const remember = (next: CompanionConversation[]) => {
    setConversations(next);
    localStorage.setItem(cacheKey(user?.id), JSON.stringify(next));
  };

  const loadConversation = async (id: number) => {
    if (!canRequest) { setError("Your session has expired. Please sign in again to load this conversation."); return; }
    setHistoryLoading(true); setError("");
    try {
      const response = await getConversation(id);
      setConversation(response.data);
      setMessages(response.data.messages || []);
      if (response.data.subject) setSubjectId(response.data.subject);
      if (response.data.lesson) setLessonId(response.data.lesson);
    } catch { setError("This conversation could not be loaded. You can still start a new one."); }
    finally { setHistoryLoading(false); }
  };

  const startNew = () => { setConversation(null); setMessages([]); setDraft(""); setError(""); setRetryPayload(null); };

  const send = async (text = draft, clientId = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`) => {
    const cleanText = text.trim();
    if (!cleanText || loading) return;
    if (!canRequest) { setError("Your session has expired. Please sign in again before sending a message."); return; }
    if (!online) { setError("You are offline. Previous conversations are available, but new AI responses need an internet connection."); return; }
    setLoading(true); setError(""); setRetryPayload(null);
    try {
      const response = await chatWithCompanion({
        message: cleanText,
        client_message_id: clientId,
        conversation_id: conversation?.id,
        subject_id: subjectId || undefined,
        lesson_id: lessonId || undefined,
        context_type: activeContext.context_type,
        context_id: activeContext.context_id,
      });
      const updated = response.data.conversation;
      setConversation(updated);
      setMessages(updated.messages || [...messages, { id: -1, role: "user", content: cleanText, created_at: new Date().toISOString() }, response.data.message]);
      remember([updated, ...conversations.filter((item) => item.id !== updated.id)]);
      setDraft("");
    } catch (requestError: any) {
      setRetryPayload({ text: cleanText, clientId });
      setError(requestError.response?.data?.detail || "Jua Companion could not reply. Please try again.");
    } finally { setLoading(false); }
  };

  const removeConversation = async (id: number) => {
    try {
      await deleteConversation(id);
      const next = conversations.filter((item) => item.id !== id);
      remember(next);
      if (conversation?.id === id) startNew();
    } catch { setError("Could not delete this conversation. Please try again."); }
  };

  const moveLauncher = (x: number, y: number, width: number, height: number, save = false) => {
    const next = clampLauncherPosition({ x, y }, width, height);
    launcherPositionRef.current = next;
    setLauncherPosition(next);
    if (save) localStorage.setItem(launcherPositionKey(user?.id), JSON.stringify(next));
  };

  const startLauncherDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (role !== "student") return;
    const rect = event.currentTarget.getBoundingClientRect();
    launcherDragState.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const dragLauncher = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = launcherDragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (Math.abs(event.clientX - (launcherPositionRef.current.x + drag.offsetX)) > 3 || Math.abs(event.clientY - (launcherPositionRef.current.y + drag.offsetY)) > 3) drag.moved = true;
    moveLauncher(event.clientX - drag.offsetX, event.clientY - drag.offsetY, rect.width, rect.height);
  };

  const finishLauncherDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = launcherDragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    launcherDragState.current = null;
    if (drag.moved) {
      ignoreLauncherClick.current = true;
      localStorage.setItem(launcherPositionKey(user?.id), JSON.stringify(launcherPositionRef.current));
    }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const studentPanelPosition = useMemo(() => {
    if (typeof window === "undefined") return { x: 8, y: 8 };
    const panelWidth = Math.min(360, window.innerWidth - 16);
    const panelHeight = isSmallScreen ? Math.min(520, window.innerHeight - 88) : Math.min(560, window.innerHeight - 16);
    const maxX = Math.max(8, window.innerWidth - panelWidth - 8);
    const maxY = Math.max(8, window.innerHeight - panelHeight - 8);
    const x = Math.min(Math.max(8, launcherPosition.x), maxX);
    const above = launcherPosition.y - panelHeight - 12;
    const below = launcherPosition.y + 60;
    return { x, y: above >= 8 ? above : Math.min(Math.max(8, below), maxY) };
  }, [isSmallScreen, launcherPosition, viewportVersion]);

  const panelContent = <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: (theme) => theme.palette.mode === "dark" ? "#222731" : "#ffffff", opacity: 1, backgroundImage: "none" }}>
    <Box sx={{ p: 2, bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", gap: 1 }}>
      <SmartToyOutlinedIcon /><Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={700}>{copy.title}</Typography><Typography variant="caption" sx={{ opacity: .88, display: "block" }}>{copy.subtitle}</Typography></Box>
      <IconButton onClick={() => setOpen(false)} aria-label="close Jua Companion" sx={{ color: "inherit" }}><CloseIcon /></IconButton>
    </Box>
    <Alert severity="info" icon={false} sx={{ borderRadius: 0, fontSize: "0.78rem" }}>AI responses may be wrong. Check important information with your teacher.</Alert>
    {!online && <Alert severity="warning" sx={{ borderRadius: 0 }}>Offline: you can read saved conversations, but cannot send a new message.</Alert>}
    <Box sx={{ p: 1.5, display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
      <FormControl size="small"><InputLabel id="jua-subject-label">Subject</InputLabel><Select labelId="jua-subject-label" id="jua-subject" name="jua_subject" value={subjectId} label="Subject" onChange={(event) => { setSubjectId(event.target.value === "" ? "" : Number(event.target.value)); setLessonId(""); }}><MenuItem value="">No subject selected</MenuItem>{subjects.map((subject) => <MenuItem key={subject.id} value={subject.id}>{subject.name}</MenuItem>)}</Select></FormControl>
      <Button startIcon={<AddIcon />} onClick={startNew}>New</Button>
      <FormControl size="small" sx={{ gridColumn: "1 / -1" }} disabled={!visibleLessons.length}><InputLabel id="jua-lesson-label">Lesson (optional)</InputLabel><Select labelId="jua-lesson-label" id="jua-lesson" name="jua_lesson" value={lessonId} label="Lesson (optional)" onChange={(event) => setLessonId(event.target.value === "" ? "" : Number(event.target.value))}><MenuItem value="">No lesson selected</MenuItem>{visibleLessons.map((lesson) => <MenuItem key={lesson.id} value={lesson.id}>{lesson.title}</MenuItem>)}</Select></FormControl>
    </Box>
    <Divider />
    <Box sx={{ flex: 1, overflowY: "auto", p: 2 }} aria-live="polite">
      {historyLoading && <Box sx={{ display: "grid", placeItems: "center", minHeight: 120 }}><CircularProgress size={28} /></Box>}
      {!historyLoading && !messages.length && <Stack spacing={1.25}><Typography color="text.secondary">Choose a prompt or ask a question about the learning material you can access.</Typography>{copy.prompts.map((prompt) => <Button key={prompt} variant="outlined" size="small" sx={{ justifyContent: "flex-start", textAlign: "left" }} onClick={() => setDraft(prompt)}>{prompt}</Button>)}<Typography variant="caption" color="text.secondary">Conversations are private to your account. You can delete them at any time.</Typography></Stack>}
      <Stack spacing={1.25}>{messages.map((message) => <Box key={message.id} sx={{ alignSelf: message.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", px: 1.5, py: 1, borderRadius: 2, bgcolor: message.role === "user" ? "primary.main" : "background.paper", color: message.role === "user" ? "primary.contrastText" : "text.primary", border: message.role === "assistant" ? "1px solid" : "none", borderColor: "divider", whiteSpace: "pre-wrap" }}>{message.content}</Box>)}</Stack>
      {loading && <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}><CircularProgress size={18} /><Typography variant="body2" color="text.secondary">Jua is thinking…</Typography></Box>}
      {error && <Alert severity="error" sx={{ mt: 2 }} action={retryPayload ? <Button color="inherit" size="small" onClick={() => send(retryPayload.text, retryPayload.clientId)}>Retry</Button> : undefined}>{error}</Alert>}
      {conversations.length > 0 && !messages.length && <Box sx={{ mt: 3 }}><Typography variant="subtitle2" sx={{ mb: 1 }}>Previous conversations</Typography><List dense disablePadding>{conversations.slice(0, 8).map((item) => <ListItem key={item.id} disablePadding secondaryAction={<IconButton edge="end" aria-label={`delete ${item.title}`} onClick={(event) => { event.stopPropagation(); removeConversation(item.id); }}><DeleteOutlineIcon fontSize="small" /></IconButton>}><ListItemButton onClick={() => loadConversation(item.id)}><ListItemText primary={item.title} secondary={item.subject_name || "General support"} primaryTypographyProps={{ noWrap: true }} /></ListItemButton></ListItem>)}</List></Box>}
    </Box>
    <Box component="form" onSubmit={(event) => { event.preventDefault(); send(); }} sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: (theme) => theme.palette.mode === "dark" ? "#222731" : "#ffffff", opacity: 1 }}>
      <TextField id="jua-companion-message" name="jua_companion_message" aria-label="Message for Jua Companion" fullWidth multiline maxRows={4} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask Jua Companion…" inputProps={{ maxLength: 1200 }} disabled={loading || !online} helperText={`${draft.length}/1200`} />
      <Button type="submit" variant="contained" fullWidth endIcon={<SendIcon />} disabled={!draft.trim() || loading || !online} sx={{ mt: 1 }}>Send</Button>
    </Box>
  </Box>;

  return <>
    <Tooltip title={copy.title} placement="left">
      <Fab ref={launcherElementRef} color="primary" variant={role === "student" && isSmallScreen ? "circular" : "extended"} onPointerDown={startLauncherDrag} onPointerMove={dragLauncher} onPointerUp={finishLauncherDrag} onPointerCancel={finishLauncherDrag} onClick={() => { if (ignoreLauncherClick.current) { ignoreLauncherClick.current = false; return; } setShowWelcome(false); setOpen(true); }} aria-label={`open ${copy.title}`} sx={role === "student" ? { position: "fixed", left: launcherPosition.x, top: launcherPosition.y, zIndex: 1200, px: isSmallScreen ? 0 : 2, gap: 1, minWidth: isSmallScreen ? 56 : undefined, width: isSmallScreen ? 56 : undefined, height: isSmallScreen ? 56 : undefined, cursor: "grab", touchAction: "none" } : { position: "fixed", right: { xs: 16, sm: 24 }, bottom: { xs: 16, sm: 24 }, zIndex: 1200, px: 2, gap: 1 }}>
        <SmartToyOutlinedIcon />{!(role === "student" && isSmallScreen) && copy.button}
      </Fab>
    </Tooltip>
    {role === "student" && <Popper open={showWelcome} anchorEl={launcherElementRef.current} placement="top-start" sx={{ zIndex: 1301 }} modifiers={[{ name: "offset", options: { offset: [0, 10] } }]}>
      <Paper elevation={8} sx={{ maxWidth: 230, p: 1.25, borderRadius: 2, border: "1px solid", borderColor: "primary.light" }}>
        <Stack direction="row" gap={1} alignItems="flex-start"><SmartToyOutlinedIcon color="primary" fontSize="small" /><Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>Hi, I&apos;m Jua, your AI companion.</Typography><IconButton aria-label="dismiss Jua welcome" size="small" onClick={() => setShowWelcome(false)} sx={{ mt: -.5, mr: -.5 }}><CloseIcon fontSize="small" /></IconButton></Stack>
      </Paper>
    </Popper>}
    {role === "student" ? open && <Box role="dialog" aria-label="Jua Companion" sx={{ position: "fixed", left: studentPanelPosition.x, top: studentPanelPosition.y, width: "min(360px, calc(100vw - 16px))", height: { xs: "min(520px, calc(100vh - 88px))", sm: "min(560px, calc(100vh - 16px))" }, maxHeight: { xs: "calc(100vh - 88px)", sm: "calc(100vh - 16px)" }, zIndex: 1300, border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", boxShadow: 12, bgcolor: (theme) => theme.palette.mode === "dark" ? "#222731" : "#ffffff", opacity: 1, backgroundImage: "none" }}>{panelContent}</Box> : <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 430 }, maxWidth: "100%" } }}>{panelContent}</Drawer>}
  </>;
}
