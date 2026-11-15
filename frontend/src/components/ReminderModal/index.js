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
} from "@material-ui/core";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const ReminderSchema = Yup.object().shape({
  description: Yup.string().required("Obrigatório"),
  dueDate: Yup.string().required("Obrigatório"),
});

const ReminderModal = ({ open, onClose, contactId, ticketId, onSaved }) => {
  const [initialValues, setInitialValues] = useState({
    description: "",
    dueDate: "",
  });

  useEffect(() => {
    if (open) {
      setInitialValues({ description: "", dueDate: "" });
    }
  }, [open]);

  const handleSave = async (values, actions) => {
    try {
      await api.post("/reminders", {
        ...values,
        contactId: contactId || undefined,
        ticketId: ticketId || undefined,
      });
      toast.success("Lembrete criado com sucesso!");
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
      <DialogTitle>Novo Lembrete</DialogTitle>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={ReminderSchema}
        onSubmit={(values, actions) => handleSave(values, actions)}
      >
        {({ touched, errors, isSubmitting }) => (
          <Form>
            <DialogContent dividers>
              <Field
                as={TextField}
                label="Descrição"
                name="description"
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                margin="dense"
                error={touched.description && Boolean(errors.description)}
                helperText={touched.description && errors.description}
              />
              <Field
                as={TextField}
                label="Data e hora"
                name="dueDate"
                type="datetime-local"
                fullWidth
                variant="outlined"
                margin="dense"
                InputLabelProps={{ shrink: true }}
                error={touched.dueDate && Boolean(errors.dueDate)}
                helperText={touched.dueDate && errors.dueDate}
              />
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

export default ReminderModal;
