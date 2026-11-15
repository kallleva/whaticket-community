import React, { useEffect, useReducer, useState } from "react";
import { useHistory } from "react-router-dom";

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
} from "@material-ui/core";
import { DeleteOutline, Edit } from "@material-ui/icons";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import ResponsiveTable from "../../components/ResponsiveTable";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ConfirmationModal from "../../components/ConfirmationModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { format, parseISO } from "date-fns";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_FLOWS") {
    const flows = action.payload;
    const newFlows = [];

    flows.forEach((flow) => {
      const index = state.findIndex((f) => f.id === flow.id);
      if (index !== -1) {
        state[index] = flow;
      } else {
        newFlows.push(flow);
      }
    });

    return [...state, ...newFlows];
  }

  if (action.type === "UPDATE_FLOW") {
    const flow = action.payload;
    const index = state.findIndex((f) => f.id === flow.id);
    if (index !== -1) {
      state[index] = flow;
      return [...state];
    }
    return [flow, ...state];
  }

  if (action.type === "DELETE_FLOW") {
    const flowId = action.payload;
    return state.filter((f) => f.id !== flowId);
  }

  if (action.type === "RESET") {
    return [];
  }

  return state;
};

const Flows = () => {
  const classes = useStyles();
  const history = useHistory();

  const [flows, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/flows")
      .then(({ data }) => dispatch({ type: "LOAD_FLOWS", payload: data }))
      .catch(toastError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = openSocket();

    socket.on("flow", (data) => {
      if (data.action === "update") {
        dispatch({ type: "UPDATE_FLOW", payload: data.flow });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_FLOW", payload: data.flowId });
      }
    });

    return () => socket.disconnect();
  }, []);

  const handleAddFlow = async () => {
    try {
      const { data } = await api.post("/flows", { name: "Novo Funil" });
      history.push(`/flows/${data.id}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleDeleteFlow = async (flowId) => {
    try {
      await api.delete(`/flows/${flowId}`);
      toast.success("Funil excluído!");
      dispatch({ type: "DELETE_FLOW", payload: flowId });
    } catch (err) {
      toastError(err);
    }
    setSelectedFlow(null);
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={selectedFlow && `Excluir o funil ${selectedFlow.name}?`}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteFlow(selectedFlow.id)}
      >
        Esta ação não pode ser desfeita.
      </ConfirmationModal>
      <MainHeader>
        <Title>Funis</Title>
        <MainHeaderButtonsWrapper>
          <Button variant="contained" color="primary" onClick={handleAddFlow}>
            Novo Funil
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <ResponsiveTable>
          <TableHead>
            <TableRow>
              <TableCell align="center">Nome</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Conexão</TableCell>
              <TableCell align="center">Última edição</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flows.map((flow) => (
              <TableRow key={flow.id}>
                <TableCell align="center">{flow.name}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={flow.status === "draft" ? "Rascunho" : flow.status}
                    size="small"
                    color={flow.status === "draft" ? "default" : "primary"}
                  />
                </TableCell>
                <TableCell align="center">{flow.whatsapp?.name || "Nenhuma"}</TableCell>
                <TableCell align="center">
                  {flow.updatedByUser?.name
                    ? `${flow.updatedByUser.name} em ${format(
                        parseISO(flow.updatedAt),
                        "dd/MM/yyyy HH:mm"
                      )}`
                    : "-"}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => history.push(`/flows/${flow.id}`)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedFlow(flow);
                      setConfirmModalOpen(true);
                    }}
                  >
                    <DeleteOutline />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {loading && <TableRowSkeleton columns={5} />}
            {!loading && flows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nenhum funil criado ainda. Clique em "Novo Funil" para montar o primeiro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ResponsiveTable>
      </Paper>
    </MainContainer>
  );
};

export default Flows;
