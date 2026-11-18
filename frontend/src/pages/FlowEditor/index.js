import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "react-flow-renderer";
import "react-flow-renderer/dist/style.css";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Button, TextField, MenuItem, Typography } from "@material-ui/core";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import FlowNodePalette from "../../components/FlowNodePalette";
import FlowNodeConfigDrawer from "../../components/FlowNodeConfigDrawer";
import { flowNodeTypes } from "../../components/FlowNodes";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  canvasWrapper: {
    flex: 1,
    height: "100%",
    width: "100%",
    // O React Flow posiciona nodes/viewport de forma absoluta em relação
    // ao ancestral posicionado mais próximo — sem isso, o canvas pode
    // renderizar fora da área visível e ficar cortado pelo overflow:hidden
    // do container pai.
    position: "relative",
  },
}));

const defaultDataFor = (type) => {
  switch (type) {
    case "message":
      return { type, text: "" };
    case "question":
      return { type, text: "", variableName: "" };
    case "menu":
      return { type, text: "", options: [] };
    case "condition":
      return { type, variable: "", operator: "eq", value: "" };
    case "delay":
      return { type, seconds: 10 };
    case "transfer_queue":
      return { type, queueId: null };
    case "transfer_agent":
      return { type, agentId: null, transitionText: "" };
    case "call_flow":
      return { type, calledFlowId: null };
    case "tag_contact":
      return { type, leadStatus: "", pipelineStage: "" };
    case "set_variable":
      return { type, variable: "", value: "" };
    default:
      return { type };
  }
};

let nodeIdCounter = 1;
const generateNodeId = () => `node_${Date.now()}_${nodeIdCounter++}`;

const FlowCanvas = ({ flowName, onNodesEdgesReady }) => {
  const classes = useStyles();
  const { flowId } = useParams();
  const reactFlowWrapper = useRef(null);
  const { project, fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    onNodesEdgesReady({ nodes, edges, setNodes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  useEffect(() => {
    let cancelled = false;

    const fetchFlow = async () => {
      try {
        const { data } = await api.get(`/flows/${flowId}`);
        if (cancelled) return;

        const loadedNodes = (data.nodesJson || []).map((n) => ({
          ...n,
          type: n.data?.type,
        }));

        if (!loadedNodes.some((n) => n.data?.type === "start")) {
          loadedNodes.push({
            id: "start",
            type: "start",
            position: { x: 250, y: 50 },
            data: { type: "start" },
          });
        }

        setNodes(loadedNodes);
        setEdges(data.edgesJson || []);

        // `fitView` (prop do <ReactFlow>) só ajusta a visualização no mount
        // inicial — como os nodes chegam depois, de forma assíncrona, o
        // canvas nunca re-enquadra sozinho. Precisa ser chamado manualmente
        // após o DOM renderizar os nodes recém-carregados. Guarda contra o
        // componente já ter desmontado (ex: usuário navegou de volta antes
        // do requestAnimationFrame disparar) para não chamar fitView numa
        // instância destruída.
        window.requestAnimationFrame(() => {
          if (!cancelled) {
            try {
              fitView();
            } catch (fitViewErr) {
              // Instância do React Flow pode já ter sido desmontada; não é
              // um erro que o usuário precise ver.
            }
          }
        });
      } catch (err) {
        if (!cancelled) toastError(err);
      }
    };
    void fetchFlow();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/flow-node-type");
      if (!type) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode = {
        id: generateNodeId(),
        type,
        position,
        data: defaultDataFor(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);

  const handleNodeDataChange = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n))
    );
    setSelectedNode((prev) => (prev && prev.id === nodeId ? { ...prev, data: newData } : prev));
  };

  const handleNodeDelete = (nodeId) => {
    const target = nodes.find((n) => n.id === nodeId);
    if (target?.data?.type === "start") {
      toast.error("O node de início não pode ser excluído.");
      return;
    }
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  return (
    <Box className={classes.body}>
      <FlowNodePalette />
      <Box className={classes.canvasWrapper} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={flowNodeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </Box>
      <FlowNodeConfigDrawer
        node={selectedNode}
        nodes={nodes}
        onChange={handleNodeDataChange}
        onClose={() => setSelectedNode(null)}
        onDelete={handleNodeDelete}
      />
    </Box>
  );
};

const FlowEditor = () => {
  const { flowId } = useParams();
  const history = useHistory();
  const [flowName, setFlowName] = useState("");
  const [flowStatus, setFlowStatus] = useState("draft");
  const [audit, setAudit] = useState(null);
  const [saving, setSaving] = useState(false);
  const graphRef = useRef({ nodes: [], edges: [] });

  const fetchFlow = async () => {
    try {
      const { data } = await api.get(`/flows/${flowId}`);
      setFlowName(data.name);
      setFlowStatus(data.status || "draft");
      setAudit({
        updatedAt: data.updatedAt,
        updatedByUser: data.updatedByUser,
      });
    } catch (err) {
      toastError(err);
    }
  };

  useEffect(() => {
    void fetchFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { nodes, edges } = graphRef.current;
      const nodesJson = nodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: { ...n.data, type: n.type },
      }));
      const edgesJson = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
      }));

      const { data } = await api.put(`/flows/${flowId}`, {
        name: flowName,
        status: flowStatus,
        nodesJson,
        edgesJson,
      });
      setAudit({ updatedAt: data.updatedAt, updatedByUser: data.updatedByUser });
      toast.success("Funil salvo com sucesso!");
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  const formatAudit = () => {
    if (!audit?.updatedAt) return null;
    try {
      const when = format(parseISO(audit.updatedAt), "dd/MM/yyyy 'às' HH:mm");
      const who = audit.updatedByUser?.name || "—";
      return `Editado por ${who} em ${when}`;
    } catch {
      return null;
    }
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>
          <Button size="small" onClick={() => history.push("/flows")}>
            ← Funis
          </Button>
        </Title>
        <TextField
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          variant="outlined"
          size="small"
          placeholder="Nome do funil"
        />
        <TextField
          select
          value={flowStatus}
          onChange={(e) => setFlowStatus(e.target.value)}
          variant="outlined"
          size="small"
          style={{ minWidth: 140, marginLeft: 8 }}
        >
          <MenuItem value="draft">Rascunho</MenuItem>
          <MenuItem value="active">Ativo</MenuItem>
          <MenuItem value="inactive">Inativo</MenuItem>
        </TextField>
        <MainHeaderButtonsWrapper>
          {formatAudit() && (
            <Typography
              variant="caption"
              color="textSecondary"
              style={{ marginRight: 12 }}
            >
              {formatAudit()}
            </Typography>
          )}
          <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
            Salvar
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Box flex={1} display="flex" style={{ height: "calc(100vh - 160px)" }}>
        <ReactFlowProvider>
          <FlowCanvas
            flowName={flowName}
            onNodesEdgesReady={({ nodes, edges }) => {
              graphRef.current = { nodes, edges };
            }}
          />
        </ReactFlowProvider>
      </Box>
    </MainContainer>
  );
};

export default FlowEditor;
