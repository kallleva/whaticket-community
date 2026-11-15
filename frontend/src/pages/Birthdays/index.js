import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

import {
  Button,
  Checkbox,
  makeStyles,
  Paper,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Chip,
} from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import ResponsiveTable from "../../components/ResponsiveTable";
import TableRowSkeleton from "../../components/TableRowSkeleton";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  messageField: {
    minWidth: 280,
  },
}));

const statusLabel = {
  pending: { label: "Pendente", color: "primary" },
  sent: { label: "Enviado", color: undefined },
  skipped: { label: "Ignorado", color: "default" },
};

const Birthdays = () => {
  const classes = useStyles();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sending, setSending] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/birthday-messages");
      setEntries(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const toggleSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleMessageChange = (id, value) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, messageBody: value } : entry
      )
    );
  };

  const handleMessageBlur = async (entry) => {
    try {
      await api.put(`/birthday-messages/${entry.id}`, {
        messageBody: entry.messageBody,
      });
    } catch (err) {
      toastError(err);
    }
  };

  const handleSkip = async (entry) => {
    try {
      await api.put(`/birthday-messages/${entry.id}`, { status: "skipped" });
      fetchEntries();
    } catch (err) {
      toastError(err);
    }
  };

  const handleSendSelected = async () => {
    if (selectedIds.length === 0) return;
    setSending(true);
    try {
      const items = selectedIds.map((id) => {
        const entry = entries.find((e) => e.id === id);
        return { id, messageBody: entry?.messageBody };
      });
      await api.post("/birthday-messages/send", { items });
      toast.success("Mensagens de aniversário enviadas!");
      setSelectedIds([]);
      fetchEntries();
    } catch (err) {
      toastError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Aniversários do Dia</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            disabled={selectedIds.length === 0 || sending}
            onClick={handleSendSelected}
          >
            Enviar Selecionados ({selectedIds.length})
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <ResponsiveTable>
          <TableHead>
            <TableRow>
              <TableCell align="center"> </TableCell>
              <TableCell align="center">Contato</TableCell>
              <TableCell align="center">Telefone</TableCell>
              <TableCell align="center">Mensagem</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell align="center">
                  {entry.status === "pending" && (
                    <Checkbox
                      checked={selectedIds.includes(entry.id)}
                      onChange={() => toggleSelected(entry.id)}
                    />
                  )}
                </TableCell>
                <TableCell align="center">{entry.contact?.name}</TableCell>
                <TableCell align="center">{entry.contact?.number}</TableCell>
                <TableCell align="center">
                  <TextField
                    className={classes.messageField}
                    value={entry.messageBody}
                    onChange={(e) =>
                      handleMessageChange(entry.id, e.target.value)
                    }
                    onBlur={() => handleMessageBlur(entry)}
                    disabled={entry.status !== "pending"}
                    multiline
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={statusLabel[entry.status]?.label || entry.status}
                    color={statusLabel[entry.status]?.color}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {entry.status === "pending" && (
                    <Button size="small" onClick={() => handleSkip(entry)}>
                      Ignorar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {loading && <TableRowSkeleton columns={6} />}
            {!loading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhum aniversariante hoje.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ResponsiveTable>
      </Paper>
    </MainContainer>
  );
};

export default Birthdays;
