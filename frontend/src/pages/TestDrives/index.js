import React, { useState, useEffect, useCallback } from "react";
import {
  format,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  parseISO,
  isToday,
  isSameDay,
} from "date-fns";

import openSocket from "../../services/socket-io";

import {
  Button,
  IconButton,
  makeStyles,
  Paper,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ButtonGroup,
} from "@material-ui/core";
import { ChevronLeft, ChevronRight, Edit, DeleteOutline, Today } from "@material-ui/icons";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import ResponsiveTable from "../../components/ResponsiveTable";
import ConfirmationModal from "../../components/ConfirmationModal";
import TestDriveModal from "../../components/TestDriveModal";
import AgendaCalendar from "../../components/AgendaCalendar";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  dateNav: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  calendarLayout: {
    display: "flex",
    gap: theme.spacing(3),
    flexWrap: "wrap",
  },
  calendarBox: {
    flex: "1 1 420px",
    minWidth: 340,
  },
  dayPanel: {
    flex: "1 1 320px",
    minWidth: 300,
  },
}));

const STATUS_LABEL = {
  scheduled: { label: "Agendado", color: "primary" },
  confirmed: { label: "Confirmado", color: "primary" },
  completed: { label: "Realizado", color: undefined },
  cancelled: { label: "Cancelado", color: "secondary" },
  no_show: { label: "Não compareceu", color: "secondary" },
};

const CALENDAR_LEGEND = [
  { key: "testDrive", label: "Test-Drive", color: "#1e88e5" },
  { key: "reminder", label: "Lembrete", color: "#fb8c00" },
];

const VIEW_MODES = [
  { value: "day", label: "Dia" },
  { value: "grid", label: "Grade" },
  { value: "calendar", label: "Calendário" },
];

const TestDrives = () => {
  const classes = useStyles();

  const [viewMode, setViewMode] = useState("calendar");

  // Visão "Dia"
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [testDrives, setTestDrives] = useState([]);
  const [loading, setLoading] = useState(false);

  // Visão "Grade"
  const [allTestDrives, setAllTestDrives] = useState([]);
  const [gridLoading, setGridLoading] = useState(false);

  // Visão "Calendário" (unifica test-drives + lembretes)
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [monthTestDrives, setMonthTestDrives] = useState([]);
  const [monthReminders, setMonthReminders] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTestDrive, setSelectedTestDrive] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchTestDrives = useCallback(() => {
    setLoading(true);
    api
      .get("/test-drives", {
        params: {
          startDate: startOfDay(selectedDate).toISOString(),
          endDate: endOfDay(selectedDate).toISOString(),
        },
      })
      .then(({ data }) => setTestDrives(data))
      .catch(toastError)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const fetchAllTestDrives = useCallback(() => {
    setGridLoading(true);
    api
      .get("/test-drives", {
        params: {
          startDate: subDays(new Date(), 30).toISOString(),
          endDate: addDays(new Date(), 90).toISOString(),
        },
      })
      .then(({ data }) => setAllTestDrives(data))
      .catch(toastError)
      .finally(() => setGridLoading(false));
  }, []);

  const fetchMonthAgenda = useCallback(() => {
    const rangeStart = startOfWeek(startOfMonth(calendarMonth)).toISOString();
    const rangeEnd = endOfWeek(endOfMonth(calendarMonth)).toISOString();

    api
      .get("/test-drives", { params: { startDate: rangeStart, endDate: rangeEnd } })
      .then(({ data }) => setMonthTestDrives(data))
      .catch(toastError);

    api
      .get("/reminders", { params: { startDate: rangeStart, endDate: rangeEnd } })
      .then(({ data }) => setMonthReminders(data))
      .catch(toastError);
  }, [calendarMonth]);

  useEffect(() => {
    if (viewMode === "day") fetchTestDrives();
  }, [viewMode, fetchTestDrives]);

  useEffect(() => {
    if (viewMode === "grid") fetchAllTestDrives();
  }, [viewMode, fetchAllTestDrives]);

  useEffect(() => {
    if (viewMode === "calendar") fetchMonthAgenda();
  }, [viewMode, fetchMonthAgenda]);

  useEffect(() => {
    const socket = openSocket();
    socket.on("testDrive", () => {
      fetchTestDrives();
      fetchAllTestDrives();
      fetchMonthAgenda();
    });
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/test-drives/${id}`);
      toast.success("Agendamento excluído!");
      fetchTestDrives();
      fetchAllTestDrives();
      fetchMonthAgenda();
    } catch (err) {
      toastError(err);
    }
    setSelectedTestDrive(null);
  };

  const countsByDay = {};
  monthTestDrives.forEach((td) => {
    const key = format(parseISO(td.scheduledAt), "yyyy-MM-dd");
    countsByDay[key] = countsByDay[key] || {};
    countsByDay[key].testDrive = (countsByDay[key].testDrive || 0) + 1;
  });
  monthReminders.forEach((r) => {
    const key = format(parseISO(r.dueDate), "yyyy-MM-dd");
    countsByDay[key] = countsByDay[key] || {};
    countsByDay[key].reminder = (countsByDay[key].reminder || 0) + 1;
  });

  const dayTestDrives = monthTestDrives.filter((td) =>
    isSameDay(parseISO(td.scheduledAt), calendarDate)
  );
  const dayReminders = monthReminders.filter((r) =>
    isSameDay(parseISO(r.dueDate), calendarDate)
  );

  const renderTestDriveRow = (td) => (
    <ListItem key={`td-${td.id}`} divider>
      <ListItemText
        primary={`${format(parseISO(td.scheduledAt), "HH:mm")} — ${td.contact?.name || "Cliente"}`}
        secondary={
          <>
            {td.vehicle ? `${td.vehicle.brand} ${td.vehicle.model} · ` : ""}
            {td.user ? `Vendedor: ${td.user.name}` : "Sem vendedor"}
            {td.notes ? ` · ${td.notes}` : ""}
          </>
        }
      />
      <Chip
        label={STATUS_LABEL[td.status]?.label || td.status}
        color={STATUS_LABEL[td.status]?.color}
        size="small"
        style={{ marginRight: 16 }}
      />
      <ListItemSecondaryAction>
        <IconButton
          size="small"
          onClick={() => {
            setSelectedTestDrive(td);
            setModalOpen(true);
          }}
        >
          <Edit fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => {
            setSelectedTestDrive(td);
            setConfirmOpen(true);
          }}
        >
          <DeleteOutline fontSize="small" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );

  const renderReminderRow = (r) => (
    <ListItem key={`rem-${r.id}`} divider>
      <ListItemText
        primary={`${format(parseISO(r.dueDate), "HH:mm")} — ${r.description}`}
        secondary={`${r.contact?.name || "Sem cliente"} · ${r.user?.name || ""}`}
      />
      <Chip label="Lembrete" size="small" style={{ marginRight: 16, backgroundColor: "#fb8c00", color: "#fff" }} />
    </ListItem>
  );

  return (
    <MainContainer>
      <ConfirmationModal
        title="Excluir este agendamento de test-drive?"
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={() => handleDelete(selectedTestDrive.id)}
      >
        Esta ação não pode ser desfeita.
      </ConfirmationModal>
      <TestDriveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        testDriveId={selectedTestDrive?.id}
        onSaved={() => {
          fetchTestDrives();
          fetchAllTestDrives();
          fetchMonthAgenda();
        }}
      />
      <MainHeader>
        <Title>Agenda de Test-Drive</Title>
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
        {viewMode === "day" && (
          <Box className={classes.dateNav}>
            <IconButton size="small" onClick={() => setSelectedDate((d) => subDays(d, 1))}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="body1" style={{ minWidth: 160, textAlign: "center" }}>
              {format(selectedDate, "dd/MM/yyyy")}
              {isToday(selectedDate) && " (hoje)"}
            </Typography>
            <IconButton size="small" onClick={() => setSelectedDate((d) => addDays(d, 1))}>
              <ChevronRight />
            </IconButton>
            <IconButton size="small" onClick={() => setSelectedDate(new Date())} title="Hoje">
              <Today />
            </IconButton>
          </Box>
        )}
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSelectedTestDrive(null);
              setModalOpen(true);
            }}
          >
            Agendar Test-Drive
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      {viewMode === "day" && (
        <Paper className={classes.mainPaper} variant="outlined">
          {!loading && testDrives.length === 0 && (
            <Typography className={classes.emptyState}>
              Nenhum test-drive agendado para este dia.
            </Typography>
          )}
          <List>{testDrives.map(renderTestDriveRow)}</List>
        </Paper>
      )}

      {viewMode === "grid" && (
        <Paper className={classes.mainPaper} variant="outlined">
          <ResponsiveTable>
            <TableHead>
              <TableRow>
                <TableCell align="center">Data/Hora</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Veículo</TableCell>
                <TableCell align="center">Vendedor</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allTestDrives.map((td) => (
                <TableRow key={td.id}>
                  <TableCell align="center">
                    {format(parseISO(td.scheduledAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell align="center">{td.contact?.name || "-"}</TableCell>
                  <TableCell align="center">
                    {td.vehicle ? `${td.vehicle.brand} ${td.vehicle.model}` : "-"}
                  </TableCell>
                  <TableCell align="center">{td.user?.name || "-"}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={STATUS_LABEL[td.status]?.label || td.status}
                      color={STATUS_LABEL[td.status]?.color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedTestDrive(td);
                        setModalOpen(true);
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedTestDrive(td);
                        setConfirmOpen(true);
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!gridLoading && allTestDrives.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nenhum test-drive nos últimos 30 dias ou próximos 90 dias.
                  </TableCell>
                </TableRow>
              )}
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
                {dayTestDrives.map(renderTestDriveRow)}
                {dayReminders.map(renderReminderRow)}
              </List>
              {dayTestDrives.length === 0 && dayReminders.length === 0 && (
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

export default TestDrives;
