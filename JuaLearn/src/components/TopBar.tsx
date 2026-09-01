import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  InputBase,
  Paper,
  useMediaQuery,
  ClickAwayListener,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../context/AuthContext";
import ProfileModal from "./ProfileModal";
import { useThemeMode } from "../context/ThemeContext";
import logoImg from "../assets/logo.jpeg";
import axios from "../api/axios";
import { profilePictureUrl } from "../utils/profilePicture";

const TopBar: React.FC = () => {
  const { user, login, accessToken, refreshToken } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(user?.profilePicture);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const { mode } = useThemeMode();
  const usesStudentTheme = user?.role === "student";
  const usesTeacherTheme = user?.role === "teacher";
  const usesDashboardTheme = usesStudentTheme || usesTeacherTheme;

  const isMobile = useMediaQuery("(max-width:700px)");
  const isCompactNavigation = useMediaQuery("(max-width:900px)");

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  let debounceTimer = useRef<number | undefined>(undefined);

  // State to toggle expanded search input on mobile
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    const openProfile = () => setProfileOpen(true);
    window.addEventListener("jualearn:open-profile", openProfile);
    return () => window.removeEventListener("jualearn:open-profile", openProfile);
  }, []);

  useEffect(() => {
    setProfilePicture(profilePictureUrl(user?.profilePicture));
  }, [user?.profilePicture]);

  useEffect(() => {
    const updateNavigationState = (event: Event) => {
      setNavigationOpen(Boolean((event as CustomEvent<boolean>).detail));
    };
    window.addEventListener("jualearn:navigation-state", updateNavigationState);
    return () => window.removeEventListener("jualearn:navigation-state", updateNavigationState);
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSearchOpen(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = window.setTimeout(() => {
      if (e.target.value.trim().length === 0) {
        setSearchResults([]);
        setSearchOpen(false);
        return;
      }
      setSearchLoading(true);
      axios
        .get(`/search/?q=${encodeURIComponent(e.target.value.trim())}`)
        .then((res) => {
          setSearchResults(res.data?.results || []);
          setSearchLoading(false);
          setSearchOpen(true);
        })
        .catch(() => {
          setSearchResults([]);
          setSearchLoading(false);
          setSearchOpen(true);
        });
    }, 400);
  };

  const handleBlur = () => setTimeout(() => setSearchOpen(false), 120);

  const handleResultClick = (result: any) => {
    alert(`Navigate or view: ${result.name || result.title || result.id}`);
    setSearchOpen(false);
    setSearch("");
    setSearchResults([]);
    if (isMobile) setSearchExpanded(false);
  };

  const handleSearchIconClick = () => {
    setSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleClickAway = () => {
    setSearchExpanded(false);
    setSearch("");
    setSearchResults([]);
  };

  const searchBg = usesStudentTheme ? "var(--student-surface)" : usesTeacherTheme ? "var(--teacher-surface)" : mode === "dark" ? "#23262d" : "#f3f6fb";
  const searchTextColor = usesStudentTheme ? "var(--student-text)" : usesTeacherTheme ? "var(--teacher-text)" : mode === "dark" ? "#fff" : "#23395d";
  const searchBorder = mode === "dark" ? "#3c5687" : "#e3e3e3";

  return (
    <>
      <AppBar
        position="sticky"
        color="default"
        elevation={1}
        sx={{
          borderBottom: "1px solid #e3e3e3",
          background: usesStudentTheme ? "var(--student-surface)" : usesTeacherTheme ? "var(--teacher-surface)" : mode === "dark" ? "#23262d" : "#fff",
          zIndex: 1201,
          minHeight: isMobile ? 56 : 72,
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: isMobile ? 0.5 : 2,
            minHeight: isMobile ? 56 : 72,
            px: isMobile ? 1 : 3,
            pl: isMobile ? 1 : 3,
          }}
        >
          {/* Logo + Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <img
              src={logoImg}
              alt="JuaLearn Logo"
              style={{
                height: isMobile ? 32 : 38,
                width: isMobile ? 32 : 38,
                borderRadius: "10px",
                objectFit: "cover",
              }}
            />
            {!isMobile && (
              <Typography
                variant="h6"
                sx={{
                  color: mode === "dark" ? "#fff" : "#23395d",
                  fontWeight: 600,
                  letterSpacing: 1,
                  userSelect: "none",
                  ml: 0.5,
                }}
              >
                JuaLearn
              </Typography>
            )}

            {/* --- SEARCH BAR --- */}
            {isMobile ? (
              <ClickAwayListener onClickAway={handleClickAway}>
                <Box sx={{ position: "relative", ml: 0, display: "flex", alignItems: "center" }}>
                  {!searchExpanded && (
                    <IconButton
                      onClick={handleSearchIconClick}
                      aria-label="open search"
                      sx={{ color: usesDashboardTheme ? (usesStudentTheme ? "var(--student-text)" : "var(--teacher-text)") : mode === "dark" ? "#fff" : "#23395d" }}
                    >
                      <SearchIcon />
                    </IconButton>
                  )}
                  {searchExpanded && (
                    <Paper
                      elevation={0}
                      sx={{
                        px: 1,
                        display: "flex",
                        alignItems: "center",
                        background: searchBg,
                        border: `1.5px solid ${searchBorder}`,
                        borderRadius: "999px",
                        position: "fixed",
                        top: 10,
                        left: 64,
                        right: 8,
                        zIndex: 1300,
                        height: 36,
                        boxShadow: "none",
                        flexGrow: 1,
                      }}
                    >
                      <InputBase
                        autoFocus
                        placeholder="Search…"
                        value={search}
                        inputRef={searchInputRef}
                        onChange={handleSearchInput}
                        onBlur={() => {}}
                        sx={{
                          ml: 1,
                          flex: 1,
                          color: searchTextColor,
                          fontSize: 14,
                          "& input": { fontWeight: 500 },
                        }}
                        inputProps={{ "aria-label": "search", name: "site-search" }}
                      />
                      <IconButton
                        type="submit"
                        size="small"
                        sx={{ color: searchTextColor }}
                        aria-label="search"
                        disabled
                      >
                        <SearchIcon />
                      </IconButton>
                    </Paper>
                  )}
                </Box>
              </ClickAwayListener>
            ) : (
              <Box sx={{ position: "relative", ml: 2 }}>
                <form onSubmit={(e) => { e.preventDefault(); }} autoComplete="off">
                  <Paper
                    elevation={0}
                    sx={{
                      px: 1,
                      display: "flex",
                      alignItems: "center",
                      background: searchBg,
                      border: `1.5px solid ${searchBorder}`,
                      borderRadius: "999px",
                      minWidth: 220,
                      height: 36,
                      boxShadow: "none",
                    }}
                  >
                    <InputBase
                      placeholder="Search…"
                      value={search}
                      inputRef={searchInputRef}
                      onChange={handleSearchInput}
                      onBlur={handleBlur}
                      sx={{
                        ml: 1,
                        flex: 1,
                        color: searchTextColor,
                        fontSize: 16,
                        "& input": { fontWeight: 500 },
                      }}
                      inputProps={{ "aria-label": "search", name: "site-search" }}
                    />
                    <IconButton
                      type="submit"
                      size="small"
                      sx={{ color: searchTextColor }}
                      aria-label="search"
                      disabled
                    >
                      <SearchIcon />
                    </IconButton>
                  </Paper>
                </form>
              </Box>
            )}
          </Box>

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Account actions live in the navigation drawer. */}
          <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 0.5 : 2, flexShrink: 0 }}>
            {isCompactNavigation && (
              <IconButton
                aria-label={navigationOpen ? "close navigation" : "open navigation"}
                onClick={() => window.dispatchEvent(new Event(navigationOpen ? "jualearn:close-navigation" : "jualearn:open-navigation"))}
                sx={{ color: usesStudentTheme ? "var(--student-text)" : mode === "dark" ? "#fff" : "#23395d" }}
              >
                {navigationOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile modal */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={{
          username: user?.username ?? "",
          email: user?.email ?? "",
          role: user?.role ?? "",
          firstName: user?.firstName,
          lastName: user?.lastName,
          profilePicture: profilePicture || profilePictureUrl(user?.profilePicture),
        }}
        onProfilePictureChange={(file: File) => {
          setProfilePicture(URL.createObjectURL(file));
          setImageFile(file);
        }}
        onSave={async (updates) => {
          if (!user) return;
          try {
            const formData = new FormData();
            formData.append("username", updates.username.trim());
            formData.append("email", updates.email.trim());
            formData.append("first_name", updates.firstName.trim());
            formData.append("last_name", updates.lastName.trim());
            if (imageFile) formData.append("profile_picture", imageFile);
            const response = await axios.patch("/profile/", formData);
            login({
              ...user,
              username: response.data.username,
              email: response.data.email,
              firstName: response.data.first_name || "",
              lastName: response.data.last_name || "",
              profilePicture: profilePictureUrl(response.data.profile_picture) || profilePicture,
              access: accessToken || undefined,
              refresh: refreshToken || undefined,
            });
            setProfilePicture(profilePictureUrl(response.data.profile_picture) || profilePicture);
            setImageFile(undefined);
            setProfileOpen(false);
          } catch (error) {
            console.error("Failed to update profile:", error);
            throw error;
          }
        }}
      />
    </>
  );
};

export default TopBar;
