import React, { useState, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  InputBase,
  Paper,
  Popper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Drawer,
  useMediaQuery,
  ClickAwayListener,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../context/AuthContext";
import ProfileMenu from "./ProfileMenu";
import ProfileModal from "./ProfileModal";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { useThemeMode } from "../context/ThemeContext";
import logoImg from "../assets/logo.jpeg";
import axios from "../api/axios";

const TopBar: React.FC = () => {
  const { user, login, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(user?.profilePicture);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const { mode } = useThemeMode();

  const isMobile = useMediaQuery("(max-width:700px)");

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  let debounceTimer = useRef<number | undefined>(undefined);

  // State to toggle expanded search input on mobile
  const [searchExpanded, setSearchExpanded] = useState(false);

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

  // Colors and styles
  const profileBgColor = mode === "dark" ? "#fff" : "#23395d";
  const profileColor = mode === "dark" ? "#23395d" : "#fff";
  const profileGlow = mode === "dark" ? { boxShadow: "0 0 8px 2px #fff" } : {};
  const searchBg = mode === "dark" ? "#23262d" : "#f3f6fb";
  const searchTextColor = mode === "dark" ? "#fff" : "#23395d";
  const searchBorder = mode === "dark" ? "#3c5687" : "#e3e3e3";

  const mobileMenu = (
    <Box sx={{ width: 220, pt: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column", mb: 2 }}>
        <Avatar
          src={profilePicture || user?.profilePicture || undefined}
          alt={user?.username}
          sx={{
            width: 56,
            height: 56,
            bgcolor: profileBgColor,
            color: profileColor,
            ...profileGlow,
            border: mode === "dark" ? "2px solid #fff" : "2px solid #23395d",
          }}
        >
          {!(profilePicture || user?.profilePicture) &&
            (user?.firstName?.[0]?.toUpperCase() ||
              user?.username?.[0]?.toUpperCase() ||
              "U")}
        </Avatar>
        <Typography sx={{ mt: 1, fontWeight: 600 }}>
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.role}
        </Typography>
      </Box>
      <List>
        <ListItem>
          <NotificationBell />
          <Typography sx={{ ml: 1 }}>Notifications</Typography>
        </ListItem>
        <ListItem
          component="button"
          onClick={() => {
            setProfileOpen(true);
            setDrawerOpen(false);
          }}
        >
          <ListItemText primary="Edit Profile" />
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        color="default"
        elevation={1}
        sx={{
          borderBottom: "1px solid #e3e3e3",
          background: mode === "dark" ? "#23262d" : "#fff",
          zIndex: 1201,
          minHeight: isMobile ? 56 : 72,
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            minHeight: isMobile ? 56 : 72,
            px: isMobile ? 1 : 3,
          }}
        >
          {/* Hamburger on mobile */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          {/* Logo + Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                <Box sx={{ position: "relative", ml: 2, display: "flex", alignItems: "center" }}>
                  {!searchExpanded && (
                    <IconButton
                      onClick={handleSearchIconClick}
                      aria-label="open search"
                      sx={{ color: mode === "dark" ? "#fff" : "#23395d" }}
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
                        minWidth: 140,
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
                        inputProps={{ "aria-label": "search" }}
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
                      inputProps={{ "aria-label": "search" }}
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

          {/* Icons always visible */}
          <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 2 }}>
            <ThemeToggle />
            <NotificationBell />
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }}>
              <Avatar
                src={profilePicture || user?.profilePicture || undefined}
                alt={user?.username}
                sx={{
                  width: isMobile ? 32 : 40,
                  height: isMobile ? 32 : 40,
                  bgcolor: profileBgColor,
                  color: profileColor,
                  ...profileGlow,
                  border: mode === "dark" ? "2px solid #fff" : "2px solid #23395d",
                }}
              >
                {!(profilePicture || user?.profilePicture) &&
                  (user?.firstName?.[0]?.toUpperCase() ||
                    user?.username?.[0]?.toUpperCase() ||
                    "U")}
              </Avatar>
            </IconButton>
            <ProfileMenu
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              onEdit={() => {
                setProfileOpen(true);
                setAnchorEl(null);
              }}
              onLogout={logout}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* MOBILE DRAWER */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ zIndex: 1500 }}
      >
        {mobileMenu}
      </Drawer>

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
          profilePicture: profilePicture || user?.profilePicture,
        }}
        onProfilePictureChange={(file: File) => {
          setProfilePicture(URL.createObjectURL(file));
          setImageFile(file);
        }}
        onSave={async (updates: any) => {
          if (imageFile) updates.profilePicture = imageFile;
          try {
            await fetch("/api/user/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updates),
            });
            login({ ...user, ...updates });
            setProfileOpen(false);
          } catch (error) {
            console.error("Failed to update profile:", error);
          }
        }}
      />
    </>
  );
};

export default TopBar;
