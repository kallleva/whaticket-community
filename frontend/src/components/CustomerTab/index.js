import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Grid,
  Paper,
  Typography,
  Avatar,
  Button,
  Chip,
  Divider,
  Box,
  Link,
  Card,
  CardHeader,
  CardContent,
  TextField,
  MenuItem,
} from "@material-ui/core";
import PersonIcon from "@material-ui/icons/Person";
import PhoneIcon from "@material-ui/icons/Phone";
import EmailIcon from "@material-ui/icons/Email";
import EditIcon from "@material-ui/icons/Edit";
import ConfirmationNumberIcon from "@material-ui/icons/ConfirmationNumber";
import InfoIcon from "@material-ui/icons/Info";
import AssignmentIcon from "@material-ui/icons/Assignment";
import EventOutlinedIcon from "@material-ui/icons/EventOutlined";
import DriveEtaOutlinedIcon from "@material-ui/icons/DriveEtaOutlined";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";

import ContactModal from "../ContactModal";
import ContactNotes from "../ContactNotes";
import MarkdownWrapper from "../MarkdownWrapper";
import ReminderModal from "../ReminderModal";
import TestDriveModal from "../TestDriveModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(3),
    height: "100%",
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  card: {
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  cardHeader: {
    backgroundColor: theme.palette.action.selected || "#f5f5f5",
    padding: theme.spacing(1.5, 2),
  },
  avatar: {
    width: 80,
    height: 80,
    marginBottom: theme.spacing(1),
  },
  profileBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: theme.spacing(2),
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    marginTop: theme.spacing(1),
    "& svg": {
      marginRight: theme.spacing(1),
      color: theme.palette.text.secondary,
    },
  },
  extraFieldCard: {
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderRadius: 6,
  },
  statusChip: {
    marginLeft: theme.spacing(1),
  },
  leadStatusRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  field: {
    marginTop: theme.spacing(1.5),
  },
}));

const LEAD_STATUS_OPTIONS = [
  { value: "hot", label: "🔥 Quente", color: "#e53935" },
  { value: "warm", label: "⛅ Morno", color: "#fb8c00" },
  { value: "cold", label: "❄️ Frio", color: "#1e88e5" },
  { value: "won", label: "💰 Fechado", color: "#43a047" },
  { value: "lost", label: "❌ Perdido", color: "#757575" },
];

const PIPELINE_STAGE_OPTIONS = [
  { value: "lead", label: "🎯 Novo Lead" },
  { value: "contacted", label: "📞 Primeiro Contato" },
  { value: "negotiating", label: "🤝 Em Negociação" },
  { value: "proposal", label: "📄 Proposta Enviada" },
  { value: "won", label: "🎉 Fechamento" },
  { value: "lost", label: "❌ Perdido" },
];

const CustomerTab = ({ contact, ticket }) => {
  const classes = useStyles();
  const [modalOpen, setModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [testDriveModalOpen, setTestDriveModalOpen] = useState(false);
  const [localContact, setLocalContact] = useState(contact);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalContact(contact);
  }, [contact]);

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return "-";
      return format(parseISO(dateStr), "dd/MM/yyyy HH:mm");
    } catch {
      return dateStr;
    }
  };

  const persistContact = async (changes) => {
    if (!localContact?.id) return;
    const payload = {
      name: localContact.name,
      number: localContact.number,
      email: localContact.email,
      address: localContact.address,
      birthDate: localContact.birthDate,
      document: localContact.document,
      leadStatus: localContact.leadStatus,
      pipelineStage: localContact.pipelineStage,
      ...changes,
    };

    setSaving(true);
    try {
      await api.put(`/contacts/${localContact.id}`, payload);
      setLocalContact((prev) => ({ ...prev, ...changes }));
      toast.success("Dados do cliente atualizados!");
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldBlur = (field) => (e) => {
    const value = e.target.value;
    if (value === (contact?.[field] || "")) return;
    persistContact({ [field]: value });
  };

  const handleLeadStatusClick = (value) => {
    if (value === localContact?.leadStatus) return;
    setLocalContact((prev) => ({ ...prev, leadStatus: value }));
    persistContact({ leadStatus: value });
  };

  const handlePipelineStageChange = (e) => {
    const value = e.target.value;
    setLocalContact((prev) => ({ ...prev, pipelineStage: value }));
    persistContact({ pipelineStage: value });
  };

  return (
    <div className={classes.container}>
      <ContactModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contactId={contact?.id}
      />

      <ReminderModal
        open={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        contactId={contact?.id}
        ticketId={ticket?.id}
      />

      <TestDriveModal
        open={testDriveModalOpen}
        onClose={() => setTestDriveModalOpen(false)}
        contactId={contact?.id}
        contactName={contact?.name}
        ticketId={ticket?.id}
      />

      <Grid container spacing={3}>
        {/* Card 1: Perfil do Cliente */}
        <Grid item xs={12} md={5}>
          <Card className={classes.card} variant="outlined">
            <CardHeader
              className={classes.cardHeader}
              avatar={<PersonIcon color="primary" />}
              title={<Typography variant="subtitle1" style={{ fontWeight: 600 }}>Dados do Cliente</Typography>}
            />
            <Divider />
            <Box
              display="flex"
              flexWrap="wrap"
              style={{ gap: 8, padding: 12 }}
            >
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<EventOutlinedIcon />}
                onClick={() => setReminderModalOpen(true)}
              >
                Lembrete
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<DriveEtaOutlinedIcon />}
                onClick={() => setTestDriveModalOpen(true)}
              >
                Test-Drive
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => setModalOpen(true)}
              >
                Editar
              </Button>
            </Box>
            <Divider />
            <CardContent>
              <Box className={classes.profileBox}>
                <Avatar
                  src={contact?.profilePicUrl}
                  alt={contact?.name}
                  className={classes.avatar}
                >
                  {contact?.name?.charAt(0)}
                </Avatar>
                <Typography variant="h6" style={{ fontWeight: 600 }}>
                  {contact?.name || "Sem nome"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ID Contato: #{contact?.id}
                </Typography>
              </Box>

              <Divider style={{ margin: "12px 0" }} />

              <Box className={classes.infoRow}>
                <PhoneIcon />
                <Typography variant="body2">
                  <Link href={`tel:${contact?.number}`} color="inherit">
                    {contact?.number || "Sem telefone"}
                  </Link>
                </Typography>
              </Box>

              <Box className={classes.infoRow}>
                <EmailIcon />
                <Typography variant="body2">
                  {contact?.email ? (
                    <Link href={`mailto:${contact?.email}`} color="inherit">
                      {contact?.email}
                    </Link>
                  ) : (
                    "Nenhum e-mail cadastrado"
                  )}
                </Typography>
              </Box>

              <Box className={classes.infoRow}>
                <ConfirmationNumberIcon />
                <Typography variant="body2">
                  Atendimento atual: Ticket #{ticket?.id}
                </Typography>
                <Chip
                  label={ticket?.status?.toUpperCase()}
                  size="small"
                  color={ticket?.status === "open" ? "primary" : "default"}
                  className={classes.statusChip}
                />
              </Box>

              {ticket?.user && (
                <Box className={classes.infoRow}>
                  <PersonIcon />
                  <Typography variant="body2">
                    Vendedor / Atendente: <strong>{ticket.user.name}</strong>
                  </Typography>
                </Box>
              )}

              {contact?.owner && (
                <Box className={classes.infoRow}>
                  <PersonIcon />
                  <Typography variant="body2">
                    Carteira (dono do cliente): <strong>{contact.owner.name}</strong>
                  </Typography>
                </Box>
              )}

              {ticket?.createdAt && (
                <Box className={classes.infoRow}>
                  <InfoIcon />
                  <Typography variant="caption" color="textSecondary">
                    Início: {formatDate(ticket.createdAt)}
                  </Typography>
                </Box>
              )}

              <Divider style={{ margin: "12px 0" }} />

              <TextField
                className={classes.field}
                label="Endereço"
                fullWidth
                multiline
                defaultValue={contact?.address || ""}
                key={`address-${contact?.id}-${contact?.address}`}
                onBlur={handleFieldBlur("address")}
                disabled={saving}
                variant="outlined"
                size="small"
              />

              <TextField
                className={classes.field}
                label="Data de Nascimento"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                defaultValue={contact?.birthDate || ""}
                key={`birthDate-${contact?.id}-${contact?.birthDate}`}
                onBlur={handleFieldBlur("birthDate")}
                disabled={saving}
                variant="outlined"
                size="small"
              />

              <TextField
                className={classes.field}
                label="CPF / CNPJ"
                fullWidth
                defaultValue={contact?.document || ""}
                key={`document-${contact?.id}-${contact?.document}`}
                onBlur={handleFieldBlur("document")}
                disabled={saving}
                variant="outlined"
                size="small"
              />
            </CardContent>
          </Card>

          {/* Card: Temperatura e Funil de Vendas */}
          <Box mt={2}>
            <Card className={classes.card} variant="outlined">
              <CardHeader
                className={classes.cardHeader}
                avatar={<AssignmentIcon color="primary" />}
                title={<Typography variant="subtitle1" style={{ fontWeight: 600 }}>CRM de Vendas</Typography>}
              />
              <Divider />
              <CardContent>
                <Typography variant="caption" color="textSecondary">
                  Temperatura do Lead
                </Typography>
                <Box className={classes.leadStatusRow}>
                  {LEAD_STATUS_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      clickable
                      onClick={() => handleLeadStatusClick(option.value)}
                      style={{
                        backgroundColor:
                          localContact?.leadStatus === option.value
                            ? option.color
                            : undefined,
                        color:
                          localContact?.leadStatus === option.value
                            ? "#fff"
                            : undefined,
                        fontWeight:
                          localContact?.leadStatus === option.value ? 600 : 400,
                      }}
                      variant={
                        localContact?.leadStatus === option.value
                          ? "default"
                          : "outlined"
                      }
                    />
                  ))}
                </Box>

                <TextField
                  className={classes.field}
                  select
                  label="Etapa do Funil"
                  fullWidth
                  value={localContact?.pipelineStage || "lead"}
                  onChange={handlePipelineStageChange}
                  disabled={saving}
                  variant="outlined"
                  size="small"
                >
                  {PIPELINE_STAGE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </CardContent>
            </Card>
          </Box>

          {/* Card: Campos Customizados Extras */}
          {contact?.extraInfo && contact.extraInfo.length > 0 && (
            <Box mt={2}>
              <Card className={classes.card} variant="outlined">
                <CardHeader
                  className={classes.cardHeader}
                  avatar={<InfoIcon color="primary" />}
                  title={<Typography variant="subtitle1" style={{ fontWeight: 600 }}>Campos Adicionais</Typography>}
                />
                <Divider />
                <CardContent>
                  {contact.extraInfo.map((info) => (
                    <Paper
                      key={info.id}
                      variant="outlined"
                      className={classes.extraFieldCard}
                    >
                      <Typography variant="caption" color="textSecondary" style={{ fontWeight: 600 }}>
                        {info.name}
                      </Typography>
                      <Typography variant="body2">
                        <MarkdownWrapper>{info.value}</MarkdownWrapper>
                      </Typography>
                    </Paper>
                  ))}
                </CardContent>
              </Card>
            </Box>
          )}
        </Grid>

        {/* Card: Observações do Cliente (múltiplos cards) */}
        <Grid item xs={12} md={7}>
          <ContactNotes contactId={contact?.id} />
        </Grid>
      </Grid>
    </div>
  );
};

export default CustomerTab;
