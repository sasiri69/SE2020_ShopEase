export const colors = {
  background: "hsl(220, 33%, 98%)",
  surface: "hsl(0, 0%, 100%)",
  surfaceAlt: "hsl(210, 20%, 96%)",
  textPrimary: "hsl(222, 47%, 11%)",
  textSecondary: "hsl(215, 16%, 47%)",
  textMuted: "hsl(215, 14%, 71%)",
  border: "hsl(214, 32%, 91%)",
  primary: "hsl(221, 83%, 53%)", // A vibrant blue
  primarySoft: "hsl(221, 83%, 93%)",
  accent: "hsl(12, 100%, 65%)", // A soft coral/orange accent
  accentSoft: "hsl(12, 100%, 95%)",
  danger: "hsl(0, 84%, 60%)",
  dangerSoft: "hsl(0, 84%, 95%)",
  success: "hsl(142, 71%, 45%)",
  successSoft: "hsl(142, 76%, 93%)",
  shadow: "hsl(222, 47%, 11%)",
};

export const fonts = {
  heading: "Montserrat_700Bold",
  body: "OpenSans_400Regular",
  button: "Roboto_500Medium",
};

export const layout = {
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 8,
    },
  },
};
