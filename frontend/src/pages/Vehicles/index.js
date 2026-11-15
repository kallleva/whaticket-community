import React, { useEffect, useState, useCallback } from "react";

import openSocket from "../../services/socket-io";

import {
  Button,
  IconButton,
  makeStyles,
  Paper,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
} from "@material-ui/core";
import { DeleteOutline, Edit } from "@material-ui/icons";
import SearchIcon from "@material-ui/icons/Search";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import ResponsiveTable from "../../components/ResponsiveTable";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ConfirmationModal from "../../components/ConfirmationModal";
import VehicleModal from "../../components/VehicleModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

const STATUS_LABEL = {
  available: { label: "Disponível", color: "primary" },
  reserved: { label: "Reservado", color: "secondary" },
  sold: { label: "Vendido", color: "default" },
  maintenance: { label: "Manutenção", color: "default" },
};

const Vehicles = () => {
  const classes = useStyles();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchVehicles = useCallback(() => {
    setLoading(true);
    api
      .get("/vehicles", { params: { searchParam } })
      .then(({ data }) => setVehicles(data))
      .catch(toastError)
      .finally(() => setLoading(false));
  }, [searchParam]);

  useEffect(() => {
    const delay = setTimeout(fetchVehicles, 400);
    return () => clearTimeout(delay);
  }, [fetchVehicles]);

  useEffect(() => {
    const socket = openSocket();

    socket.on("vehicle", (data) => {
      if (data.action === "update" || data.action === "delete") {
        fetchVehicles();
      }
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (vehicleId) => {
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      toast.success("Veículo excluído!");
      fetchVehicles();
    } catch (err) {
      toastError(err);
    }
    setSelectedVehicle(null);
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={selectedVehicle && `Excluir ${selectedVehicle.brand} ${selectedVehicle.model}?`}
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={() => handleDelete(selectedVehicle.id)}
      >
        Esta ação não pode ser desfeita.
      </ConfirmationModal>
      <VehicleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        vehicleId={selectedVehicle?.id}
        onSaved={fetchVehicles}
      />
      <MainHeader>
        <Title>Estoque de Veículos</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder="Buscar marca, modelo ou placa"
            size="small"
            value={searchParam}
            onChange={(e) => setSearchParam(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSelectedVehicle(null);
              setModalOpen(true);
            }}
          >
            Novo Veículo
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <ResponsiveTable>
          <TableHead>
            <TableRow>
              <TableCell align="center">Marca / Modelo</TableCell>
              <TableCell align="center">Ano</TableCell>
              <TableCell align="center">Cor</TableCell>
              <TableCell align="center">Placa</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell align="center">
                  {vehicle.brand} {vehicle.model} {vehicle.version || ""}
                </TableCell>
                <TableCell align="center">{vehicle.year || "-"}</TableCell>
                <TableCell align="center">{vehicle.color || "-"}</TableCell>
                <TableCell align="center">{vehicle.plate || "-"}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={STATUS_LABEL[vehicle.status]?.label || vehicle.status}
                    color={STATUS_LABEL[vehicle.status]?.color}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setModalOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setConfirmOpen(true);
                    }}
                  >
                    <DeleteOutline />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {loading && <TableRowSkeleton columns={6} />}
            {!loading && vehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {searchParam
                    ? "Nenhum veículo encontrado para essa busca."
                    : "Nenhum veículo no estoque ainda. Clique em \"Novo Veículo\" para cadastrar."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ResponsiveTable>
      </Paper>
    </MainContainer>
  );
};

export default Vehicles;
