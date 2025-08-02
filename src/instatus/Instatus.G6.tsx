import {Box, Button, Typography} from "@mui/material";

export default function StatusPage() {
  return (
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <Typography variant="h3" color="primary">
        État du Service HEI Admin
      </Typography>
      <Typography variant="body1">
        Vous pouvez consulter l'état du système en temps réel via Instatus :
      </Typography>
      <Button
        href="https://hei-admin-g6.instatus.com/"
        target="_blank"
        variant="contained"
        color="primary"
      >
        📡 Voir la page de statut
      </Button>
    </Box>
  );
}
