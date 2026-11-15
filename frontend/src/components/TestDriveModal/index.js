import React, { useState, useEffect, useContext } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import Autocomplete from "@material-ui/lab/Autocomplete";

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
import { AuthContext } from "../../context/Auth/AuthContext";

const TestDriveSchema = Yup.object().shape({
  scheduledAt: Yup.string().required("Obrigatório"),
});

const TestDriveModal = ({
  open,
  onClose,
  testDriveId,
  contactId,
  contactName,
  ticketId,
  onSaved,
}) => {
  const { user } = useContext(AuthContext);

  const [initialValues, setInitialValues] = useState({
    scheduledAt: "",
    vehicleId: "",
    userId: user?.id || "",
    notes: "",
    status: "scheduled",
  });
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [contactOptions, setContactOptions] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState(
    contactId ? { id: contactId, name: contactName } : null
  );

  useEffect(() => {
    if (!open) return;

    api.get("/vehicles", { params: { status: "available" } }).then(({ data }) => setVehicles(data)).catch(toastError);
    api.get("/users").then(({ data }) => setUsers(data.users || [])).catch(toastError);

    setSelectedContact(contactId ? { id: contactId, name: contactName } : null);

    if (testDriveId) {
      api
        .get(`/test-drives/${testDriveId}`)
        .then(({ data }) => {
          setInitialValues({
            scheduledAt: data.scheduledAt ? data.scheduledAt.slice(0, 16) : "",
            vehicleId: data.vehicleId || "",
            userId: data.userId || "",
            notes: data.notes || "",
            status: data.status || "scheduled",
          });
          setSelectedContact(data.contact);
        })
        .catch(toastError);
    } else {
      setInitialValues({
        scheduledAt: "",
        vehicleId: "",
        userId: user?.id || "",
        notes: "",
        status: "scheduled",
      });
    }
  }, [testDriveId, open, contactId, contactName, user]);

  useEffect(() => {
    if (contactId || contactSearch.length < 2) return;
    const delay = setTimeout(() => {
      api
        .get("/contacts", { params: { searchParam: contactSearch } })
        .then(({ data }) => setContactOptions(data.contacts || []))
        .catch(toastError);
    }, 400);
    return () => clearTimeout(delay);
  }, [contactSearch, contactId]);

  const handleSave = async (values, actions) => {
    if (!selectedContact?.id) {
      toast.error("Selecione um cliente");
      actions.setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...values,
        contactId: selectedContact.id,
        ticketId: ticketId || undefined,
        vehicleId: values.vehicleId || null,
        userId: values.userId || null,
      };

      if (testDriveId) {
        await api.put(`/test-drives/${testDriveId}`, payload);
      } else {
        await api.post("/test-drives", payload);
      }

      toast.success("Test-drive agendado! O cliente recebeu a confirmação por WhatsApp.");
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
      <DialogTitle>
        {testDriveId ? "Editar Test-Drive" : "Agendar Test-Drive"}
      </DialogTitle>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={TestDriveSchema}
        onSubmit={(values, actions) => handleSave(values, actions)}
      >
        {({ touched, errors, isSubmitting }) => (
          <Form>
            <DialogContent dividers>
              {!contactId && (
                <Autocomplete
                  options={contactOptions}
                  value={selectedContact}
                  getOptionLabel={(option) =>
                    option?.name ? `${option.name} - ${option.number || ""}` : ""
                  }
                  onChange={(_, value) => setSelectedContact(value)}
                  onInputChange={(_, value) => setContactSearch(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cliente"
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  )}
                />
              )}
              {contactId && (
                <TextField
                  label="Cliente"
                  value={contactName || ""}
                  disabled
                  fullWidth
                  variant="outlined"
                  margin="dense"
                />
              )}

              <Field
                as={TextField}
                label="Data e hora"
                name="scheduledAt"
                type="datetime-local"
                fullWidth
                variant="outlined"
                margin="dense"
                InputLabelProps={{ shrink: true }}
                error={touched.scheduledAt && Boolean(errors.scheduledAt)}
                helperText={touched.scheduledAt && errors.scheduledAt}
              />

              <FormControl variant="outlined" margin="dense" fullWidth>
                <InputLabel>Veículo (opcional)</InputLabel>
                <Field as={Select} name="vehicleId" label="Veículo (opcional)">
                  <MenuItem value="">
                    <em>Nenhum</em>
                  </MenuItem>
                  {vehicles.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.brand} {v.model} {v.version || ""}
                    </MenuItem>
                  ))}
                </Field>
              </FormControl>

              <FormControl variant="outlined" margin="dense" fullWidth>
                <InputLabel>Vendedor responsável</InputLabel>
                <Field as={Select} name="userId" label="Vendedor responsável">
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name}
                    </MenuItem>
                  ))}
                </Field>
              </FormControl>

              {testDriveId && (
                <FormControl variant="outlined" margin="dense" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Field as={Select} name="status" label="Status">
                    <MenuItem value="scheduled">Agendado</MenuItem>
                    <MenuItem value="confirmed">Confirmado</MenuItem>
                    <MenuItem value="completed">Realizado</MenuItem>
                    <MenuItem value="cancelled">Cancelado</MenuItem>
                    <MenuItem value="no_show">Não compareceu</MenuItem>
                  </Field>
                </FormControl>
              )}

              <Field
                as={TextField}
                label="Observações"
                name="notes"
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                margin="dense"
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

export default TestDriveModal;
