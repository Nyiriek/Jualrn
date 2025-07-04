// src/components/ProfileMenu.tsx
import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

interface Props {
  anchorEl: null | HTMLElement;
  onClose: () => void;
  onEdit: () => void;
  onLogout: () => void;
}
const ProfileMenu: React.FC<Props> = ({ anchorEl, onClose, onEdit, onLogout }) => (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
    <MenuItem onClick={() => { onEdit(); onClose(); }}>Edit Profile</MenuItem>
    <MenuItem onClick={() => { onLogout(); onClose(); }}>Logout</MenuItem>
  </Menu>
);

export default ProfileMenu;
