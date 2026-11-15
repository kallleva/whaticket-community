import React, { useState, useEffect, useRef, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
} from "@material-ui/core";
import NotificationsActiveIcon from "@material-ui/icons/NotificationsActive";
import { format, parseISO, isBefore } from "date-fns";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import openSocket from "../../services/socket-io";

const useStyles = makeStyles((theme) => ({
  iconButton: {
    color: theme.palette.common.white,
  },
  popoverPaper: {
    width: "100%",
    maxWidth: 320,
  },
  list: {
    maxHeight: 350,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  emptyState: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: theme.palette.text.secondary,
  },
}));

const ReminderBell = () => {
  const classes = useStyles();
  const history = useHistory();
  const anchorEl = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [reminders, setReminders] = useState([]);

  const fetchPendingReminders = useCallback(async () => {
    try {
      const { data } = await api.get("/reminders", {
        params: { status: "pending" },
      });
      setReminders(data);
    } catch (err) {
      toastError(err);
    }
  }, []);

  useEffect(() => {
    fetchPendingReminders();
  }, [fetchPendingReminders]);

  useEffect(() => {
    const socket = openSocket();

    socket.on("connect", () => socket.emit("joinReminders"));

    socket.on("reminder", () => {
      fetchPendingReminders();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchPendingReminders]);

  const dueCount = reminders.filter((r) =>
    isBefore(parseISO(r.dueDate), new Date())
  ).length;

  const handleClick = () => setIsOpen((prev) => !prev);
  const handleClickAway = () => setIsOpen(false);

  const handleItemClick = () => {
    setIsOpen(false);
    history.push("/reminders");
  };

  return (
    <>
      <IconButton
        ref={anchorEl}
        onClick={handleClick}
        className={classes.iconButton}
        aria-label="Lembretes"
      >
        <Badge badgeContent={dueCount} overlap="rectangular" color="secondary">
          <NotificationsActiveIcon />
        </Badge>
      </IconButton>
      <Popover
        disableScrollLock
        open={isOpen}
        anchorEl={anchorEl.current}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        classes={{ paper: classes.popoverPaper }}
        onClose={handleClickAway}
      >
        <List dense className={classes.list}>
          {reminders.length === 0 && (
            <Typography className={classes.emptyState} variant="body2">
              Nenhum lembrete pendente.
            </Typography>
          )}
          {reminders.slice(0, 10).map((reminder) => (
            <ListItem
              key={reminder.id}
              button
              onClick={handleItemClick}
            >
              <ListItemText
                primary={reminder.description}
                secondary={
                  <Box component="span">
                    {reminder.contact?.name ? `${reminder.contact.name} · ` : ""}
                    {format(parseISO(reminder.dueDate), "dd/MM/yyyy HH:mm")}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  );
};

export default ReminderBell;
