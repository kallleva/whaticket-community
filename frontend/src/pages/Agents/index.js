import React, { useEffect, useReducer, useState } from "react";

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
import AgentModal from "../../components/AgentModal";
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

const reducer = (state, action) => {
  if (action.type === "LOAD_AGENTS") {
    return action.payload;
  }

  if (action.type === "UPDATE_AGENT") {
    const agent = action.payload;
    const index = state.findIndex((a) => a.id === agent.id);
    if (index !== -1) {
      state[index] = agent;
      return [...state];
    }
    return [agent, ...state];
  }

  if (action.type === "DELETE_AGENT") {
    return state.filter((a) => a.id !== action.payload);
  }

  return state;
};

const Agents = () => {
  const classes = useStyles();

  const [agents, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchAgents = () => {
    setLoading(true);
    api
      .get("/agents")
      .then(({ data }) => dispatch({ type: "LOAD_AGENTS", payload: data }))
      .catch(toastError)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    const socket = openSocket();

    socket.on("agent", (data) => {
      if (data.action === "update") {
        dispatch({ type: "UPDATE_AGENT", payload: data.agent });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_AGENT", payload: data.agentId });
      }
    });

    return () => socket.disconnect();
  }, []);

  const handleDelete = async (agentId) => {
    try {
      await api.delete(`/agents/${agentId}`);
      toast.success("Agente excluído!");
      dispatch({ type: "DELETE_AGENT", payload: agentId });
    } catch (err) {
      toastError(err);
    }
    setSelectedAgent(null);
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={selectedAgent && `Excluir o agente ${selectedAgent.name}?`}
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={() => handleDelete(selectedAgent.id)}
      >
        Esta ação não pode ser desfeita.
      </ConfirmationModal>
      <AgentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        agentId={selectedAgent?.id}
        onSaved={fetchAgents}
      />
      <MainHeader>
        <Title>Agentes de IA</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSelectedAgent(null);
              setModalOpen(true);
            }}
          >
            Novo Agente
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <ResponsiveTable>
          <TableHead>
            <TableRow>
              <TableCell align="center">ID</TableCell>
              <TableCell align="center">Nome</TableCell>
              <TableCell align="center">Modelo</TableCell>
              <TableCell align="center">Fila de Fallback</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell align="center">{agent.id}</TableCell>
                <TableCell align="center">{agent.name}</TableCell>
                <TableCell align="center">{agent.model}</TableCell>
                <TableCell align="center">
                  {agent.fallbackQueue?.name || "-"}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setModalOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setConfirmOpen(true);
                    }}
                  >
                    <DeleteOutline />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {loading && <TableRowSkeleton columns={5} />}
            {!loading && agents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nenhum agente de IA cadastrado ainda. Clique em "Novo Agente" para criar o primeiro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ResponsiveTable>
      </Paper>
    </MainContainer>
  );
};

export default Agents;
