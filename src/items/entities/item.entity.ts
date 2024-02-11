import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { ListItem } from 'src/list-item/entities/list-item.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'items'})
@ObjectType()
export class Item {

  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;
  
  @Column()
  @Field(() => String)
  name: string;
  
  // @Column()
  // @Field(() => Float)
  // quantity: number;
  
  @Column({nullable: true})
  @Field(() => String, {nullable: true})
  quantityUnits?: string;

  @ManyToOne(() => User, (user) => user.items, {nullable: false, lazy: true}) //Con el lazy cargamos los datos del user al hacer la consulta y al actualizar
  @Index('userId-index') //Indice para que cuando hay muchos elementos sea más facil encontrarlos
  @Field(() => User)
  user: User;

  @OneToMany(()=>ListItem, (listItem) => listItem.item, {lazy: true})
  @Field(()=>[ListItem])
  listItem: ListItem[];

}
