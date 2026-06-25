import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface MatchStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
}

interface AccountPageProps {
  username: string;
  sabotageWords: string[];
  matchStats: MatchStats;
  onSabotageWordsChange: (words: string[]) => void;
}

function AccountPage({
  username,
  sabotageWords,
  matchStats,
  onSabotageWordsChange,
}: AccountPageProps) {
  const [newWord, setNewWord] = useState("");
  const winRate =
    matchStats.matchesPlayed === 0
      ? 0
      : Math.round((matchStats.wins / matchStats.matchesPlayed) * 100);

  const addSabotageWord = () => {
    const cleanedWord = newWord.trim().toLowerCase();

    if (!cleanedWord || sabotageWords.includes(cleanedWord)) {
      setNewWord("");
      return;
    }

    onSabotageWordsChange([...sabotageWords, cleanedWord]);
    setNewWord("");
  };

  const removeSabotageWord = (wordToRemove: string) => {
    const nextWords = sabotageWords.filter((word) => word !== wordToRemove);
    onSabotageWordsChange(nextWords);
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        width: "100%",
        backgroundImage: `url("/assets/bg.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        boxSizing: "border-box",
        p: { xs: 2, md: 5 },
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: "min(920px, 100%)",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "rgba(255,255,255,0.95)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
          }}
        >
          <Box
            sx={{
              bgcolor: "#111827",
              color: "#fff",
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: "#2563EB",
                color: "#fff",
                fontSize: 48,
                fontFamily: "Arial Black",
              }}
            >
              {username.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h4" sx={{ color: "#fff", fontWeight: 800 }}>
              {username}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
              Default avatar
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 3, md: 4 }, textAlign: "left" }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
              Match Stats
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
                mb: 3,
              }}
            >
              <Stat label="Played" value={matchStats.matchesPlayed} />
              <Stat label="Wins" value={matchStats.wins} />
              <Stat label="Losses" value={matchStats.losses} />
              <Stat label="Win Rate" value={`${winRate}%`} />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
              Sabotage Words
            </Typography>
            <Typography sx={{ color: "#4B5563", mb: 2 }}>
              The first word in this list is currently used as the escape word.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                size="small"
                label="New word"
                value={newWord}
                onChange={(event) => setNewWord(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSabotageWord();
                  }
                }}
                fullWidth
              />
              <Button variant="contained" onClick={addSabotageWord}>
                Add
              </Button>
            </Stack>

            {sabotageWords.length > 0 ? (
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: "wrap" }}
              >
                {sabotageWords.map((word, index) => (
                  <Chip
                    key={word}
                    label={index === 0 ? `${word} (current)` : word}
                    color={index === 0 ? "primary" : "default"}
                    onDelete={() => removeSabotageWord(word)}
                  />
                ))}
              </Stack>
            ) : (
              <Typography sx={{ color: "#6B7280" }}>
                No sabotage words saved yet.
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Box
      sx={{
        border: "1px solid #E5E7EB",
        borderRadius: 1,
        p: 2,
        bgcolor: "#F9FAFB",
      }}
    >
      <Typography sx={{ color: "#6B7280", fontSize: 14 }}>{label}</Typography>
      <Typography variant="h4" sx={{ color: "#111827", fontWeight: 900 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default AccountPage;
