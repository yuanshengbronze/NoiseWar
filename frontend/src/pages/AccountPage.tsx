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
import {
  blueContainedButtonSx,
  darkPageBackgroundImage,
  fieldSx,
  logoChipSx,
  uiColors,
} from "../styles/ui";

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
  commandSwitchWord: _commandSwitchWord,
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
    if (sabotageWords.length <= 1) {
      return;
    }

    const nextWords = sabotageWords.filter((word) => word !== wordToRemove);
    onSabotageWordsChange(nextWords);
  };

  const selectSabotageWord = (wordToSelect: string) => {
    if (sabotageWords[0] === wordToSelect) {
      return;
    }

    const nextWords = [
      wordToSelect,
      ...sabotageWords.filter((word) => word !== wordToSelect),
    ];
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
        backgroundImage: darkPageBackgroundImage,
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
              bgcolor: "rgba(255,255,255,0.6)",
              color: uiColors.text,
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
                bgcolor: uiColors.primary,
                color: "#fff",
                fontSize: 48,
                fontFamily: "Arial Black",
              }}
            >
              {username.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h4" sx={{ color: uiColors.text, fontWeight: 800 }}>
              {username}
            </Typography>
            <Typography sx={{ color: uiColors.muted }}>
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

            <Box data-guide="sabotage-words">
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                Sabotage Words
              </Typography>
              <Typography sx={{ color: uiColors.muted, mb: 2 }}>
                The first word in this list is currently used as the escape
                word.
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                  mb: 2,
                }}
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
                  sx={fieldSx}
                />
                <Button
                  variant="contained"
                  onClick={addSabotageWord}
                  sx={{ ...blueContainedButtonSx, height: 40 }}
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
                      clickable={index !== 0}
                      onClick={() => selectSabotageWord(word)}
                      onDelete={
                        sabotageWords.length > 1
                          ? () => removeSabotageWord(word)
                          : undefined
                      }
                      sx={index === 0 ? logoChipSx : undefined}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ color: "#71717A" }}>
                  No sabotage words saved yet.
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box data-guide="command-switch">
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Command Switch Trigger
              </Typography>
              <Typography sx={{ color: uiColors.muted, mb: 2 }}>
                Saying "switch" makes the opponent use these movement commands
                for 10 seconds.
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
                    sx={fieldSx}
                  />
                ))}
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  onClick={saveCommandSwitchCommands}
                  sx={{ ...blueContainedButtonSx, height: 40 }}
                >
                  Save
                </Button>
              </Box>
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
        border: `1px solid ${uiColors.border}`,
        borderRadius: 1,
        p: 2,
        bgcolor: "#FAFAFA",
      }}
    >
      <Typography sx={{ color: uiColors.faint, fontSize: 14 }}>{label}</Typography>
      <Typography variant="h4" sx={{ color: uiColors.text, fontWeight: 900 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default AccountPage;
