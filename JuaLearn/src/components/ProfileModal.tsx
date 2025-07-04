import React, { useRef, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar, TextField, Box
} from '@mui/material';

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
  user: {
    username: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  onProfilePictureChange: (file: File) => void;
  onSave: (updates: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  }) => Promise<void>;
};

const ProfileModal: React.FC<ProfileModalProps> = ({
  open, onClose, user, onProfilePictureChange, onSave,
}) => {
  const [editUser, setEditUser] = useState({
    username: user.username,
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    profilePicture: user.profilePicture,
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setEditUser({
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      profilePicture: user.profilePicture,
    });
  }, [user, open]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imgUrl = URL.createObjectURL(file);
      setEditUser((prev) => ({ ...prev, profilePicture: imgUrl }));
      onProfilePictureChange(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(editUser);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar
            src={editUser.profilePicture}
            sx={{ width: 80, height: 80, mb: 2, cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </Box>
        <TextField
          margin="dense"
          label="Username"
          name="username"
          value={editUser.username}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Email"
          name="email"
          value={editUser.email}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="First Name"
          name="firstName"
          value={editUser.firstName}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Last Name"
          name="lastName"
          value={editUser.lastName}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Role"
          value={user.role}
          fullWidth
          InputProps={{ readOnly: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileModal;
