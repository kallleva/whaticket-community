import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Chip,
  Box,
  Button,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
    maxWidth: 600,
  },
  field: {
    marginTop: theme.spacing(2),
  },
}));

const AiSettings = () => {
  const classes = useStyles();
  const [name, setName] = useState("Google Gemini");
  const [apiKey, setApiKey] = useState("");
  const [modelsText, setModelsText] = useState("");
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    api
      .get("/ai-settings")
      .then(({ data }) => {
        if (data) {
          setName(data.name || "Google Gemini");
          setModelsText((data.enabledModels || []).join(", "));
          setHasKey(true);
        }
      })
      .catch(toastError);
  }, []);

  const handleSave = async () => {
    try {
      const enabledModels = modelsText
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      await api.put("/ai-settings", {
        name,
        apiKey: apiKey || undefined,
        enabledModels,
      });

      toast.success("Configuração de IA salva!");
      setApiKey("");
      setHasKey(true);
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Configuração de IA</Title>
      </MainHeader>
      <Container className={classes.root} maxWidth="sm">
        <Paper className={classes.paper} variant="outlined">
          <Typography variant="body2" color="textSecondary">
            Chave de API do Google Gemini, usada pelos Agentes de IA para
            responder automaticamente aos clientes.
          </Typography>

          <TextField
            className={classes.field}
            label="API Key do Gemini"
            type="password"
            fullWidth
            variant="outlined"
            margin="dense"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKey ? "•••••••• (já configurada)" : "Cole a chave aqui"}
          />

          <TextField
            className={classes.field}
            label="Modelos habilitados (separados por vírgula)"
            fullWidth
            variant="outlined"
            margin="dense"
            value={modelsText}
            onChange={(e) => setModelsText(e.target.value)}
            placeholder="gemini-1.5-flash, gemini-1.5-pro"
            helperText="Esses nomes aparecerão no seletor de modelo ao criar um Agente"
          />

          <Box className={classes.field} display="flex" flexWrap="wrap" style={{ gap: 6 }}>
            {modelsText
              .split(",")
              .map((m) => m.trim())
              .filter(Boolean)
              .map((model) => (
                <Chip key={model} label={model} size="small" />
              ))}
          </Box>

          <Box className={classes.field} display="flex" justifyContent="flex-end">
            <Button variant="contained" color="primary" onClick={handleSave}>
              Salvar
            </Button>
          </Box>
        </Paper>
      </Container>
    </MainContainer>
  );
};

export default AiSettings;
