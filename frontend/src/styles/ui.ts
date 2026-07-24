export const uiColors = {
  navy: "#F8FBFF",
  navySoft: "#EAF5FF",
  page: "#EAF6FF",
  surface: "#FFFFFF",
  primary: "#0074FF",
  primaryHover: "#005ED6",
  secondary: "#FF1F2D",
  secondaryHover: "#D9101F",
  gold: "#8C7A00",
  text: "#18181B",
  muted: "#52525B",
  faint: "#71717A",
  border: "#E4E4E7",
  borderDark: "rgba(0,116,255,0.18)",
};

export const darkPageBackgroundImage =
  "linear-gradient(rgba(234,246,255,0.38), rgba(255,255,255,0.52)), url('/assets/bg.png')";

export const radius = {
  sm: 1,
  md: 2,
};

export const pageShellSx = {
  minHeight: "calc(100vh - 64px)",
  width: "100%",
  bgcolor: uiColors.page,
  p: { xs: 2, md: 4 },
  boxSizing: "border-box",
};

export const panelSx = {
  bgcolor: "rgba(255,255,255,0.92)",
  border: `1px solid ${uiColors.borderDark}`,
  borderRadius: radius.md,
  boxShadow: "0 18px 48px rgba(0,68,148,0.14)",
};

export const primaryButtonSx = {
  borderRadius: radius.sm,
  bgcolor: uiColors.primary,
  fontWeight: 800,
  textTransform: "none",
  boxShadow: "none",
  "&:hover": {
    bgcolor: uiColors.primaryHover,
    boxShadow: "none",
  },
};

export const secondaryButtonSx = {
  borderRadius: radius.sm,
  color: uiColors.secondary,
  borderColor: "rgba(255,31,45,0.36)",
  fontWeight: 800,
  textTransform: "none",
  "&:hover": {
    borderColor: uiColors.secondary,
    bgcolor: "rgba(255,31,45,0.08)",
  },
};

export const darkSecondaryButtonSx = {
  borderRadius: radius.sm,
  color: uiColors.secondary,
  borderColor: "rgba(0,116,255,0.38)",
  fontWeight: 800,
  textTransform: "none",
  "&:hover": {
    bgcolor: "rgba(0,116,255,0.08)",
    borderColor: uiColors.secondary,
  },
};

export const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: radius.sm,
    bgcolor: "#fff",
    "&.Mui-focused fieldset": {
      borderColor: uiColors.primary,
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: uiColors.primary,
  },
};

export const redContainedButtonSx = primaryButtonSx;

export const blueContainedButtonSx = {
  ...primaryButtonSx,
};

export const logoChipSx = {
  bgcolor: "rgba(0,116,255,0.1)",
  color: uiColors.primaryHover,
  border: "1px solid rgba(0,116,255,0.22)",
  fontWeight: 800,
  "& .MuiChip-deleteIcon": {
    color: "rgba(0,94,214,0.72)",
    "&:hover": {
      color: uiColors.primaryHover,
    },
  },
};
