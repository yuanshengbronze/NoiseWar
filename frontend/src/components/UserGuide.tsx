import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import GroupsIcon from "@mui/icons-material/Groups";
import HelpIcon from "@mui/icons-material/Help";
import LoginIcon from "@mui/icons-material/Login";
import MicIcon from "@mui/icons-material/Mic";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TuneIcon from "@mui/icons-material/Tune";

type GuideMode = "mandatory" | "optional";
type GuidePage = "lobby" | "account" | "room";
type DialogOffset = { marginLeft?: "auto"; marginRight?: "auto" };

interface GuideStep {
  title: string;
  icon: React.ReactNode;
  page: "lobby" | "account";
  targetSelector?: string;
  body: string;
  tip: string;
}

const guideSteps: GuideStep[] = [
  {
    title: "Create a Room",
    icon: <GroupsIcon />,
    page: "lobby",
    targetSelector: "[data-guide='create-room']",
    body: "This starts a new two-player room. After the room opens, copy the room code from the match header and send it to your opponent.",
    tip: "The match begins from the room screen once both players are connected.",
  },
  {
    title: "Enter a Room",
    icon: <LoginIcon />,
    page: "lobby",
    targetSelector: "[data-guide='enter-room']",
    body: "Use this when another player gives you a room code. Enter the code, join the room, then wait for the match to start.",
    tip: "Room codes must match exactly, so copy and paste when possible.",
  },
  {
    title: "Set Sabotage Words",
    icon: <SportsEsportsIcon />,
    page: "account",
    targetSelector: "[data-guide='sabotage-words']",
    body: "Sabotage words live on the Account page. Add words here, click a saved chip to make it current, or remove words you no longer want.",
    tip: "During a match, say sabotage to send your current sabotage word to the other player.",
  },
  {
    title: "Customize Swapped Commands",
    icon: <TuneIcon />,
    page: "account",
    targetSelector: "[data-guide='command-switch']",
    body: "These words control the temporary command-switch effect. When this sabotage is active, the opponent must use the mapped words for movement.",
    tip: "Short, distinct words are easiest for voice recognition.",
  },
  {
    title: "Use Voice Controls",
    icon: <MicIcon />,
    page: "lobby",
    body: "In a match, say stop, above, down, left, or right to move through the maze. Your browser may ask for microphone permission first.",
    tip: "You can reopen this guide from the navbar at any time.",
  },
];

interface UserGuideProps {
  open: boolean;
  mode: GuideMode;
  currentPage: GuidePage;
  onNavigate: (page: "lobby" | "account") => void;
  onClose: () => void;
}

function UserGuide({
  open,
  mode,
  currentPage,
  onNavigate,
  onClose,
}: UserGuideProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = guideSteps[activeStep];
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === guideSteps.length - 1;
  const progress = ((activeStep + 1) / guideSteps.length) * 100;
  const canClose = mode === "optional";
  const dialogOffset = useMemo<DialogOffset>(() => {
    if (!targetRect) {
      return {};
    }

    return targetRect.left > window.innerWidth / 2
      ? { marginRight: "auto" }
      : { marginLeft: "auto" };
  }, [targetRect]);

  useEffect(() => {
    if (!open || currentPage === step.page) {
      return;
    }

    onNavigate(step.page);
  }, [currentPage, onNavigate, open, step.page]);

  useEffect(() => {
    if (!open || currentPage !== step.page) {
      return;
    }

    const targetSelector = step.targetSelector;
    if (!targetSelector) {
      return;
    }

    const updateTarget = () => {
      const target = document.querySelector(targetSelector);
      if (!(target instanceof HTMLElement)) {
        setTargetRect(null);
        return;
      }

      target.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth",
      });
      window.setTimeout(() => setTargetRect(target.getBoundingClientRect()), 200);
    };

    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [currentPage, open, step.page, step.targetSelector]);

  const goBack = () => setActiveStep((current) => Math.max(current - 1, 0));
  const closeGuide = () => {
    setActiveStep(0);
    setTargetRect(null);
    onClose();
  };
  const goForward = () => {
    if (isLastStep) {
      closeGuide();
      return;
    }

    setTargetRect(null);
    setActiveStep((current) => Math.min(current + 1, guideSteps.length - 1));
  };
  const selectStep = (index: number) => {
    setTargetRect(null);
    setActiveStep(index);
  };

  return (
    <>
      {open && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(15, 23, 42, 0.58)",
            zIndex: 1199,
            pointerEvents: "none",
          }}
        >
          {targetRect && (
            <Box
              sx={{
                position: "fixed",
                top: Math.max(targetRect.top - 8, 72),
                left: Math.max(targetRect.left - 8, 8),
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                border: "3px solid #FBBF24",
                borderRadius: 2,
                boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.35)",
                bgcolor: "rgba(255, 255, 255, 0.08)",
              }}
            />
          )}
        </Box>
      )}

      <Dialog
        open={open}
        onClose={canClose ? closeGuide : undefined}
        maxWidth="sm"
        fullWidth
        slotProps={{
          backdrop: { sx: { display: "none" } },
          paper: {
            sx: {
              borderRadius: 2,
              mt: targetRect ? "96px" : undefined,
              ...dialogOffset,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            fontWeight: 900,
          }}
        >
          {mode === "mandatory" ? "New Player Tour" : "Feature Guide"}
          {canClose && (
            <Button
              onClick={onClose}
              startIcon={<CloseIcon />}
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              Close
            </Button>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                bgcolor: "#2563EB",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              {step.icon}
            </Box>
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "#64748B", fontWeight: 800 }}
              >
                Step {activeStep + 1} of {guideSteps.length}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: "#111827" }}>
                {step.title}
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 1, mb: 3, bgcolor: "#E5E7EB" }}
          />

          <Typography
            sx={{ color: "#1F2937", fontSize: 18, lineHeight: 1.6, mb: 2 }}
          >
            {step.body}
          </Typography>

          <Box
            sx={{
              border: "1px solid #BFDBFE",
              bgcolor: "#EFF6FF",
              borderRadius: 1,
              p: 2,
              color: "#1E3A8A",
              fontWeight: 700,
            }}
          >
            {step.tip}
          </Box>

          <Box sx={{ display: "flex", mt: 3, flexWrap: "wrap", gap: 1 }}>
            {guideSteps.map((guideStep, index) => (
              <Button
                key={guideStep.title}
                variant={index === activeStep ? "contained" : "outlined"}
                size="small"
                onClick={() => selectStep(index)}
                sx={{
                  minWidth: 40,
                  px: 1.25,
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: 800,
                }}
                aria-label={`Go to ${guideStep.title}`}
              >
                {index + 1}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          {mode === "mandatory" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#475569",
                mr: "auto",
                fontWeight: 700,
              }}
            >
              <HelpIcon fontSize="small" />
              Required for new users
            </Box>
          )}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={goBack}
            disabled={isFirstStep}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={isLastStep ? <CheckCircleIcon /> : <ArrowForwardIcon />}
            onClick={goForward}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default UserGuide;
