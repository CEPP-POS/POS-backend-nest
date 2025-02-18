import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Owner {
  @PrimaryGeneratedColumn()
  owner_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  owner_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255 , nullable: true})
  contact_info: string;

  @Column({ nullable: true })
  branch_id?: number;

  @Column('text', { array: true, default: () => "ARRAY['owner']" })
  roles: string[];

  @Column({ nullable: true })
  otp: string;

  @Column({ type: 'timestamp', nullable: true })
  otp_expiry: Date;
}
