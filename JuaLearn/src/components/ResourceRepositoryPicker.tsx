import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, InputLabel, MenuItem, Select,
  Stack, TextField, Typography, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import axios from "../api/axios";

export type LearningResource = {
  id: number;
  title: string;
  subject_area: string;
  topic: string;
  resource_type: string;
  description: string;
  content: string;
  source: string;
  source_reference: string;
  source_url?: string;
};

type Props = {
  value: LearningResource[];
  onChange: (resources: LearningResource[]) => void;
  label?: string;
};

const resourceTypes = ["reading", "activity", "video", "worksheet", "assessment"];
const prettyType = (type: string) => type.charAt(0).toUpperCase() + type.slice(1);

const ResourceRepositoryPicker = ({ value, onChange, label = "Browse resource repository" }: Props) => {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadResources = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/learning-resources/");
      setResources(response.data);
    } catch {
      setError("Resources could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !resources.length) loadResources();
  }, [open]);

  const subjects = useMemo(
    () => [...new Set(resources.map((resource) => resource.subject_area).filter(Boolean))].sort(),
    [resources],
  );
  const topics = useMemo(
    () => [...new Set(resources.filter((resource) => !subject || resource.subject_area === subject).map((resource) => resource.topic).filter(Boolean))].sort(),
    [resources, subject],
  );
  const visibleResources = useMemo(() => {
    const term = query.trim().toLowerCase();
    return resources.filter((resource) => {
      const haystack = `${resource.title} ${resource.topic} ${resource.description} ${resource.subject_area}`.toLowerCase();
      return (!term || haystack.includes(term))
        && (!subject || resource.subject_area === subject)
        && (!topic || resource.topic === topic)
        && (!resourceType || resource.resource_type === resourceType);
    });
  }, [query, resources, resourceType, subject, topic]);

  const isSelected = (resource: LearningResource) => value.some((item) => item.id === resource.id);
  const toggleResource = (resource: LearningResource) => {
    onChange(isSelected(resource) ? value.filter((item) => item.id !== resource.id) : [...value, resource]);
  };
  const changeSubject = (nextSubject: string) => {
    setSubject(nextSubject);
    setTopic("");
  };

  return (
    <Box>
      <Button variant="outlined" startIcon={<LibraryBooksOutlinedIcon />} onClick={() => setOpen(true)}>
        {label}
      </Button>
      {value.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1 }}>
          {value.map((resource) => (
            <Chip key={resource.id} label={resource.title} size="small" onDelete={() => onChange(value.filter((item) => item.id !== resource.id))} />
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg" fullScreen={compact}>
        <DialogTitle sx={{ pb: 1 }}>Resource repository</DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Resources are reusable source material. Select several formats from a topic, then turn the best material into separate student lessons.
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "minmax(200px, 1.2fr) repeat(3, minmax(150px, 1fr))" }, gap: 1.25, mb: 2 }}>
            <TextField id="resource-search" name="resource_search" label="Search resources" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth />
            <FormControl fullWidth>
              <InputLabel id="resource-subject-label">Subject</InputLabel>
              <Select labelId="resource-subject-label" id="resource-subject" name="resource_subject" label="Subject" value={subject} onChange={(event) => changeSubject(event.target.value)}>
                <MenuItem value="">All subjects</MenuItem>
                {subjects.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!topics.length}>
              <InputLabel id="resource-topic-label">Topic</InputLabel>
              <Select labelId="resource-topic-label" id="resource-topic" name="resource_topic" label="Topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
                <MenuItem value="">All topics</MenuItem>
                {topics.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="resource-type-label">Format</InputLabel>
              <Select labelId="resource-type-label" id="resource-type" name="resource_type" label="Format" value={resourceType} onChange={(event) => setResourceType(event.target.value)}>
                <MenuItem value="">All formats</MenuItem>
                {resourceTypes.map((item) => <MenuItem key={item} value={item}>{prettyType(item)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">{visibleResources.length} resource{visibleResources.length === 1 ? "" : "s"} available</Typography>
            <Button size="small" onClick={() => { setQuery(""); setSubject(""); setTopic(""); setResourceType(""); }}>Clear filters</Button>
          </Stack>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {loading ? <Box sx={{ py: 6, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.25 }}>
              {visibleResources.map((resource) => {
                const selected = isSelected(resource);
                return <Box key={resource.id} onClick={() => toggleResource(resource)} role="checkbox" aria-checked={selected} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && toggleResource(resource)} sx={{ cursor: "pointer", border: 1, borderColor: selected ? "primary.main" : "divider", bgcolor: selected ? "primary.50" : "background.paper", borderRadius: 2, p: 1.5, transition: "border-color .15s, background-color .15s" }}>
                  <Stack direction="row" alignItems="flex-start" gap={0.5}>
                    <Checkbox checked={selected} tabIndex={-1} disableRipple sx={{ mt: -1, ml: -1 }} />
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Stack direction="row" flexWrap="wrap" gap={0.5} alignItems="center">
                        <Typography fontWeight={700} sx={{ wordBreak: "break-word" }}>{resource.title}</Typography>
                        <Chip size="small" label={prettyType(resource.resource_type)} variant="outlined" />
                      </Stack>
                      <Typography variant="caption" color="primary.main" sx={{ display: "block", mt: 0.5 }}>{resource.subject_area}{resource.topic ? ` · ${resource.topic}` : ""}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{resource.description || "No description provided."}</Typography>
                      {resource.source && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>{resource.source_reference || resource.source}</Typography>}
                    </Box>
                  </Stack>
                </Box>;
              })}
              {!visibleResources.length && <Box sx={{ gridColumn: "1 / -1", py: 5, textAlign: "center" }}><Typography color="text.secondary">No resources match these filters.</Typography></Box>}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}><Typography variant="body2" color="text.secondary">{value.length} selected</Typography><Button variant="contained" onClick={() => setOpen(false)}>Done</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourceRepositoryPicker;
