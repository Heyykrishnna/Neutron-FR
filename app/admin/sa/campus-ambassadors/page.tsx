"use client";

import { useMemo, useState } from "react";
import { useUsers } from "@/src/hooks/api/useUsers";
import {
  CampusAmbassador,
  useCampusAmbassadors,
  useUpdateCampusAmbassadors,
} from "@/src/hooks/api/useCampusAmbassadors";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Search, Users, BadgeCheck, Link2, RefreshCw } from "lucide-react";

function DarkDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.98), rgba(6,6,6,0.98))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4,
          color: "#fff",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, letterSpacing: "0.04em" }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function CampusAmbassadorsPage() {
  const [search, setSearch] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: campusAmbassadors = [], isLoading } = useCampusAmbassadors();
  const { data: users = [] } = useUsers(
    { limit: 500, includeSuspended: false, includeRevoked: false },
    { staleTime: 60_000 },
  );
  const updateMutation = useUpdateCampusAmbassadors();

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const eligibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users
      .filter((user: any) => user?.emailVerified !== false)
      .filter((user: any) => !user?.isSuspended && !user?.isRevoked)
      .filter((user: any) => {
        if (!query) return true;
        return [user?.name, user?.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });
  }, [search, users]);

  const openManageDialog = () => {
    setSelectedIds(
      campusAmbassadors
        .map((user: CampusAmbassador) => user.id)
        .filter(Boolean),
    );
    setManageOpen(true);
  };

  const closeManageDialog = () => {
    setManageOpen(false);
    setSearch("");
  };

  const toggleUser = (userId: string) => {
    setSelectedIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const handleUpdate = async () => {
    await updateMutation.mutateAsync({ userIds: selectedIds });
    closeManageDialog();
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 1400 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, letterSpacing: "-0.04em" }}
          >
            Campus Ambassadors
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.55)", mt: 1 }}
          >
            Track referrals, leaderboard counts, and ambassador assignments.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={() => window.location.reload()}
            sx={{
              color: "white",
              borderColor: "rgba(255,255,255,0.16)",
              borderRadius: 3,
              textTransform: "none",
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Users size={16} />}
            onClick={openManageDialog}
            sx={{
              background: "linear-gradient(135deg, #ff8b5c, #ffb36b)",
              color: "#121212",
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            Manage CAs
          </Button>
        </Stack>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search eligible users"
            InputProps={{
              startAdornment: (
                <Search size={16} style={{ marginRight: 10, opacity: 0.6 }} />
              ),
            }}
            sx={{
              input: { color: "white" },
              "& .MuiOutlinedInput-root": {
                color: "white",
                borderRadius: 3,
                background: "rgba(255,255,255,0.03)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(255,179,107,0.7)",
                },
              },
            }}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ p: 4 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
              Loading...
            </Typography>
          </Box>
        ) : campusAmbassadors.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
              No campus ambassadors yet.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Box
              component="table"
              sx={{ width: "100%", borderCollapse: "collapse" }}
            >
              <Box component="thead">
                <Box
                  component="tr"
                  sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {[
                    "Name",
                    "Email",
                    "Referral Code",
                    "Total Registrations",
                  ].map((heading) => (
                    <Box
                      key={heading}
                      component="th"
                      sx={{
                        textAlign: "left",
                        p: 2,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.16em",
                        color: "rgba(255,255,255,0.42)",
                        fontWeight: 800,
                      }}
                    >
                      {heading}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {campusAmbassadors.map((ambassador) => (
                  <Box
                    component="tr"
                    key={ambassador.id}
                    sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <Box component="td" sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <BadgeCheck size={16} color="#ffb36b" />
                        <Typography sx={{ fontWeight: 700 }}>
                          {ambassador.name || "Unnamed"}
                        </Typography>
                      </Stack>
                    </Box>
                    <Box
                      component="td"
                      sx={{ p: 2, color: "rgba(255,255,255,0.72)" }}
                    >
                      {ambassador.email || "—"}
                    </Box>
                    <Box component="td" sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Link2 size={14} color="rgba(255,255,255,0.45)" />
                        <Typography
                          sx={{
                            color: "#ffb36b",
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                          }}
                        >
                          {ambassador.referralCode || "—"}
                        </Typography>
                      </Stack>
                    </Box>
                    <Box component="td" sx={{ p: 2 }}>
                      <Typography sx={{ fontWeight: 800 }}>
                        {ambassador.totalRegistrations || 0}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      <DarkDialog
        open={manageOpen}
        onClose={closeManageDialog}
        title="Manage Campus Ambassadors"
      >
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.65)", mb: 1.5 }}>
            Select the users who should have the CA role. New ambassadors
            receive a referral code automatically.
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users"
            sx={{
              input: { color: "white" },
              "& .MuiOutlinedInput-root": {
                color: "white",
                borderRadius: 3,
                background: "rgba(255,255,255,0.03)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
              },
            }}
          />
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
        <List sx={{ maxHeight: 420, overflowY: "auto" }}>
          {eligibleUsers.map((user: any) => {
            const checked = selectedSet.has(user.id);
            return (
              <ListItem
                key={user.id}
                disablePadding
                secondaryAction={
                  <Checkbox
                    checked={checked}
                    onChange={() => toggleUser(user.id)}
                    sx={{
                      color: "rgba(255,255,255,0.35)",
                      "&.Mui-checked": { color: "#ffb36b" },
                    }}
                  />
                }
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  mb: 0.5,
                  background: checked
                    ? "rgba(255,179,107,0.08)"
                    : "transparent",
                }}
              >
                <ListItemText
                  primary={user.name || user.email}
                  secondary={user.email}
                  primaryTypographyProps={{
                    sx: { color: "white", fontWeight: 700 },
                  }}
                  secondaryTypographyProps={{
                    sx: { color: "rgba(255,255,255,0.45)" },
                  }}
                />
              </ListItem>
            );
          })}
        </List>
        <DialogActions sx={{ px: 0, pt: 2 }}>
          <Button
            onClick={closeManageDialog}
            sx={{ color: "rgba(255,255,255,0.72)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #ff8b5c, #ffb36b)",
              color: "#121212",
              fontWeight: 800,
              borderRadius: 3,
              textTransform: "none",
            }}
          >
            Update
          </Button>
        </DialogActions>
      </DarkDialog>
    </Box>
  );
}
