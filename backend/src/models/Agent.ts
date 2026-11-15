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

  @Column
  model: string;

  @Default(0.7)
  @Column(DataType.FLOAT)
  temperature: number;

  @Default("HUMANO_SOLICITADO")
  @Column
  handoffMarker: string;

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
