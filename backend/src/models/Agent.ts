import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  Default,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import Queue from "./Queue";
import { jsonColumnAccessors } from "../helpers/JsonColumn";

@Table
class Agent extends Model<Agent> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column(DataType.TEXT)
  skillPrompt: string;

  // Contexto estático extra, somado ao skillPrompt (ex.: horário de
  // funcionamento, políticas da loja, destaques do estoque) — separado pra
  // não misturar "personalidade/regras" com "fatos de referência".
  @Column(DataType.TEXT)
  extraContext: string;

  @Column
  model: string;

  @Default(0.7)
  @Column(DataType.FLOAT)
  temperature: number;

  @Default("HUMANO_SOLICITADO")
  @Column
  handoffMarker: string;

  // "gemini" (API do Google) ou "local" (qualquer endpoint compatível com a
  // API da OpenAI — ex.: Ollama rodando um modelo como Qwen).
  @Default("gemini")
  @Column
  providerType: string;

  // Usado só quando providerType === "local": URL base do endpoint
  // (ex.: http://ollama:11434/v1).
  @Column
  apiUrl: string;

  // Chaves do catálogo fixo em AgentServices/tools/index.ts que este agente
  // pode usar (function calling) — só suportado no provedor Gemini.
  @Default([])
  @Column({ type: DataType.JSON, ...jsonColumnAccessors("tools") })
  tools: string[];

  // Responde em nota de voz (TTS) em vez de texto — melhor esforço: cai
  // pra texto automaticamente se a síntese de voz falhar.
  @Default(false)
  @Column
  voiceReplies: boolean;

  @ForeignKey(() => Queue)
  @Column
  fallbackQueueId: number;

  @BelongsTo(() => Queue)
  fallbackQueue: Queue;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Agent;
