import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasMany,
  AutoIncrement,
  Default,
  DataType
} from "sequelize-typescript";

import Agent from "./Agent";
import Contact from "./Contact";
import Flow from "./Flow";
import { jsonColumnAccessors } from "../helpers/JsonColumn";
import Message from "./Message";
import Queue from "./Queue";
import User from "./User";
import Whatsapp from "./Whatsapp";

@Table
class Ticket extends Model<Ticket> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ defaultValue: "pending" })
  status: string;

  @Column
  unreadMessages: number;

  @Column
  lastMessage: string;

  @Default(false)
  @Column
  isGroup: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @ForeignKey(() => Queue)
  @Column
  queueId: number;

  @BelongsTo(() => Queue)
  queue: Queue;

  @ForeignKey(() => Flow)
  @Column
  flowId: number;

  @BelongsTo(() => Flow)
  flow: Flow;

  @Column
  flowNodeId: string;

  @Default({})
  @Column({ type: DataType.JSON, ...jsonColumnAccessors("flowVariables") })
  flowVariables: Record<string, string>;

  @Default([])
  @Column({ type: DataType.JSON, ...jsonColumnAccessors("flowCallStack") })
  flowCallStack: { flowId: number; returnNodeId: string | null }[];

  @Column
  flowResumeAt: Date;

  @ForeignKey(() => Agent)
  @Column
  aiAgentId: number;

  @BelongsTo(() => Agent)
  aiAgent: Agent;

  // Fila escolhida no node "Transferir p/ Agente IA" que originou essa
  // transferência — usada quando o agente encerra (pedido de humano) em
  // vez da fila padrão cadastrada no Agente.
  @ForeignKey(() => Queue)
  @Column
  agentFallbackQueueId: number;

  @BelongsTo(() => Queue)
  agentFallbackQueue: Queue;

  @HasMany(() => Message)
  messages: Message[];
}

export default Ticket;
