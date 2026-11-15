import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  DataType
} from "sequelize-typescript";
import Contact from "./Contact";
import User from "./User";

@Table
class BirthdayMessageQueue extends Model<BirthdayMessageQueue> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.DATEONLY)
  referenceDate: string;

  @Column(DataType.TEXT)
  messageBody: string;

  @Default("pending")
  @Column
  status: string;

  @Column
  sentAt: Date;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => User)
  @Column
  sentByUserId: number;

  @BelongsTo(() => User)
  sentByUser: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default BirthdayMessageQueue;
