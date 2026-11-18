import { SchemaType, FunctionDeclaration } from "@google/generative-ai";
import { Op } from "sequelize";
import Ticket from "../../../models/Ticket";
import Vehicle from "../../../models/Vehicle";
import CreateTestDriveService from "../../TestDriveServices/CreateTestDriveService";
import CreateReminderService from "../../ReminderServices/CreateReminderService";

export interface ToolContext {
  ticket: Ticket;
}

export interface ToolDefinition {
  key: string;
  label: string;
  declaration: FunctionDeclaration;
  execute: (args: any, ctx: ToolContext) => Promise<unknown>;
}

// Catálogo fixo de ferramentas que um Agente de IA pode usar (function
// calling do Gemini). Cada uma reaproveita um service já existente — a
// mesma ação que um vendedor humano faria manualmente pelo painel.
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    key: "buscar_veiculos_disponiveis",
    label: "Buscar veículos disponíveis no estoque",
    declaration: {
      name: "buscar_veiculos_disponiveis",
      description:
        "Busca veículos disponíveis no estoque da concessionária, opcionalmente filtrando por marca ou modelo.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          marca: {
            type: SchemaType.STRING,
            description: "Marca do veículo (opcional)"
          },
          modelo: {
            type: SchemaType.STRING,
            description: "Modelo do veículo (opcional)"
          }
        }
      }
    },
    execute: async args => {
      const where: any = { status: "available" };
      if (args?.marca) where.brand = { [Op.like]: `%${args.marca}%` };
      if (args?.modelo) where.model = { [Op.like]: `%${args.modelo}%` };

      const vehicles = await Vehicle.findAll({ where, limit: 8 });

      return vehicles.map(v => ({
        id: v.id,
        marca: v.brand,
        modelo: v.model,
        versao: v.version,
        ano: v.year,
        cor: v.color,
        preco: v.price
      }));
    }
  },
  {
    key: "criar_test_drive",
    label: "Agendar test-drive",
    declaration: {
      name: "criar_test_drive",
      description:
        "Agenda um test-drive para o cliente atual numa data/hora específica, opcionalmente com um veículo escolhido.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          dataHoraISO: {
            type: SchemaType.STRING,
            description:
              "Data e hora no formato ISO 8601, ex: 2026-11-20T14:00:00"
          },
          veiculoId: {
            type: SchemaType.NUMBER,
            description:
              "ID do veículo (opcional — use o id retornado por buscar_veiculos_disponiveis)"
          }
        },
        required: ["dataHoraISO"]
      }
    },
    execute: async (args, ctx) => {
      const testDrive = await CreateTestDriveService({
        contactId: ctx.ticket.contactId,
        ticketId: ctx.ticket.id,
        vehicleId: args?.veiculoId || undefined,
        userId: ctx.ticket.contact?.ownerId || undefined,
        scheduledAt: new Date(args.dataHoraISO)
      });

      return { ok: true, id: testDrive.id };
    }
  },
  {
    key: "criar_lembrete",
    label: "Criar lembrete de follow-up para um vendedor",
    declaration: {
      name: "criar_lembrete",
      description:
        "Cria um lembrete de follow-up pra um vendedor humano revisar esse cliente depois.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          descricao: {
            type: SchemaType.STRING,
            description: "O que o vendedor deve lembrar de fazer"
          },
          dataHoraISO: {
            type: SchemaType.STRING,
            description: "Quando lembrar, formato ISO 8601"
          }
        },
        required: ["descricao", "dataHoraISO"]
      }
    },
    execute: async (args, ctx) => {
      const userId = ctx.ticket.userId || ctx.ticket.contact?.ownerId;
      if (!userId) {
        throw new Error(
          "Não há vendedor responsável por este cliente ainda — não é possível criar o lembrete."
        );
      }

      const reminder = await CreateReminderService({
        userId,
        description: args.descricao,
        dueDate: new Date(args.dataHoraISO),
        contactId: ctx.ticket.contactId,
        ticketId: ctx.ticket.id
      });

      return { ok: true, id: reminder.id };
    }
  },
  {
    key: "consultar_dados_cliente",
    label: "Consultar dados já salvos do cliente",
    declaration: {
      name: "consultar_dados_cliente",
      description:
        "Retorna os dados já cadastrados do cliente atual (nome, telefone, temperatura do lead, etapa do funil, endereço).",
      parameters: { type: SchemaType.OBJECT, properties: {} }
    },
    execute: async (_args, ctx) => {
      const { contact } = ctx.ticket;

      return {
        nome: contact?.name,
        telefone: contact?.number,
        temperaturaLead: contact?.leadStatus,
        etapaFunil: contact?.pipelineStage,
        endereco: contact?.address
      };
    }
  }
];

export const getToolsByKeys = (keys: string[]): ToolDefinition[] =>
  AVAILABLE_TOOLS.filter(tool => keys.includes(tool.key));
