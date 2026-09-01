import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, FormControl,
  InputLabel, MenuItem, Modal, Select, Stack, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import axios from "../api/axios";
import { LearningResource } from "../components/ResourceRepositoryPicker";

const blankResource = {
  title: "", subject_area: "", topic: "", resource_type: "reading", description: "", content: "",
  source: "", source_reference: "", source_url: "",
};

const TeacherResources = () => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankResource);
  const [saving, setSaving] = useState(false);

  const loadResources = async (search = query) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/learning-resources/", { params: { search: search || undefined } });
      setResources(response.data);
    } catch {
      setError("The resource repository could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadResources(""); }, []);

  const subjects = [...new Set(resources.map((resource) => resource.subject_area).filter(Boolean))].sort();
  const topics = [...new Set(resources.filter((resource) => !subjectFilter || resource.subject_area === subjectFilter).map((resource) => resource.topic).filter(Boolean))].sort();
  const visibleResources = resources.filter((resource) =>
    (!subjectFilter || resource.subject_area === subjectFilter)
    && (!topicFilter || resource.topic === topicFilter)
    && (!typeFilter || resource.resource_type === typeFilter)
  );

  const saveResource = async () => {
    if (!form.title.trim()) {
      setError("A resource title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await axios.post("/learning-resources/", form);
      setResources((current) => [response.data, ...current]);
      setForm(blankResource);
      setOpen(false);
    } catch {
      setError("The resource could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <Box sx={{ maxWidth: 1200, mx: "auto", pb: 3 }}>
    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center"><Typography variant="h4" sx={{ fontSize: { xs: "1.7rem", sm: "2.125rem" } }}>Resource repository</Typography><Chip label={`${resources.length} resources`} size="small" variant="outlined" /></Stack>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>Reusable readings, activities, worksheets, video guides and assessment prompts for building courses and quizzes.</Typography>
      </Box>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>Add resource</Button>
    </Stack>

    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "minmax(220px, 1.3fr) repeat(3, minmax(150px, 1fr)) auto" }, gap: 1, mb: 2 }}>
      <TextField id="repository-search" name="repository_search" label="Search title, topic or subject" fullWidth value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadResources()} />
      <FormControl fullWidth><InputLabel id="repository-filter-subject-label">Subject</InputLabel><Select labelId="repository-filter-subject-label" id="repository-filter-subject" name="repository_filter_subject" label="Subject" value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setTopicFilter(""); }}><MenuItem value="">All subjects</MenuItem>{subjects.map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}</Select></FormControl>
      <FormControl fullWidth disabled={!topics.length}><InputLabel id="repository-filter-topic-label">Topic</InputLabel><Select labelId="repository-filter-topic-label" id="repository-filter-topic" name="repository_filter_topic" label="Topic" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}><MenuItem value="">All topics</MenuItem>{topics.map((topic) => <MenuItem key={topic} value={topic}>{topic}</MenuItem>)}</Select></FormControl>
      <FormControl fullWidth><InputLabel id="repository-filter-type-label">Format</InputLabel><Select labelId="repository-filter-type-label" id="repository-filter-type" name="repository_filter_type" label="Format" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><MenuItem value="">All formats</MenuItem>{["reading", "activity", "video", "worksheet", "assessment"].map((type) => <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>)}</Select></FormControl>
      <Button variant="outlined" onClick={() => loadResources()}>Search</Button>
    </Box>
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
    {loading ? <Box sx={{ minHeight: 240, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : !visibleResources.length ? <Card variant="outlined"><CardContent sx={{ py: 6, textAlign: "center" }}><LibraryBooksOutlinedIcon color="primary" sx={{ fontSize: 42 }} /><Typography sx={{ mt: 1 }}>No resources found.</Typography></CardContent></Card> : (
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        {visibleResources.map((resource) => <Card key={resource.id} variant="outlined" sx={{ minWidth: 0, height: "100%" }}><CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Typography variant="h6" sx={{ wordBreak: "break-word" }}>{resource.title}</Typography><Chip label={resource.resource_type} size="small" variant="outlined" /></Stack>
          {resource.subject_area && <Typography variant="body2" color="primary" sx={{ mt: 1 }}>{resource.subject_area}{resource.topic ? ` · ${resource.topic}` : ""}</Typography>}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{resource.description || "No description provided."}</Typography>
          {resource.content && <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{resource.content}</Typography>}
          {resource.source && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>{resource.source}{resource.source_reference ? ` · ${resource.source_reference}` : ""}</Typography>}
        </CardContent></Card>)}
      </Box>
    )}

    <Modal open={open} onClose={() => !saving && setOpen(false)}><Box sx={{ width: "calc(100% - 32px)", maxWidth: 620, maxHeight: "calc(100vh - 32px)", overflowY: "auto", m: { xs: "16px auto", sm: "6vh auto" }, p: { xs: 2, sm: 3 }, bgcolor: "background.paper", borderRadius: 2, boxShadow: 24 }}>
      <Typography variant="h6">Add a resource</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>Add material your team can link to future courses and quizzes.</Typography>
      <Stack spacing={2}>
        <TextField id="resource-title" name="title" label="Title" required fullWidth value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField id="resource-subject" name="subject_area" label="Subject area" fullWidth value={form.subject_area} onChange={(event) => setForm({ ...form, subject_area: event.target.value })} /><TextField id="resource-topic" name="topic" label="Topic" fullWidth value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} /></Stack>
        <FormControl fullWidth><InputLabel id="new-resource-type-label">Format</InputLabel><Select labelId="new-resource-type-label" id="new-resource-type" name="resource_type" label="Format" value={form.resource_type} onChange={(event) => setForm({ ...form, resource_type: event.target.value })}>{["reading", "activity", "video", "worksheet", "assessment"].map((type) => <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>)}</Select></FormControl>
        <TextField id="resource-description" name="description" label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <TextField id="resource-content" name="content" label="Teaching notes or activity content" fullWidth multiline minRows={5} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
        <TextField id="resource-source" name="source" label="Source" fullWidth value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField id="resource-reference" name="source_reference" label="Page or section reference" fullWidth value={form.source_reference} onChange={(event) => setForm({ ...form, source_reference: event.target.value })} /><TextField id="resource-url" name="source_url" label="Source URL (optional)" fullWidth value={form.source_url} onChange={(event) => setForm({ ...form, source_url: event.target.value })} /></Stack>
        <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="flex-end" spacing={1}><Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={saveResource} disabled={saving}>{saving ? "Saving…" : "Save resource"}</Button></Stack>
      </Stack>
    </Box></Modal>
  </Box>;
};

export default TeacherResources;
