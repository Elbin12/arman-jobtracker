import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useTestConnectionMutation,
} from "../../../store/api/onestepgpsApi";

export default function OneStepGPSSettingsDialog({ open, onClose }) {
  const { data: settings, isLoading } = useGetSettingsQuery(undefined, { skip: !open });
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();
  const [testConnection, { isLoading: testing }] = useTestConnectionMutation();

  const [apiKey, setApiKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [webhookUsername, setWebhookUsername] = useState("");
  const [webhookPassword, setWebhookPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!settings) return;
    setIsEnabled(settings.is_enabled !== false);
    setWebhookUsername(settings.webhook_username || "");
    setApiKey("");
    setWebhookPassword("");
  }, [settings]);

  const handleCopyWebhook = async () => {
    const url = settings?.webhook_url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Webhook URL copied.");
      setTimeout(() => setMessage(null), 2500);
    } catch {
      setError("Could not copy URL.");
    }
  };

  const handleSave = async () => {
    setMessage(null);
    setError(null);
    try {
      const payload = {
        is_enabled: isEnabled,
        webhook_username: webhookUsername.trim(),
      };
      if (apiKey.trim()) payload.api_key = apiKey.trim();
      if (webhookPassword.trim() || webhookPassword === "") {
        // only send password when user typed something new, or clear intentionally
        // empty string after user edits clears; if untouched leave alone
      }
      if (webhookPassword !== "") {
        payload.webhook_password = webhookPassword;
      }
      await updateSettings(payload).unwrap();
      setApiKey("");
      setWebhookPassword("");
      setMessage("One Step GPS settings saved.");
    } catch (err) {
      setError(err?.data?.detail || "Failed to save settings.");
    }
  };

  const handleTest = async () => {
    setMessage(null);
    setError(null);
    try {
      const payload = apiKey.trim() ? { api_key: apiKey.trim() } : {};
      const result = await testConnection(payload).unwrap();
      setMessage(`Connection OK. Found ${result.device_count} device(s).`);
    } catch (err) {
      setError(err?.data?.detail || "Connection test failed.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>One Step GPS</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Connect live vehicles with an API key, and paste the webhook URL into One Step GPS to receive alerts (engine, harsh braking, etc.).
        </Typography>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                />
              }
              label="Show live vehicles on map"
            />

            <TextField
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings?.api_key_set ? "Saved key is set — enter new key to replace" : "Paste One Step GPS API key"}
              fullWidth
              autoComplete="off"
            />

            {settings?.api_key_set && !apiKey && (
              <Typography variant="caption" color="text.secondary">
                An API key is already saved for this account.
              </Typography>
            )}

            <Divider sx={{ my: 0.5 }} />

            <Typography variant="subtitle2">Alerts webhook</Typography>
            <Typography variant="caption" color="text.secondary">
              In One Step GPS, create a JSON webhook pointing to this URL. Use the location-specific path so alerts land in this subaccount.
            </Typography>

            <TextField
              label="Webhook URL"
              value={settings?.webhook_url || ""}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={handleCopyWebhook} disabled={!settings?.webhook_url}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Webhook username (optional Basic auth)"
              value={webhookUsername}
              onChange={(e) => setWebhookUsername(e.target.value)}
              fullWidth
              autoComplete="off"
            />
            <TextField
              label="Webhook password"
              type="password"
              value={webhookPassword}
              onChange={(e) => setWebhookPassword(e.target.value)}
              placeholder={
                settings?.webhook_password_set
                  ? "Saved password is set — enter new password to replace"
                  : "Optional"
              }
              fullWidth
              autoComplete="new-password"
            />

            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleTest} disabled={testing || isLoading || (!apiKey && !settings?.api_key_set)}>
          {testing ? "Testing..." : "Test connection"}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || isLoading}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
