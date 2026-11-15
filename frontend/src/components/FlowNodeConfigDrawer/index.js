import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Divider,
} from "@material-ui/core";
import { DeleteOutline, Add } from "@material-ui/icons";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { FLOW_NODE_LABELS } from "../FlowNodes";

const OPERATORS = [
  { value: "eq", label: "é igual a" },
  { value: "neq", label: "é diferente de" },
  { value: "contains", label: "contém" },
  { value: "gt", label: "é maior que" },
  { value: "lt", label: "é menor que" },
  { value: "exists", label: "foi respondida" },
];

const LEAD_STATUS_OPTIONS = [
  { value: "hot", label: "🔥 Quente" },
  { value: "warm", label: "⛅ Morno" },
  { value: "cold", label: "❄️ Frio" },
  { value: "won", label: "💰 Fechado" },
  { value: "lost", label: "❌ Perdido" },
];

const PIPELINE_STAGE_OPTIONS = [
  { value: "lead", label: "🎯 Novo Lead" },
  { value: "contacted", label: "📞 Primeiro Contato" },
  { value: "negotiating", label: "🤝 Em Negociação" },
  { value: "proposal", label: "📄 Proposta Enviada" },
  { value: "won", label: "🎉 Fechamento" },
  { value: "lost", label: "❌ Perdido" },
];

const FlowNodeConfigDrawer = ({ node, onChange, onClose, onDelete }) => {
  const { flowId } = useParams();
  const [queues, setQueues] = useState([]);
  const [agents, setAgents] = useState([]);
  const [flows, setFlows] = useState([]);

  useEffect(() => {
    if (node?.data?.type === "transfer_queue") {
      api
        .get("/queue")
        .then(({ data }) => setQueues(data))
        .catch(toastError);
    }
    if (node?.data?.type === "transfer_agent") {
      api
        .get("/agents")
        .then(({ data }) => setAgents(data))
        .catch(toastError);
    }
    if (node?.data?.type === "call_flow") {
      api
        .get("/flows")
        .then(({ data }) => setFlows(data.filter((f) => String(f.id) !== String(flowId))))
        .catch(toastError);
    }
  }, [node, flowId]);

  if (!node) return null;

  const { data } = node;

  const update = (changes) => {
    onChange(node.id, { ...data, ...changes });
  };

  const updateOption = (index, changes) => {
    const options = [...(data.options || [])];
    options[index] = { ...options[index], ...changes };
    update({ options });
  };

  const addOption = () => {
    const options = [...(data.options || [])];
    options.push({ label: `Opção ${options.length + 1}`, value: `opcao_${Date.now()}` });
    update({ options });
  };

  const removeOption = (index) => {
    const options = [...(data.options || [])];
    options.splice(index, 1);
    update({ options });
  };

  return (
    <Drawer anchor="right" open={!!node} onClose={onClose}>
      <Box p={2} width={320}>
        <Typography variant="h6">{FLOW_NODE_LABELS[data.type]}</Typography>
        <Divider style={{ margin: "12px 0" }} />

        {(data.type === "message" || data.type === "question") && (
          <TextField
            label="Texto"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            margin="dense"
            value={data.text || ""}
            onChange={(e) => update({ text: e.target.value })}
          />
        )}

        {data.type === "question" && (
          <TextField
            label="Salvar resposta na variável"
            fullWidth
            variant="outlined"
            margin="dense"
            value={data.variableName || ""}
            onChange={(e) => update({ variableName: e.target.value })}
          />
        )}

        {data.type === "menu" && (
          <>
            <TextField
              label="Texto do menu"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              margin="dense"
              value={data.text || ""}
              onChange={(e) => update({ text: e.target.value })}
            />
            <Typography variant="caption" color="textSecondary">
              Opções
            </Typography>
            {(data.options || []).map((option, index) => (
              <Box key={option.value} display="flex" alignItems="center" my={0.5}>
                <TextField
                  size="small"
                  variant="outlined"
                  value={option.label}
                  onChange={(e) => updateOption(index, { label: e.target.value })}
                  fullWidth
                />
                <IconButton size="small" onClick={() => removeOption(index)}>
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" startIcon={<Add />} onClick={addOption}>
              Adicionar opção
            </Button>
          </>
        )}

        {data.type === "condition" && (
          <>
            <TextField
              label="Variável"
              fullWidth
              variant="outlined"
              margin="dense"
              value={data.variable || ""}
              onChange={(e) => update({ variable: e.target.value })}
            />
            <TextField
              select
              label="Operador"
              fullWidth
              variant="outlined"
              margin="dense"
              value={data.operator || "eq"}
              onChange={(e) => update({ operator: e.target.value })}
            >
              {OPERATORS.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </TextField>
            {data.operator !== "exists" && (
              <TextField
                label="Valor"
                fullWidth
                variant="outlined"
                margin="dense"
                value={data.value || ""}
                onChange={(e) => update({ value: e.target.value })}
              />
            )}
          </>
        )}

        {data.type === "delay" && (
          <TextField
            label="Segundos de espera"
            type="number"
            fullWidth
            variant="outlined"
            margin="dense"
            value={data.seconds || 0}
            onChange={(e) => update({ seconds: Number(e.target.value) })}
          />
        )}

        {data.type === "transfer_queue" && (
          <TextField
            select
            label="Fila"
            fullWidth
            variant="outlined"
            margin="dense"
            value={data.queueId || ""}
            onChange={(e) => update({ queueId: Number(e.target.value) })}
          >
            {queues.map((queue) => (
              <MenuItem key={queue.id} value={queue.id}>
                {queue.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {data.type === "transfer_agent" && (
          <>
            <TextField
              select
              label="Agente de IA"
              fullWidth
              variant="outlined"
              margin="dense"
              value={data.agentId || ""}
              onChange={(e) => update({ agentId: Number(e.target.value) })}
              helperText={
                agents.length === 0 ? "Nenhum agente cadastrado em /agents" : undefined
              }
            >
              {agents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Mensagem de transição (opcional)"
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              margin="dense"
              value={data.transitionText || ""}
              onChange={(e) => update({ transitionText: e.target.value })}
            />
          </>
        )}

        {data.type === "call_flow" && (
          <TextField
            select
            label="Funil a chamar"
            fullWidth
            variant="outlined"
            margin="dense"
            value={data.calledFlowId || ""}
            onChange={(e) => update({ calledFlowId: Number(e.target.value) })}
            helperText="Quando esse funil chegar num node 'Fim', a execução volta pra cá."
          >
            {flows.map((flow) => (
              <MenuItem key={flow.id} value={flow.id}>
                {flow.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {data.type === "tag_contact" && (
          <>
            <TextField
              select
              label="Temperatura do lead (opcional)"
              fullWidth
              variant="outlined"
              margin="dense"
              value={data.leadStatus || ""}
              onChange={(e) => update({ leadStatus: e.target.value })}
            >
              <MenuItem value="">(não alterar)</MenuItem>
              {LEAD_STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Etapa do funil de vendas (opcional)"
              fullWidth
              variant="outlined"
              margin="dense"
              value={data.pipelineStage || ""}
              onChange={(e) => update({ pipelineStage: e.target.value })}
            >
              <MenuItem value="">(não alterar)</MenuItem>
              {PIPELINE_STAGE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </>
        )}

        {data.type === "set_variable" && (
          <>
            <TextField
              label="Nome da variável"
              fullWidth
              variant="outlined"
              margin="dense"
              value={data.variable || ""}
              onChange={(e) => update({ variable: e.target.value })}
            />
            <TextField
              label="Valor"
              fullWidth
              variant="outlined"
              margin="dense"
              value={data.value || ""}
              onChange={(e) => update({ value: e.target.value })}
            />
          </>
        )}

        <Box mt={3} display="flex" justifyContent="space-between">
          <Button onClick={onClose}>Fechar</Button>
          {data.type !== "start" && (
            <Button color="secondary" onClick={() => onDelete(node.id)}>
              Excluir node
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default FlowNodeConfigDrawer;
