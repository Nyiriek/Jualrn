import React from "react";
import { IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";

interface HamburgerButtonProps {
  open: boolean;
  onClick: () => void;
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ open, onClick }) => {
  const theme = useTheme();

  return (
    <IconButton
      aria-label="open sidebar menu"
      onClick={onClick}
      sx={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: theme.zIndex.drawer + 10, // above sidebar drawer and topbar
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[3],
        "&:hover": { backgroundColor: theme.palette.action.hover },
      }}
    >
      <MenuIcon />
    </IconButton>
  );
};

export default HamburgerButton;
