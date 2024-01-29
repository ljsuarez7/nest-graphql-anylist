import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemInput, UpdateItemInput } from './dto/inputs';
import { Item } from './entities/item.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { PaginationArgs, SearchArgs } from 'src/common/dto/args';

@Injectable()
export class ItemsService {

  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>
  ){}

  async create(createItemInput: CreateItemInput, user: User): Promise<Item> {
    const newItem = this.itemsRepository.create({...createItemInput, user}); //desestructuramos y añadimos el usuario
    return await this.itemsRepository.save(newItem);
  }

  async findAll(user: User, paginationArgs: PaginationArgs, searchArgs: SearchArgs): Promise<Item[]> {

    const {limit, offset} = paginationArgs;
    const {search} = searchArgs;

    const queryBuilder = this.itemsRepository.createQueryBuilder()
      .take(limit)
      .skip(offset)
      .where(`"userId" = :userId`, {userId: user.id});

    if(search){
      queryBuilder.andWhere('LOWER(name) like :name', {name: `%${search.toLowerCase()}%`})
    }

    return queryBuilder.getMany();

    //Es lo mismo que la consulta de arriba, pero la de arriba es más simple y resuelve algunos problemas como que la busqueda no sea case sensitive y q el search sea opcional y no pete
    // return this.itemsRepository.find({
    //   take: limit,
    //   skip: offset,
    //   where: {
    //     user: {
    //       id: user.id
    //     },
    //     name: Like(`%${search}%`)
    //   }
    // });

  }

  async findOne(id: string, user: User): Promise<Item> {
    const item = await this.itemsRepository.findOneBy({
      id,
      user: {
        id: user.id
      }
    });
    if(!item) throw new NotFoundException(`Item with id: ${id} not found`);
    // item.user = user; //Con esto cargamos la info del user en la consulta, pero con el lazy en la propiedad en el entity hace lo mismo
    return item;
  }

  async update(id: string, updateItemInput: UpdateItemInput, user: User): Promise<Item> {
    await this.findOne(id, user);
    // const item = await this.itemsRepository.preload({...updateItemInput, user}); //Esto seria si no tenemos el lazy puesto en el entity, para poder cargar los datos del user
    const item = await this.itemsRepository.preload(updateItemInput);
    if(!item) throw new NotFoundException(`Item with id: ${id} not found`);
    return this.itemsRepository.save(item);
  }

  async remove(id: string, user: User): Promise<Item> {
    //Lo ideal es siempre hacer eliminación mediante una actualizacion de un estado y no borrado fisico de la BD
    //TODO: soft delete, integridad referencial
    const item = await this.findOne(id, user);
    await this.itemsRepository.remove(item);
    return {...item, id}; //Esto lo tenemos que hacer porque se pierde el id al eliminarlo y necesitamos mandarselo al resolver
  }

  async itemsCountByUser(user: User): Promise<number>{
    return this.itemsRepository.count({
      where: {
        user: {
          id: user.id
        }
      }
    })
  }

  //METODOS SIN FILTRAR POR USUARIO, POR EJEMPLO PARA UN ADMIN QUE TENGA Q VERLO TODO
  //SE PODRIA MIRAR DE HACER QUE SI EL USER ES ADMIN QUE VEA TODO Y SINO FILTRAR

  //BUSCAR TODOS LOS ITEMS DE LA BD
  // async findAll(): Promise<Item[]> {
  //   // TODO: filtrar, paginar, por usuario...    
  //   return this.itemsRepository.find();
  // }

  // async findOne(id: string): Promise<Item> {
  //   const item = this.itemsRepository.findOneBy({id});
  //   if(!item) throw new NotFoundException(`Item with id: ${id} not found`);
  //   return item;
  // }

  // async update(id: string, updateItemInput: UpdateItemInput): Promise<Item> {
  //   const item = await this.itemsRepository.preload(updateItemInput);
  //   if(!item) throw new NotFoundException(`Item with id: ${id} not found`);
  //   return this.itemsRepository.save(item);
  // }

  // async remove(id: string): Promise<Item> {
  //   //Lo ideal es siempre hacer eliminación mediante una actualizacion de un estado y no borrado fisico de la BD
  //   //TODO: soft delete, integridad referencial
  //   const item = await this.findOne(id);
  //   await this.itemsRepository.remove(item);
  //   return {...item, id}; //Esto lo tenemos que hacer porque se pierde el id al eliminarlo y necesitamos mandarselo al resolver
  // }

}
