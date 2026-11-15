import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Paper, Typography } from "@material-ui/core";
import { FLOW_NODE_COLORS, FLOW_NODE_LABELS } from "../FlowNodes";

const useStyles = makeStyles((theme) => ({
  palette: {
    width: 180,
    padding: theme.spacing(1),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  item: {
    padding: theme.spacing(1),
    borderRadius: 6,
    border: "2px solid",
    cursor: "grab",
    fontSize: 12,
    fontWeight: 600,
    textAlign: "center",
    userSelect: "none",
  },
}));

const NODE_TYPES = Object.keys(FLOW_NODE_LABELS).filter((t) => t !== "start");

const FlowNodePalette = () => {
  const classes = useStyles();

  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/flow-node-type", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <Paper className={classes.palette} variant="outlined">
      <Typography variant="caption" color="textSecondary">
        Arraste para o canvas
      </Typography>
      {NODE_TYPES.map((type) => (
        <div
          key={type}
          className={classes.item}
          style={{ borderColor: FLOW_NODE_COLORS[type], color: FLOW_NODE_COLORS[type] }}
          draggable
          onDragStart={(event) => handleDragStart(event, type)}
        >
          {FLOW_NODE_LABELS[type]}
        </div>
      ))}
    </Paper>
  );
};

export default FlowNodePalette;
