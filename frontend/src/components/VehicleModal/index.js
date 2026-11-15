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

const VehicleSchema = Yup.object().shape({
  brand: Yup.string().required("Obrigatório"),
  model: Yup.string().required("Obrigatório"),
});

const STATUS_OPTIONS = [
  { value: "available", label: "Disponível" },
  { value: "reserved", label: "Reservado" },
  { value: "sold", label: "Vendido" },
  { value: "maintenance", label: "Manutenção" },
];

const initialState = {
  brand: "",
  model: "",
  version: "",
  year: "",
  color: "",
  plate: "",
  status: "available",
  price: "",
};

const VehicleModal = ({ open, onClose, vehicleId, onSaved }) => {
  const [initialValues, setInitialValues] = useState(initialState);

  useEffect(() => {
    if (!open) return;

    if (vehicleId) {
      api
        .get(`/vehicles/${vehicleId}`)
        .then(({ data }) => setInitialValues({ ...initialState, ...data }))
        .catch(toastError);
    } else {
      setInitialValues(initialState);
    }
  }, [vehicleId, open]);

  const handleSave = async (values, actions) => {
    try {
      const payload = {
        ...values,
        year: values.year ? Number(values.year) : null,
        price: values.price ? Number(values.price) : null,
      };

      if (vehicleId) {
        await api.put(`/vehicles/${vehicleId}`, payload);
      } else {
        await api.post("/vehicles", payload);
      }

      toast.success("Veículo salvo com sucesso!");
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
      <DialogTitle>{vehicleId ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={VehicleSchema}
        onSubmit={(values, actions) => handleSave(values, actions)}
      >
        {({ touched, errors, isSubmitting }) => (
          <Form>
            <DialogContent dividers>
              <Field
                as={TextField}
                label="Marca"
                name="brand"
                fullWidth
                variant="outlined"
                margin="dense"
                error={touched.brand && Boolean(errors.brand)}
                helperText={touched.brand && errors.brand}
              />
              <Field
                as={TextField}
                label="Modelo"
                name="model"
                fullWidth
                variant="outlined"
                margin="dense"
                error={touched.model && Boolean(errors.model)}
                helperText={touched.model && errors.model}
              />
              <Field
                as={TextField}
                label="Versão"
                name="version"
                fullWidth
                variant="outlined"
                margin="dense"
              />
              <Field
                as={TextField}
                label="Ano"
                name="year"
                type="number"
                fullWidth
                variant="outlined"
                margin="dense"
              />
              <Field
                as={TextField}
                label="Cor"
                name="color"
                fullWidth
                variant="outlined"
                margin="dense"
              />
              <Field
                as={TextField}
                label="Placa"
                name="plate"
                fullWidth
                variant="outlined"
                margin="dense"
              />
              <Field
                as={TextField}
                label="Preço (R$)"
                name="price"
                type="number"
                fullWidth
                variant="outlined"
                margin="dense"
              />
              <FormControl variant="outlined" margin="dense" fullWidth>
                <InputLabel>Status</InputLabel>
                <Field as={Select} name="status" label="Status">
                  {STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
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

export default VehicleModal;
