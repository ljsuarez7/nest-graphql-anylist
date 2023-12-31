import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemInput, UpdateItemInput } from './dto/inputs';
import { Item } from './entities/item.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ItemsService {

  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>
  ){}

  async create(createItemInput: CreateItemInput): Promise<Item> {
    const newItem = this.itemsRepository.create(createItemInput);
    return await this.itemsRepository.save(newItem);
  }

  async findAll(): Promise<Item[]> {
    // TODO: filtrar, paginar, por usuario...
    return this.itemsRepository.find();
  }

  async findOne(id: string): Promise<Item> {
    const item = this.itemsRepository.findOneBy({id});
    if(!item) throw new NotFoundException(`Item with id: ${id} not found`);
    return item;
  }

  async update(id: string, updateItemInput: UpdateItemInput): Promise<Item> {
    const item = await this.itemsRepository.preload(updateItemInput);
    if(!item) throw new NotFoundException(`Item with id: ${id} not found`);
    return this.itemsRepository.save(item);
  }

  async remove(id: string): Promise<Item> {
    //Lo ideal es siempre hacer eliminación mediante una actualizacion de un estado y no borrado fisico de la BD
    //TODO: soft delete, integridad referencial
    const item = await this.findOne(id);
    await this.itemsRepository.remove(item);
    return {...item, id}; //Esto lo tenemos que hacer porque se pierde el id al eliminarlo y necesitamos mandarselo al resolver
  }
}
