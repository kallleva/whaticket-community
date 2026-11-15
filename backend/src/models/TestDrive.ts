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
import Contact from "./Contact";
import Vehicle from "./Vehicle";
import User from "./User";
import Ticket from "./Ticket";

@Table
class TestDrive extends Model<TestDrive> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  scheduledAt: Date;

  // scheduled | confirmed | completed | cancelled | no_show
  @Default("scheduled")
  @Column
  status: string;

  @Column(DataType.TEXT)
  notes: string;

  @Column
  reminderSentAt: Date;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => Vehicle)
  @Column
  vehicleId: number;

  @BelongsTo(() => Vehicle)
  vehicle: Vehicle;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default TestDrive;
