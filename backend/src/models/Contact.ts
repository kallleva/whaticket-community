import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  Default,
  HasMany,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import ContactCustomField from "./ContactCustomField";
import ContactNote from "./ContactNote";
import Ticket from "./Ticket";
import User from "./User";

@Table
class Contact extends Model<Contact> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Unique
  @Column
  number: string;

  @Unique
  @Column
  lid: string;

  @AllowNull(false)
  @Default("")
  @Column
  email: string;

  @Column
  profilePicUrl: string;

  @Default(false)
  @Column
  isGroup: boolean;

  @AllowNull(true)
  @Column(DataType.TEXT)
  address: string;

  @AllowNull(true)
  @Column(DataType.DATEONLY)
  birthDate: string;

  @AllowNull(true)
  @Column
  document: string;

  @AllowNull(false)
  @Default("warm")
  @Column
  leadStatus: string;

  @AllowNull(false)
  @Default("lead")
  @Column
  pipelineStage: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @HasMany(() => ContactCustomField)
  extraInfo: ContactCustomField[];

  @HasMany(() => ContactNote)
  notes: ContactNote[];

  // "Carteira de cliente": primeiro vendedor atribuído a este contato.
  // Veja FindOrCreateTicketService (roteia direto pro owner) e
  // UpdateTicketService (grava o owner na primeira atribuição).
  @ForeignKey(() => User)
  @Column
  ownerId: number;

  @BelongsTo(() => User)
  owner: User;
}

export default Contact;
