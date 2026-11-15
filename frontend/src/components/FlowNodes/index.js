import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";
import ChatBubbleOutlineIcon from "@material-ui/icons/ChatBubbleOutline";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import ListIcon from "@material-ui/icons/List";
import CallSplitIcon from "@material-ui/icons/CallSplit";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import GroupIcon from "@material-ui/icons/Group";
import SmartToyOutlinedIcon from "@material-ui/icons/EmojiObjects";
import StopCircleIcon from "@material-ui/icons/Stop";
import AccountTreeIcon from "@material-ui/icons/AccountTree";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import FunctionsIcon from "@material-ui/icons/Functions";

const useStyles = makeStyles((theme) => ({
  node: {
    borderRadius: 8,
    border: "2px solid",
    padding: theme.spacing(1, 1.5),
    minWidth: 160,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
    fontSize: 12,
    marginBottom: 4,
  },
  preview: {
    fontSize: 11,
    color: theme.palette.text.secondary,
    maxWidth: 160,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  optionRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    marginTop: 2,
    position: "relative",
  },
}));

export const FLOW_NODE_COLORS = {
  start: "#43a047",
  message: "#1e88e5",
  question: "#fb8c00",
  menu: "#8e24aa",
  condition: "#d81b60",
  delay: "#607d8b",
  transfer_queue: "#00897b",
  transfer_agent: "#5e35b1",
  call_flow: "#3949ab",
  tag_contact: "#c0ca33",
  set_variable: "#6d4c41",
  end: "#757575",
};

export const FLOW_NODE_LABELS = {
  start: "Início",
  message: "Mensagem",
  question: "Pergunta",
  menu: "Menu de Opções",
  condition: "Condição (if/else)",
  delay: "Espera",
  transfer_queue: "Transferir p/ Fila",
  transfer_agent: "Transferir p/ Agente IA",
  call_flow: "Chamar Outro Funil",
  tag_contact: "Marcar Lead (Temperatura/Etapa)",
  set_variable: "Definir Variável",
  end: "Fim",
};

// react-flow-renderer v10 não tem a prop `connectionRadius` da v11/n8n (que
// permite soltar a conexão perto do handle em vez de bem em cima). Como
// alternativa, aumentamos a área de clique/solta dos handles via CSS — na
// prática resolve o mesmo problema de "não precisar apontar certinho".
const HANDLE_HIT_AREA = {
  width: 14,
  height: 14,
  borderRadius: 7,
};

const ICONS = {
  start: PlayCircleOutlineIcon,
  message: ChatBubbleOutlineIcon,
  question: HelpOutlineIcon,
  menu: ListIcon,
  condition: CallSplitIcon,
  delay: AccessTimeIcon,
  transfer_queue: GroupIcon,
  transfer_agent: SmartToyOutlinedIcon,
  call_flow: AccountTreeIcon,
  tag_contact: LocalOfferIcon,
  set_variable: FunctionsIcon,
  end: StopCircleIcon,
};

// Handles em cima/esquerda (entrada) e embaixo/direita (saída) em todo node
// com saída única — assim a conexão pode ser puxada/recebida de qualquer
// lado, igual ao n8n, em vez de forçar sempre topo→base. O id do target não
// importa pro motor de execução (só lemos `source`/`sourceHandle` nas
// edges), então pode duplicar livremente.
const NodeShell = ({ type, hasTarget, hasSource, children }) => {
  const classes = useStyles();
  const Icon = ICONS[type];
  const color = FLOW_NODE_COLORS[type];

  return (
    <div className={classes.node} style={{ borderColor: color }}>
      {hasTarget && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="target-top"
            style={HANDLE_HIT_AREA}
          />
          <Handle
            type="target"
            position={Position.Left}
            id="target-left"
            style={HANDLE_HIT_AREA}
          />
        </>
      )}
      <div className={classes.header} style={{ color }}>
        <Icon fontSize="small" />
        <Typography variant="caption" style={{ fontWeight: 700 }}>
          {FLOW_NODE_LABELS[type]}
        </Typography>
      </div>
      {children}
      {hasSource && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="source-bottom"
            style={HANDLE_HIT_AREA}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="source-right"
            style={HANDLE_HIT_AREA}
          />
        </>
      )}
    </div>
  );
};

export const StartNode = () => (
  <NodeShell type="start" hasTarget={false} hasSource />
);

export const MessageNode = ({ data }) => {
  const classes = useStyles();
  return (
    <NodeShell type="message" hasTarget hasSource>
      <Typography className={classes.preview}>
        {data.text || "(sem texto)"}
      </Typography>
    </NodeShell>
  );
};

export const QuestionNode = ({ data }) => {
  const classes = useStyles();
  return (
    <NodeShell type="question" hasTarget hasSource>
      <Typography className={classes.preview}>
        {data.text || "(sem texto)"}
      </Typography>
      <Typography className={classes.preview}>
        salva em: {data.variableName || "?"}
      </Typography>
    </NodeShell>
  );
};

export const MenuNode = ({ data }) => {
  const classes = useStyles();
  const options = data.options || [];

  return (
    <NodeShell type="menu" hasTarget hasSource={false}>
      <Typography className={classes.preview}>
        {data.text || "(sem texto)"}
      </Typography>
      {options.map((option) => (
        <div key={option.value} className={classes.optionRow}>
          <span>{option.label}</span>
          <Handle
            type="source"
            position={Position.Right}
            id={option.value}
            style={{ ...HANDLE_HIT_AREA, position: "absolute", right: -16, top: "50%" }}
          />
        </div>
      ))}
    </NodeShell>
  );
};

export const ConditionNode = ({ data }) => {
  const classes = useStyles();
  return (
    <NodeShell type="condition" hasTarget hasSource={false}>
      <Typography className={classes.preview}>
        {data.variable} {data.operator} {data.value}
      </Typography>
      <div className={classes.optionRow}>
        <span>verdadeiro</span>
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          style={{ ...HANDLE_HIT_AREA, position: "absolute", right: -16, top: 32 }}
        />
      </div>
      <div className={classes.optionRow}>
        <span>falso</span>
        <Handle
          type="source"
          position={Position.Right}
          id="false"
          style={{ ...HANDLE_HIT_AREA, position: "absolute", right: -16, top: 52 }}
        />
      </div>
    </NodeShell>
  );
};

export const DelayNode = ({ data }) => {
  const classes = useStyles();
  return (
    <NodeShell type="delay" hasTarget hasSource>
      <Typography className={classes.preview}>
        {data.seconds || 0}s
      </Typography>
    </NodeShell>
  );
};

export const TransferQueueNode = ({ data }) => {
  const classes = useStyles();
  return (
    <NodeShell type="transfer_queue" hasTarget hasSource={false}>
      <Typography className={classes.preview}>
        Fila #{data.queueId || "?"}
      </Typography>
    </NodeShell>
  );
};

export const TransferAgentNode = ({ data }) => {
  const classes = useStyles();
  return (
    <NodeShell type="transfer_agent" hasTarget hasSource={false}>
      <Typography className={classes.preview}>
        Agente #{data.agentId || "?"}
      </Typography>
    </NodeShell>
  );
};

export const CallFlowNode = ({ data }) => {
  const classes = useStyles();
  return (
    <NodeShell type="call_flow" hasTarget hasSource>
      <Typography className={classes.preview}>
        Funil #{data.calledFlowId || "?"}
      </Typography>
    </NodeShell>
  );
};

export const TagContactNode = ({ data }) => {
  const classes = useStyles();
  return (
    <NodeShell type="tag_contact" hasTarget hasSource>
      <Typography className={classes.preview}>
        {data.leadStatus ? `temperatura: ${data.leadStatus}` : ""}
      </Typography>
      <Typography className={classes.preview}>
        {data.pipelineStage ? `etapa: ${data.pipelineStage}` : ""}
      </Typography>
    </NodeShell>
  );
};

export const SetVariableNode = ({ data }) => {
  const classes = useStyles();
  return (
    <NodeShell type="set_variable" hasTarget hasSource>
      <Typography className={classes.preview}>
        {data.variable || "?"} = {data.value ?? ""}
      </Typography>
    </NodeShell>
  );
};

export const EndNode = () => <NodeShell type="end" hasTarget hasSource={false} />;

export const flowNodeTypes = {
  start: StartNode,
  message: MessageNode,
  question: QuestionNode,
  menu: MenuNode,
  condition: ConditionNode,
  delay: DelayNode,
  transfer_queue: TransferQueueNode,
  transfer_agent: TransferAgentNode,
  call_flow: CallFlowNode,
  tag_contact: TagContactNode,
  set_variable: SetVariableNode,
  end: EndNode,
};
