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
import Whatsapp from "./Whatsapp";
import User from "./User";
import { jsonColumnAccessors } from "../helpers/JsonColumn";

export type FlowNodeType =
  | "start"
  | "message"
  | "question"
  | "menu"
  | "condition"
  | "delay"
  | "transfer_queue"
  | "transfer_agent"
  | "call_flow"
  | "tag_contact"
  | "set_variable"
  | "end";

export interface FlowNodeData {
  type: FlowNodeType;
  text?: string;
  variableName?: string;
  options?: Array<{ label: string; value: string }>;
  variable?: string;
  operator?: "eq" | "neq" | "contains" | "gt" | "lt" | "exists";
  value?: string;
  seconds?: number;
  queueId?: number;
  agentId?: number;
  transitionText?: string;
  calledFlowId?: number;
  leadStatus?: string;
  pipelineStage?: string;
}

export interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: FlowNodeData;
  [key: string]: unknown;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  [key: string]: unknown;
}

@Table
class Flow extends Model<Flow> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Default("draft")
  @Column
  status: string;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @Default([])
  @Column({ type: DataType.JSON, ...jsonColumnAccessors("nodesJson") })
  nodesJson: FlowNode[];

  @Default([])
  @Column({ type: DataType.JSON, ...jsonColumnAccessors("edgesJson") })
  edgesJson: FlowEdge[];

  @ForeignKey(() => User)
  @Column
  updatedByUserId: number;

  @BelongsTo(() => User)
  updatedByUser: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Flow;
