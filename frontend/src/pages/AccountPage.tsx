import { useState } from "react";
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
import type { CommandSwitchCommands } from "./GamePage";

interface MatchStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
}

interface AccountPageProps {
  username: string;
  sabotageWords: string[];
  commandSwitchWord: string;
  commandSwitchCommands: CommandSwitchCommands;
  matchStats: MatchStats;
  onSabotageWordsChange: (words: string[]) => void;
  onCommandSwitchCommandsChange: (commands: CommandSwitchCommands) => void;
}

function AccountPage({
  username,
  sabotageWords,
  commandSwitchWord,
  commandSwitchCommands,
  matchStats,
  onSabotageWordsChange,
  onCommandSwitchCommandsChange,
}: AccountPageProps) {
  const [newWord, setNewWord] = useState("");
  const [newCommandSwitchCommands, setNewCommandSwitchCommands] = useState(
    commandSwitchCommands,
  );
  const [wordError, setWordError] = useState("");
  const [commandSwitchCommandErrors, setCommandSwitchCommandErrors] = useState<
    Partial<Record<keyof CommandSwitchCommands, string>>
  >({});
  const winRate =
    matchStats.matchesPlayed === 0
      ? 0
      : Math.round((matchStats.wins / matchStats.matchesPlayed) * 100);

  const addSabotageWord = () => {
    const cleanedWord = newWord.trim().toLowerCase();

    if (!cleanedWord) {
      setNewWord("");
      setWordError("");
      return;
    }

    if (!/^[a-z]+$/.test(cleanedWord)) {
      setWordError("Only letters are allowed.");
      return;
    }

    if (sabotageWords.includes(cleanedWord)) {
      setNewWord("");
      setWordError("");
      return;
    }

    onSabotageWordsChange([...sabotageWords, cleanedWord]);
    setNewWord("");
    setWordError("");
  };

  const removeSabotageWord = (wordToRemove: string) => {
    const nextWords = sabotageWords.filter((word) => word !== wordToRemove);
    onSabotageWordsChange(nextWords);
  };

  const saveCommandSwitchCommands = () => {
    const cleanedCommands = Object.fromEntries(
      Object.entries(newCommandSwitchCommands).map(([command, word]) => [
        command,
        word.trim().toLowerCase(),
      ]),
    ) as CommandSwitchCommands;

    const nextErrors: Partial<Record<keyof CommandSwitchCommands, string>> = {};

    (
      Object.entries(cleanedCommands) as Array<
        [keyof CommandSwitchCommands, string]
      >
    ).forEach(([command, word]) => {
      if (!word) {
        nextErrors[command] = "Required.";
      } else if (!/^[a-z]+$/.test(word)) {
        nextErrors[command] = "Only letters are allowed.";
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setCommandSwitchCommandErrors(nextErrors);
      return;
    }

    setNewCommandSwitchCommands(cleanedCommands);
    setCommandSwitchCommandErrors({});
    onCommandSwitchCommandsChange(cleanedCommands);
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
          overflow: "hidden auto",
          maxHeight: "calc(100vh - 100px)",
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

            <Box
              sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 2 }}
            >
              <TextField
                size="small"
                label="New word"
                value={newWord}
                error={Boolean(wordError)}
                helperText={wordError || " "}
                onChange={(event) => {
                  setNewWord(event.target.value);
                  setWordError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSabotageWord();
                  }
                }}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={addSabotageWord}
                sx={{ height: 40 }}
              >
                Add
              </Button>
            </Box>

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

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Command Switch Trigger
            </Typography>
            <Typography sx={{ color: "#4B5563", mb: 2 }}>
              Saying "{commandSwitchWord}" makes the opponent use these movement
              commands for 10 seconds.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 2,
                mb: 2,
              }}
            >
              {(
                [
                  ["above", "Above"],
                  ["down", "Down"],
                  ["right", "Right"],
                  ["left", "Left"],
                ] as Array<[keyof CommandSwitchCommands, string]>
              ).map(([command, label]) => (
                <TextField
                  key={command}
                  size="small"
                  label={`${label} word`}
                  value={newCommandSwitchCommands[command]}
                  error={Boolean(commandSwitchCommandErrors[command])}
                  helperText={commandSwitchCommandErrors[command] || " "}
                  onChange={(event) => {
                    setNewCommandSwitchCommands({
                      ...newCommandSwitchCommands,
                      [command]: event.target.value,
                    });
                    setCommandSwitchCommandErrors({
                      ...commandSwitchCommandErrors,
                      [command]: "",
                    });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      saveCommandSwitchCommands();
                    }
                  }}
                  fullWidth
                />
              ))}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={saveCommandSwitchCommands}
                sx={{ height: 40 }}
              >
                Save
              </Button>
            </Box>
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
