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
} from "@material-ui/core";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const AgentSchema = Yup.object().shape({
  name: Yup.string().min(2, "Muito curto").required("Obrigatório"),
  skillPrompt: Yup.string().required("Obrigatório"),
  model: Yup.string().required("Obrigatório"),
});

const AgentModal = ({ open, onClose, agentId, onSaved }) => {
  const [initialValues, setInitialValues] = useState({
    name: "",
    skillPrompt: "",
    model: "",
    temperature: 0.7,
    handoffMarker: "HUMANO_SOLICITADO",
    fallbackQueueId: "",
  });
  const [models, setModels] = useState([]);
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    if (!open) return;

    api.get("/queue").then(({ data }) => setQueues(data)).catch(toastError);
    api
      .get("/ai-settings")
      .then(({ data }) => setModels(data?.enabledModels || []))
      .catch(toastError);

    if (agentId) {
      api
        .get(`/agents/${agentId}`)
        .then(({ data }) => {
          setInitialValues({
            name: data.name || "",
            skillPrompt: data.skillPrompt || "",
            model: data.model || "",
            temperature: data.temperature ?? 0.7,
            handoffMarker: data.handoffMarker || "HUMANO_SOLICITADO",
            fallbackQueueId: data.fallbackQueueId || "",
          });
        })
        .catch(toastError);
    } else {
      setInitialValues({
        name: "",
        skillPrompt: "",
        model: "",
        temperature: 0.7,
        handoffMarker: "HUMANO_SOLICITADO",
        fallbackQueueId: "",
      });
    }
  }, [agentId, open]);

  const handleSave = async (values, actions) => {
    try {
      const payload = {
        ...values,
        fallbackQueueId: values.fallbackQueueId || null,
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
        {({ touched, errors, isSubmitting, values }) => (
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
                rows={10}
                fullWidth
                variant="outlined"
                margin="dense"
                placeholder="Você é a Luiza, consultora digital da concessionária..."
                error={touched.skillPrompt && Boolean(errors.skillPrompt)}
                helperText={touched.skillPrompt && errors.skillPrompt}
              />

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

              <Field
                as={TextField}
                label="Temperatura (0 a 1)"
                name="temperature"
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 1 }}
                variant="outlined"
                margin="dense"
              />

              <Field
                as={TextField}
                label="Marcador de transferência para humano"
                name="handoffMarker"
                fullWidth
                variant="outlined"
                margin="dense"
                helperText="Quando a resposta da IA contiver esse texto, o ticket é transferido e o marcador não é enviado ao cliente"
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
