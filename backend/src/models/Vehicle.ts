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

@Table
class Vehicle extends Model<Vehicle> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  brand: string;

  @Column
  model: string;

  @Column
  version: string;

  @Column
  year: number;

  @Column
  color: string;

  @Column
  plate: string;

  @Default("available")
  @Column
  status: string;

  @Column(DataType.DECIMAL(12, 2))
  price: number;

  @Column(DataType.TEXT)
  photoUrl: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Vehicle;
