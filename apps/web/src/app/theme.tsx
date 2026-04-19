import { alpha, createTheme } from "@mui/material/styles"

const navy = "#355872"
const sky = "#7AAACE"
const mist = "#9CD5FF"
const canvas = "#F7F8F0"

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: navy,
      light: sky,
    },
    secondary: {
      main: sky,
    },
    info: {
      main: mist,
    },
    success: {
      main: "#5B8C5A",
    },
    warning: {
      main: "#C68A2D",
    },
    error: {
      main: "#C05A50",
    },
    background: {
      default: canvas,
      paper: "#FFFFFF",
    },
    text: {
      primary: navy,
      secondary: alpha(navy, 0.75),
    },
    divider: alpha(navy, 0.1),
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: "2.4rem",
      fontWeight: 700,
      lineHeight: 1.1,
    },
    h2: {
      fontSize: "1.45rem",
      fontWeight: 700,
    },
    h3: {
      fontSize: "1.05rem",
      fontWeight: 700,
    },
    overline: {
      fontWeight: 700,
      letterSpacing: "0.14em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: canvas,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#FFFFFF", 0.92),
          color: navy,
          boxShadow: "none",
          borderBottom: `1px solid ${alpha(navy, 0.1)}`,
          backdropFilter: "blur(10px)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 10px 30px rgba(53, 88, 114, 0.08)",
          border: `1px solid ${alpha(navy, 0.08)}`,
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 700,
          paddingInline: 18,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#FFFFFF", 0.94),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
  },
})
