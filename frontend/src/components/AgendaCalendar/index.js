import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Typography, IconButton } from "@material-ui/core";
import { ChevronLeft, ChevronRight } from "@material-ui/icons";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const useStyles = makeStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
  },
  weekRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 2,
  },
  weekDayLabel: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 600,
    color: theme.palette.text.secondary,
    padding: theme.spacing(0.5, 0),
  },
  day: {
    minHeight: 64,
    borderRadius: 6,
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(0.5),
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  dayOutside: {
    opacity: 0.35,
  },
  daySelected: {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
  },
  dayToday: {
    backgroundColor: theme.palette.action.selected,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: 600,
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 2,
    marginTop: "auto",
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 4,
    padding: "1px 4px",
    color: "#fff",
  },
}));

// Calendário mensal genérico: cada dia pode trazer contadores de eventos de
// tipos diferentes (test-drive, lembrete) via `countsByDay`, pra servir como
// visão única da "agenda" em vez de cada tela ter seu próprio calendário.
const AgendaCalendar = ({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  countsByDay, // { "yyyy-MM-dd": { testDrive: n, reminder: n } }
  legend, // [{ key, label, color }]
}) => {
  const classes = useStyles();

  const gridStart = startOfWeek(startOfMonth(month), { locale: ptBR });
  const gridEnd = endOfWeek(endOfMonth(month), { locale: ptBR });

  const days = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const weekDayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <Box>
      <Box className={classes.header}>
        <IconButton size="small" onClick={() => onMonthChange(subMonths(month, 1))}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="subtitle1" style={{ fontWeight: 600, textTransform: "capitalize" }}>
          {format(month, "MMMM yyyy", { locale: ptBR })}
        </Typography>
        <IconButton size="small" onClick={() => onMonthChange(addMonths(month, 1))}>
          <ChevronRight />
        </IconButton>
      </Box>

      {legend && (
        <Box display="flex" gap={12} mb={1} flexWrap="wrap">
          {legend.map((item) => (
            <Box key={item.key} display="flex" alignItems="center" style={{ gap: 4 }}>
              <span
                className={classes.badge}
                style={{ backgroundColor: item.color }}
              >
                &nbsp;
              </span>
              <Typography variant="caption" color="textSecondary">
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box className={classes.weekRow} mb={0.5}>
        {weekDayLabels.map((label) => (
          <Typography key={label} className={classes.weekDayLabel}>
            {label}
          </Typography>
        ))}
      </Box>

      <Box className={classes.weekRow}>
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const counts = countsByDay?.[key] || {};
          const outside = !isSameMonth(day, month);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);

          return (
            <Box
              key={key}
              className={`${classes.day} ${outside ? classes.dayOutside : ""} ${
                selected ? classes.daySelected : ""
              } ${today ? classes.dayToday : ""}`}
              onClick={() => onSelectDate(day)}
            >
              <Typography className={classes.dayNumber}>{format(day, "d")}</Typography>
              <Box className={classes.badgeRow}>
                {legend?.map((item) =>
                  counts[item.key] ? (
                    <span
                      key={item.key}
                      className={classes.badge}
                      style={{ backgroundColor: item.color }}
                    >
                      {counts[item.key]}
                    </span>
                  ) : null
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default AgendaCalendar;
