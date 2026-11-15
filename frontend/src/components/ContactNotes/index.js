import React, { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Box,
  Tooltip,
} from "@material-ui/core";
import NoteIcon from "@material-ui/icons/Notes";
import AddIcon from "@material-ui/icons/Add";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import ConfirmationModal from "../ConfirmationModal";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  card: {
    margin: theme.spacing(2, 0),
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  header: {
    backgroundColor: theme.palette.action.selected || "#f5f5f5",
    padding: theme.spacing(1.5, 2),
  },
  content: {
    padding: theme.spacing(2),
  },
  actions: {
    padding: theme.spacing(1, 2),
    justifyContent: "flex-end",
  },
  noteCard: {
    marginBottom: theme.spacing(1.5),
    borderRadius: 8,
  },
  noteHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noteAuthorBox: {
    display: "flex",
    alignItems: "center",
  },
  noteAvatar: {
    width: 28,
    height: 28,
    fontSize: 14,
    marginRight: theme.spacing(1),
  },
  noteText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    marginTop: theme.spacing(1),
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(3),
    color: theme.palette.text.secondary,
  },
}));

const ContactNotes = ({ contactId }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  useEffect(() => {
    if (!contactId) return;

    const fetchNotes = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/contacts/${contactId}/notes`);
        setNotes(data);
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [contactId]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !contactId) return;
    setSaving(true);
    try {
      const { data } = await api.post(`/contacts/${contactId}/notes`, {
        note: newNote.trim(),
      });
      setNotes((prev) => [data, ...prev]);
      setNewNote("");
      toast.success("Observação adicionada!");
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    try {
      await api.delete(`/contacts/${contactId}/notes/${noteToDelete.id}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
      toast.success("Observação excluída!");
    } catch (err) {
      toastError(err);
    } finally {
      setNoteToDelete(null);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm");
    } catch {
      return dateStr;
    }
  };

  const canDelete = (note) =>
    user?.profile === "admin" || String(note.userId) === String(user?.id);

  return (
    <Card className={classes.card} variant="outlined">
      <ConfirmationModal
        title="Excluir observação?"
        open={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleDeleteNote}
      >
        Esta ação não pode ser desfeita.
      </ConfirmationModal>

      <CardHeader
        className={classes.header}
        avatar={<NoteIcon color="primary" />}
        title={
          <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
            Observações do Cliente
          </Typography>
        }
        subheader="Histórico de anotações dos atendimentos"
      />
      <Divider />
      <CardContent className={classes.content}>
        <TextField
          label="Nova observação"
          multiline
          rows={3}
          fullWidth
          variant="outlined"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Ex: Cliente tem interesse no plano anual. Enviado orçamento por e-mail."
          disabled={saving}
        />
      </CardContent>
      <CardActions className={classes.actions}>
        <Button
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
          onClick={handleAddNote}
          disabled={saving || !newNote.trim()}
        >
          Adicionar Anotação
        </Button>
      </CardActions>
      <Divider />
      <CardContent className={classes.content}>
        {loading && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && notes.length === 0 && (
          <Typography className={classes.emptyState}>
            Nenhuma observação cadastrada para este cliente. Adicione a primeira acima!
          </Typography>
        )}

        {!loading &&
          notes.map((note) => (
            <Card key={note.id} variant="outlined" className={classes.noteCard}>
              <CardContent>
                <Box className={classes.noteHeader}>
                  <Box className={classes.noteAuthorBox}>
                    <Avatar className={classes.noteAvatar}>
                      {(note.user?.name || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" style={{ fontWeight: 600 }}>
                        {note.user?.name || "Importado"}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(note.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                  {canDelete(note) && (
                    <Tooltip title="Excluir observação">
                      <IconButton
                        size="small"
                        onClick={() => setNoteToDelete(note)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" className={classes.noteText}>
                  {note.note}
                </Typography>
              </CardContent>
            </Card>
          ))}
      </CardContent>
    </Card>
  );
};

export default ContactNotes;
