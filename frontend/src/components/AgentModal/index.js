import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Switch,
  Typography,
  Divider,
  Box,
} from "@material-ui/core";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const AgentSchema = Yup.object().shape({
  name: Yup.string().min(2, "Muito curto").required("Obrigatório"),
  skillPrompt: Yup.string().required("Obrigatório"),
  model: Yup.string().required("Obrigatório"),
});

const DEFAULT_VALUES = {
  name: "",
  skillPrompt: "",
  extraContext: "",
  model: "",
  temperature: 0.7,
  handoffMarker: "HUMANO_SOLICITADO",
  fallbackQueueId: "",
  providerType: "gemini",
  apiUrl: "",
  tools: [],
  voiceReplies: false,
};

const AgentModal = ({ open, onClose, agentId, onSaved }) => {
  const [initialValues, setInitialValues] = useState(DEFAULT_VALUES);
  const [models, setModels] = useState([]);
  const [queues, setQueues] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);

  useEffect(() => {
    if (!open) return;

    api.get("/queue").then(({ data }) => setQueues(data)).catch(toastError);
    api
      .get("/ai-settings")
      .then(({ data }) => setModels(data?.enabledModels || []))
      .catch(toastError);
    api
      .get("/agents/tools")
      .then(({ data }) => setAvailableTools(data || []))
      .catch(toastError);

    if (agentId) {
      api
        .get(`/agents/${agentId}`)
        .then(({ data }) => {
          setInitialValues({
            name: data.name || "",
            skillPrompt: data.skillPrompt || "",
            extraContext: data.extraContext || "",
            model: data.model || "",
            temperature: data.temperature ?? 0.7,
            handoffMarker: data.handoffMarker || "HUMANO_SOLICITADO",
            fallbackQueueId: data.fallbackQueueId || "",
            providerType: data.providerType || "gemini",
            apiUrl: data.apiUrl || "",
            tools: data.tools || [],
            voiceReplies: !!data.voiceReplies,
          });
        })
        .catch(toastError);
    } else {
      setInitialValues(DEFAULT_VALUES);
    }
  }, [agentId, open]);

  const handleSave = async (values, actions) => {
    try {
      const payload = {
        ...values,
        fallbackQueueId: values.fallbackQueueId || null,
        apiUrl: values.providerType === "local" ? values.apiUrl : null,
      };

      if (agentId) {
        await api.put(`/agents/${agentId}`, payload);
      } else {
        await api.post("/agents", payload);
      }

      toast.success("Agente salvo com sucesso!");
      actions.setSubmitting(false);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      actions.setSubmitting(false);
      toastError(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{agentId ? "Editar Agente de IA" : "Novo Agente de IA"}</DialogTitle>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={AgentSchema}
        onSubmit={(values, actions) => handleSave(values, actions)}
      >
        {({ touched, errors, isSubmitting, values, setFieldValue }) => (
          <Form>
            <DialogContent dividers>
              <Field
                as={TextField}
                label="Nome do Agente"
                name="name"
                fullWidth
                variant="outlined"
                margin="dense"
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
              />

              <Field
                as={TextField}
                label="Skill (prompt de personalidade e regras)"
                name="skillPrompt"
                multiline
                rows={8}
                fullWidth
                variant="outlined"
                margin="dense"
                placeholder="Você é a Luiza, consultora digital da concessionária..."
                error={touched.skillPrompt && Boolean(errors.skillPrompt)}
                helperText={touched.skillPrompt && errors.skillPrompt}
              />

              <Field
                as={TextField}
                label="Contexto adicional (opcional)"
                name="extraContext"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                margin="dense"
                placeholder="Ex: horário de funcionamento, políticas da loja, destaques do estoque..."
                helperText="Informações de referência, separadas da personalidade/regras acima."
              />

              <Divider style={{ margin: "12px 0" }} />
              <Typography variant="subtitle2" color="textSecondary">
                Provedor de IA
              </Typography>

              <FormControl variant="outlined" margin="dense" fullWidth>
                <InputLabel>Provedor</InputLabel>
                <Field as={Select} name="providerType" label="Provedor">
                  <MenuItem value="gemini">Google Gemini (API)</MenuItem>
                  <MenuItem value="local">
                    Modelo local / API própria (ex.: Qwen via Ollama)
                  </MenuItem>
                </Field>
              </FormControl>

              {values.providerType === "local" ? (
                <>
                  <Field
                    as={TextField}
                    label="URL base da API (compatível com OpenAI)"
                    name="apiUrl"
                    fullWidth
                    variant="outlined"
                    margin="dense"
                    placeholder="http://ollama:11434/v1"
                  />
                  <Field
                    as={TextField}
                    label="Nome do modelo"
                    name="model"
                    fullWidth
                    variant="outlined"
                    margin="dense"
                    placeholder="qwen2.5:7b"
                    error={touched.model && Boolean(errors.model)}
                    helperText={
                      (touched.model && errors.model) ||
                      "Nome do modelo exatamente como o servidor local espera."
                    }
                  />
                </>
              ) : (
                <FormControl variant="outlined" margin="dense" fullWidth>
                  <InputLabel>Modelo</InputLabel>
                  <Field as={Select} name="model" label="Modelo">
                    {models.length === 0 && (
                      <MenuItem value="" disabled>
                        Cadastre modelos em Configuração de IA
                      </MenuItem>
                    )}
                    {models.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </Field>
                </FormControl>
              )}

              <Field
                as={TextField}
                label="Temperatura (0 a 1)"
                name="temperature"
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 1 }}
                variant="outlined"
                margin="dense"
              />

              {values.providerType === "gemini" && (
                <>
                  <Divider style={{ margin: "12px 0" }} />
                  <Typography variant="subtitle2" color="textSecondary">
                    Ferramentas (o agente pode consultar/agir no sistema)
                  </Typography>
                  <FormGroup>
                    {availableTools.map((tool) => (
                      <FormControlLabel
                        key={tool.key}
                        control={
                          <Checkbox
                            checked={values.tools.includes(tool.key)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...values.tools, tool.key]
                                : values.tools.filter((k) => k !== tool.key);
                              setFieldValue("tools", next);
                            }}
                          />
                        }
                        label={tool.label}
                      />
                    ))}
                    {availableTools.length === 0 && (
                      <Typography variant="body2" color="textSecondary">
                        Nenhuma ferramenta disponível.
                      </Typography>
                    )}
                  </FormGroup>
                </>
              )}

              <Divider style={{ margin: "12px 0" }} />

              <Field
                as={TextField}
                label="Marcador de transferência para humano"
                name="handoffMarker"
                fullWidth
                variant="outlined"
                margin="dense"
                helperText="Quando a resposta da IA contiver esse texto, o ticket é transferido e o marcador não é enviado ao cliente. Além disso, frases comuns como 'quero falar com atendente' já disparam a transferência automaticamente, sem depender da IA."
              />

              <FormControl variant="outlined" margin="dense" fullWidth>
                <InputLabel>Fila de fallback (transferência)</InputLabel>
                <Field as={Select} name="fallbackQueueId" label="Fila de fallback (transferência)">
                  <MenuItem value="">
                    <em>Nenhuma</em>
                  </MenuItem>
                  {queues.map((queue) => (
                    <MenuItem key={queue.id} value={queue.id}>
                      {queue.name}
                    </MenuItem>
                  ))}
                </Field>
              </FormControl>

              <Box mt={1}>
                <FormControlLabel
                  control={
                    <Field as={Switch} type="checkbox" name="voiceReplies" color="primary" />
                  }
                  label="Responder por áudio (nota de voz) em vez de texto"
                />
                <Typography variant="caption" color="textSecondary" display="block">
                  Melhor esforço: se a geração de voz falhar, a resposta cai automaticamente
                  para texto.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={20} /> : "Salvar"}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default AgentModal;
