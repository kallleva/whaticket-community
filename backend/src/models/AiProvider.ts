import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  Default,
  DataType
} from "sequelize-typescript";
import { jsonColumnAccessors } from "../helpers/JsonColumn";

@Table
class AiProvider extends Model<AiProvider> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Default("Google Gemini")
  @Column
  name: string;

  @Column(DataType.TEXT)
  apiKeyEncrypted: string;

  @Default([])
  @Column({ type: DataType.JSON, ...jsonColumnAccessors("enabledModels") })
  enabledModels: string[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default AiProvider;
