import React, { useState, useEffect, useCallback, useContext } from "react";
import { useHistory } from "react-router-dom";
import {
  format,
  parseISO,
  isBefore,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isToday,
} from "date-fns";

import {
  Button,
  IconButton,
  makeStyles,
  Paper,
  Box,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ButtonGroup,
} from "@material-ui/core";
import { DeleteOutline, CheckCircleOutline, LaunchOutlined } from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import ResponsiveTable from "../../components/ResponsiveTable";
import ConfirmationModal from "../../components/ConfirmationModal";
import ReminderModal from "../../components/ReminderModal";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import AgendaCalendar from "../../components/AgendaCalendar";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  calendarLayout: {
    display: "flex",
    gap: theme.spacing(3),
    flexWrap: "wrap",
    padding: theme.spacing(2),
  },
  calendarBox: {
    flex: "1 1 420px",
    minWidth: 340,
  },
  dayPanel: {
    flex: "1 1 320px",
    minWidth: 300,
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
}));

const CALENDAR_LEGEND = [
  { key: "reminder", label: "Lembrete", color: "#fb8c00" },
  { key: "testDrive", label: "Test-Drive", color: "#1e88e5" },
];

const VIEW_MODES = [
  { value: "list", label: "Lista" },
  { value: "calendar", label: "Calendário" },
];

const Reminders = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const history = useHistory();

  const [viewMode, setViewMode] = useState("list");

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Visão "Calendário" (unifica lembretes + test-drives, igual à Agenda de Test-Drive)
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [monthReminders, setMonthReminders] = useState([]);
  const [monthTestDrives, setMonthTestDrives] = useState([]);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reminders");
      setReminders(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthAgenda = useCallback(() => {
    const rangeStart = startOfWeek(startOfMonth(calendarMonth)).toISOString();
    const rangeEnd = endOfWeek(endOfMonth(calendarMonth)).toISOString();

    api
      .get("/reminders", { params: { startDate: rangeStart, endDate: rangeEnd } })
      .then(({ data }) => setMonthReminders(data))
      .catch(toastError);

    api
      .get("/test-drives", { params: { startDate: rangeStart, endDate: rangeEnd } })
      .then(({ data }) => setMonthTestDrives(data))
      .catch(toastError);
  }, [calendarMonth]);

  useEffect(() => {
    if (viewMode === "list") fetchReminders();
  }, [viewMode, fetchReminders]);

  useEffect(() => {
    if (viewMode === "calendar") fetchMonthAgenda();
  }, [viewMode, fetchMonthAgenda]);

  const handleMarkDone = async (reminder) => {
    try {
      await api.put(`/reminders/${reminder.id}`, { status: "done" });
      fetchReminders();
      fetchMonthAgenda();
      toast.success("Lembrete concluído!");
    } catch (err) {
      toastError(err);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/reminders/${deleting.id}`);
      toast.success("Lembrete excluído!");
      fetchReminders();
      fetchMonthAgenda();
    } catch (err) {
      toastError(err);
    } finally {
      setDeleting(null);
    }
  };

  const isOverdue = (reminder) =>
    reminder.status === "pending" && isBefore(parseISO(reminder.dueDate), new Date());

  const countsByDay = {};
  monthReminders.forEach((r) => {
    const key = format(parseISO(r.dueDate), "yyyy-MM-dd");
    countsByDay[key] = countsByDay[key] || {};
    countsByDay[key].reminder = (countsByDay[key].reminder || 0) + 1;
  });
  monthTestDrives.forEach((td) => {
    const key = format(parseISO(td.scheduledAt), "yyyy-MM-dd");
    countsByDay[key] = countsByDay[key] || {};
    countsByDay[key].testDrive = (countsByDay[key].testDrive || 0) + 1;
  });

  const dayReminders = monthReminders.filter((r) =>
    isSameDay(parseISO(r.dueDate), calendarDate)
  );
  const dayTestDrives = monthTestDrives.filter((td) =>
    isSameDay(parseISO(td.scheduledAt), calendarDate)
  );

  return (
    <MainContainer>
      <ConfirmationModal
        title="Excluir lembrete?"
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={handleDelete}
      >
        Esta ação não pode ser desfeita.
      </ConfirmationModal>
      <ReminderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          fetchReminders();
          fetchMonthAgenda();
        }}
      />
      <MainHeader>
        <Title>Agenda / Lembretes</Title>
        <ButtonGroup size="small" variant="outlined">
          {VIEW_MODES.map((mode) => (
            <Button
              key={mode.value}
              variant={viewMode === mode.value ? "contained" : "outlined"}
              color={viewMode === mode.value ? "primary" : "default"}
              onClick={() => setViewMode(mode.value)}
            >
              {mode.label}
            </Button>
          ))}
        </ButtonGroup>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setModalOpen(true)}
          >
            Novo Lembrete
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      {viewMode === "list" && (
        <Paper className={classes.mainPaper} variant="outlined">
          <ResponsiveTable>
            <TableHead>
              <TableRow>
                <TableCell align="center">Descrição</TableCell>
                <TableCell align="center">Contato / Ticket</TableCell>
                <TableCell align="center">Vencimento</TableCell>
                {user.profile === "admin" && (
                  <TableCell align="center">Responsável</TableCell>
                )}
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reminders.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell align="center">{reminder.description}</TableCell>
                  <TableCell align="center">
                    {reminder.contact?.name || reminder.ticket?.id
                      ? `${reminder.contact?.name || ""} ${
                          reminder.ticket?.id ? `#${reminder.ticket.id}` : ""
                        }`
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {format(parseISO(reminder.dueDate), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  {user.profile === "admin" && (
                    <TableCell align="center">{reminder.user?.name}</TableCell>
                  )}
                  <TableCell align="center">
                    {reminder.status === "done" ? (
                      <Chip label="Concluído" size="small" />
                    ) : isOverdue(reminder) ? (
                      <Chip label="Vencido" size="small" color="secondary" />
                    ) : (
                      <Chip label="Pendente" size="small" color="primary" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {reminder.status === "pending" && (
                      <IconButton
                        size="small"
                        onClick={() => handleMarkDone(reminder)}
                      >
                        <CheckCircleOutline />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => {
                        setDeleting(reminder);
                        setConfirmOpen(true);
                      }}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={6} />}
            </TableBody>
          </ResponsiveTable>
        </Paper>
      )}

      {viewMode === "calendar" && (
        <Paper className={classes.mainPaper} variant="outlined">
          <Box className={classes.calendarLayout}>
            <Box className={classes.calendarBox}>
              <AgendaCalendar
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                selectedDate={calendarDate}
                onSelectDate={setCalendarDate}
                countsByDay={countsByDay}
                legend={CALENDAR_LEGEND}
              />
            </Box>
            <Box className={classes.dayPanel}>
              <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                {format(calendarDate, "dd/MM/yyyy")}
                {isToday(calendarDate) && " (hoje)"}
              </Typography>
              <List>
                {dayReminders.map((reminder) => (
                  <ListItem key={`rem-${reminder.id}`} divider>
                    <ListItemText
                      primary={`${format(parseISO(reminder.dueDate), "HH:mm")} — ${reminder.description}`}
                      secondary={
                        `${reminder.contact?.name || "Sem cliente"}` +
                        (reminder.user?.name ? ` · ${reminder.user.name}` : "")
                      }
                    />
                    {reminder.status === "done" ? (
                      <Chip label="Concluído" size="small" style={{ marginRight: 8 }} />
                    ) : isOverdue(reminder) ? (
                      <Chip label="Vencido" size="small" color="secondary" style={{ marginRight: 8 }} />
                    ) : (
                      <Chip label="Pendente" size="small" color="primary" variant="outlined" style={{ marginRight: 8 }} />
                    )}
                    <ListItemSecondaryAction>
                      {reminder.status === "pending" && (
                        <IconButton size="small" onClick={() => handleMarkDone(reminder)}>
                          <CheckCircleOutline fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => {
                          setDeleting(reminder);
                          setConfirmOpen(true);
                        }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {dayTestDrives.map((td) => (
                  <ListItem key={`td-${td.id}`} divider>
                    <ListItemText
                      primary={`${format(parseISO(td.scheduledAt), "HH:mm")} — ${td.contact?.name || "Cliente"} (Test-Drive)`}
                      secondary={
                        (td.vehicle ? `${td.vehicle.brand} ${td.vehicle.model} · ` : "") +
                        (td.user ? `Vendedor: ${td.user.name}` : "Sem vendedor")
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        title="Ver na Agenda de Test-Drive"
                        onClick={() => history.push("/test-drives")}
                      >
                        <LaunchOutlined fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              {dayReminders.length === 0 && dayTestDrives.length === 0 && (
                <Typography className={classes.emptyState}>
                  Nada agendado para este dia.
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      )}
    </MainContainer>
  );
};

export default Reminders;
