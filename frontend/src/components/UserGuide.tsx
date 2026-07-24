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
import { uiColors } from "../styles/ui";

type GuideMode = "mandatory" | "optional";
type GuidePage = "lobby" | "account" | "room";
type DialogOffset = { marginLeft?: "auto"; marginRight?: "auto" };

const POPUP_SLIDE_MS = 220;

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
    title: "Set Sabotage Settings",
    icon: <SportsEsportsIcon />,
    page: "account",
    targetSelector: "[data-guide='sabotage-words']",
    body: "Sabotage is the main disruption mechanic, with Pause and Command Switch as its two subtypes. Pause sends your current sabotage word to the opponent, freezes their gameplay, and stops them from moving until they spell the displayed word correctly.",
    tip: "During a match, say pause to trigger Pause sabotage.",
  },
  {
    title: "Customize Command Switch",
    icon: <TuneIcon />,
    page: "account",
    targetSelector: "[data-guide='command-switch']",
    body: "Command Switch is the other sabotage subtype. It temporarily changes the opponent's movement voice commands, so they must use the mapped words here instead of the normal direction words.",
    tip: "During a match, say switch to trigger Command Switch sabotage.",
  },
  {
    title: "Use Voice Controls",
    icon: <MicIcon />,
    page: "lobby",
    body: "In a match, say stop, above, down, left, or right to move through the maze. Press space to accurately stop. Your browser may ask for microphone permission first.",
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
  const [displayStep, setDisplayStep] = useState(0);
  const [isPopupSliding, setIsPopupSliding] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = guideSteps[activeStep];
  const visibleStep = guideSteps[displayStep];
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
    if (displayStep === activeStep) {
      return;
    }

    setIsPopupSliding(true);
    const timeoutId = window.setTimeout(() => {
      setDisplayStep(activeStep);
      setIsPopupSliding(false);
    }, POPUP_SLIDE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeStep, displayStep]);

  useEffect(() => {
    if (!open || currentPage !== step.page) {
      return;
    }

    let firstAnimationFrame = 0;
    let secondAnimationFrame = 0;
    let measurementTimeout = 0;
    const targetSelector = step.targetSelector;
    if (!targetSelector) {
      setTargetRect(null);
      return;
    }

    const updateTarget = () => {
      const target = document.querySelector(targetSelector);
      if (!(target instanceof HTMLElement)) {
        setTargetRect(null);
        return;
      }

      firstAnimationFrame = window.requestAnimationFrame(() => {
        secondAnimationFrame = window.requestAnimationFrame(() => {
          setTargetRect(target.getBoundingClientRect());
        });
      });
    };

    const scrollToTarget = () => {
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
    };

    scrollToTarget();
    updateTarget();
    measurementTimeout = window.setTimeout(updateTarget, 320);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.cancelAnimationFrame(firstAnimationFrame);
      window.cancelAnimationFrame(secondAnimationFrame);
      window.clearTimeout(measurementTimeout);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [currentPage, open, step.page, step.targetSelector]);

  const goBack = () => setActiveStep((current) => Math.max(current - 1, 0));
  const closeGuide = () => {
    setActiveStep(0);
    setDisplayStep(0);
    setIsPopupSliding(false);
    setTargetRect(null);
    onClose();
  };
  const goForward = () => {
    if (isLastStep) {
      closeGuide();
      return;
    }

    setActiveStep((current) => Math.min(current + 1, guideSteps.length - 1));
  };
  const selectStep = (index: number) => {
    setActiveStep(index);
  };

  return (
    <>
      {open && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0, 32, 72, 0.34)",
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
                boxShadow: "0 0 0 9999px rgba(0, 32, 72, 0.22)",
                bgcolor: "rgba(255, 255, 255, 0.06)",
                transition:
                  "top 220ms ease, left 220ms ease, width 220ms ease, height 220ms ease",
              }}
            />
          )}
        </Box>
      )}

      <Dialog
        open={open}
        onClose={canClose ? closeGuide : undefined}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: { sx: { display: "none" } },
          paper: {
            sx: {
              borderRadius: 2,
              border: `1px solid ${uiColors.border}`,
              mt: targetRect ? "80px" : undefined,
              maxWidth: 480,
              boxShadow: "0 18px 48px rgba(0,68,148,0.16)",
              transition: `margin ${POPUP_SLIDE_MS}ms ease, opacity 140ms ease`,
              opacity: isPopupSliding ? 0.9 : 1,
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
            gap: 1.5,
            fontWeight: 900,
            px: 2.5,
            py: 1.75,
          }}
        >
          {mode === "mandatory" ? "New Player Tour" : "Feature Guide"}
          {canClose && (
            <Button
              onClick={onClose}
              startIcon={<CloseIcon />}
              size="small"
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              Close
            </Button>
          )}
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, py: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", mb: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                bgcolor: uiColors.primary,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              {visibleStep.icon}
            </Box>
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "#71717A", fontWeight: 800, lineHeight: 1.2 }}
              >
                Step {displayStep + 1} of {guideSteps.length}
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 900, color: "#18181B", lineHeight: 1.25 }}
              >
                {visibleStep.title}
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 1,
              mb: 2,
              bgcolor: uiColors.border,
              "& .MuiLinearProgress-bar": {
                bgcolor: uiColors.primary,
              },
            }}
          />

          <Typography
            sx={{ color: "#27272A", fontSize: 15, lineHeight: 1.5, mb: 1.5 }}
          >
            {visibleStep.body}
          </Typography>

          <Box
            sx={{
              border: "1px solid rgba(225,29,46,0.18)",
              bgcolor: "#FFF1F2",
              borderRadius: 1,
              p: 1.5,
              color: "#9F1239",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {visibleStep.tip}
          </Box>

          <Box sx={{ display: "flex", mt: 2, flexWrap: "wrap", gap: 0.75 }}>
            {guideSteps.map((guideStep, index) => (
              <Button
                key={guideStep.title}
                variant={index === activeStep ? "contained" : "outlined"}
                size="small"
                onClick={() => selectStep(index)}
                sx={{
                  minWidth: 36,
                  px: 1,
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
        <DialogActions sx={{ px: 2.5, py: 2, pt: 0.75 }}>
          {mode === "mandatory" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#52525B",
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
