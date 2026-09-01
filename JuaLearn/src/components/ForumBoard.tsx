import { FormEvent, useEffect, useState } from "react";
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Divider,
  MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import axios from "../api/axios";

type Author = { id: number; display_name: string; role: string };
type Comment = { id: number; author: Author; body: string; created_at: string };
type Post = {
  id: number;
  author: Author;
  title: string;
  body: string;
  post_type: "question" | "discussion";
  comments: Comment[];
  created_at: string;
};

const formatDate = (value: string) => new Date(value).toLocaleString(undefined, {
  day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
});

const initials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

const ForumBoard = ({ variant = "forum" }: { variant?: "forum" | "feedback" }) => {
  const isFeedback = variant === "feedback";
  const postEndpoint = isFeedback ? "/feedback-posts/" : "/forum-posts/";
  const commentEndpoint = isFeedback ? "/feedback-comments/" : "/forum-comments/";
  const boardName = isFeedback ? "feedback" : "forum";
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<"question" | "discussion">("question");
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const normalizePost = (post: any): Post => isFeedback
    ? { ...post, post_type: post.feedback_type === "suggestion" ? "question" : "discussion" }
    : post;

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(postEndpoint);
      setPosts(response.data.map(normalizePost));
      setError("");
    } catch {
      setError("The forum could not be loaded. Refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [postEndpoint]);

  const createPost = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Add both a title and your message before posting.");
      return;
    }
    setPosting(true);
    setError("");
    try {
      const response = await axios.post(postEndpoint, isFeedback
        ? { title: title.trim(), body: body.trim(), feedback_type: postType === "question" ? "suggestion" : "feedback" }
        : { title: title.trim(), body: body.trim(), post_type: postType });
      setPosts((current) => [normalizePost(response.data), ...current]);
      setTitle("");
      setBody("");
      setPostType("question");
    } catch {
      setError("Your post could not be published. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const submitReply = async (postId: number) => {
    if (!replyText.trim()) return;
    setReplying(true);
    setError("");
    try {
      const response = await axios.post(commentEndpoint, { post: postId, body: replyText.trim() });
      setPosts((current) => current.map((post) => post.id === postId ? { ...post, comments: [...post.comments, response.data] } : post));
      setReplyText("");
      setReplyFor(null);
    } catch {
      setError("Your reply could not be posted. Please try again.");
    } finally {
      setReplying(false);
    }
  };

  return <Box sx={{ maxWidth: 980, mx: "auto", pb: 4 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1} sx={{ mb: 3 }}>
      <Box><Typography variant="h4" sx={{ fontSize: { xs: "1.7rem", sm: "2.125rem" } }}>{isFeedback ? "Feedback board" : "Community forum"}</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>{isFeedback ? "Share suggestions, report issues, and respond constructively to community feedback." : "Ask questions, share ideas, and help other learners succeed."}</Typography></Box>
      <Button variant="outlined" onClick={loadPosts} disabled={loading}>Refresh</Button>
    </Stack>

    <Card variant="outlined" sx={{ mb: 3 }}><CardContent component="form" onSubmit={createPost} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}><ForumOutlinedIcon color="primary" /><Typography variant="h6">{isFeedback ? "Share feedback" : "Start a conversation"}</Typography></Stack>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField id={`${boardName}-post-title`} name={`${boardName}_post_title`} label={isFeedback ? "Feedback title" : "Topic title"} placeholder={isFeedback ? "What would you like us to improve?" : "What would you like to discuss?"} fullWidth required value={title} onChange={(event) => setTitle(event.target.value)} /><TextField id={`${boardName}-post-type`} name={`${boardName}_post_type`} label="Post type" select value={postType} onChange={(event) => setPostType(event.target.value as "question" | "discussion")} sx={{ minWidth: { sm: 180 } }}><MenuItem value="question">{isFeedback ? "Suggestion" : "Question"}</MenuItem><MenuItem value="discussion">{isFeedback ? "Feedback" : "Discussion"}</MenuItem></TextField></Stack>
        <TextField id={`${boardName}-post-body`} name={`${boardName}_post_body`} label="Your message" placeholder={isFeedback ? "Describe your suggestion or experience…" : "Write your question, answer, or idea…"} fullWidth required multiline minRows={4} value={body} onChange={(event) => setBody(event.target.value)} />
        <Box><Button type="submit" variant="contained" startIcon={<SendOutlinedIcon />} disabled={posting}>{posting ? "Posting…" : isFeedback ? "Share feedback" : "Post to forum"}</Button></Box>
      </Stack>
    </CardContent></Card>

    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
    {loading ? <Box sx={{ minHeight: 240, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      : posts.length === 0 ? <Card variant="outlined"><CardContent sx={{ py: 6, textAlign: "center" }}><QuestionAnswerOutlinedIcon color="disabled" sx={{ fontSize: 42 }} /><Typography variant="h6" sx={{ mt: 1 }}>{isFeedback ? "Be the first to share feedback" : "Be the first to start a discussion"}</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>{isFeedback ? "Other learners and teachers will be able to see and respond to it." : "Your classmates will be able to see and respond to your post."}</Typography></CardContent></Card>
      : <Stack spacing={2}>{posts.map((post) => <Card key={post.id} variant="outlined"><CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start"><Avatar sx={{ bgcolor: post.post_type === "question" ? "primary.main" : "secondary.main", width: 38, height: 38 }}>{initials(post.author.display_name)}</Avatar><Box sx={{ minWidth: 0, flex: 1 }}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={.5}><Box><Typography variant="h6">{post.title}</Typography><Typography variant="body2" color="text.secondary">{post.author.display_name} · {formatDate(post.created_at)}</Typography></Box><Chip size="small" color={post.post_type === "question" ? "primary" : "secondary"} label={post.post_type === "question" ? "Question" : "Discussion"} sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }} /></Stack><Typography component="div" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>{post.body}</Typography></Box></Stack>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1.5}>{post.comments.length === 0 ? <Typography variant="body2" color="text.secondary">No replies yet. Share a helpful answer or thought.</Typography> : post.comments.map((comment) => <Box key={comment.id} sx={{ display: "flex", gap: 1.25 }}><Avatar sx={{ width: 30, height: 30, fontSize: ".75rem", bgcolor: "action.selected", color: "text.primary" }}>{initials(comment.author.display_name)}</Avatar><Box sx={{ bgcolor: "action.hover", borderRadius: 2, px: 1.5, py: 1, flex: 1 }}><Typography variant="subtitle2">{comment.author.display_name} <Typography component="span" variant="caption" color="text.secondary">· {formatDate(comment.created_at)}</Typography></Typography><Typography component="div" variant="body2" sx={{ mt: .25, whiteSpace: "pre-wrap" }}>{comment.body}</Typography></Box></Box>)}</Stack>
        {replyFor === post.id ? <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}><TextField id={`forum-reply-${post.id}`} name={`forum_reply_${post.id}`} label="Write a reply" fullWidth required multiline minRows={2} autoFocus value={replyText} onChange={(event) => setReplyText(event.target.value)} /><Stack direction="row" spacing={1} alignItems="flex-end"><Button onClick={() => { setReplyFor(null); setReplyText(""); }} disabled={replying}>Cancel</Button><Button variant="contained" onClick={() => submitReply(post.id)} disabled={replying || !replyText.trim()}>{replying ? "Posting…" : "Reply"}</Button></Stack></Stack> : <Button size="small" sx={{ mt: 1.5 }} startIcon={<QuestionAnswerOutlinedIcon />} onClick={() => { setReplyFor(post.id); setReplyText(""); }}>Reply</Button>}
      </CardContent></Card>)}</Stack>}
  </Box>;
};

export default ForumBoard;
